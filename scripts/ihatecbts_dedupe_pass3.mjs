#!/usr/bin/env node
// Pass 3: dedupe Q&As within each public/data/answers/<slug>.json.
//
// The Quizlet docx files often bundled multiple sets containing the same
// questions, so an "Army Cyber Awareness 2023" file ends up with 226 Q&As
// when the real exam has ~50. This pass collapses duplicates by normalized
// question text, keeping the longest answer when variants disagree.
//
// Also rebuilds scripts/ihatecbts_pass2_index.json with updated question counts.
//
// Idempotent — safe to re-run.

import fs from 'node:fs';
import path from 'node:path';

const ANSWERS_DIR = 'public/data/answers';
const INDEX_FILE = 'scripts/ihatecbts_pass2_index.json';

function normQ(q) {
  return q
    .toLowerCase()
    .replace(/[^\w\s]/g, '')  // strip punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

function dedupe(qas) {
  const seen = new Map();  // normQ -> {qa, idx, variants:[answers]}
  for (let i = 0; i < qas.length; i++) {
    const qa = qas[i];
    const key = normQ(qa.q);
    if (!key) continue;
    if (!seen.has(key)) {
      seen.set(key, { qa: { ...qa }, idx: i, variants: [qa.a] });
    } else {
      const existing = seen.get(key);
      existing.variants.push(qa.a);
      // Keep the longest answer (most informative)
      if (qa.a.length > existing.qa.a.length) {
        existing.qa.a = qa.a;
      }
    }
  }
  // Preserve original order
  return [...seen.values()].sort((a, b) => a.idx - b.idx).map(v => v.qa);
}

const totalsBefore = { questions: 0, files: 0 };
const totalsAfter = { questions: 0, files: 0 };
const biggestDrops = [];
const files = fs.readdirSync(ANSWERS_DIR).filter(f => f.endsWith('.json'));
let droppedFiles = 0;

for (const f of files) {
  const p = path.join(ANSWERS_DIR, f);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (data.kind !== 'qa' || !Array.isArray(data.qas)) continue;

  const before = data.qas.length;
  totalsBefore.questions += before;
  totalsBefore.files++;

  const deduped = dedupe(data.qas);
  const after = deduped.length;

  if (after < 2) {
    // Not enough unique Q&As to be useful — remove the file entirely
    fs.unlinkSync(p);
    droppedFiles++;
    continue;
  }

  data.qas = deduped;
  data.question_count = after;
  data.dedupe_pass = { before, after, removed: before - after, version: 3 };

  fs.writeFileSync(p, JSON.stringify(data));
  totalsAfter.questions += after;
  totalsAfter.files++;

  const dropped = before - after;
  if (dropped >= 20) {
    biggestDrops.push({ slug: data.slug, title: data.title, before, after, dropped });
  }
}

// Rebuild pass2 index
const idx = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
const survivingSlugs = new Set(
  fs.readdirSync(ANSWERS_DIR).map(f => f.replace(/\.json$/, ''))
);
const newEntries = [];
for (const e of idx.entries) {
  if (!survivingSlugs.has(e.slug)) continue;
  const p = path.join(ANSWERS_DIR, e.slug + '.json');
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  newEntries.push({
    slug: e.slug,
    title: e.title,
    bucket: e.bucket,
    kind: data.kind,
    question_count: data.question_count || 0,
    word_count: data.word_count,
  });
}
idx.entries = newEntries;
idx.stats.dedupe_pass3 = {
  run_at: new Date().toISOString(),
  files_dropped_after_dedupe: droppedFiles,
  questions_before: totalsBefore.questions,
  questions_after: totalsAfter.questions,
};
fs.writeFileSync(INDEX_FILE, JSON.stringify(idx, null, 2));

biggestDrops.sort((a, b) => b.dropped - a.dropped);

console.log('=== DEDUPE STATS ===');
console.log(`Files processed:          ${totalsBefore.files}`);
console.log(`Files dropped (<2 unique): ${droppedFiles}`);
console.log(`Files remaining:          ${totalsAfter.files}`);
console.log(`Questions before:         ${totalsBefore.questions}`);
console.log(`Questions after:          ${totalsAfter.questions}`);
console.log(`Questions removed:        ${totalsBefore.questions - totalsAfter.questions} (${((1 - totalsAfter.questions/totalsBefore.questions)*100).toFixed(1)}%)`);
console.log('\nTop 15 biggest reductions:');
for (const d of biggestDrops.slice(0, 15)) {
  console.log(`  ${d.before} -> ${d.after}  (-${d.dropped})  ${d.title}`);
}
