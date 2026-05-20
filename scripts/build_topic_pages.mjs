#!/usr/bin/env node
// Build topic deep-dive pages: aggregate every Q&A across all CBTs by section.
//
// Input:  public/data/answers/<slug>.json  (with `sections` + qa.section from pass 4)
// Output: public/data/topics/<topic-slug>.json
//         scripts/topics_index.json (for the topic-index page)
//
// Example: every "Spillage" Q&A from every Cyber Awareness variant ends up on
// one page at /answers/topic/spillage. SEO landing for "spillage answers".

import fs from 'node:fs';
import path from 'node:path';

const ANSWERS_DIR = 'public/data/answers';
const OUT_DIR = 'public/data/topics';
const INDEX_OUT = 'scripts/topics_index.json';

fs.mkdirSync(OUT_DIR, { recursive: true });

function topicSlug(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function normQ(q) {
  return q.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

// topicSlug -> { name (canonical capitalization), qas: [{q, a, source_slug, source_title, source_bucket}] }
const topics = new Map();

const files = fs.readdirSync(ANSWERS_DIR).filter(f => f.endsWith('.json'));

for (const f of files) {
  const data = JSON.parse(fs.readFileSync(path.join(ANSWERS_DIR, f), 'utf8'));
  if (data.kind !== 'qa' || !Array.isArray(data.qas)) continue;
  for (const qa of data.qas) {
    if (!qa.section) continue;
    const slug = topicSlug(qa.section);
    if (!slug) continue;
    if (!topics.has(slug)) {
      topics.set(slug, {
        slug,
        // Prefer the first-seen capitalization for display
        name: qa.section,
        qas: [],
      });
    }
    topics.get(slug).qas.push({
      q: qa.q,
      a: qa.a,
      source_slug: data.slug,
      source_title: data.title,
      source_bucket: data.bucket,
    });
  }
}

// Dedupe within each topic by normalized question text — keep longest answer
const indexEntries = [];
for (const topic of topics.values()) {
  const seen = new Map();  // normQ -> entry
  for (const qa of topic.qas) {
    const key = normQ(qa.q);
    if (!key) continue;
    if (!seen.has(key)) {
      seen.set(key, { ...qa, also_in: new Set([qa.source_slug]) });
    } else {
      const existing = seen.get(key);
      existing.also_in.add(qa.source_slug);
      if (qa.a.length > existing.a.length) {
        existing.q = qa.q;
        existing.a = qa.a;
        existing.source_slug = qa.source_slug;
        existing.source_title = qa.source_title;
        existing.source_bucket = qa.source_bucket;
      }
    }
  }
  const dedupedQas = [...seen.values()].map(e => ({
    q: e.q,
    a: e.a,
    source_slug: e.source_slug,
    source_title: e.source_title,
    source_bucket: e.source_bucket,
    also_in_count: e.also_in.size,
  }));

  if (dedupedQas.length < 2) continue;  // not worth a page

  const out = {
    slug: topic.slug,
    name: topic.name,
    question_count: dedupedQas.length,
    source_cbt_count: new Set(dedupedQas.map(q => q.source_slug)).size,
    qas: dedupedQas,
  };
  fs.writeFileSync(path.join(OUT_DIR, topic.slug + '.json'), JSON.stringify(out));
  indexEntries.push({
    slug: topic.slug,
    name: topic.name,
    question_count: dedupedQas.length,
    source_cbt_count: out.source_cbt_count,
  });
}

indexEntries.sort((a, b) => b.question_count - a.question_count);
fs.writeFileSync(INDEX_OUT, JSON.stringify({
  generated_at: new Date().toISOString(),
  topics: indexEntries,
}, null, 2));

console.log(`Built ${indexEntries.length} topic pages`);
console.log('Top 15 by question count:');
for (const t of indexEntries.slice(0, 15)) {
  console.log(`  ${t.name.padEnd(40)} ${t.question_count} Qs across ${t.source_cbt_count} CBTs`);
}
