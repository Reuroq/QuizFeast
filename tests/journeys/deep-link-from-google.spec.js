// Visitor lands directly from Google search: deep-link URL with ?q=... and
// #q-N anchor. Simulates the most common organic-search path. Verifies the
// find bar pre-fills + page auto-scrolls to the exact question.

import { test, expect } from '@playwright/test';

test.describe('Deep-link from search engine: ?q + #q-N anchor', () => {
  test('arriving with ?q=spillage#q-1 pre-fills find bar and scrolls to Q1', async ({ page }) => {
    const t0 = Date.now();
    await page.goto('/answers/army-cyber-awareness-challenge-2023?q=spillage#q-1');

    // Find bar should be pre-filled with the URL query
    const findBar = page.getByPlaceholder(/Find a question/i);
    await expect(findBar).toHaveValue('spillage', { timeout: 5_000 });

    // Wait for scroll animation
    await page.waitForTimeout(600);

    // Q1 should be in viewport
    const q1 = page.locator('[id="q-1"]');
    await expect(q1).toBeVisible();
    const inView = await q1.evaluate(el => {
      const r = el.getBoundingClientRect();
      return r.top >= 0 && r.top < window.innerHeight;
    });
    expect(inView, 'q-1 should be scrolled into view').toBeTruthy();

    const elapsed = Date.now() - t0;
    console.log(`[deep-link] full deep-link experience: ${elapsed}ms`);
    expect(elapsed, 'deep-link landing should be under 5 seconds').toBeLessThan(5_000);
  });

  test('topic deep-dive page renders with full search-engine semantic structure', async ({ page }) => {
    await page.goto('/answers/topic/spillage');
    await expect(page.getByRole('heading', { level: 1, name: /Spillage/i })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/Topic Deep Dive/i)).toBeVisible();
    // FAQPage JSON-LD should be in the HTML for rich snippets
    const html = await page.content();
    expect(html).toContain('"@type":"FAQPage"');
    // The "CBTs that cover" panel should list source CBTs
    await expect(page.getByRole('heading', { name: /CBTs that cover/i })).toBeVisible();
  });
});
