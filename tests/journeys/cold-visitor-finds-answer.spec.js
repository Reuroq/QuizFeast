// Cold visitor lands on the homepage, navigates to a CBT, finds a specific
// question, reads the answer. Times the full path. This is the most-traveled
// journey on the site.

import { test, expect } from '@playwright/test';

test.describe('Cold visitor journey: homepage -> CBT -> find answer', () => {
  test('visitor can find a Cyber Awareness answer in under 8 seconds', async ({ page }) => {
    const t0 = Date.now();

    // Step 1: land on homepage
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /CBT Answers/ })).toBeVisible({ timeout: 5_000 });

    // Step 2: click into the answer keys index
    await page.getByRole('link', { name: 'Answer Keys' }).first().click();
    await expect(page).toHaveURL(/\/answers$/);
    await expect(page.getByPlaceholder(/Find your CBT/i)).toBeVisible({ timeout: 5_000 });

    // Step 3: type a CBT name into the find bar. Use "navy" because that's a
    // stable, non-redirected canonical (army-cyber-awareness-challenge-2023
    // 100%-redirects to dod-cyber-awareness-2023 via dedupe pass 7).
    await page.getByPlaceholder(/Find your CBT/i).fill('navy cyber awareness');
    // Local title filter is instant; cross-CBT API search is debounced 220ms
    await page.waitForTimeout(400);

    // Step 4: click into the result — when a query is active the href includes
    // ?q=... so use a prefix match
    const matchLink = page.locator('a[href^="/answers/navy-cyber-awareness-challenge-2023"]').first();
    await expect(matchLink).toBeVisible({ timeout: 5_000 });
    await matchLink.click();
    await expect(page).toHaveURL(/\/answers\/navy-cyber-awareness-challenge-2023/);

    // Step 5: page's find bar is pre-filled with our index query, which
    // filters out everything (CBT-name queries don't match Q text). Clear it
    // so we see the full set.
    const pageFind = page.getByPlaceholder(/Find a question/i);
    await expect(pageFind).toBeVisible({ timeout: 5_000 });
    await pageFind.fill('');
    await page.waitForTimeout(200);
    await expect(page.locator('[id="q-1"]')).toBeVisible({ timeout: 5_000 });

    // Step 6: search within the set for a specific topic and verify a hit
    await pageFind.fill('whaling');
    await page.waitForTimeout(300);
    const hit = page.locator('[id^="q-"]', { hasText: /whaling/i }).first();
    await expect(hit).toBeVisible({ timeout: 3_000 });
    // Answer text should be visible inside the same card
    await expect(hit.getByText(/ANSWER/)).toBeVisible();

    const elapsed = Date.now() - t0;
    console.log(`[cold-visitor] full journey: ${elapsed}ms`);
    expect(elapsed, 'cold-visitor full journey should complete under 8 seconds').toBeLessThan(8000);
  });
});
