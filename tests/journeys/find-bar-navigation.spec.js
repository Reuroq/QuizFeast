// Visitor uses the find bar on /answers index to navigate the corpus.
// Tests the cross-CBT question search (Pinecone via /api/answers/global-search)
// plus the local title filter, plus the per-page find bar after click-through.

import { test, expect } from '@playwright/test';

test.describe('Find bar journey: search across corpus, click result, find specific Q', () => {
  test('cross-CBT question search returns + clicking a result lands at the matching Q', async ({ page }) => {
    const t0 = Date.now();

    await page.goto('/answers');
    const indexFind = page.getByPlaceholder(/Find your CBT/i);
    await expect(indexFind).toBeVisible({ timeout: 5_000 });

    // Type a question that triggers the cross-CBT API search (>=3 chars)
    await indexFind.fill('phishing');
    await expect(page.getByRole('heading', { name: /Questions matching/i })).toBeVisible({ timeout: 6_000 });

    // First question result should be a Q-anchor link
    const firstResult = page.locator('a[href*="/answers/"][href*="#q-"]').first();
    await expect(firstResult).toBeVisible();
    const href = await firstResult.getAttribute('href');
    expect(href, 'result link should have a #q- anchor').toMatch(/#q-\d+/);
    await firstResult.click();

    // Should land on the source CBT page with that Q in view
    await expect(page.getByPlaceholder(/Find a question/i)).toBeVisible({ timeout: 5_000 });

    // Verify the find bar pre-filled with our search term
    const pageFind = page.getByPlaceholder(/Find a question/i);
    await expect(pageFind).toHaveValue(/phishing/i, { timeout: 3_000 });

    const elapsed = Date.now() - t0;
    console.log(`[find-bar] full journey: ${elapsed}ms`);
    expect(elapsed, 'find-bar journey should complete under 10 seconds').toBeLessThan(10_000);
  });

  test('keyboard shortcut "/" focuses the find bar from anywhere on page', async ({ page }) => {
    await page.goto('/answers');
    await page.waitForTimeout(300);
    await page.press('body', '/');
    await expect(page.getByPlaceholder(/Find your CBT/i)).toBeFocused();
  });

  test('Escape clears the find bar query', async ({ page }) => {
    await page.goto('/answers');
    const findBar = page.getByPlaceholder(/Find your CBT/i);
    await findBar.fill('test query');
    await findBar.press('Escape');
    await expect(findBar).toHaveValue('');
  });
});
