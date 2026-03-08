import { NextResponse } from 'next/server';
import { generateQuestionsFromText } from '@/lib/ai';

export async function POST(request) {
  try {
    const { text, count: rawCount = 10 } = await request.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Text content required' }, { status: 400 });
    }

    // Cap count to prevent abuse / timeouts
    const count = Math.min(Math.max(1, parseInt(rawCount) || 10), 50);

    const questions = await generateQuestionsFromText(text.trim(), count);

    // Normalize to array of {question, answer}
    let cards = [];
    if (Array.isArray(questions)) {
      cards = questions.map(q => ({
        question: q.question || q.q || q.Question || '',
        answer: q.answer || q.a || q.Answer || '',
      })).filter(c => c.question && c.answer);
    } else if (questions && typeof questions === 'object' && (questions.question || questions.q)) {
      // Single question object returned
      cards = [{
        question: questions.question || questions.q || '',
        answer: questions.answer || questions.a || '',
      }];
    }

    // Suggest a title from the first 200 chars
    const suggestedTitle = text.trim().slice(0, 60).replace(/\s+/g, ' ') + '...';

    return NextResponse.json({ cards, suggestedTitle });
  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 });
  }
}
