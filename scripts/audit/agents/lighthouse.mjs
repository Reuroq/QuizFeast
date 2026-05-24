// LighthouseAgent — runs Google Lighthouse against a representative URL per
// page category. Captures Core Web Vitals + perf/SEO/a11y/best-practices
// scores. Reports issues when scores fall below thresholds.
//
// Cost: ~30s per URL audited. Sample one URL per category (8 URLs).
// Total: ~4 min added to audit time. No API spend.

import lighthouse from 'lighthouse';
import * as ChromeLauncher from 'chrome-launcher';

const SCORE_THRESHOLDS = {
  performance: 0.6,        // Below 0.6 = high; below 0.4 = critical
  accessibility: 0.85,
  'best-practices': 0.85,
  seo: 0.9,
};

const CWV_THRESHOLDS = {
  lcp: 2500,    // ms — Largest Contentful Paint (Google's CWV good threshold)
  cls: 0.1,     // Cumulative Layout Shift
  tbt: 200,     // ms — Total Blocking Time (FID proxy)
};

function severityForScore(score, threshold) {
  if (score < threshold * 0.6) return 'high';
  if (score < threshold * 0.85) return 'medium';
  return 'low';
}

export async function runLighthouseAgent({ urlsByCategory, store }) {
  // One representative URL per category
  const samples = Object.entries(urlsByCategory)
    .filter(([cat]) => cat !== 'other')
    .map(([cat, urls]) => ({ category: cat, url: urls[0]?.url }))
    .filter(s => s.url);

  let chrome;
  try {
    chrome = await ChromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox'] });
  } catch (err) {
    store.report({
      agent: 'lighthouse', category: 'launch-failed', severity: 'medium', url: null,
      message: `Could not launch Chrome for Lighthouse: ${err.message}`,
      auto_fixable: false,
    });
    return;
  }

  try {
    for (const { category, url } of samples) {
      let result;
      try {
        result = await lighthouse(url, {
          port: chrome.port,
          output: 'json',
          logLevel: 'error',
          onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
          // Mobile is the default Lighthouse preset (Google ranks mobile-first)
          formFactor: 'mobile',
          screenEmulation: { mobile: true, width: 375, height: 667, deviceScaleFactor: 2 },
        });
      } catch (err) {
        store.report({
          agent: 'lighthouse', category: 'audit-failed', severity: 'medium', url,
          sub_key: category,
          message: `Lighthouse failed for ${category}: ${err.message}`,
          auto_fixable: false,
        });
        continue;
      }

      const lhr = result.lhr;

      // Per-category scores
      for (const [cat, threshold] of Object.entries(SCORE_THRESHOLDS)) {
        const score = lhr.categories[cat]?.score;
        if (score == null) continue;
        if (score < threshold) {
          store.report({
            agent: 'lighthouse', category: `low-${cat}`,
            severity: severityForScore(score, threshold),
            url,
            sub_key: `${category}-${cat}`,
            message: `Lighthouse ${cat} score is ${(score * 100).toFixed(0)} (threshold ${(threshold * 100).toFixed(0)}) on ${category} page`,
            evidence: { kind: 'text', value: `score=${score}, threshold=${threshold}` },
            suggested_fix: `See https://web.dev/articles/${cat}-score`,
            auto_fixable: false,
          });
        }
      }

      // Core Web Vitals
      const lcp = lhr.audits['largest-contentful-paint']?.numericValue;
      const cls = lhr.audits['cumulative-layout-shift']?.numericValue;
      const tbt = lhr.audits['total-blocking-time']?.numericValue;

      if (lcp != null && lcp > CWV_THRESHOLDS.lcp) {
        store.report({
          agent: 'lighthouse', category: 'lcp-slow',
          severity: lcp > 4000 ? 'high' : 'medium',
          url,
          sub_key: `${category}-lcp`,
          message: `LCP is ${Math.round(lcp)}ms on ${category} page (Google CWV "good" is <${CWV_THRESHOLDS.lcp}ms)`,
          auto_fixable: false,
        });
      }
      if (cls != null && cls > CWV_THRESHOLDS.cls) {
        store.report({
          agent: 'lighthouse', category: 'cls-high',
          severity: cls > 0.25 ? 'high' : 'medium',
          url,
          sub_key: `${category}-cls`,
          message: `CLS is ${cls.toFixed(3)} on ${category} page (Google CWV "good" is <${CWV_THRESHOLDS.cls})`,
          auto_fixable: false,
        });
      }
      if (tbt != null && tbt > CWV_THRESHOLDS.tbt) {
        store.report({
          agent: 'lighthouse', category: 'tbt-high',
          severity: tbt > 600 ? 'high' : 'medium',
          url,
          sub_key: `${category}-tbt`,
          message: `TBT is ${Math.round(tbt)}ms on ${category} page (threshold ${CWV_THRESHOLDS.tbt}ms)`,
          auto_fixable: false,
        });
      }
    }
  } finally {
    await chrome.kill();
  }
}
