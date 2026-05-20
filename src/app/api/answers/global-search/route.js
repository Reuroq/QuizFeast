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

// Recency-weighted boost: position 0 -> max boost, decaying for older entries.
function slugBoost(slug, contextSlugs) {
  if (!contextSlugs?.length) return 0;
  const idx = contextSlugs.indexOf(slug);
  if (idx === -1) return 0;
  return Math.round(1000 / (idx + 1));  // 1000, 500, 333, 250, 200, ...
}

function sectionBoost(section, contextSections) {
  if (!section || !contextSections?.length) return 0;
  const sLower = section.toLowerCase();
  const idx = contextSections.findIndex(s => s.toLowerCase() === sLower);
  if (idx === -1) return 0;
  return Math.round(300 / (idx + 1));  // 300, 150, 100, 75, 60, ...
}

function parseListParam(s) {
  if (!s) return [];
  return s.split(',').map(x => x.trim()).filter(Boolean).slice(0, 10);
}

export async function GET(request) {
  loadIndex();
  if (_loadError) {
    return NextResponse.json({ error: 'Index unavailable' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  const contextSlugs = parseListParam(searchParams.get('context_slugs'));
  const contextSections = parseListParam(searchParams.get('context_sections'));
  const hasContext = contextSlugs.length > 0 || contextSections.length > 0;

  if (q.length < 2) {
    return NextResponse.json({ cbts: [], questions: [], total_cbts: 0, total_questions: 0 });
  }

  // CBT title matches — higher score is better, sort desc.
  const cbtScored = [];
  for (const cbt of _indexCBTs) {
    const idx = cbt.title_lower.indexOf(q);
    if (idx === -1) continue;
    let score = idx === 0 ? 100 : (idx < 10 ? 50 : 10);
    score += slugBoost(cbt.slug, contextSlugs);
    cbtScored.push({ cbt, score });
  }
  cbtScored.sort((a, b) => b.score - a.score || b.cbt.question_count - a.cbt.question_count);

  // Question-text matches with context boosts.
  // Diversity cap: 3 per CBT normally, 6 for in-context CBTs (we want more from "your" CBT).
  const qMatches = [];
  const perCBT = new Map();
  for (const item of _index) {
    if (!item.q_lower.includes(q)) continue;
    const cap = contextSlugs.includes(item.slug) ? 6 : 3;
    const count = perCBT.get(item.slug) || 0;
    if (count >= cap) continue;
    perCBT.set(item.slug, count + 1);

    const score = 50
      + slugBoost(item.slug, contextSlugs)
      + sectionBoost(item.section, contextSections);
    qMatches.push({ item, score });
    if (qMatches.length >= 200) break;
  }
  qMatches.sort((a, b) => b.score - a.score);

  return NextResponse.json({
    cbts: cbtScored.slice(0, 12).map(m => ({
      slug: m.cbt.slug,
      title: m.cbt.title,
      bucket: m.cbt.bucket,
      question_count: m.cbt.question_count,
      in_context: contextSlugs.includes(m.cbt.slug),
    })),
    questions: qMatches.slice(0, 20).map(m => ({
      slug: m.item.slug,
      cbt_title: m.item.cbt_title,
      bucket: m.item.bucket,
      q_idx: m.item.q_idx,
      q_text: m.item.q_text,
      section: m.item.section,
      in_context: contextSlugs.includes(m.item.slug),
    })),
    total_cbts: cbtScored.length,
    total_questions: qMatches.length,
    context_applied: hasContext,
  });
}
