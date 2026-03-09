import { NextResponse } from 'next/server';
import OpenAI from 'openai';

let _openai;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

// Analyze a screenshot with GPT-4o-mini Vision
export async function POST(request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'Image data required' }, { status: 400 });
    }

    // Ensure proper data URL format
    const imageUrl = image.startsWith('data:')
      ? image
      : `data:image/png;base64,${image}`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: imageUrl, detail: 'high' },
          },
          {
            type: 'text',
            text: 'Look at this quiz screenshot. Identify the question and all answer options. Determine the correct answer(s). Reply with ONLY the correct answer text, nothing else. If multiple answers are correct, list each on a new line.',
          },
        ],
      }],
      temperature: 0,
    });

    const answer = response.choices[0].message.content;
    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Screenshot analysis error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
