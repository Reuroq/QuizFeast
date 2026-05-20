import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

// Lazy-loaded module-scope cache.
let _index = null;
let _indexCBTs = null;
let _loadError = null;

function loadIndex() {
  if (_index || _loadError) return;
  try {
    const indexFile = path.join(process.cwd(), 'scripts', 'answers_question_index.json');
    const pass2File = path.join(process.cwd(), 'scripts', 'ihatecbts_pass2_index.json');
    _index = JSON.parse(fs.readFileSync(indexFile, 'utf8')).questions;

    // Build a lightweight CBT title list for title-only search
    const pass2 = JSON.parse(fs.readFileSync(pass2File, 'utf8'));
    _indexCBTs = pass2.entries.map(e => ({
      slug: e.slug,
      title: e.title,
      title_lower: e.title.toLowerCase(),
      bucket: e.bucket,
      question_count: e.question_count || 0,
    }));
  } catch (e) {
    _loadError = e;
    console.error('global-search: failed to load index', e);
  }
}

export async function GET(request) {
  loadIndex();
  if (_loadError) {
    return NextResponse.json({ error: 'Index unavailable' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  if (q.length < 2) {
    return NextResponse.json({ cbts: [], questions: [], total_cbts: 0, total_questions: 0 });
  }

  // Title matches (CBT cards) — score by where match starts (prefix matches rank higher)
  const cbtMatches = [];
  for (const cbt of _indexCBTs) {
    const idx = cbt.title_lower.indexOf(q);
    if (idx === -1) continue;
    cbtMatches.push({ cbt, score: idx === 0 ? 0 : (idx < 10 ? 1 : 2) });
  }
  cbtMatches.sort((a, b) => a.score - b.score || b.cbt.question_count - a.cbt.question_count);

  // Question-text matches — substring search across all 76K
  const qMatches = [];
  const seenSlugs = new Set();  // Diversify: max 3 hits per CBT in question results
  const perCBT = new Map();
  for (const item of _index) {
    if (!item.q_lower.includes(q)) continue;
    const count = perCBT.get(item.slug) || 0;
    if (count >= 3) continue;
    perCBT.set(item.slug, count + 1);
    qMatches.push(item);
    if (qMatches.length >= 100) break;  // hard cap on scan results
  }

  return NextResponse.json({
    cbts: cbtMatches.slice(0, 12).map(m => ({
      slug: m.cbt.slug,
      title: m.cbt.title,
      bucket: m.cbt.bucket,
      question_count: m.cbt.question_count,
    })),
    questions: qMatches.slice(0, 20).map(item => ({
      slug: item.slug,
      cbt_title: item.cbt_title,
      bucket: item.bucket,
      q_idx: item.q_idx,
      q_text: item.q_text,
      section: item.section,
    })),
    total_cbts: cbtMatches.length,
    total_questions: qMatches.length,
  });
}
