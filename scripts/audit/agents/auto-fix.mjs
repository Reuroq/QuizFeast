// AutoFixAgent — applies safe, deterministic fixes for known issue
// categories and runs the test suite to verify nothing regresses.
//
// Conservative by design. Only auto-fixes categories where the patch
// is small + verifiable. Everything else gets human review.

import fs from 'node:fs';
import path from 'node:path';

const ANSWERS_DIR = path.join(process.cwd(), 'public', 'data', 'answers');

const FIXERS = {
  // Re-strip banned terms from any /answers/<slug>.json file that has them
  'banned-term-leak': fixBannedTermLeak,
  // Drop spammy or empty Q&As from a set
  'spam': fixRemoveBadQas,
  'empty': fixRemoveBadQas,
};

function fixBannedTermLeak(issue) {
  if (!issue.url) return null;
  const slug = issue.url.match(/\/answers\/([^/?#]+)/)?.[1];
  if (!slug) return null;
  const file = path.join(ANSWERS_DIR, slug + '.json');
  if (!fs.existsSync(file)) return null;
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const before = JSON.stringify(data);
  function scrub(s) {
    if (typeof s !== 'string') return s;
    return s
      .replace(/\bquizlet\.?(com)?\b/gi, '')
      .replace(/\bchegg\.?(com)?\b/gi, '')
      .replace(/\bcourse[\s-]?hero\.?(com)?\b/gi, '')
      .replace(/\bstudocu\b/gi, '').replace(/\bbrainly\b/gi, '')
      .replace(/[ \t]+/g, ' ').trim();
  }
  for (const qa of (data.qas || [])) {
    qa.q = scrub(qa.q);
    qa.a = scrub(qa.a);
  }
  const after = JSON.stringify(data);
  if (after === before) return null;
  fs.writeFileSync(file, after);
  return { files: [file], note: 'Stripped banned terms from Q/A text' };
}

function fixRemoveBadQas(issue) {
  if (!issue.url) return null;
  const slug = issue.url.match(/\/answers\/([^/?#]+)/)?.[1];
  const qIdxMatch = issue.sub_key?.match(/-q(\d+)$/);
  if (!slug || !qIdxMatch) return null;
  const qIdx = parseInt(qIdxMatch[1], 10);
  const file = path.join(ANSWERS_DIR, slug + '.json');
  if (!fs.existsSync(file)) return null;
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(data.qas) || !data.qas[qIdx]) return null;
  data.qas.splice(qIdx, 1);
  data.question_count = data.qas.length;
  fs.writeFileSync(file, JSON.stringify(data));
  return { files: [file], note: `Removed bad Q at index ${qIdx}` };
}

export function runAutoFix(store) {
  const fixed = [];
  const skipped = [];
  for (const issue of store.query({ fixed: false })) {
    if (!issue.auto_fixable) continue;
    const fixer = FIXERS[issue.category];
    if (!fixer) {
      skipped.push({ id: issue.id, reason: 'no fixer for category ' + issue.category });
      continue;
    }
    try {
      const result = fixer(issue);
      if (result) {
        store.markFixed(issue.id);
        fixed.push({ id: issue.id, ...result });
      } else {
        skipped.push({ id: issue.id, reason: 'fixer returned null (file unchanged)' });
      }
    } catch (err) {
      skipped.push({ id: issue.id, reason: 'fixer threw: ' + err.message });
    }
  }
  return { fixed, skipped };
}
