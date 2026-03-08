'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSet } from '@/lib/storage';

export default function CreatePage() {
  const router = useRouter();
  const [mode, setMode] = useState('manual'); // manual | ai | paste
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [cards, setCards] = useState([{ question: '', answer: '' }]);
  const [pasteText, setPasteText] = useState('');
  const [file, setFile] = useState(null);
  const [aiText, setAiText] = useState('');
  const [aiCount, setAiCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addCard = () => setCards([...cards, { question: '', answer: '' }]);

  const removeCard = (i) => {
    if (cards.length <= 1) return;
    setCards(cards.filter((_, idx) => idx !== i));
  };

  const updateCard = (i, field, value) => {
    const updated = [...cards];
    updated[i] = { ...updated[i], [field]: value };
    setCards(updated);
  };

  const handlePasteImport = () => {
    if (!pasteText.trim()) return;
    // Support tab-separated and newline patterns
    const lines = pasteText.trim().split('\n').filter(l => l.trim());
    const parsed = [];

    for (const line of lines) {
      // Try tab-separated first
      if (line.includes('\t')) {
        const [q, a] = line.split('\t');
        if (q?.trim() && a?.trim()) parsed.push({ question: q.trim(), answer: a.trim() });
      }
      // Try " - " separator
      else if (line.includes(' - ')) {
        const idx = line.indexOf(' - ');
        const q = line.slice(0, idx);
        const a = line.slice(idx + 3);
        if (q?.trim() && a?.trim()) parsed.push({ question: q.trim(), answer: a.trim() });
      }
      // Try ": " separator
      else if (line.includes(': ')) {
        const idx = line.indexOf(': ');
        const q = line.slice(0, idx);
        const a = line.slice(idx + 2);
        if (q?.trim() && a?.trim()) parsed.push({ question: q.trim(), answer: a.trim() });
      }
    }

    if (parsed.length > 0) {
      setCards(parsed);
      setMode('manual');
      setPasteText('');
    } else {
      setError('Could not parse any Q&A pairs. Use tab, " - ", or ": " as separator between question and answer.');
    }
  };

  const handleAIGenerate = async () => {
    setLoading(true);
    setError('');

    try {
      let text = aiText;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await fetch('/api/ai/extract', { method: 'POST', body: formData });
        if (!uploadRes.ok) throw new Error('Failed to extract text from file');
        const uploadData = await uploadRes.json();
        text = uploadData.text;
      }

      if (!text.trim()) {
        setError('Please provide text or upload a document');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, count: aiCount }),
      });

      if (!res.ok) throw new Error('AI generation failed');
      const data = await res.json();

      if (data.cards?.length > 0) {
        setCards(data.cards);
        setMode('manual');
        if (!title) setTitle(data.suggestedTitle || 'AI Generated Set');
      } else {
        setError('AI could not generate questions from this content');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!title.trim()) { setError('Please enter a title'); return; }
    const validCards = cards.filter(c => c.question.trim() && c.answer.trim());
    if (validCards.length === 0) { setError('Add at least one Q&A pair'); return; }

    const newSet = createSet({
      title: title.trim(),
      description: description.trim(),
      cards: validCards,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    });

    router.push(`/study/${newSet.id}`);
  };

  return (
    <div className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Create Study Set</h1>
      <p className="text-dark-400 mb-8">Add cards manually, paste Q&As, or let AI generate them from your content</p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-6 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Mode Tabs */}
      <div className="flex gap-1 bg-dark-800 p-1 rounded-xl mb-8 w-fit">
        {[
          { key: 'manual', label: 'Manual Entry', icon: '✏️' },
          { key: 'paste', label: 'Paste Q&As', icon: '📋' },
          { key: 'ai', label: 'AI Generate', icon: '🤖' },
        ].map(m => (
          <button
            key={m.key}
            onClick={() => { setMode(m.key); setError(''); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              mode === m.key
                ? 'bg-brand-500 text-white'
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            <span>{m.icon}</span> {m.label}
          </button>
        ))}
      </div>

      {/* Title + Description */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-sm text-dark-400 mb-1 block">Title *</label>
          <input
            className="input-field"
            placeholder="e.g., Biology Chapter 5"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-dark-400 mb-1 block">Tags (comma separated)</label>
          <input
            className="input-field"
            placeholder="e.g., biology, midterm, chapter 5"
            value={tags}
            onChange={e => setTags(e.target.value)}
          />
        </div>
      </div>
      <div className="mb-8">
        <label className="text-sm text-dark-400 mb-1 block">Description (optional)</label>
        <input
          className="input-field"
          placeholder="What's this set about?"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>

      {/* AI Generation Mode */}
      {mode === 'ai' && (
        <div className="card mb-8 animate-fade-in">
          <h3 className="text-lg font-semibold text-white mb-4">AI Question Generator</h3>
          <p className="text-sm text-dark-400 mb-4">
            Paste your notes, lecture content, or textbook text below. Or upload a DOCX/PDF file.
          </p>

          {/* File Upload */}
          <div className="mb-4">
            <label className="block">
              <div className="border-2 border-dashed border-dark-700 hover:border-brand-500/50 rounded-xl p-8 text-center cursor-pointer transition-colors">
                <div className="text-3xl mb-2">📄</div>
                <p className="text-sm text-dark-400 mb-1">
                  {file ? file.name : 'Drop a DOCX or PDF here, or click to browse'}
                </p>
                <p className="text-xs text-dark-600">Max 10MB</p>
              </div>
              <input
                type="file"
                accept=".docx,.pdf,.txt"
                className="hidden"
                onChange={e => setFile(e.target.files[0] || null)}
              />
            </label>
          </div>

          {/* Or paste text */}
          <div className="mb-4">
            <label className="text-sm text-dark-400 mb-1 block">Or paste your content</label>
            <textarea
              className="input-field h-40 text-sm"
              placeholder="Paste lecture notes, textbook content, or any study material..."
              value={aiText}
              onChange={e => setAiText(e.target.value)}
            />
          </div>

          {/* Question count */}
          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm text-dark-400">Number of questions:</label>
            <select
              className="input-field w-24"
              value={aiCount}
              onChange={e => setAiCount(parseInt(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
            </select>
          </div>

          <button
            onClick={handleAIGenerate}
            disabled={loading || (!aiText.trim() && !file)}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Generating...
              </>
            ) : (
              <>Generate Questions</>
            )}
          </button>
        </div>
      )}

      {/* Paste Mode */}
      {mode === 'paste' && (
        <div className="card mb-8 animate-fade-in">
          <h3 className="text-lg font-semibold text-white mb-4">Paste Q&As</h3>
          <p className="text-sm text-dark-400 mb-4">
            One Q&A per line. Separate question and answer with <code className="bg-dark-700 px-1 rounded">Tab</code>, <code className="bg-dark-700 px-1 rounded"> - </code>, or <code className="bg-dark-700 px-1 rounded">: </code>
          </p>
          <textarea
            className="input-field h-48 text-sm font-mono"
            placeholder={"What is the capital of France?\tParis\nWhat is 2+2? - 4\nLargest planet: Jupiter"}
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
          />
          <button onClick={handlePasteImport} className="btn-primary mt-4">
            Parse & Import
          </button>
        </div>
      )}

      {/* Manual Cards */}
      {mode === 'manual' && (
        <div className="space-y-3 mb-8">
          {cards.map((card, i) => (
            <div key={i} className="card flex gap-4 items-start py-4 animate-fade-in">
              <div className="text-dark-600 text-sm font-mono pt-3 w-8 text-center flex-shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-dark-500 mb-1 block">Question</label>
                  <textarea
                    className="input-field text-sm h-20 resize-none"
                    placeholder="Enter question..."
                    value={card.question}
                    onChange={e => updateCard(i, 'question', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-dark-500 mb-1 block">Answer</label>
                  <textarea
                    className="input-field text-sm h-20 resize-none"
                    placeholder="Enter answer..."
                    value={card.answer}
                    onChange={e => updateCard(i, 'answer', e.target.value)}
                  />
                </div>
              </div>
              <button
                onClick={() => removeCard(i)}
                className="p-2 rounded-lg hover:bg-red-500/20 text-dark-500 hover:text-red-400 transition-colors flex-shrink-0 mt-6"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          <button
            onClick={addCard}
            className="w-full border-2 border-dashed border-dark-700 hover:border-brand-500/50 rounded-xl p-4 text-dark-500 hover:text-brand-400 transition-colors text-sm font-medium"
          >
            + Add Card
          </button>
        </div>
      )}

      {/* Save */}
      <div className="flex items-center justify-between pt-6 border-t border-dark-800">
        <p className="text-sm text-dark-500">
          {cards.filter(c => c.question.trim() && c.answer.trim()).length} valid cards
        </p>
        <div className="flex gap-3">
          <button onClick={() => router.push('/dashboard')} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary">
            Save Study Set
          </button>
        </div>
      </div>
    </div>
  );
}
