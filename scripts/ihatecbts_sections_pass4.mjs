#!/usr/bin/env node
// Pass 4: extract section markers (e.g. "*Spillage", "**Classified Data")
// embedded at the start of question text into a structured `section` field.
//
// Quizlet study sets often prefix every question with the topic section like:
//   *Spillage
//   After reading an online story about a new security project...
//
// This pass moves the section into qa.section and cleans the question text.
// Also adds a top-level `sections` summary to each JSON file.
//
// Idempotent: skips qas that already have qa.section set.

import fs from 'node:fs';
import path from 'node:path';

const ANSWERS_DIR = 'public/data/answers';
const INDEX_FILE = 'scripts/ihatecbts_pass2_index.json';

// Match section markers like:
//   *Spillage\n<question>
//   **Classified Data\n<question>
//   ***Mobile Devices\n<question>
// 1-5 leading asterisks, then a short label line (<60 chars), then newline + body.
const SECTION_RE = /^(\*{1,5})\s*([^\n*][^\n]{0,80})\n+([\s\S]+)$/;

function extractSection(q) {
  const m = q.match(SECTION_RE);
  if (!m) return { section: null, q };
  const section = m[2].trim();
  // Sanity-check: section labels are titles, not full sentences. Reject if
  // it looks like a sentence (ends with punctuation typical of a question).
  if (/[?.!,;:]$/.test(section)) return { section: null, q };
  // Reject if section is suspiciously long for a label
  if (section.length > 60) return { section: null, q };
  return { section, q: m[3].trim() };
}

let totalFiles = 0;
let totalQs = 0;
let qsWithSection = 0;
let filesWithSections = 0;

const files = fs.readdirSync(ANSWERS_DIR).filter(f => f.endsWith('.json'));

for (const f of files) {
  const p = path.join(ANSWERS_DIR, f);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (data.kind !== 'qa' || !Array.isArray(data.qas)) continue;

  totalFiles++;
  const sectionCounts = new Map();
  let touched = false;

  for (const qa of data.qas) {
    totalQs++;
    if (qa.section) {
      // already processed
      qsWithSection++;
      sectionCounts.set(qa.section, (sectionCounts.get(qa.section) || 0) + 1);
      continue;
    }
    const ex = extractSection(qa.q);
    if (ex.section) {
      qa.section = ex.section;
      qa.q = ex.q;
      qsWithSection++;
      sectionCounts.set(ex.section, (sectionCounts.get(ex.section) || 0) + 1);
      touched = true;
    }
  }

  // Build sections summary (preserve first-appearance order)
  const sectionsList = [];
  const seenSec = new Set();
  for (const qa of data.qas) {
    if (qa.section && !seenSec.has(qa.section)) {
      seenSec.add(qa.section);
      sectionsList.push({ name: qa.section, count: sectionCounts.get(qa.section) });
    }
  }

  if (sectionsList.length) {
    filesWithSections++;
    data.sections = sectionsList;
    touched = true;
  }

  if (touched) {
    data.sections_pass = 4;
    fs.writeFileSync(p, JSON.stringify(data));
  }
}

// Rebuild index with sections info
const idx = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
for (const e of idx.entries) {
  const p = path.join(ANSWERS_DIR, e.slug + '.json');
  if (!fs.existsSync(p)) continue;
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (data.sections?.length) {
    e.section_count = data.sections.length;
  }
}
idx.stats.sections_pass4 = {
  run_at: new Date().toISOString(),
  files_processed: totalFiles,
  files_with_sections: filesWithSections,
  total_questions: totalQs,
  questions_with_section: qsWithSection,
};
fs.writeFileSync(INDEX_FILE, JSON.stringify(idx, null, 2));

console.log('=== SECTIONS PASS 4 ===');
console.log(`Files processed:            ${totalFiles}`);
console.log(`Files with sections:        ${filesWithSections}`);
console.log(`Total questions:            ${totalQs}`);
console.log(`Questions with section tag: ${qsWithSection} (${(qsWithSection/totalQs*100).toFixed(1)}%)`);

// Show top 5 files by section count
const top = [];
for (const f of fs.readdirSync(ANSWERS_DIR)) {
  if (!f.endsWith('.json')) continue;
  const d = JSON.parse(fs.readFileSync(path.join(ANSWERS_DIR, f)));
  if (d.sections?.length >= 3) {
    top.push({ slug: d.slug, title: d.title, sec: d.sections.length, q: d.question_count });
  }
}
top.sort((a, b) => b.sec - a.sec);
console.log(`\nTop 10 files by section count:`);
for (const t of top.slice(0, 10)) {
  console.log(`  ${t.sec} sections, ${t.q} questions  -  ${t.title}`);
}
