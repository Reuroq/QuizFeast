import { NextResponse } from 'next/server';
import { searchPinecone } from '@/lib/pinecone';

export async function POST(request) {
  try {
    const { query, topK = 10 } = await request.json();

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    const results = await searchPinecone(query.trim(), topK);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
