#!/usr/bin/env node
// Pass 2: open each kept docx, extract Q&A structure, write per-slug JSON.
//
// Input:  scripts/ihatecbts_pass1_manifest.json (keepers from pass 1)
// Output: public/data/answers/<slug>.json  (per-page data)
//         scripts/ihatecbts_pass2_index.json (slug list + meta for index page + sitemap)

import fs from 'node:fs';
import path from 'node:path';
import mammoth from 'mammoth';

const MANIFEST = JSON.parse(fs.readFileSync('scripts/ihatecbts_pass1_manifest.json'));
const OUT_DIR = 'public/data/answers';
const INDEX_OUT = 'scripts/ihatecbts_pass2_index.json';

fs.mkdirSync(OUT_DIR, { recursive: true });

// Heuristic title: filename without extension, title-cased reasonably.
function titleFromFilename(filename) {
  const stem = path.basename(filename, '.docx');
  // Filenames are mixed-case; just collapse whitespace and strip cruft.
  return stem.replace(/\s+/g, ' ').trim();
}

// Extract Q&A pairs from raw HTML emitted by mammoth.
// The docx use one of two structures:
//   Pattern A (Quizlet exports):
//     <p>Question: ...</p><p>Answer: ...</p><p>==========...</p> (repeat)
//   Pattern B (article-style):
//     <p>Title</p><p>Body paragraph.</p>
function parseQA(html, filename) {
  // Strip HTML tags but preserve <br /> as newlines, paragraph breaks as double-newlines.
  const text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

  // Split on the equals-sign separator (Quizlet pattern A)
  const SEP = /\n=+\n/g;
  const chunks = text.split(SEP).map(c => c.trim()).filter(Boolean);

  const qas = [];
  for (const chunk of chunks) {
    // Each chunk should contain "Question: X" then "Answer: Y" (Y may span lines)
    const qMatch = chunk.match(/Question\s*:\s*([\s\S]*?)(?:\n\s*Answer\s*:|$)/i);
    const aMatch = chunk.match(/Answer\s*:\s*([\s\S]*?)$/i);
    if (qMatch && aMatch) {
      const q = qMatch[1].trim();
      const a = aMatch[1].trim();
      if (q && a) qas.push({ q, a });
    }
  }

  if (qas.length > 0) {
    return { kind: 'qa', qas, prose: null };
  }

  // No Q&A structure — treat as prose article (pattern B).
  // First non-empty line is title, rest is body.
  const paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  if (paragraphs.length === 0) return null;
  const title = paragraphs[0];
  const body = paragraphs.slice(1).join('\n\n').trim();
  if (!body) return null;
  return { kind: 'prose', qas: null, prose: { title, body } };
}

// Quality filters
function isSpamRepetition(qas) {
  if (qas.length < 2) return false;
  // All answers identical = spam (the mesothelioma pattern)
  const firstA = qas[0].a;
  return qas.every(qa => qa.a === firstA) && firstA.length > 100;
}

function wordCount(s) { return (s.match(/\b\w+\b/g) || []).length; }

const stats = {
  total: MANIFEST.keepers.length,
  written: 0,
  skipped_no_content: 0,
  skipped_spam_repetition: 0,
  skipped_too_short: 0,
  error: 0,
  by_bucket: {},
  by_kind: { qa: 0, prose: 0 },
};

const indexEntries = [];

async function processOne(entry) {
  let html;
  try {
    const r = await mammoth.convertToHtml({ path: entry.path });
    html = r.value;
  } catch (e) {
    stats.error++;
    return;
  }

  const parsed = parseQA(html, entry.filename);
  if (!parsed) { stats.skipped_no_content++; return; }

  // Quality bar
  if (parsed.kind === 'qa') {
    if (parsed.qas.length < 2) { stats.skipped_too_short++; return; }
    if (isSpamRepetition(parsed.qas)) { stats.skipped_spam_repetition++; return; }
  } else if (parsed.kind === 'prose') {
    if (wordCount(parsed.prose.body) < 40) { stats.skipped_too_short++; return; }
  }

  const title = titleFromFilename(entry.filename);
  const totalQuestions = parsed.kind === 'qa' ? parsed.qas.length : 0;
  const wordsTotal = parsed.kind === 'qa'
    ? parsed.qas.reduce((s, qa) => s + wordCount(qa.q) + wordCount(qa.a), 0)
    : wordCount(parsed.prose.body);

  const out = {
    slug: entry.slug,
    title,
    bucket: entry.bucket,
    source_filename: entry.filename,
    kind: parsed.kind,
    question_count: totalQuestions,
    word_count: wordsTotal,
    qas: parsed.qas,
    prose: parsed.prose,
  };

  fs.writeFileSync(path.join(OUT_DIR, entry.slug + '.json'), JSON.stringify(out));
  indexEntries.push({
    slug: entry.slug,
    title,
    bucket: entry.bucket,
    kind: parsed.kind,
    question_count: totalQuestions,
    word_count: wordsTotal,
  });
  stats.written++;
  stats.by_kind[parsed.kind]++;
  stats.by_bucket[entry.bucket] = (stats.by_bucket[entry.bucket] || 0) + 1;
}

const CONCURRENCY = 8;
async function runAll() {
  const queue = [...MANIFEST.keepers];
  let processed = 0;
  const workers = [];
  for (let w = 0; w < CONCURRENCY; w++) {
    workers.push((async () => {
      while (queue.length) {
        const entry = queue.shift();
        if (!entry) break;
        await processOne(entry);
        processed++;
        if (processed % 100 === 0) console.log('  processed', processed, '/', stats.total);
      }
    })());
  }
  await Promise.all(workers);
}

console.log('Starting pass 2: extracting from', MANIFEST.keepers.length, 'docx files...');
const t0 = Date.now();
await runAll();
const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

// Sort index by bucket then question_count desc for nicer browsing
indexEntries.sort((a, b) => a.bucket.localeCompare(b.bucket) || (b.question_count - a.question_count));
fs.writeFileSync(INDEX_OUT, JSON.stringify({ generated_at: new Date().toISOString(), stats, entries: indexEntries }, null, 2));

console.log('\n=== STATS ===');
console.log(JSON.stringify(stats, null, 2));
console.log(`\nElapsed: ${elapsed}s`);
console.log('Per-slug JSONs written to:', OUT_DIR);
console.log('Index written to:', INDEX_OUT);
