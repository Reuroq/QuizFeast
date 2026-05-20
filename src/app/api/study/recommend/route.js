import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'node:fs';
import path from 'node:path';
import { searchPinecone } from '@/lib/pinecone';
import { sanitizeDeep, safeChipLabel } from '@/lib/sanitize';

let _anthropic;
function getAnthropic() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

// Lazy-load CBT slug -> title map so we can resolve slugs Claude mentions
// back to actual landing pages.
let _slugIndex = null;
function getSlugIndex() {
  if (_slugIndex) return _slugIndex;
  try {
    const file = path.join(process.cwd(), 'scripts', 'ihatecbts_pass2_index.json');
    const idx = JSON.parse(fs.readFileSync(file, 'utf8'));
    _slugIndex = new Map(idx.entries.map(e => [e.slug, { title: e.title, bucket: e.bucket, question_count: e.question_count }]));
  } catch (e) {
    _slugIndex = new Map();
  }
  return _slugIndex;
}

// Lazy-load the flat question index (76K Q's across 1,329 slugs) so we can
// bridge Pinecone-retrieved snippets back to a real /answers/<slug> page
// by finding which slug contains the same question text.
let _qIndex = null;
function getQuestionIndex() {
  if (_qIndex) return _qIndex;
  try {
    const file = path.join(process.cwd(), 'scripts', 'answers_question_index.json');
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    // Build a map: first ~80 chars of normalized question -> slug
    // Multiple Q's may share a slug; we keep the first match per key.
    _qIndex = new Map();
    for (const item of data.questions || []) {
      const key = normalizeForMatch(item.q_text).slice(0, 80);
      if (key.length >= 12 && !_qIndex.has(key)) {
        _qIndex.set(key, item.slug);
      }
    }
  } catch (e) {
    console.error('study/recommend: failed to load question_index', e);
    _qIndex = new Map();
  }
  return _qIndex;
}

function normalizeForMatch(s) {
  return (s || '').toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

// Extract the first individual question fragment from a Pinecone-retrieved
// multi-Q&A text chunk. Returns null if no clear "Question:" found.
function extractFirstQuestion(text) {
  if (!text) return null;
  const m = text.match(/Question\s*\d*\s*:\s*([\s\S]{10,400}?)(?:\s+Answer\s*:|={4,}|$)/i);
  if (!m) return null;
  return m[1].replace(/\s+/g, ' ').trim();
}

export async function POST(request) {
  try {
    const { questions } = await request.json();
    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'Provide at least one question.' }, { status: 400 });
    }

    // Clean + cap input — abuse guard
    const cleaned = questions
      .map(q => String(q || '').trim())
      .filter(q => q.length >= 10 && q.length <= 2000)
      .slice(0, 5);

    if (cleaned.length === 0) {
      return NextResponse.json({ error: 'Questions must be 10-2000 characters each.' }, { status: 400 });
    }

    // Step 1: semantic retrieve from the corpus (Pinecone has ihatecbts Q&A indexed)
    const retrievalQuery = cleaned.join('\n\n');
    let retrieved = [];
    try {
      retrieved = await searchPinecone(retrievalQuery, 30);
    } catch (err) {
      console.error('study/recommend: pinecone failed', err);
    }

    // Step 2: also do a substring match against our flat question index
    // (cheap, in-memory after first load). Helps when Pinecone has different
    // chunking than our /answers corpus.
    const slugMap = getSlugIndex();
    const candidateSnippets = retrieved.slice(0, 20).map((r, i) => ({
      idx: i,
      text: (r.text || '').slice(0, 500),
      source: r.source || '',
      filename: r.filename || '',
      score: r.score,
    }));

    // Step 3: ask Claude Haiku to identify the topic + select the most relevant
    // related questions from the retrieved candidates.
    const systemPrompt = `You are a study assistant for QuizFeast. The user pastes 2-3 questions they're stuck on. You receive their questions plus up to 20 candidate Q&A snippets retrieved from a study corpus. Your job:

1. Identify what exam, CBT, or topic the user is likely studying.
2. Select the most relevant 8-10 candidates that would help them study (drop irrelevant ones).
3. Write a short 2-3 sentence study brief that summarizes the topic and helps them think about it.

Output ONLY JSON with this exact shape:
{
  "identified_topic": "string — short label of the topic/section, e.g. 'Cyber Awareness — Spillage'",
  "identified_exam": "string — best guess at the exam/CBT name, e.g. 'Cyber Awareness Challenge 2024'",
  "confidence": "low" | "medium" | "high",
  "study_brief": "2-3 sentence summary tailored to the user's questions",
  "related_indices": [array of integer indices into the candidates list, in priority order, 0-19]
}

Rules:
- If you can't confidently identify the topic, say so in identified_topic + set confidence: "low".
- Be honest. Don't make up facts. If candidates don't seem to match, return empty related_indices.
- Output JSON only. No markdown, no commentary.`;

    const userPrompt = `User's questions:
${cleaned.map((q, i) => `Q${i + 1}. ${q}`).join('\n\n')}

Candidate snippets retrieved from the corpus:
${candidateSnippets.map((c) => `[${c.idx}] ${c.text}`).join('\n\n')}`;

    let aiResult;
    try {
      const response = await getAnthropic().messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });
      const rawText = response.content?.[0]?.text || '{}';
      // Strip code fences if Claude added them despite instructions
      const stripped = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      aiResult = JSON.parse(stripped);
    } catch (err) {
      console.error('study/recommend: claude failed', err);
      return NextResponse.json({
        error: 'AI service unavailable. Try again in a moment.',
      }, { status: 503 });
    }

    // Step 4: stitch the selected candidates back into full result objects
    const selectedIndices = Array.isArray(aiResult.related_indices)
      ? aiResult.related_indices.filter(i => Number.isInteger(i) && i >= 0 && i < candidateSnippets.length).slice(0, 10)
      : [];

    // Slug resolution strategy. Pinecone records were loaded with a
    // different naming scheme than our /answers slugs, so direct metadata
    // lookup rarely matches. We bridge by question-text identity.
    const qIndex = getQuestionIndex();

    function slugifyText(s) {
      return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
    }
    function findSlugInIndex(candidate) {
      // 1. Cross-reference question text against our local question_index.
      // This is the highest-yield path because Pinecone retrieves by
      // semantic similarity and our index has every Q-text in the corpus.
      const firstQ = extractFirstQuestion(candidate.text);
      if (firstQ) {
        const key = normalizeForMatch(firstQ).slice(0, 80);
        if (key.length >= 12 && qIndex.has(key)) {
          return qIndex.get(key);
        }
      }
      // 2. Direct source field slugified
      const s1 = slugifyText(candidate.source || '');
      if (s1 && slugMap.has(s1)) return s1;
      // 3. Filename field
      const s2 = slugifyText((candidate.filename || '').replace(/\.docx$/i, ''));
      if (s2 && slugMap.has(s2)) return s2;
      // 4. Extract first line of text as title — text format is often
      // "<Title> Question: ..." so chop at the first "Question:" word
      const firstChunk = (candidate.text || '').split(/Question\s*\d*\s*:/i)[0].trim();
      if (firstChunk) {
        const s3 = slugifyText(firstChunk);
        if (s3 && slugMap.has(s3)) return s3;
        const short = firstChunk.split(/\s+/).slice(0, 8).join(' ');
        const s4 = slugifyText(short);
        if (s4 && slugMap.has(s4)) return s4;
      }
      return null;
    }

    const related = selectedIndices.map(i => {
      const c = candidateSnippets[i];
      const slug = findSlugInIndex(c);
      const slugMeta = slug ? slugMap.get(slug) : null;
      const title = slugMeta ? slugMeta.title : null;
      const bucket = slugMeta ? slugMeta.bucket : null;
      // chip_label hides third-party vendor trademarks (CompTIA, Cisco, AWS,
      // etc.) from the UI badge. Underlying page link still goes to /answers
      // where the full title can appear (nominative fair use), but in
      // compact UI we avoid surfacing trademarks as branded chips.
      const chip_label = safeChipLabel(title, bucket);
      return {
        text: c.text,
        slug,
        title,
        chip_label,
        bucket,
        relevance_score: c.score,
      };
    });

    return NextResponse.json(sanitizeDeep({
      input_question_count: cleaned.length,
      identified_topic: String(aiResult.identified_topic || 'Unidentified topic'),
      identified_exam: String(aiResult.identified_exam || ''),
      confidence: ['low', 'medium', 'high'].includes(aiResult.confidence) ? aiResult.confidence : 'low',
      study_brief: String(aiResult.study_brief || ''),
      related,
    }));

  } catch (error) {
    console.error('study/recommend error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
