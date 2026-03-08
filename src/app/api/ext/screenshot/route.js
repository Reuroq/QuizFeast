import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

// Analyze a screenshot with Claude Vision
export async function POST(request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'Image data required' }, { status: 400 });
    }

    // Strip data URL prefix if present
    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: base64Image,
            },
          },
          {
            type: 'text',
            text: 'Look at this training quiz screenshot. What is the correct answer? Reply with ONLY the answer text, nothing else. No explanation, no reasoning, just the exact answer option text.',
          },
        ],
      }],
    });

    const answer = response.content[0].text;
    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Screenshot analysis error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
