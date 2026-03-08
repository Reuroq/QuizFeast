import { NextResponse } from 'next/server';
import { searchPinecone } from '@/lib/pinecone';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

// Extension cache lookup — Pinecone first, returns cached Q&A if match found
export async function POST(request) {
  try {
    const { question, options } = await request.json();

    if (!question?.trim()) {
      return NextResponse.json({ error: 'Question required' }, { status: 400 });
    }

    // Search Pinecone for similar questions
    const results = await searchPinecone(question.trim(), 3);

    if (results.length > 0 && results[0].score >= 0.85) {
      const best = results[0];
      const cachedAnswer = best.text || '';

      // Try to match cached answer to provided options
      if (options?.length > 0) {
        const cachedLower = cachedAnswer.toLowerCase();
        for (let i = 0; i < options.length; i++) {
          if (options[i].toLowerCase().includes(cachedLower) ||
              cachedLower.includes(options[i].toLowerCase())) {
            return NextResponse.json({
              hit: true,
              answerIndex: i,
              answer: options[i],
              confidence: 'high',
              score: best.score,
              source: 'pinecone_cache',
            });
          }
        }
      }

      // Return raw cached text if no option match
      return NextResponse.json({
        hit: true,
        answer: cachedAnswer,
        subject: best.subject,
        score: best.score,
        source: 'pinecone_cache',
      });
    }

    return NextResponse.json({ hit: false, source: 'cache_miss' });
  } catch (error) {
    console.error('Extension query error:', error);
    return NextResponse.json({ hit: false, error: error.message });
  }
}
