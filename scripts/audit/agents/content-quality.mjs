// ContentQualityAgent — samples Q&A pairs from /answers slugs and asks
// Claude Haiku to flag duplicates, suspicious answers, off-topic content.
// Costs ~$0.001 per slug reviewed; we sample ~50 slugs per audit run.

import fs from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';

const ANSWERS_DATA_DIR = path.join(process.cwd(), 'public', 'data', 'answers');

let _anthropic;
function getClaude() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

function loadSlugData(slug) {
  const file = path.join(ANSWERS_DATA_DIR, slug + '.json');
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const SYSTEM_PROMPT = `You are a quality-control reviewer for a study-set library. For each Q&A set:

1. Identify any Q&A pairs where the answer is suspiciously short (just "yes"/"true"/"false" with no context), exact duplicates of the question, or empty.
2. Identify off-topic Qs that don't match the set's stated topic.
3. Identify Q text that's actually advertising/spam (mesothelioma, payday loans, etc.) rather than a real study question.

Output ONLY a JSON object:
{
  "verdict": "clean" | "minor-issues" | "major-issues",
  "issues": [{ "q_index": N, "kind": "suspicious-answer" | "off-topic" | "spam" | "duplicate" | "empty", "note": "<one short sentence>" }],
  "summary": "<one sentence overall assessment>"
}

Be conservative — only flag clear problems. Don't flag every short answer; only ones that look wrong (e.g., yes/no with no explanation when context demands more).`;

export async function runContentQualityAgent({ slug, store }) {
  const data = loadSlugData(slug);
  if (!data || !Array.isArray(data.qas) || data.qas.length < 5) return null;

  // Build a compact sample: title + first 12 Qs to keep tokens manageable
  const sample = data.qas.slice(0, 12).map((qa, i) =>
    `[${i}] Q: ${qa.q.slice(0, 200)}\nA: ${(qa.a || '').slice(0, 250)}`
  ).join('\n\n');

  const userPrompt = `Set title: ${data.title}\nSet bucket: ${data.bucket}\nQ count: ${data.question_count}\n\nSample Q&As (first 12 of ${data.qas.length}):\n\n${sample}`;

  let result;
  try {
    const response = await getClaude().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });
    const raw = response.content?.[0]?.text || '{}';
    const stripped = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    result = JSON.parse(stripped);
  } catch (err) {
    // Don't report errors as issues; just skip
    return { error: err.message };
  }

  if (result.verdict === 'major-issues' || result.verdict === 'minor-issues') {
    for (const iss of (result.issues || [])) {
      store.report({
        agent: 'content', category: iss.kind || 'quality-issue',
        severity: result.verdict === 'major-issues' ? 'high' : 'medium',
        url: `/answers/${slug}`,
        sub_key: `${slug}-q${iss.q_index}`,
        message: `${iss.kind} on Q${iss.q_index + 1}: ${iss.note}`,
        evidence: { kind: 'text', value: `Q: ${data.qas[iss.q_index]?.q?.slice(0, 150)}\nA: ${(data.qas[iss.q_index]?.a || '').slice(0, 200)}` },
        suggested_fix: iss.kind === 'spam' || iss.kind === 'empty' || iss.kind === 'duplicate'
          ? 'Remove this Q&A from the set'
          : 'Manual review / community correction',
        auto_fixable: iss.kind === 'spam' || iss.kind === 'empty',
      });
    }
  }

  return result;
}
