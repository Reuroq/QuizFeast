// End-to-end tests for the /answers surface.
// Run: npm run test:e2e
// Run against prod: PLAYWRIGHT_BASE_URL=https://quizfeast.onrender.com npm run test:e2e

import { test, expect } from '@playwright/test';

const SAMPLE_QA_SLUG = 'navy-cyber-awareness-challenge-2023';
const SAMPLE_TOPIC = 'spillage';

test.describe('/answers index page', () => {
  test('loads with title + find bar + first category', async ({ page }) => {
    await page.goto('/answers');
    await expect(page.getByRole('heading', { name: /Military CBT/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Find your CBT/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'DoD Annual Training' })).toBeVisible();
  });

  test('title-only filter narrows the grid as you type', async ({ page }) => {
    await page.goto('/answers');
    const initialCards = await page.locator('a[href^="/answers/"]:not([href*="/topic/"]):not([href*="/q/"])').count();
    await page.getByPlaceholder(/Find your CBT/i).fill('opsec');
    await page.waitForTimeout(400);
    const filteredCards = await page.locator('a[href^="/answers/"]:not([href*="/topic/"]):not([href*="/q/"])').count();
    expect(filteredCards).toBeLessThan(initialCards);
    expect(filteredCards).toBeGreaterThan(0);
  });

  test('global cross-CBT question search triggers at 3+ chars and shows question results', async ({ page }) => {
    await page.goto('/answers');
    await page.getByPlaceholder(/Find your CBT/i).fill('phishing');
    // Wait for the API debounce + response
    await expect(page.getByRole('heading', { name: /Questions matching/i })).toBeVisible({ timeout: 5000 });
    const questionLinks = page.locator('a[href*="/answers/"][href*="#q-"]');
    expect(await questionLinks.count()).toBeGreaterThan(0);
  });

  test('/ keyboard shortcut focuses the find bar', async ({ page }) => {
    await page.goto('/answers');
    await page.press('body', '/');
    await expect(page.getByPlaceholder(/Find your CBT/i)).toBeFocused();
  });

  test('bucket chip filters the grid to one category', async ({ page }) => {
    await page.goto('/answers');
    // Wait for the chip area to be ready
    await expect(page.locator('button:has-text("All categories")')).toBeVisible();
    await page.locator('button:has-text("Air Force ·")').first().click();
    // After click, DoD Annual heading hides, Air Force section stays
    await expect(page.locator('h2:has-text("DoD Annual Training")')).not.toBeVisible();
    await expect(page.locator('h2:has-text("Air Force")').first()).toBeVisible();
  });
});

test.describe('/answers/[slug] page', () => {
  test('loads with title + find bar + Q&A cards', async ({ page }) => {
    await page.goto(`/answers/${SAMPLE_QA_SLUG}`);
    await expect(page.getByRole('heading', { name: /Army Cyber Awareness Challenge 2023/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Find a question or keyword/i)).toBeVisible();
    // First question card visible
    await expect(page.locator('[id="q-1"]')).toBeVisible();
  });

  test('find bar filters Q&A cards in place', async ({ page }) => {
    await page.goto(`/answers/${SAMPLE_QA_SLUG}`);
    const initial = await page.locator('[id^="q-"]').count();
    await page.getByPlaceholder(/Find a question/i).fill('VPN');
    await page.waitForTimeout(300);
    const filtered = await page.locator('[id^="q-"]').count();
    expect(filtered).toBeLessThan(initial);
    expect(filtered).toBeGreaterThanOrEqual(0);
  });

  test('section chip filters to one topic', async ({ page }) => {
    await page.goto(`/answers/${SAMPLE_QA_SLUG}`);
    await expect(page.locator('button:has-text("All sections")')).toBeVisible();
    await page.locator('button:has-text("Spillage ·")').first().click();
    await page.waitForTimeout(300);
    const cards = page.locator('[id^="q-"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    // Each visible card should show the Spillage badge
    for (let i = 0; i < Math.min(count, 5); i++) {
      await expect(cards.nth(i).locator('span:has-text("Spillage")').first()).toBeVisible();
    }
  });

  test('?q=...#q-N URL prefills find bar AND scrolls to question', async ({ page }) => {
    await page.goto(`/answers/${SAMPLE_QA_SLUG}?q=spillage#q-1`);
    await expect(page.getByPlaceholder(/Find a question/i)).toHaveValue('spillage');
    // Wait for scroll
    await page.waitForTimeout(500);
    const q1 = page.locator('[id="q-1"]');
    await expect(q1).toBeVisible();
    // Check it's in viewport
    const inView = await q1.evaluate(el => {
      const r = el.getBoundingClientRect();
      return r.top >= 0 && r.top < window.innerHeight;
    });
    expect(inView).toBeTruthy();
  });

  test('"Report wrong answer" button opens correction modal', async ({ page }) => {
    await page.goto(`/answers/${SAMPLE_QA_SLUG}`);
    await page.getByRole('button', { name: /Wrong answer\? Report it/i }).first().click();
    await expect(page.getByRole('heading', { name: 'Report Wrong Answer' })).toBeVisible();
    await expect(page.getByPlaceholder(/Type the correct answer/i)).toBeVisible();
    // Close it without submitting (don't pollute prod vote pool)
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Report Wrong Answer' })).not.toBeVisible();
  });
});

test.describe('Session-aware context boost', () => {
  test('visiting a CBT then searching boosts that CBT to top of question results', async ({ page }) => {
    // Visit a specific CBT — this should push slug into sessionStorage
    await page.goto(`/answers/${SAMPLE_QA_SLUG}`);
    await page.waitForTimeout(300);

    // Verify the slug was stored
    const stored = await page.evaluate(() => sessionStorage.getItem('qf_recent_slugs'));
    expect(stored).toContain(SAMPLE_QA_SLUG);

    // Navigate back to /answers and search
    await page.goto('/answers');
    await page.getByPlaceholder(/Find your CBT/i).fill('phishing');
    await expect(page.getByRole('heading', { name: /Questions matching/i })).toBeVisible({ timeout: 5000 });

    // The first question result should link to our context CBT
    const firstResult = page.locator('a[href*="/answers/"][href*="#q-"]').first();
    const href = await firstResult.getAttribute('href');
    expect(href).toContain(SAMPLE_QA_SLUG);
  });
});

test.describe('/answers/topic/[slug] page', () => {
  test('topic deep-dive page loads with aggregated Q&As + source CBT list', async ({ page }) => {
    await page.goto(`/answers/topic/${SAMPLE_TOPIC}`);
    await expect(page.getByRole('heading', { level: 1, name: /Spillage/i })).toBeVisible();
    await expect(page.getByText(/Topic Deep Dive/i)).toBeVisible();
    await expect(page.getByPlaceholder(/Find a question/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /CBTs that cover/i })).toBeVisible();
    // At least 1 Q&A card rendered
    expect(await page.locator('[id^="q-"]').count()).toBeGreaterThan(0);
  });
});

test.describe('/answers/q/[slug] canonical question page', () => {
  test('loads with question + answer + "appears in" list', async ({ page, request }) => {
    // Grab a real canonical slug from the sitemap (resilient to data changes)
    const xmlRes = await request.get('/sitemap.xml');
    const xml = await xmlRes.text();
    const m = xml.match(/<loc>[^<]+\/answers\/q\/([^<]+)<\/loc>/);
    expect(m).toBeTruthy();
    const canonicalSlug = m[1];
    await page.goto(`/answers/q/${canonicalSlug}`);
    await expect(page.getByText(/Verified Question/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /This question appears on/i })).toBeVisible();
  });
});

test.describe('API endpoints', () => {
  test('GET /api/answers/global-search returns expected shape', async ({ request }) => {
    const res = await request.get('/api/answers/global-search?q=phishing');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty('cbts');
    expect(data).toHaveProperty('questions');
    expect(data).toHaveProperty('total_cbts');
    expect(data).toHaveProperty('total_questions');
    expect(Array.isArray(data.cbts)).toBeTruthy();
    expect(Array.isArray(data.questions)).toBeTruthy();
    expect(data.questions.length).toBeGreaterThan(0);
  });

  test('context_slugs param re-ranks results', async ({ request }) => {
    const without = await (await request.get('/api/answers/global-search?q=phishing')).json();
    const withCtx = await (await request.get(
      `/api/answers/global-search?q=phishing&context_slugs=${SAMPLE_QA_SLUG}`
    )).json();
    // First questions response should differ in ranking (the context slug rises)
    expect(withCtx.questions[0]?.slug).toBe(SAMPLE_QA_SLUG);
    expect(withCtx.questions[0]?.in_context).toBeTruthy();
    expect(withCtx.context_applied).toBeTruthy();
    // Without context, the first result probably isn't our context CBT
    expect(without.questions[0]?.slug).not.toBe(SAMPLE_QA_SLUG);
  });

  test('short query returns empty', async ({ request }) => {
    const res = await request.get('/api/answers/global-search?q=p');
    const data = await res.json();
    expect(data.questions).toEqual([]);
    expect(data.cbts).toEqual([]);
  });

  test('sitemap.xml renders with expected URL count', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    const locs = (body.match(/<loc>/g) || []).length;
    expect(locs).toBeGreaterThan(2000);  // we know we shipped ~2,926
  });

  test('robots.txt points to sitemap', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toMatch(/Sitemap:/);
  });
});
