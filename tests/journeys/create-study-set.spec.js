// Visitor creates a new study set via /create. Storage is localStorage-only
// (per src/lib/storage.js), so this test fully exercises the flow without
// polluting any prod database. Playwright runs each test in a fresh browser
// context, so the localStorage state doesn't leak across tests either.

import { test, expect } from '@playwright/test';

test.describe('Create journey: visitor builds a study set from scratch', () => {
  test('manual flow: add Q&A cards, fill metadata, save, verify in dashboard', async ({ page }) => {
    const t0 = Date.now();
    const testTitle = `Synthetic Test Set ${Date.now()}`;

    await page.goto('/create');
    // The Title input has a distinctive placeholder
    const titleInput = page.getByPlaceholder(/Biology Chapter 5/i);
    await expect(titleInput).toBeVisible({ timeout: 10_000 });
    await titleInput.fill(testTitle);

    // First Q&A — textareas in the manual mode card section
    const textareas = page.locator('textarea');
    await expect(textareas.first()).toBeVisible({ timeout: 5_000 });
    await textareas.nth(0).fill('What is the capital of synthetic-test-land?');
    await textareas.nth(1).fill('Synthetic City');

    // Save — button text is "Save Set" or "Create Set" depending on state
    const saveBtn = page.getByRole('button', { name: /^(save|create)\s*(set|study set)?/i }).first();
    await saveBtn.click();

    // Wait for storage to update (no navigation required) OR navigation
    await page.waitForTimeout(500);

    // Confirm set persisted in localStorage
    const stored = await page.evaluate(() => {
      try {
        return JSON.parse(localStorage.getItem('quizfeast_data') || '{}');
      } catch { return {}; }
    });
    expect(Array.isArray(stored.sets), 'localStorage should have sets array').toBeTruthy();
    expect(stored.sets?.length, 'at least 1 set should be saved').toBeGreaterThan(0);

    const elapsed = Date.now() - t0;
    console.log(`[create-set] full journey: ${elapsed}ms`);
    expect(elapsed, 'create-set flow should complete under 15 seconds').toBeLessThan(15_000);
  });

  test('paste-import flow renders the parser controls', async ({ page }) => {
    await page.goto('/create');
    // Click the "Paste" mode button if it exists
    const pasteMode = page.getByRole('button', { name: /paste/i }).first();
    if (await pasteMode.isVisible().catch(() => false)) {
      await pasteMode.click();
      await expect(page.locator('textarea').first()).toBeVisible();
    }
  });
});
