import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateQuestionsFromText(text, count = 10) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an expert study assistant. Generate exactly ${count} high-quality study questions and answers from the provided text. Each question should test understanding, not just recall. Return ONLY valid JSON with a "questions" key containing an array of objects, each with "question" and "answer" fields. Even if count is 1, always return an array.`
      },
      {
        role: 'user',
        content: `Generate ${count} study questions from this content. Return as JSON array with "question" and "answer" fields. Make questions clear and answers concise but complete.\n\nContent:\n${text.slice(0, 12000)}`
      }
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const parsed = JSON.parse(response.choices[0].message.content);
  // Handle various JSON formats the AI might return
  const result = parsed.questions || parsed.cards || parsed.flashcards || parsed.items || parsed;
  // If result is an object with a single array value, extract it
  if (!Array.isArray(result) && typeof result === 'object') {
    const values = Object.values(result);
    const arrayVal = values.find(v => Array.isArray(v));
    if (arrayVal) return arrayVal;
  }
  return Array.isArray(result) ? result : [];
}

export async function explainAnswer(question, correctAnswer, userAnswer) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful tutor. Explain why the correct answer is right and why the user\'s answer was wrong (if applicable). Be concise but educational. 2-3 sentences max.'
      },
      {
        role: 'user',
        content: `Question: ${question}\nCorrect answer: ${correctAnswer}\nUser's answer: ${userAnswer}\n\nExplain why the correct answer is right.`
      }
    ],
    temperature: 0.5,
    max_tokens: 200,
  });

  return response.choices[0].message.content;
}

export async function smartCheckAnswer(question, correctAnswer, userAnswer) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an answer checker. Determine if the user\'s answer MATCHES the expected answer, even if worded differently. Accept synonyms, rephrasings, equivalent answers, minor spelling errors, and abbreviations. If the answer is blank or whitespace only, mark it incorrect. IMPORTANT: Do NOT verify factual accuracy — only check if the user\'s answer conveys the same meaning as the expected answer. If they match, mark correct. Return ONLY valid JSON: {"correct": true/false, "feedback": "brief feedback"}'
      },
      {
        role: 'user',
        content: `Question: ${question}\nExpected answer: ${correctAnswer}\nUser's answer: ${userAnswer}\n\nIs the user's answer correct? Be lenient with minor typos and spelling variations. Accept equivalent meanings.`
      }
    ],
    temperature: 0,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content);
}

export async function generateDistractors(question, correctAnswer, count = 3) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Generate ${count} plausible but incorrect answer choices for a multiple choice question. Make them believable but clearly wrong. Return ONLY a JSON array of strings.`
      },
      {
        role: 'user',
        content: `Question: ${question}\nCorrect answer: ${correctAnswer}\n\nGenerate ${count} wrong but plausible answer choices. Return as JSON array of strings.`
      }
    ],
    temperature: 0.8,
    response_format: { type: 'json_object' },
  });

  const parsed = JSON.parse(response.choices[0].message.content);
  return parsed.distractors || parsed.choices || parsed.options || parsed;
}
