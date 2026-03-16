import { NextResponse } from 'next/server';
import { getEmbedding, upsertVectors } from '@/lib/pinecone';
import OpenAI from 'openai';
import crypto from 'crypto';

let _openai;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

async function moderateContent(questions) {
  const sample = questions.slice(0, 10).map((q, i) => `${i + 1}. Q: ${q.q}\n   A: ${q.a}`).join('\n');

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a content moderator for a military training study platform. Review submitted Q&A pairs for:

1. DMCA/Copyright: Flag if content appears to be copied verbatim from a copyrighted source (e.g., exact test questions from a commercial product). Military/government training content is generally OK since it's public domain.
2. Accuracy: Flag obviously wrong answers.
3. Relevance: Flag content that isn't related to military/professional training.
4. Harmful content: Flag anything inappropriate, offensive, or that could compromise security.

For each question, return PASS or FAIL with a brief reason.

Return JSON: {"results": [{"index": 0, "status": "PASS"|"FAIL", "reason": "brief reason"}], "summary": "overall assessment", "passRate": 0.0-1.0}

Be lenient — most military CBT content is derived from public government doctrine. Only FAIL clearly problematic content.`
      },
      {
        role: 'user',
        content: `Review these submitted Q&A pairs:\n\n${sample}`
      }
    ],
    temperature: 0,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content);
}

export async function POST(request) {
  try {
    const { questions, category, submitterNote } = await request.json();

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'No questions provided' }, { status: 400 });
    }

    if (questions.length > 200) {
      return NextResponse.json({ error: 'Maximum 200 questions per submission' }, { status: 400 });
    }

    // Validate format
    const validQuestions = questions.filter(q =>
      q.q && q.a && q.q.trim().length >= 10 && q.a.trim().length >= 2
    );

    if (validQuestions.length === 0) {
      return NextResponse.json({ error: 'No valid questions found. Each needs a question (10+ chars) and answer (2+ chars).' }, { status: 400 });
    }

    // AI moderation
    const moderation = await moderateContent(validQuestions);

    // Filter to only passing questions
    const passedIndices = new Set(
      (moderation.results || [])
        .filter(r => r.status === 'PASS')
        .map(r => r.index)
    );

    // If moderation checked fewer than all questions (only sampled 10), pass the rest
    const approvedQuestions = validQuestions.filter((_, i) => {
      if (i < 10) return passedIndices.has(i);
      return moderation.passRate >= 0.7; // If sample mostly passed, approve the rest
    });

    if (approvedQuestions.length === 0) {
      return NextResponse.json({
        accepted: 0,
        rejected: validQuestions.length,
        reason: 'All questions were flagged by content moderation: ' + moderation.summary,
      });
    }

    // Store approved submissions in Pinecone with pending status
    const vectors = [];
    for (const q of approvedQuestions) {
      const hash = crypto.createHash('md5').update(q.q).digest('hex').slice(0, 16);
      const embedding = await getEmbedding(q.q);

      vectors.push({
        id: `cbt_user_${hash}`,
        values: embedding,
        metadata: {
          text: q.q.slice(0, 500),
          answer: q.a.slice(0, 500),
          category: category || 'User Submitted',
          source: 'cbt_user_submission',
          status: 'approved',
          submitterNote: (submitterNote || '').slice(0, 200),
          submittedAt: new Date().toISOString(),
          upvotes: '0',
        },
      });
    }

    await upsertVectors(vectors);

    return NextResponse.json({
      accepted: approvedQuestions.length,
      rejected: validQuestions.length - approvedQuestions.length,
      total: questions.length,
      message: `${approvedQuestions.length} questions accepted and added to the study library!`,
      moderation: {
        passRate: moderation.passRate,
        summary: moderation.summary,
      },
    });
  } catch (error) {
    console.error('CBT submit error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
