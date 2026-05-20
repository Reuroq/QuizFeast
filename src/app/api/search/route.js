import { NextResponse } from 'next/server';
import { searchPinecone } from '@/lib/pinecone';
import { sanitizeDeep } from '@/lib/sanitize';

export async function POST(request) {
  try {
    const { query, topK = 10 } = await request.json();

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    const results = await searchPinecone(query.trim(), topK);
    // Strip third-party study-site mentions from every retrieved field.
    return NextResponse.json({ results: sanitizeDeep(results) });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
