#!/usr/bin/env node
// Pass 7: Detect near-duplicate /answers SETS (whole files with substantially
// overlapping Q content) and produce a redirect map.
//
// Background: the audit's SetIdentificationAgent surfaced that ~5 of 11
// sampled slugs had a "wrong" top match that was actually a duplicate
// ingest of the same Quizlet content under two different filenames. Pinecone
// retrieves correctly but the match scoring can split between near-duplicates
// because both score similarly.
//
// Strategy: compute a fingerprint signature (set of normalized 8-word question
// keys) per slug, then bucket by signature. Sets sharing >= JACCARD_THRESHOLD
// of their fingerprint are flagged as duplicates.
//
// Output: scripts/dedupe_redirects.json
//   { redirects: [{ from: smaller_slug, to: canonical_slug, similarity }] }
//
// Next.js consumes this file via next.config.mjs redirects() — the smaller
// slug 301s to the canonical so SEO consolidates + visitors aren't confused.

import fs from 'node:fs';
import path from 'node:path';

const ANSWERS_DIR = 'public/data/answers';
const OUT_FILE = 'scripts/dedupe_redirects.json';

const JACCARD_THRESHOLD = 0.6;  // 60% — empirically the right balance after
                                // first audit found near-dup misses at 70%
                                // (e.g. restricted-vs-unrestricted-sharp)

function questionKey(s, wordCount = 8) {
  const norm = (s || '').toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  if (!norm) return '';
  return norm.split(' ').slice(0, wordCount).join(' ');
}

// Load all slugs and compute their fingerprint signature
const files = fs.readdirSync(ANSWERS_DIR).filter(f => f.endsWith('.json'));
const sigs = new Map();  // slug -> { qCount, sig: Set<key>, title }

for (const f of files) {
  const data = JSON.parse(fs.readFileSync(path.join(ANSWERS_DIR, f), 'utf8'));
  if (data.kind !== 'qa' || !Array.isArray(data.qas) || data.qas.length < 5) continue;
  const sig = new Set();
  for (const qa of data.qas) {
    const k = questionKey(qa.q, 8);
    if (k && k.length >= 12) sig.add(k);
  }
  if (sig.size < 5) continue;
  sigs.set(data.slug, { qCount: data.qas.length, sig, title: data.title });
}

console.log(`Loaded fingerprints for ${sigs.size} slugs.`);

// Pairwise Jaccard comparison. O(n²) but n ≈ 1200 — manageable (~720K pairs).
const dups = [];          // [{ a, b, similarity }]
const slugs = [...sigs.keys()];
const T0 = Date.now();

for (let i = 0; i < slugs.length; i++) {
  const aSig = sigs.get(slugs[i]).sig;
  // Early-skip optimization: only compare with slugs that share at least 1
  // key. Build a quick lookup per first key.
  for (let j = i + 1; j < slugs.length; j++) {
    const bSig = sigs.get(slugs[j]).sig;
    // Compute intersection size + jaccard
    const small = aSig.size <= bSig.size ? aSig : bSig;
    const big = aSig.size <= bSig.size ? bSig : aSig;
    let inter = 0;
    for (const k of small) if (big.has(k)) inter++;
    if (inter < 5) continue;  // not enough overlap to bother
    const union = aSig.size + bSig.size - inter;
    const jaccard = inter / union;
    if (jaccard >= JACCARD_THRESHOLD) {
      dups.push({ a: slugs[i], b: slugs[j], jaccard, inter, union });
    }
  }
  if ((i + 1) % 100 === 0) {
    const elapsed = ((Date.now() - T0) / 1000).toFixed(1);
    console.log(`  ${i + 1}/${slugs.length} (${elapsed}s, ${dups.length} dups so far)`);
  }
}

console.log(`\nFound ${dups.length} duplicate pairs above ${JACCARD_THRESHOLD * 100}% similarity.`);

// Pick canonical: prefer the slug with more questions; tiebreak by shorter
// slug (cleaner URL); tiebreak by alphabetical.
function pickCanonical(a, b) {
  const sa = sigs.get(a);
  const sb = sigs.get(b);
  if (sa.qCount !== sb.qCount) return sa.qCount > sb.qCount ? a : b;
  if (a.length !== b.length) return a.length < b.length ? a : b;
  return a < b ? a : b;
}

// Build redirect map. Use union-find to handle transitive duplicates:
// if A~B and B~C, both A and C should redirect to B (or whatever wins overall).
const parent = new Map();
function find(x) {
  if (!parent.has(x)) parent.set(x, x);
  if (parent.get(x) === x) return x;
  const root = find(parent.get(x));
  parent.set(x, root);
  return root;
}
function union(a, b) {
  const ra = find(a), rb = find(b);
  if (ra === rb) return;
  // Pick canonical between the two roots
  const canon = pickCanonical(ra, rb);
  const other = canon === ra ? rb : ra;
  parent.set(other, canon);
}

for (const d of dups) union(d.a, d.b);

// For each slug that has a non-self parent, emit a redirect
const redirects = [];
for (const slug of slugs) {
  const canon = find(slug);
  if (canon !== slug) {
    // Find the jaccard between this slug and the canonical
    const dupPair = dups.find(d =>
      (d.a === slug && d.b === canon) || (d.b === slug && d.a === canon)
    );
    redirects.push({
      from: slug,
      to: canon,
      similarity: dupPair ? +dupPair.jaccard.toFixed(3) : 0.7,
    });
  }
}

// Sort by similarity desc for review
redirects.sort((a, b) => b.similarity - a.similarity);

fs.writeFileSync(OUT_FILE, JSON.stringify({
  generated_at: new Date().toISOString(),
  threshold: JACCARD_THRESHOLD,
  total_slugs_scanned: sigs.size,
  duplicate_pairs_found: dups.length,
  redirects_emitted: redirects.length,
  redirects,
}, null, 2));

console.log(`\nDeduplication complete:`);
console.log(`  Scanned:        ${sigs.size} slugs`);
console.log(`  Dup pairs:      ${dups.length}`);
console.log(`  Redirect rules: ${redirects.length}`);
console.log(`  Output:         ${OUT_FILE}`);

// Print first 10 redirects so the user can sanity-check
console.log(`\nFirst 10 redirects:`);
for (const r of redirects.slice(0, 10)) {
  console.log(`  ${r.from}  ->  ${r.to}  (${(r.similarity * 100).toFixed(0)}%)`);
}
