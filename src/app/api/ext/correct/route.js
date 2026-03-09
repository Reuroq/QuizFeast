import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { getEmbedding, upsertVectors } from '@/lib/pinecone';
import { Pinecone } from '@pinecone-database/pinecone';
import crypto from 'crypto';

const VOTE_THRESHOLD = 30;

let _anthropic;
function getAnthropic() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

let _openai;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

function buildVerifyPrompt(wrongAnswer) {
  return `Look at this screenshot. The user selected "${wrongAnswer}" as their answer.

1. Does this screenshot show quiz/training FEEDBACK indicating the answer was INCORRECT/WRONG? (yes/no)
2. What is the CORRECT answer shown?

Reply in this exact format:
VERIFIED: yes or no
CORRECT_ANSWER: the answer text (or "none" if not verified)`;
}

// Try Claude first, fall back to GPT-4o-mini if refused
async function verifyWithClaude(base64Image, wrongAnswer) {
  const response = await getAnthropic().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/png', data: base64Image },
        },
        { type: 'text', text: buildVerifyPrompt(wrongAnswer) },
      ],
    }],
  });

  const text = response.content[0].text.trim();

  // Detect refusal
  const refusalPatterns = [
    'i cannot', 'i can\'t', 'i\'m not able', 'i\'m unable',
    'please complete the training', 'not appropriate',
    'designed to ensure', 'complete the training yourself',
  ];
  if (refusalPatterns.some(p => text.toLowerCase().includes(p))) {
    throw new Error('CLAUDE_REFUSED');
  }

  return text;
}

async function verifyWithGPT(imageUrl, wrongAnswer) {
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 200,
    temperature: 0,
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
        { type: 'text', text: buildVerifyPrompt(wrongAnswer) },
      ],
    }],
  });

  return response.choices[0].message.content.trim();
}

export async function POST(request) {
  try {
    const { image, originalQuestion, wrongAnswer } = await request.json();

    if (!image || !originalQuestion || !wrongAnswer) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');
    const imageUrl = image.startsWith('data:')
      ? image
      : `data:image/png;base64,${image}`;

    // Step 1: Verify screenshot — Claude first, GPT fallback
    let aiText;
    try {
      aiText = await verifyWithClaude(base64Image, wrongAnswer);
    } catch (err) {
      console.log('[QuizFeast] Claude refused/failed on verify, falling back to GPT:', err.message);
      aiText = await verifyWithGPT(imageUrl, wrongAnswer);
    }

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
