// CrossBrowserAgent — runs a small smoke suite against firefox + webkit
// to catch Safari/iOS bugs that chromium tests miss. Most common:
// - Date parsing differences (Safari is stricter about formats)
// - ES2022+ feature gaps in older webkit
// - CSS :has() / aspect-ratio inconsistencies
// - sessionStorage / localStorage quota differences

import { firefox, webkit } from '@playwright/test';

const SMOKE_URLS = (baseUrl) => [
  { name: 'home', url: `${baseUrl}/`, requireText: 'CBT Answers' },
  { name: 'answers-index', url: `${baseUrl}/answers`, requireText: 'Answer Keys' },
  { name: 'answers-slug', url: `${baseUrl}/answers/army-cyber-awareness-challenge-2023`, requireText: 'Find a question' },
  { name: 'study', url: `${baseUrl}/study`, requireText: 'Stuck on a few questions' },
  { name: 'legal', url: `${baseUrl}/terms`, requireText: 'Nightshift Labs LLC' },
];

async function runBrowserSmoke(browserType, browserName, baseUrl, store) {
  let browser;
  try {
    browser = await browserType.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Capture console errors per page
    const errors = [];
    page.on('pageerror', (err) => errors.push({ type: 'pageerror', message: err.message }));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push({ type: 'console.error', message: msg.text() });
    });

    for (const tc of SMOKE_URLS(baseUrl)) {
      errors.length = 0;
      try {
        await page.goto(tc.url, { waitUntil: 'domcontentloaded', timeout: 25_000 });
        const html = await page.content();
        if (!html.includes(tc.requireText)) {
          store.report({
            agent: 'cross-browser', category: `${browserName}-missing-content`,
            severity: 'high', url: tc.url,
            sub_key: `${browserName}-${tc.name}`,
            message: `${browserName}: ${tc.name} page missing expected text "${tc.requireText}"`,
            auto_fixable: false,
          });
        }
        for (const err of errors) {
          store.report({
            agent: 'cross-browser', category: `${browserName}-${err.type}`,
            severity: 'high', url: tc.url,
            sub_key: `${browserName}-${tc.name}-${err.message.slice(0, 40)}`,
            message: `${browserName} (${tc.name}): ${err.type} — ${err.message.slice(0, 180)}`,
            auto_fixable: false,
          });
        }
      } catch (err) {
        store.report({
          agent: 'cross-browser', category: `${browserName}-load-failed`,
          severity: 'medium', url: tc.url,
          sub_key: `${browserName}-${tc.name}`,
          message: `${browserName}: failed to load ${tc.name} — ${err.message}`,
          auto_fixable: false,
        });
      }
    }
  } catch (err) {
    store.report({
      agent: 'cross-browser', category: `${browserName}-launch-failed`,
      severity: 'low', url: null,
      message: `Could not launch ${browserName}: ${err.message}. Run "npx playwright install" if missing.`,
      auto_fixable: false,
    });
  } finally {
    if (browser) await browser.close();
  }
}

export async function runCrossBrowserAgent({ baseUrl, store }) {
  // firefox + webkit. Chromium is already covered by the existing functional
  // agent + a11y agent.
  await runBrowserSmoke(firefox, 'firefox', baseUrl, store);
  await runBrowserSmoke(webkit, 'webkit', baseUrl, store);
}
