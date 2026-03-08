import { NextResponse } from 'next/server';
import { smartCheckAnswer } from '@/lib/ai';

export async function POST(request) {
  try {
    const { question, correctAnswer, userAnswer } = await request.json();

    if (!question || !correctAnswer) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Blank/whitespace answer is always wrong
    if (!userAnswer || !userAnswer.trim()) {
      return NextResponse.json({ correct: false, feedback: 'No answer provided' });
    }

    const result = await smartCheckAnswer(question, correctAnswer, userAnswer);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Answer check error:', error);
    // Fallback to basic comparison
    const { correctAnswer, userAnswer } = await request.json().catch(() => ({}));
    const correct = (correctAnswer || '').toLowerCase().trim() === (userAnswer || '').toLowerCase().trim();
    return NextResponse.json({ correct, feedback: correct ? 'Correct!' : 'Incorrect' });
  }
}
