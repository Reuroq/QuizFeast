import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

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

const PROMPT = 'Look at this quiz screenshot. Identify the question and all answer options. Determine the correct answer(s). Reply with ONLY the correct answer text, nothing else. If multiple answers are correct, list each on a new line.';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

// Try Claude first (smarter), fall back to GPT-4o-mini if refused
async function analyzeWithClaude(base64Image) {
  const response = await getAnthropic().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/png', data: base64Image },
        },
        { type: 'text', text: PROMPT },
      ],
    }],
  });

  const answer = response.content[0].text;

  // Detect refusal patterns
  const refusalPatterns = [
    'i cannot', 'i can\'t', 'i\'m not able', 'i am not able',
    'i\'m unable', 'i am unable', 'please complete the training',
    'i won\'t', 'i will not', 'not appropriate for me',
    'designed to ensure', 'complete the training yourself',
  ];

  const answerLower = answer.toLowerCase();
  const isRefusal = refusalPatterns.some(p => answerLower.includes(p));

  if (isRefusal) {
    throw new Error('CLAUDE_REFUSED');
  }

  return answer;
}

async function analyzeWithGPT(imageUrl) {
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 500,
    temperature: 0,
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
        { type: 'text', text: PROMPT },
      ],
    }],
  });

  return response.choices[0].message.content;
}

export async function POST(request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'Image data required' }, { status: 400 });
    }

    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');
    const imageUrl = image.startsWith('data:')
      ? image
      : `data:image/png;base64,${image}`;

    let answer;
    let model = 'claude';

    // Try Claude first
    try {
      answer = await analyzeWithClaude(base64Image);
    } catch (err) {
      // Claude refused or errored — fall back to GPT-4o-mini
      console.log('[QuizFeast] Claude refused/failed, falling back to GPT-4o-mini:', err.message);
      model = 'gpt-4o-mini';
      answer = await analyzeWithGPT(imageUrl);
    }

    return NextResponse.json({ answer, model });
  } catch (error) {
    console.error('Screenshot analysis error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
