#!/usr/bin/env node
// Build a flat searchable question index across all /answers JSONs.
//
// Output: scripts/answers_question_index.json (server-only, NOT in public/)
//   Format: { questions: [{ slug, cbt_title, q_idx, q_text, q_lower, section }] }
//
// Re-run after pass 2, pass 3, or pass 4 to keep the index fresh.

import fs from 'node:fs';
import path from 'node:path';

const ANSWERS_DIR = 'public/data/answers';
const OUT = 'scripts/answers_question_index.json';

const questions = [];
let fileCount = 0;

for (const f of fs.readdirSync(ANSWERS_DIR)) {
  if (!f.endsWith('.json')) continue;
  const data = JSON.parse(fs.readFileSync(path.join(ANSWERS_DIR, f), 'utf8'));
  if (data.kind !== 'qa' || !Array.isArray(data.qas)) continue;
  fileCount++;
  for (let i = 0; i < data.qas.length; i++) {
    const qa = data.qas[i];
    // Truncate to keep index size sane
    const qText = qa.q.slice(0, 200);
    questions.push({
      slug: data.slug,
      cbt_title: data.title,
      bucket: data.bucket,
      q_idx: i,
      q_text: qText,
      q_lower: qText.toLowerCase(),
      section: qa.section || null,
    });
  }
}

fs.writeFileSync(OUT, JSON.stringify({
  generated_at: new Date().toISOString(),
  file_count: fileCount,
  question_count: questions.length,
  questions,
}));

const sizeMB = (fs.statSync(OUT).size / 1024 / 1024).toFixed(2);
console.log(`Indexed ${questions.length.toLocaleString()} questions across ${fileCount} files`);
console.log(`Output: ${OUT} (${sizeMB} MB)`);
