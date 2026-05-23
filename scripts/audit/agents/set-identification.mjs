// SetIdentificationAgent — the most-important behavioral test.
// For each sampled /answers/<slug> page, take 2 questions from that slug
// and submit them to /api/study/recommend. Verify the API returns the
// SAME slug we sampled from. If it returns a different slug, that's an
// accuracy bug.
//
// This catches the bug class that surfaced manually with the OPSEC inputs
// (matched 2W2 Air Force instead of OPSEC). At scale, samples every CBT
// type to find which inputs the matcher gets wrong.

import fs from 'node:fs';
import path from 'node:path';

const ANSWERS_DATA_DIR = path.join(process.cwd(), 'public', 'data', 'answers');

function loadSlugData(slug) {
  const file = path.join(ANSWERS_DATA_DIR, slug + '.json');
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export async function runSetIdentificationAgent({ baseUrl, slugs, store, sampleSize = 50 }) {
  // Sample-test a subset of slugs to keep cost + time reasonable.
  // 50 random slugs × $0.001 per /study call = ~$0.05 per audit run.
  // (The user said sophisticated, not free. This is the sweet spot.)
  const sampled = sampleN(slugs, sampleSize);
  let tested = 0;
  let correct = 0;
  let wrong_slug = 0;
  let no_match = 0;

  for (const slug of sampled) {
    const data = loadSlugData(slug);
    if (!data || !Array.isArray(data.qas) || data.qas.length < 4) continue;

    // Pick 2 distinctive Qs (not the very-first, which is often a stub).
    // Use indices 2 and 5 if available, fallback to whatever's there.
    const i1 = Math.min(2, data.qas.length - 1);
    const i2 = Math.min(5, data.qas.length - 1);
    if (i1 === i2) continue;
    const q1 = data.qas[i1].q?.trim();
    const q2 = data.qas[i2].q?.trim();
    if (!q1 || !q2 || q1.length < 10 || q2.length < 10) continue;

    tested++;
    let result;
    try {
      const res = await fetch(`${baseUrl}/api/study/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: [q1, q2] }),
      });
      if (!res.ok) {
        store.report({
          agent: 'set-id', category: 'study-api-error', severity: 'high',
          url: `${baseUrl}/api/study/recommend`,
          sub_key: slug,
          message: `Study API returned ${res.status} for ${slug} sample`,
          auto_fixable: false,
        });
        continue;
      }
      result = await res.json();
    } catch (err) {
      store.report({
        agent: 'set-id', category: 'study-api-error', severity: 'high',
        url: `${baseUrl}/api/study/recommend`,
        sub_key: slug,
        message: `Study API threw: ${err.message}`,
        auto_fixable: false,
      });
      continue;
    }

    if (!result.identified_slug) {
      no_match++;
      // Only report if the source slug actually has distinctive content
      if (data.question_count >= 10) {
        store.report({
          agent: 'set-id', category: 'no-match', severity: 'medium',
          url: `${baseUrl}/answers/${slug}`,
          sub_key: slug,
          message: `Study API returned NO match for two Qs from ${slug} (${data.question_count} Qs, ${data.bucket})`,
          evidence: { kind: 'text', value: `q1: ${q1.slice(0, 80)}\nq2: ${q2.slice(0, 80)}` },
          auto_fixable: false,
        });
      }
      continue;
    }

    if (result.identified_slug === slug) {
      correct++;
      continue;
    }

    // Wrong slug — but check alternates. If the source slug is IN the
    // alternates list, that's a partial pass (top-N accuracy).
    const inAlternates = (result.alternates || []).some(a => a.slug === slug);
    wrong_slug++;

    store.report({
      agent: 'set-id',
      category: inAlternates ? 'wrong-top-slug' : 'wrong-no-alternates',
      severity: inAlternates ? 'low' : 'medium',
      url: `${baseUrl}/answers/${slug}`,
      sub_key: slug,
      message: inAlternates
        ? `Sample from ${slug} matched ${result.identified_slug} as top but ${slug} is in alternates (${result.confidence}, ${result.match_method})`
        : `Sample from ${slug} matched UNRELATED slug ${result.identified_slug} (${result.confidence}, ${result.match_method}, score=${result.match_score})`,
      evidence: {
        kind: 'text',
        value: `Source: ${slug} (${data.bucket})\nMatched: ${result.identified_slug}\nQ1: ${q1.slice(0, 80)}\nQ2: ${q2.slice(0, 80)}`,
      },
      auto_fixable: false,
    });

    // Pace ourselves — don't hammer the API
    await new Promise(r => setTimeout(r, 200));
  }

  return { tested, correct, wrong_slug, no_match,
    accuracy: tested > 0 ? (correct / tested).toFixed(3) : 'n/a' };
}

function sampleN(arr, n) {
  if (arr.length <= n) return [...arr];
  const out = [];
  const step = arr.length / n;
  for (let i = 0; i < n; i++) out.push(arr[Math.floor(i * step)]);
  return out;
}
