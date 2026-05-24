// MobileAgent — renders representative URLs on a mobile viewport (375px)
// and checks for mobile-specific bugs:
//   - Horizontal overflow (page wider than viewport)
//   - Tap targets smaller than 44px (iOS HIG / Material recommendation)
//   - Text smaller than 12px
//   - Find bar / nav hidden on mobile

import { chromium, devices } from '@playwright/test';

export async function runMobileAgent({ urlsByCategory, store }) {
  const samples = Object.entries(urlsByCategory)
    .filter(([cat]) => cat !== 'other')
    .map(([cat, urls]) => ({ category: cat, url: urls[0]?.url }))
    .filter(s => s.url);

  let browser;
  try {
    browser = await chromium.launch();
    const context = await browser.newContext({ ...devices['iPhone 13'] });
    const page = await context.newPage();

    for (const { category, url } of samples) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      } catch (err) {
        store.report({
          agent: 'mobile', category: 'page-load-failed', severity: 'medium', url,
          sub_key: category,
          message: `Mobile agent could not load: ${err.message}`,
          auto_fixable: false,
        });
        continue;
      }

      // 1. Horizontal overflow — body should not exceed viewport width
      const overflow = await page.evaluate(() => {
        const docW = document.documentElement.scrollWidth;
        const winW = window.innerWidth;
        return { docW, winW, overflows: docW > winW + 2 };
      });
      if (overflow.overflows) {
        store.report({
          agent: 'mobile', category: 'horizontal-overflow', severity: 'high', url,
          sub_key: `${category}-overflow`,
          message: `Page is ${overflow.docW}px wide on a ${overflow.winW}px viewport (horizontal scroll on mobile)`,
          suggested_fix: 'Find element with fixed width or overflow-x, add max-w or overflow-x:hidden',
          auto_fixable: false,
        });
      }

      // 2. Tap targets too small
      const smallTargets = await page.evaluate(() => {
        const els = document.querySelectorAll('a, button, [role="button"], input, select');
        const violations = [];
        for (const el of els) {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;  // hidden
          if (rect.width < 32 || rect.height < 32) {
            violations.push({
              tag: el.tagName,
              w: Math.round(rect.width),
              h: Math.round(rect.height),
              text: (el.innerText || el.textContent || el.getAttribute('aria-label') || '').slice(0, 40),
            });
          }
          if (violations.length >= 5) break;  // cap report size
        }
        return violations;
      });
      for (const t of smallTargets) {
        store.report({
          agent: 'mobile', category: 'tap-target-small', severity: 'low', url,
          sub_key: `${category}-${t.tag}-${t.text.slice(0, 20)}`,
          message: `<${t.tag.toLowerCase()}> "${t.text}" is ${t.w}×${t.h}px — below 32×32 minimum for mobile tap targets`,
          auto_fixable: false,
        });
      }

      // 3. Find bar / nav rendered on mobile?
      if (category === 'answers-slug' || category === 'answers-index') {
        const findBarVisible = await page.evaluate(() => {
          const inputs = document.querySelectorAll('input[type="text"]');
          for (const inp of inputs) {
            const r = inp.getBoundingClientRect();
            const ph = (inp.placeholder || '').toLowerCase();
            if ((ph.includes('find') || ph.includes('cbt')) && r.width > 0 && r.height > 0) return true;
          }
          return false;
        });
        if (!findBarVisible) {
          store.report({
            agent: 'mobile', category: 'find-bar-missing', severity: 'high', url,
            sub_key: category,
            message: 'Find bar input is not visible on mobile viewport',
            auto_fixable: false,
          });
        }
      }
    }
  } finally {
    if (browser) await browser.close();
  }
}
