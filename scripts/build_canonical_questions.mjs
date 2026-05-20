#!/usr/bin/env node
// Group questions that appear identically across many CBTs into canonical pages.
//
// Input:  public/data/answers/<slug>.json
// Output: public/data/canonical/<question-slug>.json
//         scripts/canonical_index.json
//
// Threshold: 5+ different source CBTs. Each canonical page picks the longest
// answer (most info), lists every CBT the question appears in, and is a clean
// SEO landing for that specific question.

import fs from 'node:fs';
import path from 'node:path';

const ANSWERS_DIR = 'public/data/answers';
const OUT_DIR = 'public/data/canonical';
const INDEX_OUT = 'scripts/canonical_index.json';
const MIN_CBTS = 5;  // Question must appear in this many CBTs to get a page

fs.mkdirSync(OUT_DIR, { recursive: true });

function normQ(q) {
  return q.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

function slugify(q) {
  return q.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
}

// Skip ultra-short questions (one-word or two-word lookups) — too generic
// and slug collides too often.
function shouldSkip(q) {
  const trimmed = q.trim();
  if (trimmed.length < 12) return true;
  const words = trimmed.split(/\s+/).length;
  if (words < 3) return true;
  return false;
}

const buckets = new Map();  // normQ -> { q (display), entries: [{slug,title,bucket,a}] }
const files = fs.readdirSync(ANSWERS_DIR).filter(f => f.endsWith('.json'));

for (const f of files) {
  const data = JSON.parse(fs.readFileSync(path.join(ANSWERS_DIR, f), 'utf8'));
  if (data.kind !== 'qa' || !Array.isArray(data.qas)) continue;
  for (const qa of data.qas) {
    if (shouldSkip(qa.q)) continue;
    const key = normQ(qa.q);
    if (!key) continue;
    if (!buckets.has(key)) {
      buckets.set(key, { q: qa.q, entries: [] });
    }
    buckets.get(key).entries.push({
      source_slug: data.slug,
      source_title: data.title,
      source_bucket: data.bucket,
      q: qa.q,
      a: qa.a,
    });
  }
}

const indexEntries = [];
const slugTaken = new Map();

// Sort by appearance count desc so we can break slug ties in favor of more-popular Qs
const sorted = [...buckets.entries()]
  .map(([key, val]) => ({
    key,
    val,
    cbts: new Set(val.entries.map(e => e.source_slug)).size,
  }))
  .filter(x => x.cbts >= MIN_CBTS)
  .sort((a, b) => b.cbts - a.cbts);

for (const { key, val, cbts } of sorted) {
  // Find longest answer across all variants
  const longest = val.entries.reduce((a, b) => b.a.length > a.a.length ? b : a);
  const cbtList = new Map();  // source_slug -> {title, bucket, answer}
  for (const e of val.entries) {
    if (!cbtList.has(e.source_slug)) {
      cbtList.set(e.source_slug, {
        slug: e.source_slug,
        title: e.source_title,
        bucket: e.source_bucket,
        answer: e.a,
      });
    }
  }

  let baseSlug = slugify(longest.q);
  if (!baseSlug) continue;
  let slug = baseSlug;
  let n = 2;
  while (slugTaken.has(slug)) {
    slug = baseSlug + '-' + n;
    n++;
  }
  slugTaken.set(slug, true);

  const out = {
    slug,
    question: longest.q,
    canonical_answer: longest.a,
    appears_in_count: cbts,
    appears_in: [...cbtList.values()].sort((a, b) => a.title.localeCompare(b.title)),
  };
  fs.writeFileSync(path.join(OUT_DIR, slug + '.json'), JSON.stringify(out));
  indexEntries.push({
    slug,
    question: longest.q.slice(0, 200),
    appears_in_count: cbts,
  });
}

fs.writeFileSync(INDEX_OUT, JSON.stringify({
  generated_at: new Date().toISOString(),
  min_cbts: MIN_CBTS,
  total: indexEntries.length,
  entries: indexEntries,
}, null, 2));

console.log(`Built ${indexEntries.length} canonical question pages (questions appearing in ${MIN_CBTS}+ CBTs)`);
console.log('Top 10 by appearance count:');
for (const e of indexEntries.slice(0, 10)) {
  console.log(`  [${String(e.appears_in_count).padStart(2)}] ${e.question.slice(0, 90)}`);
}
