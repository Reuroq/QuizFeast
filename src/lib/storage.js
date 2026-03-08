'use client';

import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'quizfeast_data';

function getData() {
  if (typeof window === 'undefined') return { sets: [], stats: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { sets: [], stats: {} };
  } catch {
    return { sets: [], stats: {} };
  }
}

function saveData(data) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Study Sets
export function getAllSets() {
  return getData().sets;
}

export function getSet(id) {
  return getData().sets.find(s => s.id === id) || null;
}

export function createSet({ title, description, cards, tags }) {
  const data = getData();
  const newSet = {
    id: uuidv4(),
    title,
    description: description || '',
    cards: cards.map((c, i) => ({
      id: uuidv4(),
      question: c.question,
      answer: c.answer,
      order: i,
      // Spaced repetition fields
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: new Date().toISOString(),
      lastReview: null,
    })),
    tags: tags || [],
    cardCount: cards.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    studyCount: 0,
    mastery: 0,
  };
  data.sets.unshift(newSet);
  saveData(data);
  return newSet;
}

export function updateSet(id, updates) {
  const data = getData();
  const idx = data.sets.findIndex(s => s.id === id);
  if (idx === -1) return null;
  data.sets[idx] = { ...data.sets[idx], ...updates, updatedAt: new Date().toISOString() };
  saveData(data);
  return data.sets[idx];
}

export function deleteSet(id) {
  const data = getData();
  data.sets = data.sets.filter(s => s.id !== id);
  saveData(data);
}

// Spaced Repetition (SM-2 Algorithm)
export function updateCardSR(setId, cardId, quality) {
  // quality: 0-5 (0=complete fail, 5=perfect)
  const data = getData();
  const set = data.sets.find(s => s.id === setId);
  if (!set) return;
  const card = set.cards.find(c => c.id === cardId);
  if (!card) return;

  if (quality >= 3) {
    // Correct response
    if (card.repetitions === 0) {
      card.interval = 1;
    } else if (card.repetitions === 1) {
      card.interval = 6;
    } else {
      card.interval = Math.round(card.interval * card.easeFactor);
    }
    card.repetitions += 1;
  } else {
    // Incorrect — reset
    card.repetitions = 0;
    card.interval = 1;
  }

  // Update ease factor
  card.easeFactor = Math.max(1.3,
    card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  card.lastReview = new Date().toISOString();
  const next = new Date();
  next.setDate(next.getDate() + card.interval);
  card.nextReview = next.toISOString();

  // Recalculate mastery
  const mastered = set.cards.filter(c => c.repetitions >= 3).length;
  set.mastery = Math.round((mastered / set.cards.length) * 100);

  saveData(data);
  return card;
}

// Get cards due for review
export function getDueCards(setId) {
  const set = getSet(setId);
  if (!set) return [];
  const now = new Date();
  return set.cards.filter(c => new Date(c.nextReview) <= now);
}

// Study stats
export function recordStudySession(setId, mode, correct, total) {
  const data = getData();
  const set = data.sets.find(s => s.id === setId);
  if (set) {
    set.studyCount = (set.studyCount || 0) + 1;
  }

  if (!data.stats.sessions) data.stats.sessions = [];
  data.stats.sessions.push({
    setId,
    mode,
    correct,
    total,
    accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    date: new Date().toISOString(),
  });

  // Keep last 500 sessions
  if (data.stats.sessions.length > 500) {
    data.stats.sessions = data.stats.sessions.slice(-500);
  }

  saveData(data);
}

export function getStats() {
  return getData().stats;
}

// Import/Export
export function exportSet(id) {
  const set = getSet(id);
  if (!set) return null;
  return JSON.stringify(set, null, 2);
}

export function importSet(jsonString) {
  try {
    const imported = JSON.parse(jsonString);
    if (!imported.title || !imported.cards) throw new Error('Invalid format');
    return createSet({
      title: imported.title,
      description: imported.description,
      cards: imported.cards.map(c => ({ question: c.question, answer: c.answer })),
      tags: imported.tags,
    });
  } catch (e) {
    throw new Error('Invalid study set format');
  }
}
