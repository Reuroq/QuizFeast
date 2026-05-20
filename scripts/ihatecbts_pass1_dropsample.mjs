// Sample DROPPED files (re-running classify) to spot any military CBT misses.
import fs from 'node:fs';
import path from 'node:path';

const SOURCE_DIRS = [
  'D:/SquarespaceAutoArticles',
  'D:/Quizlet2023/AlienAll',
  'D:/Quizlet2023/AlienAll2',
  'D:/Quizlet2023/AleinAll3',
  'D:/Quizlet2023/All2',
  'D:/Quizlet2023/All3',
];

const m = JSON.parse(fs.readFileSync('scripts/ihatecbts_pass1_manifest.json'));
const keptPaths = new Set(m.keepers.map(k => k.path));

// Words that suggest a real military/CBT file we may have missed
const SMOKE_WORDS = [
  'army', 'navy', 'marine', 'usmc', 'usaf', 'air force', 'soldier',
  'military', 'jko', 'cdse', 'alms', 'nko', 'marinenet',
  'training answers', 'answer key', 'test answers', 'exam answers',
  'jrotc', 'rotc',
  'awareness training', 'awareness test', 'awareness answers',
  'sere', 'opsec', 'sapr', 'sharp', 'tarp',
  'cbrn', 'tccc', 'cls', 'risk management', 'cui',
  'hazmat', 'bloodborne', 'first aid', 'combat',
  'jko ', ' jko', 'cdse ', ' cdse',
];

const samples = [];

for (const dir of SOURCE_DIRS) {
  if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir)) {
    if (!name.toLowerCase().endsWith('.docx')) continue;
    const fullPath = path.join(dir, name);
    if (keptPaths.has(fullPath)) continue;  // already kept
    const stem = path.basename(name, '.docx').toLowerCase();
    for (const w of SMOKE_WORDS) {
      if (stem.includes(w)) {
        samples.push({ filename: name, smoke: w });
        break;
      }
    }
    if (samples.length >= 500) break;
  }
  if (samples.length >= 500) break;
}

console.log('Sampled', samples.length, 'dropped files containing military/CBT smoke words.\n');
const bySmoke = {};
for (const s of samples) (bySmoke[s.smoke] ||= []).push(s.filename);
for (const [smoke, arr] of Object.entries(bySmoke)) {
  console.log(`\n--- "${smoke}" (${arr.length} dropped) ---`);
  for (const f of arr.slice(0, 12)) console.log('  ', f);
}
