#!/usr/bin/env node
// Audit orchestrator. Runs every agent against the configured base URL and
// writes findings to the issue store + a human-readable AUDIT.md.
//
// Usage:
//   node scripts/audit/run.mjs                      # default: prod, all agents
//   AUDIT_BASE=http://localhost:3000 node ...        # against dev
//   AUDIT_AGENTS=functional,legal node ...           # subset
//   AUDIT_SET_ID_SAMPLE=10 node ...                  # smaller sample

import fs from 'node:fs';
import path from 'node:path';
import { AuditStore, logRun } from './lib/store.mjs';
import { crawlSitemap, groupByCategory, evenSample } from './lib/crawl.mjs';
import { runFunctionalAgent } from './agents/functional.mjs';
import { runLegalAgent } from './agents/legal.mjs';
import { runContentQualityAgent } from './agents/content-quality.mjs';
import { runSetIdentificationAgent } from './agents/set-identification.mjs';
import { runA11yAgent } from './agents/a11y.mjs';
import { runAutoFix } from './agents/auto-fix.mjs';

const BASE_URL = process.env.AUDIT_BASE || 'https://quizfeast.onrender.com';
const AGENTS = (process.env.AUDIT_AGENTS || 'functional,legal,content,set-id,a11y').split(',').map(s => s.trim());
const SET_ID_SAMPLE = parseInt(process.env.AUDIT_SET_ID_SAMPLE || '30', 10);
const CONTENT_SAMPLE = parseInt(process.env.AUDIT_CONTENT_SAMPLE || '20', 10);
const FUNCTIONAL_CONCURRENCY = 8;
const AUTO_FIX = process.env.AUDIT_AUTO_FIX === '1';

const started_at = new Date().toISOString();
console.log('=== QuizFeast Audit ===');
console.log('Base URL:', BASE_URL);
console.log('Agents:  ', AGENTS.join(', '));
console.log('Started: ', started_at);

const store = new AuditStore();

// Phase 1: Discovery
console.log('\n[discovery] Crawling sitemap...');
const allUrls = await crawlSitemap(BASE_URL);
const byCategory = groupByCategory(allUrls);
console.log(`[discovery] ${allUrls.length} URLs across ${Object.keys(byCategory).length} categories:`);
for (const [cat, urls] of Object.entries(byCategory)) {
  console.log(`  - ${cat}: ${urls.length}`);
}

// Phase 2: Functional agent against a representative sample
// (full crawl of 2,926 URLs would take 20+ minutes against prod)
if (AGENTS.includes('functional')) {
  console.log('\n[functional] Sampling URLs per category for status + DOM checks...');
  const sample = [];
  // Audit ALL legal/feature/root/index pages (small N, high stakes)
  // Sample SSG pages (large N, lower stakes per page)
  const SAMPLE_PER_CATEGORY = {
    'root': null, 'answers-index': null, 'feature': null, 'legal': null,
    'cbt-slug': 10, 'answers-slug': 30, 'answers-topic': 5, 'answers-canonical': 20, 'other': 5,
  };
  for (const [cat, urls] of Object.entries(byCategory)) {
    const n = SAMPLE_PER_CATEGORY[cat];
    sample.push(...(n == null ? urls : evenSample(urls, n)));
  }
  console.log(`[functional] Testing ${sample.length} URLs with concurrency=${FUNCTIONAL_CONCURRENCY}...`);

  // Parallel pool
  const queue = [...sample];
  let done = 0;
  await Promise.all(Array(FUNCTIONAL_CONCURRENCY).fill(0).map(async () => {
    while (queue.length) {
      const item = queue.shift();
      if (!item) break;
      await runFunctionalAgent({ url: item.url, category: item.category, store });
      done++;
      if (done % 25 === 0) console.log(`  ...${done}/${sample.length}`);
    }
  }));
  console.log(`[functional] Done. Open issues now: ${store.query({ fixed: false }).length}`);
}

// Phase 3: Legal agent
if (AGENTS.includes('legal')) {
  console.log('\n[legal] Checking banned terms, vendor leaks, legal-page contracts...');
  // Test all legal pages + sample of /answers slugs (where threshold-leak
  // might appear in the modal)
  const legalSample = [
    ...(byCategory.legal || []),
    ...(byCategory.root || []),
    ...evenSample(byCategory['answers-slug'] || [], 15),
  ];
  for (const u of legalSample) {
    await runLegalAgent({ url: u.url, category: u.category, store });
  }
  console.log(`[legal] Done. Found ${store.query({ agent: 'legal', fixed: false }).length} open issues.`);
}

// Phase 4: ContentQualityAgent (Claude-powered, sample-based)
if (AGENTS.includes('content')) {
  console.log(`\n[content] Sampling ${CONTENT_SAMPLE} /answers slugs for Q&A quality review...`);
  const slugs = (byCategory['answers-slug'] || [])
    .map(u => u.pathname.replace('/answers/', ''));
  const sampled = evenSample(slugs, CONTENT_SAMPLE);
  for (let i = 0; i < sampled.length; i++) {
    const slug = sampled[i];
    await runContentQualityAgent({ slug, store });
    if ((i + 1) % 5 === 0) console.log(`  ...${i + 1}/${sampled.length}`);
  }
  console.log(`[content] Done. Found ${store.query({ agent: 'content', fixed: false }).length} open issues.`);
}

// Phase 5: SetIdentificationAgent (test the AI matching accuracy)
let setIdSummary = null;
if (AGENTS.includes('set-id')) {
  console.log(`\n[set-id] Sampling ${SET_ID_SAMPLE} /answers slugs, verifying /study returns correct slug...`);
  const slugs = (byCategory['answers-slug'] || [])
    .map(u => u.pathname.replace('/answers/', ''));
  setIdSummary = await runSetIdentificationAgent({ baseUrl: BASE_URL, slugs, store, sampleSize: SET_ID_SAMPLE });
  console.log(`[set-id] Tested ${setIdSummary.tested}, correct=${setIdSummary.correct}, wrong-slug=${setIdSummary.wrong_slug}, no-match=${setIdSummary.no_match}, accuracy=${setIdSummary.accuracy}`);
}

// Phase 6: A11y on representative URLs
if (AGENTS.includes('a11y')) {
  console.log('\n[a11y] Running axe-core against one URL per category (Playwright)...');
  try {
    await runA11yAgent({ urlsByCategory: byCategory, store });
    console.log(`[a11y] Done. Found ${store.query({ agent: 'a11y', fixed: false }).length} open issues.`);
  } catch (err) {
    console.log(`[a11y] Failed to run: ${err.message}`);
  }
}

// Phase 7: Auto-fix (opt-in via env var, default off in case of bugs)
let autoFixResult = null;
if (AUTO_FIX) {
  console.log('\n[auto-fix] Applying safe deterministic fixes...');
  autoFixResult = runAutoFix(store);
  console.log(`[auto-fix] Fixed ${autoFixResult.fixed.length}, skipped ${autoFixResult.skipped.length}`);
}

// Persist + log + report
store.persist();
const finished_at = new Date().toISOString();
const elapsedSec = ((Date.now() - new Date(started_at)) / 1000).toFixed(1);
const stats = store.stats();
logRun({
  started_at, finished_at,
  agents: AGENTS,
  urls_audited: allUrls.length,
  issues_found: stats.open,
});

// Generate AUDIT.md
const auditMd = renderReport({ stats, store, setIdSummary, autoFixResult, BASE_URL, started_at, finished_at, elapsedSec });
fs.writeFileSync('AUDIT.md', auditMd);

console.log('\n=== Done ===');
console.log(`Elapsed: ${elapsedSec}s`);
console.log(`Open issues: ${stats.open} (${stats.fixed} previously fixed)`);
console.log(`Report: AUDIT.md`);

function renderReport({ stats, store, setIdSummary, autoFixResult, BASE_URL, started_at, finished_at, elapsedSec }) {
  const issues = store.query({ fixed: false });
  // Severity order
  const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  issues.sort((a, b) => (sevOrder[a.severity] ?? 9) - (sevOrder[b.severity] ?? 9));

  const lines = [];
  lines.push('# QuizFeast Site Audit Report\n');
  lines.push(`- **Base URL:** ${BASE_URL}`);
  lines.push(`- **Run:** ${started_at} → ${finished_at} (${elapsedSec}s)`);
  lines.push(`- **Issues open:** ${stats.open} (${stats.fixed} previously fixed)`);
  lines.push('');
  lines.push('## Severity breakdown\n');
  for (const sev of ['critical', 'high', 'medium', 'low']) {
    lines.push(`- ${sev}: ${stats.by_severity[sev] || 0}`);
  }
  lines.push('');
  lines.push('## By agent\n');
  for (const [agent, n] of Object.entries(stats.by_agent)) {
    lines.push(`- ${agent}: ${n}`);
  }
  if (setIdSummary) {
    lines.push('');
    lines.push('## Set-identification accuracy\n');
    lines.push(`- Tested: **${setIdSummary.tested}** slug samples`);
    lines.push(`- Correct top match: **${setIdSummary.correct}** (${setIdSummary.accuracy} accuracy)`);
    lines.push(`- Wrong slug returned: **${setIdSummary.wrong_slug}**`);
    lines.push(`- No match returned: **${setIdSummary.no_match}**`);
  }
  if (autoFixResult) {
    lines.push('');
    lines.push('## Auto-fix results\n');
    lines.push(`- Applied: ${autoFixResult.fixed.length}`);
    lines.push(`- Skipped: ${autoFixResult.skipped.length}`);
  }
  lines.push('');
  lines.push('## Open issues\n');
  for (const it of issues.slice(0, 100)) {
    lines.push(`### [${it.severity.toUpperCase()}] ${it.category} — ${it.agent}`);
    if (it.url) lines.push(`- URL: ${it.url}`);
    lines.push(`- ${it.message}`);
    if (it.suggested_fix) lines.push(`- _Fix:_ ${it.suggested_fix}`);
    if (it.auto_fixable) lines.push(`- Auto-fixable: yes`);
    if (it.evidence?.value) {
      const ev = it.evidence.value.slice(0, 240).replace(/\n/g, ' ');
      lines.push(`- _Evidence:_ \`${ev}\``);
    }
    lines.push('');
  }
  if (issues.length > 100) {
    lines.push(`_(${issues.length - 100} more open issues — see scripts/audit/state/issues.json for full list.)_`);
  }
  return lines.join('\n');
}
