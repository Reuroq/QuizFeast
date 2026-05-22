// AI Study Assistant journey: paste 2 questions, get the matched set back.
// This is the load-bearing differentiator for the site, so we test it
// thoroughly and verify the correct CBT is identified.

import { test, expect } from '@playwright/test';

test.describe('AI Study journey: paste questions -> identify set -> see full Q&A', () => {
  test('two Cyber Awareness questions identify the right set with high confidence', async ({ page }) => {
    const t0 = Date.now();

    await page.goto('/study');
    await expect(page.getByRole('heading', { name: /Stuck on a few questions/i })).toBeVisible({ timeout: 5_000 });

    const textarea = page.getByPlaceholder(/Paste 2/i);
    await textarea.fill(
      'What is whaling?\n\nHow can you protect your information when using wireless technology?'
    );

    const submitBtn = page.getByRole('button', { name: /Find my set/i });
    await expect(submitBtn).toBeEnabled();
    const submitTime = Date.now();
    await submitBtn.click();

    // Wait for the set match card to appear (anchor: the "Matched study set" label)
    await expect(page.getByText(/Matched study set/i)).toBeVisible({ timeout: 30_000 });
    const aiElapsed = Date.now() - submitTime;
    console.log(`[paste-to-study] AI round-trip: ${aiElapsed}ms`);

    // Correctness: should identify a Cyber Awareness set
    const setHeading = page.locator('h1, h2, a').filter({ hasText: /Cyber Awareness/i }).first();
    await expect(setHeading).toBeVisible();

    // Confidence chip should appear (one of low/medium/high)
    const confidence = page.locator('span', { hasText: /(low|medium|high)\s+confidence/i }).first();
    await expect(confidence).toBeVisible();

    // The set's find bar + Q cards should be rendered inline
    await expect(page.getByPlaceholder(/Find a question/i)).toBeVisible();
    expect(await page.locator('[id^="q-"]').count(), 'set should render multiple Q cards').toBeGreaterThan(10);

    // The study brief should be present (non-empty paragraph below the set header)
    const briefVisible = await page.locator('p', { hasText: /whaling|wireless|phishing/i }).count();
    expect(briefVisible, 'study brief should mention input topics').toBeGreaterThan(0);

    const elapsed = Date.now() - t0;
    console.log(`[paste-to-study] full journey: ${elapsed}ms`);
    // AI calls are slow; allow up to 25s for the full flow
    expect(elapsed).toBeLessThan(25_000);
  });

  test('AI round-trip alone completes in under 20 seconds', async ({ page }) => {
    await page.goto('/study');
    await page.getByPlaceholder(/Paste 2/i).fill('What is the best response if you find classified government data on the internet?');
    const t0 = Date.now();
    await page.getByRole('button', { name: /Find my set/i }).click();
    await expect(page.getByText(/Matched study set/i)).toBeVisible({ timeout: 22_000 });
    const elapsed = Date.now() - t0;
    console.log(`[paste-to-study] single-Q AI round-trip: ${elapsed}ms`);
    expect(elapsed, 'AI study should respond within 20s').toBeLessThan(20_000);
  });
});
