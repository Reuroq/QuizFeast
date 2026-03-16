import { NextResponse } from 'next/server';
import { searchPinecone } from '@/lib/pinecone';
import fs from 'fs';
import path from 'path';

// Load all CBT data at startup for fast local search
let allCBTData = null;

function loadAllCBTs() {
  if (allCBTData) return allCBTData;

  const dataDir = path.join(process.cwd(), 'public', 'data');
  allCBTData = [];

  try {
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const raw = fs.readFileSync(path.join(dataDir, file), 'utf-8');
      const data = JSON.parse(raw);
      const slug = file.replace('.json', '');
      for (let i = 0; i < data.questions.length; i++) {
        allCBTData.push({
          slug,
          category: data.category,
          index: i,
          q: data.questions[i].q,
          a: data.questions[i].a,
        });
      }
    }
  } catch (e) {
    console.error('Failed to load CBT data:', e);
  }

  return allCBTData;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const mode = searchParams.get('mode') || 'auto'; // 'auto', 'local', 'semantic'

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    // Short queries → local text match (fast, for autocomplete)
    // Long queries (pasted questions) → semantic search via Pinecone
    const isLongQuery = query.length > 40 || mode === 'semantic';
    const isLocalOnly = mode === 'local';

    // Always do local search first (it's fast)
    const allData = loadAllCBTs();
    const queryLower = query.toLowerCase();

    const localResults = [];
    for (const item of allData) {
      const qMatch = item.q.toLowerCase().includes(queryLower);
      const aMatch = item.a.toLowerCase().includes(queryLower);
      const catMatch = item.category.toLowerCase().includes(queryLower);
      if (qMatch || aMatch || catMatch) {
        localResults.push({
          ...item,
          matchType: catMatch && !qMatch ? 'category' : 'question',
          score: qMatch ? 1.0 : aMatch ? 0.8 : 0.6,
        });
      }
      if (localResults.length >= 20) break;
    }

    // Sort: exact question matches first, then category matches
    localResults.sort((a, b) => b.score - a.score);

    // If short query or local-only, return local results
    if (!isLongQuery || isLocalOnly) {
      // Also return matching categories for autocomplete
      const categories = [];
      const seen = new Set();
      for (const r of localResults) {
        if (!seen.has(r.slug)) {
          seen.add(r.slug);
          categories.push({ slug: r.slug, category: r.category });
        }
      }

      return NextResponse.json({
        results: localResults.slice(0, 10),
        categories,
        source: 'local',
      });
    }

    // Long query → also do semantic search
    let semanticResults = [];
    try {
      const pineconeResults = await searchPinecone(query, 10);
      semanticResults = pineconeResults
        .filter(r => r.score >= 0.65)
        .map(r => ({
          q: r.text,
          a: r.metadata?.answer || '',
          category: r.subject || r.filename || 'Study Materials',
          slug: null,
          index: null,
          matchType: 'semantic',
          score: r.score,
          source: r.source,
        }));
    } catch (e) {
      console.error('Semantic search failed:', e);
    }

    // Merge: local results first (exact matches), then semantic
    const merged = [...localResults.slice(0, 5), ...semanticResults.slice(0, 5)];

    // Deduplicate by question similarity
    const unique = [];
    const seenQuestions = new Set();
    for (const r of merged) {
      const key = r.q.toLowerCase().slice(0, 60);
      if (!seenQuestions.has(key)) {
        seenQuestions.add(key);
        unique.push(r);
      }
    }

    return NextResponse.json({
      results: unique.slice(0, 10),
      source: 'mixed',
    });
  } catch (error) {
    console.error('CBT search error:', error);
    return NextResponse.json({ results: [], error: error.message }, { status: 500 });
  }
}
