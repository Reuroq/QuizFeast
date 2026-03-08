import { NextResponse } from 'next/server';
import { explainAnswer } from '@/lib/ai';

export async function POST(request) {
  try {
    const { question, answer, userAnswer } = await request.json();

    if (!question || !answer) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const explanation = await explainAnswer(question, answer, userAnswer || 'N/A');
    return NextResponse.json({ explanation });
  } catch (error) {
    console.error('Explain error:', error);
    return NextResponse.json({ explanation: 'Unable to generate explanation at this time.' });
  }
}
