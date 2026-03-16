import { NextResponse } from 'next/server';
import { getEmbedding, upsertVectors } from '@/lib/pinecone';
import { Pinecone } from '@pinecone-database/pinecone';
import crypto from 'crypto';

const VOTE_THRESHOLD = 5;

export async function POST(request) {
  try {
    const { slug, questionIndex, question, currentAnswer, suggestedAnswer } = await request.json();

    if (!slug || questionIndex === undefined || !question || !suggestedAnswer) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (suggestedAnswer.trim().length < 2) {
      return NextResponse.json({ error: 'Suggested answer too short' }, { status: 400 });
    }

    // Create a deterministic ID for this specific question's correction votes
    const hash = crypto.createHash('md5').update(`${slug}_${questionIndex}_${question}`).digest('hex').slice(0, 16);
    const correctionId = `cbt_fix_${hash}`;

    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const index = pc.index('quiz', process.env.PINECONE_HOST);

    // Fetch existing correction record
    let existingVotes = [];
    let existingMetadata = {};

    try {
      const fetchResult = await index.fetch([correctionId]);
      if (fetchResult.records?.[correctionId]) {
        existingMetadata = fetchResult.records[correctionId].metadata || {};
        existingVotes = JSON.parse(existingMetadata.votes || '[]');
      }
    } catch (e) {
      // No existing record
    }

    // Normalize the suggested answer for comparison
    const normalizedSuggestion = suggestedAnswer.trim().toLowerCase();

    // Find if this suggestion already has votes
    let matched = false;
    for (const vote of existingVotes) {
      if (vote.answer.toLowerCase() === normalizedSuggestion) {
        vote.count += 1;
        vote.lastVote = new Date().toISOString();
        matched = true;
        break;
      }
    }

    if (!matched) {
      existingVotes.push({
        answer: suggestedAnswer.trim(),
        count: 1,
        lastVote: new Date().toISOString(),
      });
    }

    // Check if any suggestion has reached the threshold
    const topVote = existingVotes.reduce((top, v) => v.count > (top?.count || 0) ? v : top, null);
    let flipped = false;
    let newAnswer = currentAnswer;

    if (topVote && topVote.count >= VOTE_THRESHOLD) {
      flipped = true;
      newAnswer = topVote.answer;
    }

    // Store correction data in Pinecone
    const embedding = await getEmbedding(question);
    await upsertVectors([{
      id: correctionId,
      values: embedding,
      metadata: {
        text: question.slice(0, 500),
        slug,
        questionIndex: String(questionIndex),
        originalAnswer: currentAnswer || '',
        correctedAnswer: flipped ? newAnswer : '',
        votes: JSON.stringify(existingVotes).slice(0, 1000),
        totalVotes: String(existingVotes.reduce((s, v) => s + v.count, 0)),
        flipped: String(flipped),
        source: 'cbt_correction',
        updatedAt: new Date().toISOString(),
      },
    }]);

    return NextResponse.json({
      voted: true,
      flipped,
      correctedAnswer: flipped ? newAnswer : null,
      currentVotes: topVote?.count || 1,
      threshold: VOTE_THRESHOLD,
      message: flipped
        ? `Answer updated! ${VOTE_THRESHOLD} users confirmed the correction.`
        : `Vote recorded (${topVote?.count || 1}/${VOTE_THRESHOLD}). Need ${VOTE_THRESHOLD - (topVote?.count || 1)} more to update.`,
    });
  } catch (error) {
    console.error('CBT correction error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get corrections for a specific CBT slug
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 });
    }

    // Search for all corrections for this slug
    const embedding = await getEmbedding(`${slug} correction`);
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const index = pc.index('quiz', process.env.PINECONE_HOST);

    const results = await index.query({
      vector: embedding,
      topK: 100,
      includeMetadata: true,
      filter: { source: { $eq: 'cbt_correction' }, slug: { $eq: slug }, flipped: { $eq: 'true' } },
    });

    const corrections = {};
    for (const match of results.matches || []) {
      const meta = match.metadata;
      if (meta.flipped === 'true' && meta.questionIndex) {
        corrections[meta.questionIndex] = meta.correctedAnswer;
      }
    }

    return NextResponse.json({ corrections });
  } catch (error) {
    console.error('Get corrections error:', error);
    return NextResponse.json({ corrections: {} });
  }
}
