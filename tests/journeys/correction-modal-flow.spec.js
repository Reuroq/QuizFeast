// Visitor reports a wrong answer via the correction modal. We exercise the
// modal open/close + form fields but DO NOT actually submit a correction —
// real submissions would pollute the Pinecone vote pool and could flip
// answers in production. We test the UI/UX path that triggers the API.

import { test, expect } from '@playwright/test';

test.describe('Correction modal journey: report a wrong answer', () => {
  test('Wrong-answer report button opens modal with question + current answer', async ({ page }) => {
    const t0 = Date.now();
    await page.goto('/answers/navy-cyber-awareness-challenge-2023');
    await expect(page.getByPlaceholder(/Find a question/i)).toBeVisible({ timeout: 5_000 });

    // Click the first "Wrong answer? Report it" link on any Q card
    const reportBtn = page.getByRole('button', { name: /Wrong answer\? Report it/i }).first();
    await expect(reportBtn).toBeVisible();
    await reportBtn.click();

    // Modal should appear with the original Q + current answer + a textarea
    await expect(page.getByRole('heading', { name: 'Report Wrong Answer' })).toBeVisible({ timeout: 3_000 });
    // "CURRENT ANSWER" only exists inside the modal — unambiguous
    await expect(page.getByText(/CURRENT ANSWER/i)).toBeVisible();
    const ta = page.getByPlaceholder(/Type the correct answer/i);
    await expect(ta).toBeVisible();

    // Threshold leak: copy must NOT reveal the 5-vote auto-correct threshold
    const heading = page.locator('h3', { hasText: 'Report Wrong Answer' });
    const headingParent = heading.locator('..');
    const visibleText = await headingParent.innerText();
    expect(visibleText).not.toMatch(/After \d+ people/i);
    expect(visibleText).not.toMatch(/\d+\/\d+ votes?/i);

    // Type something — verify the input is interactive
    await ta.fill('synthetic test text — not submitted');

    // Submit is enabled but we DO NOT click. Close via Escape instead so we
    // don't add a vote to the prod corpus.
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Report Wrong Answer' })).not.toBeVisible({ timeout: 3_000 });

    const elapsed = Date.now() - t0;
    console.log(`[correction-modal] open + close: ${elapsed}ms`);
    expect(elapsed).toBeLessThan(8_000);
  });

  test('Pre-existing community corrections are fetched + applied on page load', async ({ page }) => {
    // The /api/cbt/correct GET endpoint should return without 500 even if
    // no corrections exist. Verifies the integration is wired.
    const corrResponse = page.waitForResponse((resp) =>
      resp.url().includes('/api/cbt/correct?slug=') && resp.status() === 200,
      { timeout: 8_000 }
    );
    await page.goto('/answers/navy-cyber-awareness-challenge-2023');
    const resp = await corrResponse;
    const data = await resp.json();
    expect(data).toHaveProperty('corrections');
    expect(typeof data.corrections).toBe('object');
  });
});
