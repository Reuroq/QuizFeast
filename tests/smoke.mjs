#!/usr/bin/env node
// Fast smoke test — no browser, no Playwright. Just curl-level checks against
// the running site to confirm the surface isn't broken.
//
// Run: npm run test:smoke
// Run against prod: BASE_URL=https://quizfeast.onrender.com npm run test:smoke

const BASE = process.env.BASE_URL || 'http://localhost:3000';

const checks = [];
let failed = 0;

async function check(name, fn) {
  process.stdout.write(`  ${name} ... `);
  const t0 = Date.now();
  try {
    await fn();
    console.log(`OK (${Date.now() - t0}ms)`);
    checks.push({ name, ok: true, ms: Date.now() - t0 });
  } catch (e) {
    failed++;
    console.log(`FAIL  ${e.message}`);
    checks.push({ name, ok: false, ms: Date.now() - t0, error: e.message });
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }

async function fetchOk(url, expectedShape) {
  const res = await fetch(url);
  assert(res.ok, `${url} returned ${res.status}`);
  if (expectedShape === 'json') return res.json();
  if (expectedShape === 'text') return res.text();
  return res;
}

console.log(`Smoke testing ${BASE}\n`);

// ----- Routes return 200 -----
await check('GET /', async () => {
  await fetchOk(`${BASE}/`);
});

await check('GET /answers', async () => {
  const r = await fetch(`${BASE}/answers`);
  assert(r.ok, `status ${r.status}`);
  const html = await r.text();
  assert(html.includes('Find your CBT'), 'find bar placeholder missing');
});

await check('GET /answers/army-cyber-awareness-challenge-2023', async () => {
  const r = await fetch(`${BASE}/answers/army-cyber-awareness-challenge-2023`);
  assert(r.ok, `status ${r.status}`);
  const html = await r.text();
  assert(html.includes('Find a question'), 'find bar missing');
  assert(html.includes('Wrong answer? Report'), 'correction button missing');
});

await check('GET /answers/topic/spillage', async () => {
  const r = await fetch(`${BASE}/answers/topic/spillage`);
  assert(r.ok, `status ${r.status}`);
  const html = await r.text();
  assert(html.includes('Topic Deep Dive'), 'topic badge missing');
});

await check('GET /sitemap.xml has 2000+ URLs', async () => {
  const text = await fetchOk(`${BASE}/sitemap.xml`, 'text');
  const locs = (text.match(/<loc>/g) || []).length;
  assert(locs > 2000, `only ${locs} URLs`);
});

await check('GET /robots.txt points to sitemap', async () => {
  const text = await fetchOk(`${BASE}/robots.txt`, 'text');
  assert(/Sitemap:/i.test(text), 'no Sitemap directive');
});

// ----- API shape -----
await check('API /api/answers/global-search returns expected shape', async () => {
  const data = await fetchOk(`${BASE}/api/answers/global-search?q=phishing`, 'json');
  assert(Array.isArray(data.cbts), 'cbts not array');
  assert(Array.isArray(data.questions), 'questions not array');
  assert(data.questions.length > 0, 'no questions returned');
  assert('q_idx' in data.questions[0], 'q_idx missing on result');
  assert('cbt_title' in data.questions[0], 'cbt_title missing on result');
});

// ----- Context boost actually re-ranks -----
await check('API context_slugs boost re-ranks results', async () => {
  const SLUG = 'army-cyber-awareness-challenge-2023';
  const without = await fetchOk(`${BASE}/api/answers/global-search?q=phishing`, 'json');
  const withCtx = await fetchOk(
    `${BASE}/api/answers/global-search?q=phishing&context_slugs=${SLUG}`,
    'json'
  );
  assert(withCtx.questions[0]?.slug === SLUG, `expected ${SLUG} first, got ${withCtx.questions[0]?.slug}`);
  assert(withCtx.questions[0]?.in_context === true, 'in_context flag not set');
  assert(withCtx.context_applied === true, 'context_applied flag not set');
  assert(without.questions[0]?.slug !== SLUG, 'no-context first result should NOT be context slug (control)');
});

// ----- Short query is empty -----
await check('API short query returns empty', async () => {
  const data = await fetchOk(`${BASE}/api/answers/global-search?q=p`, 'json');
  assert(data.questions.length === 0, 'short query returned questions');
});

// ----- Existing /cbt/[slug] still works -----
await check('GET /cbt/cyber_awareness (existing pre-/answers route)', async () => {
  const r = await fetch(`${BASE}/cbt/cyber_awareness`);
  assert(r.ok, `status ${r.status}`);
});

console.log(`\n${checks.length - failed}/${checks.length} passed`);
if (failed > 0) {
  console.log('\nFAILURES:');
  for (const c of checks.filter(c => !c.ok)) console.log(`  - ${c.name}: ${c.error}`);
  process.exit(1);
}
console.log('All green.');
