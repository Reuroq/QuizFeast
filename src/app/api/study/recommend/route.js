import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'node:fs';
import path from 'node:path';
import { sanitizeDeep, safeChipLabel } from '@/lib/sanitize';

let _anthropic;
function getAnthropic() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

function normalizeForMatch(s) {
  return (s || '').toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

// Key on first N words. Word-prefix is stable across punctuation + casing.
function questionKey(s, wordCount = 8) {
  const norm = normalizeForMatch(s);
  if (!norm) return '';
  return norm.split(' ').slice(0, wordCount).join(' ');
}

// Multi-value index: a single Q text typically appears in many /answers sets
// (e.g., "What is whaling?" is in ~30 Cyber Awareness pages). To identify
// the user's specific set, we need the FULL set of slugs each Q appears in,
// not just the first one we saw during build.
let _multiIndex = null;
function getMultiIndex() {
  if (_multiIndex) return _multiIndex;
  try {
    const file = path.join(process.cwd(), 'scripts', 'answers_question_index.json');
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const k8 = new Map();  // 8-word key → Set<slug>
    const k4 = new Map();  // 4-word key → Set<slug>
    for (const item of data.questions || []) {
      const key8 = questionKey(item.q_text, 8);
      const key4 = questionKey(item.q_text, 4);
      if (key8) {
        if (!k8.has(key8)) k8.set(key8, new Set());
        k8.get(key8).add(item.slug);
      }
      if (key4 && key4 !== key8) {
        if (!k4.has(key4)) k4.set(key4, new Set());
        k4.get(key4).add(item.slug);
      }
    }
    _multiIndex = { k8, k4 };
  } catch (e) {
    console.error('study/recommend: multiIndex load failed', e);
    _multiIndex = { k8: new Map(), k4: new Map() };
  }
  return _multiIndex;
}

// Slug → { title, bucket } so we can stamp metadata onto the chosen set.
let _slugMeta = null;
function getSlugMeta() {
  if (_slugMeta) return _slugMeta;
  try {
    const file = path.join(process.cwd(), 'scripts', 'ihatecbts_pass2_index.json');
    const idx = JSON.parse(fs.readFileSync(file, 'utf8'));
    _slugMeta = new Map(idx.entries.map(e => [e.slug, {
      title: e.title,
      bucket: e.bucket,
      question_count: e.question_count,
    }]));
  } catch (e) {
    _slugMeta = new Map();
  }
  return _slugMeta;
}

// Identify the most likely /answers set by intersecting the slug-sets that
// contain each of the user's input questions.
function identifySet(userQuestions, mi) {
  const slugScores = new Map();  // slug → score
  for (const uq of userQuestions) {
    const k8 = questionKey(uq, 8);
    const k4 = questionKey(uq, 4);
    const slugs8 = (k8 && mi.k8.get(k8)) || new Set();
    const slugs4 = (k4 && mi.k4.get(k4)) || new Set();
    // Award 2 points per slug that has the precise 8-word match,
    // 1 point per slug with the more permissive 4-word match.
    for (const s of slugs8) slugScores.set(s, (slugScores.get(s) || 0) + 2);
    for (const s of slugs4) if (!slugs8.has(s)) slugScores.set(s, (slugScores.get(s) || 0) + 1);
  }
  return [...slugScores.entries()].sort((a, b) => b[1] - a[1]);
}

// Load the full Q&A set for the chosen slug.
function loadSet(slug) {
  if (!slug) return null;
  // Path guard — slug came from our own index but defensive against traversal
  if (!/^[a-z0-9-]+$/i.test(slug)) return null;
  const file = path.join(process.cwd(), 'public', 'data', 'answers', slug + '.json');
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch { return null; }
}

export async function POST(request) {
  try {
    const { questions } = await request.json();
    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'Provide at least one question.' }, { status: 400 });
    }

    const cleaned = questions
      .map(q => String(q || '').trim())
      .filter(q => q.length >= 10 && q.length <= 2000)
      .slice(0, 5);

    if (cleaned.length === 0) {
      return NextResponse.json({ error: 'Questions must be 10-2000 characters each.' }, { status: 400 });
    }

    const mi = getMultiIndex();
    const slugMeta = getSlugMeta();

    // Step 1: identify the user's set by matching against the question_index.
    const candidateSlugs = identifySet(cleaned, mi);
    const topSlug = candidateSlugs[0]?.[0] || null;
    const topScore = candidateSlugs[0]?.[1] || 0;

    // Pick alternates only if their score is meaningfully close to the top.
    const alternateSlugs = candidateSlugs.slice(1, 6).filter(([, s]) => s >= Math.max(1, topScore / 2));

    // Step 2: load the chosen set's full Q&A library.
    const setData = topScore >= 1 ? loadSet(topSlug) : null;

    // Step 3: ask Claude for a topic + study brief based on user's input.
    // No retrieval — Claude just identifies the topic and writes a couple
    // of orienting sentences. The set itself is the corpus.
    let aiResult = { identified_topic: 'Identified study set', identified_exam: '', confidence: 'low', study_brief: '' };
    try {
      const setTitle = setData?.title || (topSlug && slugMeta.get(topSlug)?.title) || 'unknown';
      const systemPrompt = `You are a study assistant for QuizFeast. The user pasted 1-5 questions they're stuck on. We've already deterministically matched them to a specific study set: "${setTitle}".

Your job: write a short, useful 2-3 sentence study brief that ties the user's specific questions together and frames what they should review. Use the brief to orient them, not to give individual answers (those are in the set).

Output ONLY JSON with this exact shape:
{
  "identified_topic": "short topic label, e.g. 'Cyber Awareness — Spillage & Wireless'",
  "confidence": "low" | "medium" | "high",
  "study_brief": "2-3 sentence summary"
}

No markdown, no commentary.`;

      const userPrompt = `User's pasted questions:\n${cleaned.map((q, i) => `Q${i + 1}. ${q}`).join('\n\n')}\n\nMatched set title: ${setTitle}`;

      const response = await getAnthropic().messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });
      const rawText = response.content?.[0]?.text || '{}';
      const stripped = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      const parsed = JSON.parse(stripped);
      aiResult.identified_topic = String(parsed.identified_topic || 'Identified study set');
      aiResult.confidence = ['low', 'medium', 'high'].includes(parsed.confidence) ? parsed.confidence : 'low';
      aiResult.study_brief = String(parsed.study_brief || '');
      // Use the matched set's title as the "exam"
      aiResult.identified_exam = setTitle !== 'unknown' ? setTitle : '';
    } catch (err) {
      console.error('study/recommend: claude brief failed', err);
      // Continue — brief is nice-to-have but not essential
    }

    // Build set payload for the frontend
    const set = setData ? {
      slug: setData.slug,
      title: setData.title,
      bucket: setData.bucket,
      question_count: setData.question_count || (setData.qas?.length || 0),
      qas: setData.qas || [],
      sections: setData.sections || null,
    } : null;

    // Alternates: small list for the user to switch sets if our top guess is wrong.
    const alternates = alternateSlugs.map(([s]) => {
      const meta = slugMeta.get(s);
      return {
        slug: s,
        title: meta?.title || s,
        chip_label: safeChipLabel(meta?.title || s, meta?.bucket),
        question_count: meta?.question_count || 0,
      };
    });

    return NextResponse.json(sanitizeDeep({
      input_question_count: cleaned.length,
      identified_topic: aiResult.identified_topic,
      identified_exam: aiResult.identified_exam,
      identified_slug: topSlug,
      confidence: aiResult.confidence,
      study_brief: aiResult.study_brief,
      set,
      alternates,
      match_score: topScore,
    }));

  } catch (error) {
    console.error('study/recommend error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
