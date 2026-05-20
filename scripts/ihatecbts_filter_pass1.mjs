#!/usr/bin/env node
// Pass 1: filename-only filter for ihatecbts content ingestion.
// Walks all D:/Quizlet2023/* + D:/SquarespaceAutoArticles, classifies each file
// using WORD-BOUNDARY regex against a list of known CBT/training/cert course
// names, writes a manifest JSON.
//
// Output: scripts/ihatecbts_pass1_manifest.json

import fs from 'node:fs';
import path from 'node:path';

const SOURCE_DIRS = [
  'D:/SquarespaceAutoArticles',
  'D:/Quizlet2023/AlienAll',
  'D:/Quizlet2023/AlienAll2',
  'D:/Quizlet2023/AleinAll3',
  'D:/Quizlet2023/All2',
  'D:/Quizlet2023/All3',
  'D:/Quizlet2023/Published',
];

// Each pattern uses \b for word boundaries. Lowercased filenames are matched
// against these. Bucket exists so we can see distribution + tune.
const PATTERNS = [
  // === DoD Annual Training (the high-value core) ===
  { bucket: 'cbt_annual',   re: /\bcyber[\s_-]*awareness\b/ },
  { bucket: 'cbt_annual',   re: /\binsider[\s_-]*threat\b/ },
  { bucket: 'cbt_annual',   re: /\bopsec\b/ },
  { bucket: 'cbt_annual',   re: /\bantiterrorism\b|\banti[\s_-]terrorism\b|\bat[\s_-]level[\s_-]*1\b/ },
  { bucket: 'cbt_annual',   re: /\bsapr\b/ },
  { bucket: 'cbt_annual',   re: /\bsharp\b(?![\s_-]*shooter)/ },
  { bucket: 'cbt_annual',   re: /\bsere\b(?![\s_-]*ngeti)/ },
  { bucket: 'cbt_annual',   re: /\bequal[\s_-]opportunity\b/ },
  { bucket: 'cbt_annual',   re: /\bno[\s_-]*fear[\s_-]act\b/ },
  { bucket: 'cbt_annual',   re: /\bsuicide[\s_-]prevention\b|\bace[\s_-]suicide\b/ },
  { bucket: 'cbt_annual',   re: /\bctip\b|\bcombating[\s_-]trafficking\b|\btrafficking[\s_-]in[\s_-]persons\b/ },
  { bucket: 'cbt_annual',   re: /\bdod[\s_-]ethics\b|\bjoint[\s_-]ethics\b/ },
  { bucket: 'cbt_annual',   re: /\bannual[\s_-]security[\s_-]awareness\b/ },
  { bucket: 'cbt_annual',   re: /\bactive[\s_-]shooter\b/ },
  { bucket: 'cbt_annual',   re: /\bworkplace[\s_-]violence\b/ },
  { bucket: 'cbt_annual',   re: /\bsubstance[\s_-]abuse[\s_-]prevention\b/ },
  { bucket: 'cbt_annual',   re: /\bconcussion[\s_-]training\b|\btbi[\s_-]training\b|\bmtbi\b/ },

  // === Security / Intel / Classification ===
  { bucket: 'cbt_security', re: /\binformation[\s_-]security\b/ },
  { bucket: 'cbt_security', re: /\bderivative[\s_-]classification\b/ },
  { bucket: 'cbt_security', re: /\bmarking[\s_-]classified\b/ },
  { bucket: 'cbt_security', re: /\bcontrolled[\s_-]unclassified\b/ },
  { bucket: 'cbt_security', re: /\bcounterintelligence\b/ },
  { bucket: 'cbt_security', re: /\btarp\b/ },
  { bucket: 'cbt_security', re: /\bintelligence[\s_-]oversight\b/ },
  { bucket: 'cbt_security', re: /\bforce[\s_-]protection\b|\bfpcon\b/ },
  { bucket: 'cbt_security', re: /\bif10[3-7]\b|\bif011\b|\bif012\b/ },
  { bucket: 'cbt_security', re: /\bcyber[\s_-]fundamentals\b/ },

  // === JKO / SEJPME / Joint courses ===
  { bucket: 'cbt_jko',      re: /\bsejpme\b/ },
  { bucket: 'cbt_jko',      re: /\bejpme\b/ },
  { bucket: 'cbt_jko',      re: /\blaw[\s_-]of[\s_-]war\b/ },
  { bucket: 'cbt_jko',      re: /\bcbrn[\s_-]awareness\b|\bcbrne\b|\bcbrn[\s_-]defense\b/ },
  { bucket: 'cbt_jko',      re: /\bwmd\b|\bcombating[\s_-]wmd\b/ },
  { bucket: 'cbt_jko',      re: /\bhuman[\s_-]trafficking[\s_-]awareness\b/ },
  { bucket: 'cbt_jko',      re: /\bdriving[\s_-]for[\s_-]life\b/ },
  { bucket: 'cbt_jko',      re: /\bjko\b/ },

  // === Health & Safety ===
  { bucket: 'cbt_health',   re: /\bhipaa\b|\bhippa\b/ },
  { bucket: 'cbt_health',   re: /\btccc\b|\btactical[\s_-]combat[\s_-]casualty\b/ },
  { bucket: 'cbt_health',   re: /\bbloodborne[\s_-]pathogens?\b/ },
  { bucket: 'cbt_health',   re: /\bhazmat\b|\bhazcom\b/ },
  { bucket: 'cbt_health',   re: /\bcomposite[\s_-]risk[\s_-]management\b|\boperational[\s_-]risk[\s_-]management\b\b|\bcrm[\s_-]army\b/ },
  { bucket: 'cbt_health',   re: /\bdomestic[\s_-]violence[\s_-](training|awareness)\b|\bfap[\s_-]referral\b|\bfamily[\s_-]advocacy[\s_-]program\b/ },
  { bucket: 'cbt_health',   re: /\bcombat[\s_-]lifesaver\b|\bcls[\s_-]course\b|\bcls[\s_-]exam\b/ },
  // (Dropped ACLS/BLS/PALS/NRP, ATI nursing wildcard, ServSafe — civilian healthcare/food, not military CBT)

  // === Ammo & Ordnance ===
  { bucket: 'cbt_ammo',     re: /\bammo[\s_-]?(45|67|49|51|62|63|64|68)\b/ },

  // === Service-specific ===
  { bucket: 'cbt_army',     re: /\barmy[\s_-]values\b|\bldrship\b|\bsoldiers?[\s_-]creed\b|\bwarrior[\s_-]ethos\b/ },
  { bucket: 'cbt_army',     re: /\barmy[\s_-]sharp\b|\bsharp[\s_-]army\b/ },
  { bucket: 'cbt_army',     re: /\bucmj\b/ },
  { bucket: 'cbt_army',     re: /\balms\b/ },
  // Army MOS: NN<letter> at start of name + " mos" or " army" suffix
  { bucket: 'cbt_army',     re: /^\d{2}[a-z]\b[\s_-]+(mos|army|ait)\b/ },
  { bucket: 'cbt_army',     re: /^\d{2}[a-z]\d?\b[\s_-]+(mos|army)\b/ },
  { bucket: 'cbt_army',     re: /\b\d{2}[a-z]\d?\s+(mos|army)\b/ },
  // Air Force AFSC: "<N><letter><N>X<N>" pattern + " air force" / " usaf"
  { bucket: 'cbt_af',       re: /\bair[\s_-]force[\s_-]pme\b|\b(?:afh|afi|afpam|afman|afpd|afto|afmrt|afmra)[\s_-]?\d/ },
  { bucket: 'cbt_af',       re: /\bcdc[\s_-](?:exam|course|test|answers|study)\b/ },
  { bucket: 'cbt_af',       re: /\b\d[a-z]\d[a-z]?\d?\b\s+(?:air[\s_-]force|usaf|afsc)\b/ },
  { bucket: 'cbt_af',       re: /\bafsc\b/ },
  // Navy ratings/courses
  { bucket: 'cbt_navy',     re: /\bnavy[\s_-](gmt|bmr|bmt|advancement|wide|knowledge|coursework)\b/ },
  { bucket: 'cbt_navy',     re: /\bnko\b/ },
  // Marine Corps MOS + orders
  { bucket: 'cbt_marine',   re: /\bmarine[\s_-]corps[\s_-](leadership|orders|knowledge|history)\b|\bmci[\s_-]\d/ },
  { bucket: 'cbt_marine',   re: /^\d{4}[\s_-]+(?:mos[\s_-]+usmc|usmc)\b/ },
  { bucket: 'cbt_marine',   re: /\bgeneral[\s_-]orders?\b.*\b(usmc|marine)\b|\b(usmc|marine)\b.*\bgeneral[\s_-]orders?\b/ },

  // === Professional Development / Acquisition ===
  { bucket: 'cbt_prof',     re: /\bacquisition[\s_-]ethics\b|\bclm[\s_-]?003\b|\bclm[\s_-]?\d{2,3}\b/ },
  { bucket: 'cbt_prof',     re: /\brecords[\s_-]management\b/ },
  { bucket: 'cbt_prof',     re: /\bfoia[\s_-](training|course)\b/ },
  { bucket: 'cbt_prof',     re: /\bfinancial[\s_-]readiness\b/ },
  { bucket: 'cbt_prof',     re: /\btransition[\s_-]assistance\b|\bsfl[\s_-]tap\b|\btap[\s_-]class\b/ },
  { bucket: 'cbt_prof',     re: /\bgtcc?\b|\bgovernment[\s_-]travel[\s_-]card\b/ },
  { bucket: 'cbt_prof',     re: /\bgpc\b|\bgovernment[\s_-]purchase[\s_-]card\b/ },
  { bucket: 'cbt_prof',     re: /\biuid\b/ },

  // === Civilian/IT certs (CBT-style audience) ===
  { bucket: 'cert_it',      re: /\bsecurity\+\b|\bsecurity[\s_-]plus\b|\bsec\+\b/ },
  { bucket: 'cert_it',      re: /\bnetwork\+\b|\bnetwork[\s_-]plus\b|\bnet\+\b/ },
  { bucket: 'cert_it',      re: /\bcomptia\b/ },
  { bucket: 'cert_it',      re: /\bcissp\b/ },
  { bucket: 'cert_it',      re: /\bcism\b(?![a-z])/ },
  { bucket: 'cert_it',      re: /\bcisa\b(?![a-z])/ },
  { bucket: 'cert_it',      re: /\bceh\b(?![a-z])/ },
  { bucket: 'cert_it',      re: /\boscp\b/ },
  { bucket: 'cert_it',      re: /\baws[\s_-](certified|cloud[\s_-]practitioner|saa|solutions[\s_-]architect)\b/ },
  { bucket: 'cert_it',      re: /\bazure[\s_-](az[\s_-]?\d|fundamentals)\b/ },
  { bucket: 'cert_it',      re: /\bccna\b|\bccnp\b/ },
  { bucket: 'cert_it',      re: /\bpki\b(?![a-z])/ },
  { bucket: 'cert_it',      re: /\brmf\b(?![a-z])/ },
  { bucket: 'cert_it',      re: /\bnist[\s_-]800\b/ },
];

// Spammy / non-CBT patterns to actively drop even if a keyword matched
const DROP_PATTERNS = [
  /\bmesothelioma\b/, /\basbestos\b/,
  /\bpenny[\s_-]stock\b/, /\bforex[\s_-]broker\b/,
  /\bcasino[\s_-]bonus\b/, /\bcbd[\s_-]oil\b/,
  /\b1[\s_-]800\b/, /\b1-800-\b/,
];

function classify(filename) {
  const stem = path.basename(filename, '.docx').toLowerCase().replace(/\s+/g, ' ').trim();

  for (const re of DROP_PATTERNS) {
    if (re.test(stem)) return { keep: false, reason: 'spam' };
  }

  for (const { bucket, re } of PATTERNS) {
    if (re.test(stem)) return { keep: true, bucket, matched: re.toString() };
  }
  return { keep: false, reason: 'no-match' };
}

function slugify(filename) {
  return path.basename(filename, '.docx')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) {
    console.error('SKIP (missing):', dir);
    return [];
  }
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    if (!name.toLowerCase().endsWith('.docx')) continue;
    out.push(path.join(dir, name));
  }
  return out;
}

const stats = {
  total: 0,
  kept: 0,
  dropped_spam: 0,
  dropped_no_match: 0,
  by_bucket: {},
  by_source: {},
  duplicate_slugs: 0,
};
const keepers = [];
const seenSlugs = new Map();

for (const dir of SOURCE_DIRS) {
  console.log('Scanning', dir, '...');
  const files = walkDir(dir);
  stats.by_source[dir] = { total: files.length, kept: 0 };
  for (const fullPath of files) {
    stats.total++;
    const filename = path.basename(fullPath);
    const c = classify(filename);
    if (!c.keep) {
      if (c.reason === 'spam') stats.dropped_spam++;
      else stats.dropped_no_match++;
      continue;
    }
    const slug = slugify(filename);
    if (seenSlugs.has(slug)) {
      stats.duplicate_slugs++;
      const existing = seenSlugs.get(slug);
      const existingSize = fs.statSync(existing.path).size;
      const newSize = fs.statSync(fullPath).size;
      if (newSize > existingSize) {
        existing.path = fullPath;
        existing.filename = filename;
        existing.bucket = c.bucket;
      }
      continue;
    }
    const entry = { path: fullPath, filename, slug, bucket: c.bucket };
    keepers.push(entry);
    seenSlugs.set(slug, entry);
    stats.kept++;
    stats.by_bucket[c.bucket] = (stats.by_bucket[c.bucket] || 0) + 1;
    stats.by_source[dir].kept++;
  }
  console.log('  files:', files.length, 'kept-so-far:', stats.kept);
}

const out = { generated_at: new Date().toISOString(), stats, keepers };
const outPath = path.join(process.cwd(), 'scripts', 'ihatecbts_pass1_manifest.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log('\n=== STATS ===');
console.log(JSON.stringify(stats, null, 2));
console.log('\nManifest written:', outPath, '(' + (fs.statSync(outPath).size / 1024 / 1024).toFixed(2) + ' MB)');
