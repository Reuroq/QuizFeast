// FunctionalAgent — basic correctness checks for every audited URL:
// - HTTP status is 200
// - Response time under threshold
// - Page has expected markers based on category (h1, find bar, etc.)
// - No raw error/exception text leaked in HTML

const CATEGORY_MARKERS = {
  'root': [/CBT Answers/i],
  'answers-index': [/CBT[\s\S]*Answer Keys/, /Find your CBT/i],
  // answers-slug can be Q&A OR prose. We require ONE of these markers, not all.
  'answers-slug': [{ anyOf: [/Find a question/i, /Topic Deep Dive/i, /community-sourced/i] }],
  'answers-topic': [/Topic Deep Dive/i, /CBTs that cover/i],
  'answers-canonical': [/Community Question/i],
  'cbt-slug': [/Q&A Mode|study|questions/i],
  'legal': [/Nightshift Labs LLC/],
  'feature': [/QuizFeast/],
};

const RESPONSE_TIME_THRESHOLD_MS = 4000;
const ERROR_LEAK_PATTERNS = [
  /TypeError:/, /ReferenceError:/, /SyntaxError:/, /undefined is not/,
  /Cannot read prop/, /at .*\.js:\d/, /Application error/,
];

export async function runFunctionalAgent({ url, category, store }) {
  const t0 = Date.now();
  let res, html;
  try {
    res = await fetch(url, { redirect: 'follow' });
    html = await res.text();
  } catch (err) {
    store.report({
      agent: 'functional', category: 'fetch-failure', severity: 'critical', url,
      message: `fetch threw: ${err.message}`,
      auto_fixable: false,
    });
    return;
  }
  const elapsed = Date.now() - t0;

  // 1. Status check
  if (!res.ok) {
    store.report({
      agent: 'functional', category: 'http-error', severity: res.status >= 500 ? 'critical' : 'high',
      url, message: `HTTP ${res.status} ${res.statusText}`,
      evidence: { kind: 'text', value: html.slice(0, 500) },
      auto_fixable: false,
    });
    return;
  }

  // 2. Response time
  if (elapsed > RESPONSE_TIME_THRESHOLD_MS) {
    store.report({
      agent: 'functional', category: 'slow-response', severity: elapsed > 8000 ? 'high' : 'medium',
      url, message: `Response took ${elapsed}ms (threshold ${RESPONSE_TIME_THRESHOLD_MS}ms)`,
      evidence: { kind: 'text', value: `elapsed=${elapsed}ms` },
      auto_fixable: false,
    });
  }

  // 3. Empty / tiny response
  if (html.length < 500) {
    store.report({
      agent: 'functional', category: 'empty-page', severity: 'high',
      url, message: `HTML body only ${html.length} bytes`,
      evidence: { kind: 'text', value: html },
      auto_fixable: false,
    });
    return;
  }

  // 4. Expected markers per category. Two modes:
  //    - bare regex: must match
  //    - { anyOf: [re, re, ...] }: at least one must match
  const markers = CATEGORY_MARKERS[category] || [];
  for (const m of markers) {
    if (m && typeof m === 'object' && !(m instanceof RegExp) && Array.isArray(m.anyOf)) {
      const hit = m.anyOf.some(re => re.test(html));
      if (!hit) {
        store.report({
          agent: 'functional', category: 'missing-marker', severity: 'medium', url,
          message: `${category} page missing any of expected markers ${m.anyOf.map(r => r.toString()).join(', ')}`,
          sub_key: m.anyOf.map(r => r.toString()).join('|'),
          evidence: { kind: 'text', value: html.slice(0, 300) },
          auto_fixable: false,
        });
      }
    } else if (m instanceof RegExp) {
      if (!m.test(html)) {
        store.report({
          agent: 'functional', category: 'missing-marker', severity: 'medium', url,
          message: `${category} page missing expected marker ${m.toString()}`,
          sub_key: m.toString(),
          evidence: { kind: 'text', value: html.slice(0, 300) },
          auto_fixable: false,
        });
      }
    }
  }

  // 5. Error leak in HTML
  for (const re of ERROR_LEAK_PATTERNS) {
    const m = html.match(re);
    if (m) {
      store.report({
        agent: 'functional', category: 'error-leak', severity: 'high', url,
        message: `Error string in HTML: ${m[0].slice(0, 80)}`,
        sub_key: m[0].slice(0, 40),
        evidence: { kind: 'text', value: m[0].slice(0, 200) },
        auto_fixable: false,
      });
    }
  }

  return { ok: true, elapsed };
}
