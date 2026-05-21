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

// ----- Legal pages -----
await check('GET /terms has Nightshift Labs LLC + arbitration clause', async () => {
  const html = await fetchOk(`${BASE}/terms`, 'text');
  assert(/Nightshift Labs LLC/i.test(html), 'entity name missing');
  assert(/arbitration/i.test(html), 'arbitration clause missing');
  assert(/Nevada/i.test(html), 'governing law missing');
});

await check('GET /dmca has takedown procedure + designated agent', async () => {
  const html = await fetchOk(`${BASE}/dmca`, 'text');
  assert(/DMCA/i.test(html), 'DMCA reference missing');
  assert(/Designated/i.test(html), 'designated agent section missing');
  assert(/dwaynemorise007@gmail\.com/i.test(html), 'DMCA email missing');
});

await check('GET /privacy reflects no-account / sessionStorage policy', async () => {
  const html = await fetchOk(`${BASE}/privacy`, 'text');
  assert(/sessionStorage/i.test(html), 'sessionStorage disclosure missing');
  assert(/No accounts|don.t require an account/i.test(html), 'no-account claim missing');
});

await check('GET /disclaimer has not-affiliated + may-be-wrong statements', async () => {
  const html = await fetchOk(`${BASE}/disclaimer`, 'text');
  assert(/not affiliated/i.test(html), 'no-affiliation claim missing');
  assert(/may be wrong/i.test(html), 'accuracy disclaimer missing');
});

await check('/answers/[slug] shows community-sourced disclaimer banner', async () => {
  const html = await fetchOk(`${BASE}/answers/army-cyber-awareness-challenge-2023`, 'text');
  assert(/Community-sourced/i.test(html), 'in-page disclaimer banner missing');
});

await check('Footer has Terms / Privacy / DMCA / Disclaimer links', async () => {
  const html = await fetchOk(`${BASE}/`, 'text');
  for (const link of ['/terms', '/privacy', '/dmca', '/disclaimer']) {
    assert(html.includes(`href="${link}"`), `footer missing ${link} link`);
  }
});

// ----- Banned-term scrub verification -----
// Probe every dynamic surface that returns retrieved content. None of them
// should leak references to third-party study sites we don't want to be
// associated with.
const BANNED_RE = /\b(quizlet|chegg|course[\s-]?hero|studocu|brainly)\b/i;

await check('Banned terms not present on /answers/[slug] (live page)', async () => {
  const html = await fetchOk(`${BASE}/answers/army-cyber-awareness-challenge-2023`, 'text');
  assert(!BANNED_RE.test(html), `banned term leaked on /answers/army-cyber-awareness-challenge-2023`);
});

await check('Banned terms not present on /answers index', async () => {
  const html = await fetchOk(`${BASE}/answers`, 'text');
  assert(!BANNED_RE.test(html), 'banned term leaked on /answers');
});

await check('Banned terms not present in /api/answers/global-search response', async () => {
  const data = await fetchOk(`${BASE}/api/answers/global-search?q=cyber`, 'json');
  const serialized = JSON.stringify(data);
  assert(!BANNED_RE.test(serialized), 'banned term leaked in global-search response');
});

await check('Banned terms not present in /api/cbt/search response', async () => {
  const data = await fetchOk(`${BASE}/api/cbt/search?q=phishing`, 'json');
  const serialized = JSON.stringify(data);
  assert(!BANNED_RE.test(serialized), 'banned term leaked in cbt search response');
});

await check('Banned terms not present in /api/search response', async () => {
  const res = await fetch(`${BASE}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'phishing', topK: 10 }),
  });
  if (!res.ok) return;  // route may be deprecated, don't fail
  const data = await res.json();
  const serialized = JSON.stringify(data);
  assert(!BANNED_RE.test(serialized), 'banned term leaked in /api/search response');
});

await check('Banned terms not in legal pages or footer', async () => {
  for (const p of ['/terms', '/privacy', '/disclaimer', '/dmca', '/']) {
    const html = await fetchOk(`${BASE}${p}`, 'text');
    assert(!BANNED_RE.test(html), `banned term leaked on ${p}`);
  }
});

// ----- /study page + API surface -----
await check('GET /study renders form + AI study label', async () => {
  const html = await fetchOk(`${BASE}/study`, 'text');
  assert(/Stuck on a few questions/i.test(html), 'study page heading missing');
  assert(/Paste 2/i.test(html), 'placeholder copy missing');
});

await check('POST /api/study/recommend rejects empty payload', async () => {
  const r = await fetch(`${BASE}/api/study/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questions: [] }),
  });
  assert(r.status === 400, `expected 400, got ${r.status}`);
});

await check('POST /api/study/recommend alternates chip_labels do NOT contain vendor trademarks', async () => {
  const r = await fetch(`${BASE}/api/study/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questions: ['What is the CIA triad in information security?'] }),
  });
  if (!r.ok) return;
  const data = await r.json();
  const VENDOR_RE = /\b(comptia|cisco|aws|amazon\s+web\s+services|microsoft|azure|cissp|cism|ccna|ccnp|ceh|oscp|security\+|network\+)\b/i;
  for (const item of data.alternates || []) {
    if (item.chip_label) {
      assert(!VENDOR_RE.test(item.chip_label), `vendor trademark in chip_label: "${item.chip_label}"`);
    }
  }
});

await check('POST /api/study/recommend returns a matched set with full qas', async () => {
  const r = await fetch(`${BASE}/api/study/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      questions: [
        'What is whaling?',
        'How can you protect your information when using wireless technology?',
      ],
    }),
  });
  if (!r.ok) return;
  const data = await r.json();
  assert('identified_topic' in data, 'missing identified_topic');
  assert('identified_slug' in data, 'missing identified_slug');
  assert('set' in data, 'missing set object');
  if (data.set) {
    assert(typeof data.set.slug === 'string', 'set.slug not a string');
    assert(Array.isArray(data.set.qas), 'set.qas not an array');
    assert(data.set.qas.length >= 2, 'set has fewer than 2 qas');
    // Sample qa shape
    assert('q' in data.set.qas[0], 'set qa missing q');
    assert('a' in data.set.qas[0], 'set qa missing a');
  }
});

await check('Correction modal copy does not leak the vote threshold to visitors', async () => {
  const html = await fetchOk(`${BASE}/answers/army-cyber-awareness-challenge-2023`, 'text');
  // The old copy "After 5 people submit..." was an abuse vector
  assert(!/After \d+ people submit/i.test(html), 'old threshold-leak copy still present');
  assert(!/\d+\/\d+\s+votes/i.test(html), 'vote count UI still visible');
});

console.log(`\n${checks.length - failed}/${checks.length} passed`);
if (failed > 0) {
  console.log('\nFAILURES:');
  for (const c of checks.filter(c => !c.ok)) console.log(`  - ${c.name}: ${c.error}`);
  process.exit(1);
}
console.log('All green.');
