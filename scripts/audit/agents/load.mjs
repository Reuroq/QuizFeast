// LoadAgent — synthetic load test. Hits key endpoints with N concurrent
// requests, measures p50/p95/p99 latency, and reports if any percentile
// exceeds a threshold. Models "what happens at 20 concurrent visitors"
// (a small launch's traffic spike). Not a real load test (no ramp,
// no sustained duration) — a sanity check.

const SCENARIOS = (baseUrl) => [
  { name: 'home', method: 'GET', url: `${baseUrl}/`, concurrent: 20, p95_threshold_ms: 1500 },
  { name: 'answers-index', method: 'GET', url: `${baseUrl}/answers`, concurrent: 20, p95_threshold_ms: 2000 },
  { name: 'answers-slug', method: 'GET', url: `${baseUrl}/answers/army-cyber-awareness-challenge-2023`, concurrent: 15, p95_threshold_ms: 2000 },
  { name: 'global-search-api', method: 'GET', url: `${baseUrl}/api/answers/global-search?q=cyber`, concurrent: 10, p95_threshold_ms: 1500 },
  { name: 'sitemap', method: 'GET', url: `${baseUrl}/sitemap.xml`, concurrent: 5, p95_threshold_ms: 3000 },
];

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return sorted[idx];
}

async function runScenario(scenario) {
  const promises = [];
  const t0 = Date.now();
  for (let i = 0; i < scenario.concurrent; i++) {
    promises.push((async () => {
      const start = Date.now();
      let status, err;
      try {
        const res = await fetch(scenario.url, { method: scenario.method });
        status = res.status;
        await res.text();  // drain body so timing reflects full response
      } catch (e) {
        err = e.message;
      }
      return { elapsed: Date.now() - start, status, err };
    })());
  }
  const results = await Promise.all(promises);
  const wallTime = Date.now() - t0;
  const times = results.filter(r => r.status === 200).map(r => r.elapsed);
  const errors = results.filter(r => r.err || r.status >= 500);
  return {
    name: scenario.name,
    url: scenario.url,
    concurrent: scenario.concurrent,
    wall_ms: wallTime,
    success_count: times.length,
    error_count: errors.length,
    p50: percentile(times, 0.5),
    p95: percentile(times, 0.95),
    p99: percentile(times, 0.99),
    max: Math.max(...times, 0),
    threshold: scenario.p95_threshold_ms,
  };
}

export async function runLoadAgent({ baseUrl, store }) {
  const scenarios = SCENARIOS(baseUrl);
  for (const scenario of scenarios) {
    const result = await runScenario(scenario);
    // Errors immediately = high severity
    if (result.error_count > 0) {
      store.report({
        agent: 'load', category: 'concurrent-errors', severity: 'high', url: result.url,
        sub_key: result.name,
        message: `${result.error_count}/${result.concurrent} requests failed under concurrent load on ${result.name}`,
        evidence: { kind: 'text', value: JSON.stringify(result) },
        auto_fixable: false,
      });
    }
    // p95 over threshold = medium-high signal of capacity issue
    if (result.p95 > result.threshold) {
      const sev = result.p95 > result.threshold * 2 ? 'high' : 'medium';
      store.report({
        agent: 'load', category: 'slow-under-load', severity: sev, url: result.url,
        sub_key: result.name,
        message: `${result.name}: p95 ${result.p95}ms exceeds threshold ${result.threshold}ms under ${result.concurrent} concurrent requests (p50=${result.p50}, p99=${result.p99}, max=${result.max})`,
        evidence: { kind: 'text', value: JSON.stringify(result) },
        suggested_fix: 'Profile slow path. Add caching headers, increase Render plan, or reduce server work per request.',
        auto_fixable: false,
      });
    }
    // Successful run summary — log to console only (not as an "issue")
    console.log(`  ${result.name}: p50=${result.p50}ms p95=${result.p95}ms p99=${result.p99}ms (${result.success_count}/${result.concurrent} ok, threshold=${result.threshold}ms)`);
  }
}
