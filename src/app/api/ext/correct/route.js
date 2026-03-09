import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getEmbedding, upsertVectors } from '@/lib/pinecone';
import { Pinecone } from '@pinecone-database/pinecone';
import crypto from 'crypto';

const VOTE_THRESHOLD = 30;

let _openai;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

// Correct a wrong answer with voting system
export async function POST(request) {
  try {
    const { image, originalQuestion, wrongAnswer } = await request.json();

    if (!image || !originalQuestion || !wrongAnswer) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure proper data URL format
    const imageUrl = image.startsWith('data:')
      ? image
      : `data:image/png;base64,${image}`;

    // Step 1: Verify with GPT-4o-mini Vision that the screenshot shows incorrect feedback
    const verifyResponse = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 200,
      temperature: 0,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: imageUrl, detail: 'high' },
          },
          {
            type: 'text',
            text: `Look at this screenshot. The user selected "${wrongAnswer}" as their answer.

1. Does this screenshot show quiz/training FEEDBACK indicating the answer was INCORRECT/WRONG? (yes/no)
2. What is the CORRECT answer shown?

Reply in this exact format:
VERIFIED: yes or no
CORRECT_ANSWER: the answer text (or "none" if not verified)`,
          },
        ],
      }],
    });

    const aiText = verifyResponse.choices[0].message.content.trim();
    const verifiedMatch = aiText.match(/VERIFIED:\s*(yes|no)/i);
    const answerMatch = aiText.match(/CORRECT_ANSWER:\s*(.+)/i);

    const isVerified = verifiedMatch && verifiedMatch[1].toLowerCase() === 'yes';
    const correctAnswer = answerMatch ? answerMatch[1].trim() : null;

    if (!isVerified || !correctAnswer || correctAnswer.toLowerCase() === 'none') {
      return NextResponse.json({
        correctAnswer: null,
        rejected: true,
        reason: 'Screenshot does not show incorrect answer feedback. Vote not counted.',
      });
    }

    // Step 2: Get existing vector and apply voting
    const embedding = await getEmbedding(originalQuestion);
    const hash = crypto.createHash('md5').update(originalQuestion).digest('hex').slice(0, 16);
    const vectorId = `cbt_${hash}`;

    // Fetch existing vector
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const index = pc.index('quiz', process.env.PINECONE_HOST);

    let wrongVotes = 0;
    let existingMetadata = {};

    try {
      const fetchResult = await index.fetch([vectorId]);
      if (fetchResult.records?.[vectorId]) {
        existingMetadata = fetchResult.records[vectorId].metadata || {};
        wrongVotes = parseInt(existingMetadata.wrong_votes || '0');
      }
    } catch (e) {
      // Vector might not exist yet
    }

    wrongVotes += 1;
    let newAnswer = wrongAnswer;
    let flipped = false;
    let message = '';

    if (wrongVotes >= VOTE_THRESHOLD) {
      newAnswer = correctAnswer;
      flipped = true;
      wrongVotes = 0;
      message = `Answer UPDATED! Users confirmed this was wrong.`;
    } else {
      message = `Vote recorded (${wrongVotes}/${VOTE_THRESHOLD}). Need ${VOTE_THRESHOLD - wrongVotes} more to change.`;
    }

    // Update Pinecone
    await upsertVectors([{
      id: vectorId,
      values: embedding,
      metadata: {
        text: originalQuestion.slice(0, 500),
        answer: newAnswer,
        previous_answer: flipped ? wrongAnswer : (existingMetadata.previous_answer || ''),
        wrong_votes: wrongVotes,
        suggested_answer: correctAnswer,
        source: flipped ? 'quizfeast_voted_correction' : (existingMetadata.source || 'quizfeast_extension'),
        flipped: String(flipped),
        last_vote: new Date().toISOString(),
      },
    }]);

    return NextResponse.json({
      correctAnswer,
      voted: true,
      flipped,
      currentVotes: wrongVotes,
      threshold: VOTE_THRESHOLD,
      message,
    });
  } catch (error) {
    console.error('Correction error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
