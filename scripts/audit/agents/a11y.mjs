// AccessibilityAgent — runs axe-core via Playwright on a representative
// sample of each page category. Catches contrast issues, missing labels,
// keyboard traps, ARIA mistakes.
//
// Sample only — Playwright launch is heavy (~5s per page). Audit one URL
// per category type. If any of them fails, the issue likely applies to
// every URL of that category (shared component).

import { chromium } from '@playwright/test';

const AXE_VIOLATIONS_SEVERITY = {
  critical: 'high',
  serious: 'medium',
  moderate: 'low',
  minor: 'low',
};

export async function runA11yAgent({ urlsByCategory, store }) {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Pick one URL per category (representative)
    const samples = Object.entries(urlsByCategory)
      .filter(([cat]) => cat !== 'other')
      .map(([cat, urls]) => ({ category: cat, url: urls[0]?.url }))
      .filter(s => s.url);

    for (const { category, url } of samples) {
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 20_000 });
      } catch (err) {
        store.report({
          agent: 'a11y', category: 'page-load-failed', severity: 'medium', url,
          message: `a11y agent could not load page: ${err.message}`,
          auto_fixable: false,
        });
        continue;
      }

      // Inject axe-core
      await page.addScriptTag({ url: 'https://unpkg.com/axe-core@4/axe.min.js' });
      const violations = await page.evaluate(async () => {
        const results = await window.axe.run({
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'],
          },
        });
        return results.violations.map(v => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          help: v.help,
          nodes: v.nodes.length,
          firstHtml: v.nodes[0]?.html?.slice(0, 200) || '',
        }));
      });

      for (const v of violations) {
        store.report({
          agent: 'a11y', category: v.id,
          severity: AXE_VIOLATIONS_SEVERITY[v.impact] || 'low',
          url,
          sub_key: `${category}-${v.id}`,
          message: `${v.help} (${v.nodes} elements on ${category} page)`,
          evidence: { kind: 'text', value: v.firstHtml },
          suggested_fix: `Read axe rule ${v.id} — typically applies to the shared component for ${category}`,
          auto_fixable: false,
        });
      }
    }
  } finally {
    await browser.close();
  }
}
