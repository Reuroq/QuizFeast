import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let pineconeIndex = null;

function getIndex() {
  if (!pineconeIndex) {
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    pineconeIndex = pc.index('quiz', process.env.PINECONE_HOST);
  }
  return pineconeIndex;
}

export async function getEmbedding(text) {
  const truncated = text.length > 8000 ? text.slice(0, 8000) : text;
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: truncated,
  });
  return response.data[0].embedding;
}

export async function searchPinecone(query, topK = 10) {
  const embedding = await getEmbedding(query);
  const index = getIndex();

  const results = await index.query({
    vector: embedding,
    topK,
    includeMetadata: true,
  });

  return results.matches.map(match => ({
    id: match.id,
    score: match.score,
    filename: match.metadata?.filename || '',
    subject: match.metadata?.subject || '',
    text: match.metadata?.text || '',
    source: match.metadata?.source || '',
  }));
}

export async function upsertVectors(vectors) {
  const index = getIndex();
  const BATCH = 100;
  for (let i = 0; i < vectors.length; i += BATCH) {
    await index.upsert(vectors.slice(i, i + BATCH));
  }
}
