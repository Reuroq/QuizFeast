import { NextResponse } from 'next/server';
import { searchPinecone, getEmbedding, upsertVectors } from '@/lib/pinecone';
import OpenAI from 'openai';
import crypto from 'crypto';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

// Full analysis: Pinecone cache → AI fallback → cache new answer
export async function POST(request) {
  try {
    const { question, options } = await request.json();

    if (!question?.trim()) {
      return NextResponse.json({ error: 'Question required' }, { status: 400 });
    }

    // Step 1: Check Pinecone cache
    const cacheResults = await searchPinecone(question.trim(), 3);

    if (cacheResults.length > 0 && cacheResults[0].score >= 0.85) {
      const best = cacheResults[0];
      const cachedAnswer = best.text || '';

      if (options?.length > 0) {
        const cachedLower = cachedAnswer.toLowerCase();
        for (let i = 0; i < options.length; i++) {
          if (options[i].toLowerCase().includes(cachedLower) ||
              cachedLower.includes(options[i].toLowerCase())) {
            return NextResponse.json({
              answerIndex: i,
              answer: options[i],
              confidence: 'high',
              reason: `Cached answer (${Math.round(best.score * 100)}% match)`,
              source: 'pinecone_cache',
            });
          }
        }
      }
    }

    // Step 2: AI fallback
    if (!options?.length) {
      return NextResponse.json({ error: 'No options provided and no cache hit' }, { status: 400 });
    }

    const optionsText = options.map((opt, i) => `${i + 1}. ${opt}`).join('\n');
    const prompt = `Analyze this question and determine the correct answer.

Question: ${question}

Options:
${optionsText}

Which option is most likely correct? Respond with ONLY a JSON object:
{"answer": <number 1-${options.length}>, "confidence": "high"|"medium"|"low", "reason": "<brief reason>"}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const answerIdx = parsed.answer - 1;
      const answerText = options[answerIdx] || '';

      // Step 3: Cache the new answer to Pinecone
      cacheAnswer(question, answerText, options).catch(err =>
        console.error('Cache store error:', err)
      );

      return NextResponse.json({
        answerIndex: answerIdx,
        answer: answerText,
        confidence: parsed.confidence,
        reason: parsed.reason,
        source: 'ai',
      });
    }

    return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 });
  } catch (error) {
    console.error('Extension analyze error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function cacheAnswer(question, answer, options) {
  try {
    const embedding = await getEmbedding(question);
    const hash = crypto.createHash('md5').update(question).digest('hex').slice(0, 16);
    const vectorId = `cbt_${hash}`;

    await upsertVectors([{
      id: vectorId,
      values: embedding,
      metadata: {
        text: question.slice(0, 500),
        answer: answer,
        options: JSON.stringify(options).slice(0, 500),
        source: 'quizfeast_extension',
        timestamp: new Date().toISOString(),
      },
    }]);
  } catch (error) {
    console.error('Cache store failed:', error);
  }
}
