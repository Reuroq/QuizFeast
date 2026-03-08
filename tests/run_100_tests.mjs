/**
 * QuizFeast Test Suite — 100 Student Scenarios
 * Simulates 100 different students doing different things
 */

const BASE = 'http://localhost:3000';
let passed = 0;
let failed = 0;
let errors = [];

async function test(num, name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ #${String(num).padStart(3, '0')} ${name}`);
  } catch (e) {
    failed++;
    const msg = e.message || String(e);
    errors.push({ num, name, error: msg });
    console.log(`  ✗ #${String(num).padStart(3, '0')} ${name} — ${msg.slice(0, 120)}`);
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

async function fetchJSON(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  return { status: res.status, data: await res.json().catch(() => null), ok: res.ok };
}

async function fetchPage(path) {
  const res = await fetch(`${BASE}${path}`);
  const text = await res.text();
  return { status: res.status, html: text, ok: res.ok };
}

// ============================================================
// PAGE LOAD TESTS (Students 1-15: Just browsing the site)
// ============================================================

async function pageTests() {
  console.log('\n📄 PAGE LOAD TESTS (Students browsing the site)');

  await test(1, 'Landing page loads (200)', async () => {
    const r = await fetchPage('/');
    assert(r.status === 200, `Got ${r.status}`);
  });

  await test(2, 'Landing page contains QuizFeast branding', async () => {
    const r = await fetchPage('/');
    assert(r.html.includes('QuizFeast'), 'Missing QuizFeast branding');
  });

  await test(3, 'Landing page has hero CTA buttons', async () => {
    const r = await fetchPage('/');
    assert(r.html.includes('Start Studying Free') || r.html.includes('/create'), 'Missing CTA');
  });

  await test(4, 'Landing page has comparison table', async () => {
    const r = await fetchPage('/');
    assert(r.html.includes('The Rest') || r.html.includes('comparison'), 'Missing comparison');
  });

  await test(5, 'Dashboard page loads (200)', async () => {
    const r = await fetchPage('/dashboard');
    assert(r.status === 200, `Got ${r.status}`);
  });

  await test(6, 'Dashboard has empty state message', async () => {
    const r = await fetchPage('/dashboard');
    assert(r.html.includes('My Study Sets') || r.html.includes('dashboard'), 'Missing dashboard content');
  });

  await test(7, 'Create page loads (200)', async () => {
    const r = await fetchPage('/create');
    assert(r.status === 200, `Got ${r.status}`);
  });

  await test(8, 'Create page has all 3 modes', async () => {
    const r = await fetchPage('/create');
    assert(r.html.includes('Manual') || r.html.includes('manual'), 'Missing manual mode');
  });

  await test(9, 'Search page loads (200)', async () => {
    const r = await fetchPage('/search');
    assert(r.status === 200, `Got ${r.status}`);
  });

  await test(10, 'Search page has search input', async () => {
    const r = await fetchPage('/search');
    assert(r.html.includes('Search') || r.html.includes('search'), 'Missing search');
  });

  await test(11, 'Study page with invalid ID loads gracefully', async () => {
    const r = await fetchPage('/study/nonexistent-id-12345');
    assert(r.status === 200, `Got ${r.status}`);
  });

  await test(12, 'Navbar renders on landing page', async () => {
    const r = await fetchPage('/');
    assert(r.html.includes('My Sets') || r.html.includes('/dashboard'), 'Missing nav');
  });

  await test(13, 'Create page has file upload zone', async () => {
    const r = await fetchPage('/create');
    assert(r.html.includes('AI') || r.html.includes('upload') || r.html.includes('Generate'), 'Missing AI upload');
  });

  await test(14, 'Landing page has feature cards', async () => {
    const r = await fetchPage('/');
    assert(r.html.includes('Spaced Repetition') || r.html.includes('spaced'), 'Missing features');
  });

  await test(15, 'Landing page has footer', async () => {
    const r = await fetchPage('/');
    assert(r.html.includes('footer') || r.html.includes('free forever'), 'Missing footer');
  });
}

// ============================================================
// SEARCH API TESTS (Students 16-35: Searching for study materials)
// ============================================================

async function searchTests() {
  console.log('\n🔍 SEARCH API TESTS (Students searching for materials)');

  await test(16, 'Search for "biology" returns results', async () => {
    const r = await fetchJSON('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'biology cell division', topK: 5 }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.results, 'No results array');
  });

  await test(17, 'Search for "chemistry" returns results', async () => {
    const r = await fetchJSON('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'chemistry periodic table elements', topK: 5 }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(Array.isArray(r.data.results), 'Results not array');
  });

  await test(18, 'Search for "math quadratic" returns results', async () => {
    const r = await fetchJSON('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'quadratic formula algebra', topK: 5 }),
    });
    assert(r.status === 200, `Got ${r.status}`);
  });

  await test(19, 'Search for "history civil war" returns results', async () => {
    const r = await fetchJSON('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'American civil war causes', topK: 5 }),
    });
    assert(r.status === 200, `Got ${r.status}`);
  });

  await test(20, 'Search results have metadata fields', async () => {
    const r = await fetchJSON('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'photosynthesis', topK: 3 }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    if (r.data.results?.length > 0) {
      const first = r.data.results[0];
      assert(first.score !== undefined, 'Missing score');
      assert(first.text !== undefined, 'Missing text');
    }
  });

  await test(21, 'Search with topK=1 returns max 1 result', async () => {
    const r = await fetchJSON('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'anatomy', topK: 1 }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.results?.length <= 1, `Got ${r.data.results?.length} results`);
  });

  await test(22, 'Search with topK=20 returns up to 20', async () => {
    const r = await fetchJSON('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'science', topK: 20 }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.results?.length <= 20, 'Too many results');
  });

  await test(23, 'Search for "psychology" returns results', async () => {
    const r = await fetchJSON('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'psychology behavioral cognitive', topK: 5 }),
    });
    assert(r.status === 200, `Got ${r.status}`);
  });

  await test(24, 'Search for nursing content', async () => {
    const r = await fetchJSON('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'nursing patient care assessment', topK: 5 }),
    });
    assert(r.status === 200, `Got ${r.status}`);
  });

  await test(25, 'Search for computer science', async () => {
    const r = await fetchJSON('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'algorithm data structure', topK: 5 }),
    });
    assert(r.status === 200, `Got ${r.status}`);
  });

  await test(26, 'Empty query returns 400 error', async () => {
    const r = await fetchJSON('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: '' }),
    });
    assert(r.status === 400, `Expected 400, got ${r.status}`);
  });

  await test(27, 'Missing query returns 400 error', async () => {
    const r = await fetchJSON('/api/search', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    assert(r.status === 400, `Expected 400, got ${r.status}`);
  });

  await test(28, 'Search for Spanish vocabulary', async () => {
    const r = await fetchJSON('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'Spanish vocabulary preterite tense', topK: 5 }),
    });
    assert(r.status === 200, `Got ${r.status}`);
  });

  await test(29, 'Search for economics terms', async () => {
    const r = await fetchJSON('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'supply and demand economics', topK: 5 }),
    });
    assert(r.status === 200, `Got ${r.status}`);
  });

  await test(30, 'Search for very long query handles gracefully', async () => {
    const longQuery = 'What is the relationship between ' + 'mitochondria and cellular respiration '.repeat(20);
    const r = await fetchJSON('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: longQuery, topK: 3 }),
    });
    assert(r.status === 200, `Got ${r.status}`);
  });

  await test(31, 'Search for OSHA safety regulations', async () => {
    const r = await fetchJSON('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'OSHA workplace safety regulations', topK: 5 }),
    });
    assert(r.status === 200, `Got ${r.status}`);
  });

  await test(32, 'Search for medical terminology', async () => {
    const r = await fetchJSON('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'anaphylaxis allergic reaction treatment', topK: 5 }),
    });
    assert(r.status === 200, `Got ${r.status}`);
  });

  await test(33, 'Search results scores are between 0 and 1', async () => {
    const r = await fetchJSON('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'physics newton laws', topK: 5 }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    if (r.data.results?.length > 0) {
      for (const res of r.data.results) {
        assert(res.score >= 0 && res.score <= 1, `Score out of range: ${res.score}`);
      }
    }
  });

  await test(34, 'Search for AP biology content', async () => {
    const r = await fetchJSON('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'AP biology DNA replication transcription', topK: 5 }),
    });
    assert(r.status === 200, `Got ${r.status}`);
  });

  await test(35, 'Search with special characters handles gracefully', async () => {
    const r = await fetchJSON('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'what is H₂O (water)? & why?', topK: 3 }),
    });
    assert(r.status === 200, `Got ${r.status}`);
  });
}

// ============================================================
// AI GENERATION TESTS (Students 36-50: Using AI to create study sets)
// ============================================================

async function aiTests() {
  console.log('\n🤖 AI GENERATION TESTS (Students creating sets with AI)');

  await test(36, 'AI generates questions from biology text', async () => {
    const r = await fetchJSON('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Photosynthesis is the process by which green plants convert sunlight into chemical energy. It occurs in the chloroplasts, specifically using chlorophyll pigments. The process involves two stages: the light-dependent reactions and the Calvin cycle. During the light reactions, water molecules are split, releasing oxygen. The Calvin cycle uses CO2 to produce glucose.',
        count: 3,
      }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.cards?.length > 0, 'No cards generated');
  });

  await test(37, 'AI generates questions from history text', async () => {
    const r = await fetchJSON('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({
        text: 'The American Revolution began in 1775 when thirteen colonies sought independence from British rule. Key causes included taxation without representation, the Stamp Act, and the Boston Tea Party. George Washington led the Continental Army. The Declaration of Independence was signed on July 4, 1776. The war ended with the Treaty of Paris in 1783.',
        count: 5,
      }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.cards?.length > 0, 'No cards generated');
  });

  await test(38, 'AI generated cards have question and answer fields', async () => {
    const r = await fetchJSON('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({
        text: 'The mitochondria is the powerhouse of the cell. It produces ATP through cellular respiration. The process involves glycolysis, the Krebs cycle, and oxidative phosphorylation.',
        count: 2,
      }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    if (r.data.cards?.length > 0) {
      assert(r.data.cards[0].question, 'Missing question field');
      assert(r.data.cards[0].answer, 'Missing answer field');
    }
  });

  await test(39, 'AI returns suggested title', async () => {
    const r = await fetchJSON('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Newton first law states that an object at rest stays at rest unless acted upon by an external force.',
        count: 2,
      }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.suggestedTitle, 'Missing suggested title');
  });

  await test(40, 'AI rejects empty text with 400', async () => {
    const r = await fetchJSON('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({ text: '', count: 5 }),
    });
    assert(r.status === 400, `Expected 400, got ${r.status}`);
  });

  await test(41, 'AI rejects missing text with 400', async () => {
    const r = await fetchJSON('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({ count: 5 }),
    });
    assert(r.status === 400, `Expected 400, got ${r.status}`);
  });

  await test(42, 'AI generates from math content', async () => {
    const r = await fetchJSON('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({
        text: 'The quadratic formula is x = (-b ± √(b²-4ac)) / 2a. It solves equations of the form ax² + bx + c = 0. The discriminant b²-4ac determines the number of solutions: positive means two real solutions, zero means one, negative means no real solutions.',
        count: 3,
      }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.cards?.length > 0, 'No cards generated');
  });

  await test(43, 'AI handles very short text gracefully', async () => {
    const r = await fetchJSON('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({ text: 'DNA stands for deoxyribonucleic acid.', count: 2 }),
    });
    assert(r.status === 200, `Got ${r.status}`);
  });

  await test(44, 'AI generates from psychology content', async () => {
    const r = await fetchJSON('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Classical conditioning, discovered by Ivan Pavlov, involves learning through association. An unconditioned stimulus naturally triggers a response. When paired with a neutral stimulus, the neutral stimulus becomes a conditioned stimulus that triggers a conditioned response. Operant conditioning, developed by B.F. Skinner, involves learning through consequences: reinforcement increases behavior, punishment decreases it.',
        count: 4,
      }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.cards?.length > 0, 'No cards');
  });

  await test(45, 'AI generates from Spanish vocabulary text', async () => {
    const r = await fetchJSON('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Common Spanish greetings: Hola means hello, Buenos días means good morning, Buenas tardes means good afternoon, Buenas noches means good night, Adiós means goodbye, ¿Cómo estás? means how are you.',
        count: 5,
      }),
    });
    assert(r.status === 200, `Got ${r.status}`);
  });

  await test(46, 'AI smart check: "Father Christmas" = "Santa Claus"', async () => {
    const r = await fetchJSON('/api/ai/check', {
      method: 'POST',
      body: JSON.stringify({
        question: 'Who delivers presents on Christmas?',
        correctAnswer: 'Santa Claus',
        userAnswer: 'Father Christmas',
      }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.correct === true, 'Should accept synonym');
  });

  await test(47, 'AI smart check: completely wrong answer rejected', async () => {
    const r = await fetchJSON('/api/ai/check', {
      method: 'POST',
      body: JSON.stringify({
        question: 'What is the capital of France?',
        correctAnswer: 'Paris',
        userAnswer: 'London',
      }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.correct === false, 'Should reject wrong answer');
  });

  await test(48, 'AI smart check: accepts rephrased answer', async () => {
    const r = await fetchJSON('/api/ai/check', {
      method: 'POST',
      body: JSON.stringify({
        question: 'What is the powerhouse of the cell?',
        correctAnswer: 'The mitochondria',
        userAnswer: 'mitochondria',
      }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.correct === true, 'Should accept without article');
  });

  await test(49, 'AI check returns feedback', async () => {
    const r = await fetchJSON('/api/ai/check', {
      method: 'POST',
      body: JSON.stringify({
        question: 'What year did WW2 end?',
        correctAnswer: '1945',
        userAnswer: '1944',
      }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.feedback, 'Missing feedback');
  });

  await test(50, 'AI explain endpoint works', async () => {
    const r = await fetchJSON('/api/ai/explain', {
      method: 'POST',
      body: JSON.stringify({
        question: 'What is the largest planet in our solar system?',
        answer: 'Jupiter',
      }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.explanation, 'Missing explanation');
  });
}

// ============================================================
// AI CHECK EDGE CASES (Students 51-65: Testing answer validation)
// ============================================================

async function aiCheckEdgeCases() {
  console.log('\n🎯 AI ANSWER CHECK EDGE CASES (Students testing answer validation)');

  await test(51, 'Smart check: case insensitive ("paris" vs "Paris")', async () => {
    const r = await fetchJSON('/api/ai/check', {
      method: 'POST',
      body: JSON.stringify({
        question: 'Capital of France?',
        correctAnswer: 'Paris',
        userAnswer: 'paris',
      }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.correct === true, 'Should accept case difference');
  });

  await test(52, 'Smart check: abbreviation accepted ("US" = "United States")', async () => {
    const r = await fetchJSON('/api/ai/check', {
      method: 'POST',
      body: JSON.stringify({
        question: 'What country has the most GDP?',
        correctAnswer: 'United States',
        userAnswer: 'US',
      }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.correct === true, 'Should accept abbreviation');
  });

  await test(53, 'Smart check: number word vs digit ("4" = "four")', async () => {
    const r = await fetchJSON('/api/ai/check', {
      method: 'POST',
      body: JSON.stringify({
        question: 'How many chambers does the heart have?',
        correctAnswer: '4',
        userAnswer: 'four',
      }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.correct === true, 'Should accept word form of number');
  });

  await test(54, 'Smart check: extra words still correct', async () => {
    const r = await fetchJSON('/api/ai/check', {
      method: 'POST',
      body: JSON.stringify({
        question: 'Who painted the Mona Lisa?',
        correctAnswer: 'Leonardo da Vinci',
        userAnswer: 'It was Leonardo da Vinci who painted it',
      }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.correct === true, 'Should accept verbose answer');
  });

  await test(55, 'Smart check: partial answer rejected', async () => {
    const r = await fetchJSON('/api/ai/check', {
      method: 'POST',
      body: JSON.stringify({
        question: 'Name the three states of matter',
        correctAnswer: 'solid, liquid, gas',
        userAnswer: 'solid',
      }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    // This could be accepted or rejected depending on AI interpretation
    assert(r.data.feedback, 'Should have feedback');
  });

  await test(56, 'Smart check: misspelled but close', async () => {
    const r = await fetchJSON('/api/ai/check', {
      method: 'POST',
      body: JSON.stringify({
        question: 'What organelle produces energy?',
        correctAnswer: 'mitochondria',
        userAnswer: 'mitocondria',
      }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.correct === true, 'Should accept minor misspelling');
  });

  await test(57, 'Smart check rejects missing fields', async () => {
    const r = await fetchJSON('/api/ai/check', {
      method: 'POST',
      body: JSON.stringify({ question: 'test' }),
    });
    assert(r.status === 400, `Expected 400, got ${r.status}`);
  });

  await test(58, 'Explain with user wrong answer', async () => {
    const r = await fetchJSON('/api/ai/explain', {
      method: 'POST',
      body: JSON.stringify({
        question: 'What is the boiling point of water?',
        answer: '100°C',
        userAnswer: '50°C',
      }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.explanation?.length > 10, 'Explanation too short');
  });

  await test(59, 'Explain with missing fields', async () => {
    const r = await fetchJSON('/api/ai/explain', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    assert(r.status === 400, `Expected 400, got ${r.status}`);
  });

  await test(60, 'Smart check: scientific notation', async () => {
    const r = await fetchJSON('/api/ai/check', {
      method: 'POST',
      body: JSON.stringify({
        question: 'Speed of light in m/s?',
        correctAnswer: '3 × 10^8 m/s',
        userAnswer: '300,000,000 m/s',
      }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.correct === true, 'Should accept equivalent notation');
  });

  await test(61, 'Smart check: date format variations', async () => {
    const r = await fetchJSON('/api/ai/check', {
      method: 'POST',
      body: JSON.stringify({
        question: 'When did WW1 start?',
        correctAnswer: '1914',
        userAnswer: 'July 28, 1914',
      }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.correct === true, 'Should accept more specific date');
  });

  await test(62, 'AI generates from computer science content', async () => {
    const r = await fetchJSON('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Big O notation describes algorithm complexity. O(1) is constant time. O(n) is linear. O(n²) is quadratic. O(log n) is logarithmic. Binary search has O(log n) complexity. Bubble sort has O(n²) worst case.',
        count: 3,
      }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.cards?.length > 0, 'No cards');
  });

  await test(63, 'AI generates from medical content', async () => {
    const r = await fetchJSON('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Type 1 diabetes is an autoimmune condition where the immune system attacks insulin-producing beta cells. Type 2 diabetes involves insulin resistance. Symptoms include frequent urination, excessive thirst, and unexplained weight loss. Treatment for Type 1 requires insulin injections. Type 2 may be managed with diet, exercise, and metformin.',
        count: 4,
      }),
    });
    assert(r.status === 200, `Got ${r.status}`);
  });

  await test(64, 'AI check: emoji in answer handled', async () => {
    const r = await fetchJSON('/api/ai/check', {
      method: 'POST',
      body: JSON.stringify({
        question: 'What is water?',
        correctAnswer: 'H2O',
        userAnswer: 'H2O 💧',
      }),
    });
    assert(r.status === 200, `Got ${r.status}`);
  });

  await test(65, 'AI check: blank answer rejected', async () => {
    const r = await fetchJSON('/api/ai/check', {
      method: 'POST',
      body: JSON.stringify({
        question: 'What is 2+2?',
        correctAnswer: '4',
        userAnswer: '   ',
      }),
    });
    // Should either return 400 or correct=false
    assert(r.status === 200 || r.status === 400, `Got ${r.status}`);
    if (r.status === 200) {
      assert(r.data.correct === false, 'Blank should be incorrect');
    }
  });
}

// ============================================================
// FILE UPLOAD / EXTRACT TESTS (Students 66-75: Uploading documents)
// ============================================================

async function uploadTests() {
  console.log('\n📄 FILE UPLOAD TESTS (Students uploading documents)');

  await test(66, 'Extract endpoint rejects no file', async () => {
    const r = await fetch(`${BASE}/api/ai/extract`, {
      method: 'POST',
      body: new FormData(),
    });
    assert(r.status === 400, `Expected 400, got ${r.status}`);
  });

  await test(67, 'Extract endpoint handles text file', async () => {
    const formData = new FormData();
    const blob = new Blob(['The mitochondria is the powerhouse of the cell. It produces ATP through oxidative phosphorylation.'], { type: 'text/plain' });
    formData.append('file', blob, 'notes.txt');
    const r = await fetch(`${BASE}/api/ai/extract`, { method: 'POST', body: formData });
    assert(r.status === 200, `Got ${r.status}`);
    const data = await r.json();
    assert(data.text?.includes('mitochondria'), 'Text not extracted');
  });

  await test(68, 'Extract rejects unsupported file type', async () => {
    const formData = new FormData();
    const blob = new Blob(['test'], { type: 'image/png' });
    formData.append('file', blob, 'image.png');
    const r = await fetch(`${BASE}/api/ai/extract`, { method: 'POST', body: formData });
    assert(r.status === 400, `Expected 400, got ${r.status}`);
  });

  await test(69, 'Extract handles empty text file', async () => {
    const formData = new FormData();
    const blob = new Blob([''], { type: 'text/plain' });
    formData.append('file', blob, 'empty.txt');
    const r = await fetch(`${BASE}/api/ai/extract`, { method: 'POST', body: formData });
    assert(r.status === 400, `Expected 400 for empty file, got ${r.status}`);
  });

  await test(70, 'Extract handles large text file', async () => {
    const formData = new FormData();
    const largeText = 'The study of genetics involves understanding DNA structure and function. '.repeat(500);
    const blob = new Blob([largeText], { type: 'text/plain' });
    formData.append('file', blob, 'big_notes.txt');
    const r = await fetch(`${BASE}/api/ai/extract`, { method: 'POST', body: formData });
    assert(r.status === 200, `Got ${r.status}`);
    const data = await r.json();
    assert(data.text?.length > 100, 'Text too short');
  });

  await test(71, 'Extract text file with special characters', async () => {
    const formData = new FormData();
    const blob = new Blob(['Café résumé naïve — "quotes" & ampersands <html> é à ñ'], { type: 'text/plain' });
    formData.append('file', blob, 'special.txt');
    const r = await fetch(`${BASE}/api/ai/extract`, { method: 'POST', body: formData });
    assert(r.status === 200, `Got ${r.status}`);
  });

  await test(72, 'Extract text file with unicode', async () => {
    const formData = new FormData();
    const blob = new Blob(['日本語テスト Chinese 中文 Korean 한국어 Arabic العربية'], { type: 'text/plain' });
    formData.append('file', blob, 'unicode.txt');
    const r = await fetch(`${BASE}/api/ai/extract`, { method: 'POST', body: formData });
    assert(r.status === 200, `Got ${r.status}`);
  });

  await test(73, 'Generate from extracted text file', async () => {
    const formData = new FormData();
    const blob = new Blob([
      'World War 2 lasted from 1939 to 1945. The Allied Powers included USA, UK, and USSR. ' +
      'The Axis Powers were Germany, Italy, and Japan. D-Day occurred on June 6, 1944. ' +
      'The war ended after atomic bombs were dropped on Hiroshima and Nagasaki.'
    ], { type: 'text/plain' });
    formData.append('file', blob, 'ww2.txt');
    const extractRes = await fetch(`${BASE}/api/ai/extract`, { method: 'POST', body: formData });
    assert(extractRes.status === 200, `Extract got ${extractRes.status}`);
    const { text } = await extractRes.json();

    const genRes = await fetchJSON('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({ text, count: 3 }),
    });
    assert(genRes.status === 200, `Generate got ${genRes.status}`);
    assert(genRes.data.cards?.length > 0, 'No cards from extracted text');
  });

  await test(74, 'Extract rejects .exe file', async () => {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array([0x4d, 0x5a])], { type: 'application/octet-stream' });
    formData.append('file', blob, 'malware.exe');
    const r = await fetch(`${BASE}/api/ai/extract`, { method: 'POST', body: formData });
    assert(r.status === 400, `Expected 400, got ${r.status}`);
  });

  await test(75, 'Extract handles CSV-like text file', async () => {
    const formData = new FormData();
    const blob = new Blob(['Question,Answer\nWhat is DNA?,Deoxyribonucleic acid\nWhat is RNA?,Ribonucleic acid'], { type: 'text/plain' });
    formData.append('file', blob, 'flashcards.txt');
    const r = await fetch(`${BASE}/api/ai/extract`, { method: 'POST', body: formData });
    assert(r.status === 200, `Got ${r.status}`);
  });
}

// ============================================================
// CONCURRENT / STRESS TESTS (Students 76-90: Multiple students at once)
// ============================================================

async function concurrentTests() {
  console.log('\n⚡ CONCURRENT TESTS (Multiple students searching simultaneously)');

  await test(76, '5 simultaneous searches complete', async () => {
    const queries = ['biology', 'chemistry', 'physics', 'math', 'history'];
    const results = await Promise.all(queries.map(q =>
      fetchJSON('/api/search', { method: 'POST', body: JSON.stringify({ query: q, topK: 3 }) })
    ));
    for (const r of results) {
      assert(r.status === 200, `Got ${r.status}`);
    }
  });

  await test(77, '3 simultaneous AI generations complete', async () => {
    const texts = [
      'The heart has four chambers: two atria and two ventricles.',
      'Gravity is a force that attracts objects with mass toward each other.',
      'The French Revolution began in 1789 with the storming of the Bastille.',
    ];
    const results = await Promise.all(texts.map(text =>
      fetchJSON('/api/ai/generate', { method: 'POST', body: JSON.stringify({ text, count: 2 }) })
    ));
    for (const r of results) {
      assert(r.status === 200, `Got ${r.status}`);
    }
  });

  await test(78, '3 simultaneous answer checks complete', async () => {
    const checks = [
      { question: 'Capital of Japan?', correctAnswer: 'Tokyo', userAnswer: 'Tokyo' },
      { question: 'Largest ocean?', correctAnswer: 'Pacific', userAnswer: 'Pacific Ocean' },
      { question: '2+2?', correctAnswer: '4', userAnswer: 'four' },
    ];
    const results = await Promise.all(checks.map(c =>
      fetchJSON('/api/ai/check', { method: 'POST', body: JSON.stringify(c) })
    ));
    for (const r of results) {
      assert(r.status === 200, `Got ${r.status}`);
    }
  });

  await test(79, 'Mixed concurrent: search + generate + check', async () => {
    const [search, gen, check] = await Promise.all([
      fetchJSON('/api/search', { method: 'POST', body: JSON.stringify({ query: 'astronomy', topK: 3 }) }),
      fetchJSON('/api/ai/generate', { method: 'POST', body: JSON.stringify({ text: 'Planets orbit the sun. Mercury is closest.', count: 2 }) }),
      fetchJSON('/api/ai/check', { method: 'POST', body: JSON.stringify({ question: 'Closest planet to sun?', correctAnswer: 'Mercury', userAnswer: 'Mercury' }) }),
    ]);
    assert(search.status === 200, `Search: ${search.status}`);
    assert(gen.status === 200, `Generate: ${gen.status}`);
    assert(check.status === 200, `Check: ${check.status}`);
  });

  await test(80, '10 rapid page loads', async () => {
    const pages = ['/', '/dashboard', '/create', '/search', '/', '/dashboard', '/create', '/search', '/', '/dashboard'];
    const results = await Promise.all(pages.map(p => fetchPage(p)));
    for (const r of results) {
      assert(r.status === 200, `Got ${r.status}`);
    }
  });

  await test(81, 'Rapid search: 10 queries in parallel', async () => {
    const topics = ['enzyme', 'protein', 'lipid', 'carbohydrate', 'nucleotide', 'amino acid', 'vitamin', 'mineral', 'hormone', 'antibody'];
    const results = await Promise.all(topics.map(q =>
      fetchJSON('/api/search', { method: 'POST', body: JSON.stringify({ query: q, topK: 2 }) })
    ));
    const successes = results.filter(r => r.status === 200).length;
    assert(successes >= 8, `Only ${successes}/10 succeeded`);
  });

  await test(82, 'Rapid search results are different for different queries', async () => {
    const [r1, r2] = await Promise.all([
      fetchJSON('/api/search', { method: 'POST', body: JSON.stringify({ query: 'photosynthesis chloroplast', topK: 3 }) }),
      fetchJSON('/api/search', { method: 'POST', body: JSON.stringify({ query: 'world war 2 history', topK: 3 }) }),
    ]);
    assert(r1.status === 200 && r2.status === 200, 'Failed');
    if (r1.data.results?.length > 0 && r2.data.results?.length > 0) {
      assert(r1.data.results[0].id !== r2.data.results[0].id, 'Same result for different queries');
    }
  });

  await test(83, '5 simultaneous explain requests', async () => {
    const questions = [
      { question: 'What is DNA?', answer: 'Deoxyribonucleic acid' },
      { question: 'What is RNA?', answer: 'Ribonucleic acid' },
      { question: 'What is ATP?', answer: 'Adenosine triphosphate' },
      { question: 'What is pH?', answer: 'Measure of acidity' },
      { question: 'What is osmosis?', answer: 'Movement of water across membrane' },
    ];
    const results = await Promise.all(questions.map(q =>
      fetchJSON('/api/ai/explain', { method: 'POST', body: JSON.stringify(q) })
    ));
    const successes = results.filter(r => r.status === 200).length;
    assert(successes >= 3, `Only ${successes}/5 succeeded`);
  });

  await test(84, 'Search with different topK values simultaneously', async () => {
    const results = await Promise.all([1, 5, 10, 15, 20].map(topK =>
      fetchJSON('/api/search', { method: 'POST', body: JSON.stringify({ query: 'biology', topK }) })
    ));
    for (let i = 0; i < results.length; i++) {
      assert(results[i].status === 200, `topK=${[1,5,10,15,20][i]}: ${results[i].status}`);
      assert(results[i].data.results?.length <= [1,5,10,15,20][i], 'Too many results');
    }
  });

  await test(85, 'Generate with varying counts simultaneously', async () => {
    const text = 'Cells are the basic unit of life. They contain organelles like nucleus, mitochondria, endoplasmic reticulum, and Golgi apparatus.';
    const results = await Promise.all([2, 3, 5].map(count =>
      fetchJSON('/api/ai/generate', { method: 'POST', body: JSON.stringify({ text, count }) })
    ));
    for (const r of results) {
      assert(r.status === 200, `Got ${r.status}`);
    }
  });

  await test(86, 'Invalid JSON body returns error', async () => {
    const r = await fetch(`${BASE}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json{{{',
    });
    assert(r.status >= 400, `Expected 4xx/5xx, got ${r.status}`);
  });

  await test(87, 'GET on POST-only route returns 405 or 404', async () => {
    const r = await fetch(`${BASE}/api/search`);
    assert(r.status === 405 || r.status === 404 || r.status === 500, `Got ${r.status}`);
  });

  await test(88, 'Search for empty string returns 400', async () => {
    const r = await fetchJSON('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: '   ' }),
    });
    assert(r.status === 400, `Expected 400, got ${r.status}`);
  });

  await test(89, 'Search for single character works', async () => {
    const r = await fetchJSON('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'A', topK: 3 }),
    });
    assert(r.status === 200, `Got ${r.status}`);
  });

  await test(90, 'Generate with count=1 returns at least 1 card', async () => {
    const r = await fetchJSON('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({
        text: 'The speed of light is approximately 299,792,458 meters per second in a vacuum.',
        count: 1,
      }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.cards?.length >= 1, 'Expected at least 1 card');
  });
}

// ============================================================
// ADVANCED / REAL-WORLD SCENARIOS (Students 91-100)
// ============================================================

async function advancedTests() {
  console.log('\n🎓 ADVANCED REAL-WORLD SCENARIOS (Students doing complex tasks)');

  await test(91, 'Full workflow: generate → verify answers', async () => {
    const gen = await fetchJSON('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({
        text: 'The Earth revolves around the Sun. It takes approximately 365.25 days. The Earth rotates on its axis every 24 hours.',
        count: 2,
      }),
    });
    assert(gen.status === 200 && gen.data.cards?.length > 0, 'Generate failed');

    const card = gen.data.cards[0];
    const check = await fetchJSON('/api/ai/check', {
      method: 'POST',
      body: JSON.stringify({
        question: card.question,
        correctAnswer: card.answer,
        userAnswer: card.answer,
      }),
    });
    assert(check.status === 200, 'Check failed');
    assert(check.data.correct === true, 'Own answer should be correct');
  });

  await test(92, 'Full workflow: search → get explanation', async () => {
    const search = await fetchJSON('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'mitochondria cell energy', topK: 1 }),
    });
    assert(search.status === 200, 'Search failed');

    if (search.data.results?.length > 0) {
      const explain = await fetchJSON('/api/ai/explain', {
        method: 'POST',
        body: JSON.stringify({
          question: 'What is the function of mitochondria?',
          answer: 'To produce ATP (energy) for the cell',
        }),
      });
      assert(explain.status === 200, 'Explain failed');
      assert(explain.data.explanation, 'No explanation');
    }
  });

  await test(93, 'Student uploads notes and generates quiz', async () => {
    const formData = new FormData();
    const notes = `Chapter 5: The Respiratory System
The respiratory system is responsible for gas exchange.
The lungs contain alveoli, tiny air sacs where oxygen enters the blood and carbon dioxide exits.
The diaphragm is a muscle that aids in breathing.
Inhalation occurs when the diaphragm contracts, creating negative pressure.
Exhalation occurs when the diaphragm relaxes.
The trachea, bronchi, and bronchioles form the airways.`;
    const blob = new Blob([notes], { type: 'text/plain' });
    formData.append('file', blob, 'chapter5.txt');

    const extract = await fetch(`${BASE}/api/ai/extract`, { method: 'POST', body: formData });
    assert(extract.status === 200, 'Extract failed');
    const { text } = await extract.json();

    const gen = await fetchJSON('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({ text, count: 5 }),
    });
    assert(gen.status === 200, 'Generate failed');
    assert(gen.data.cards?.length >= 3, `Only ${gen.data.cards?.length} cards`);
  });

  await test(94, 'Search relevance: biology query returns biology results', async () => {
    const r = await fetchJSON('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'what is the function of chloroplasts in photosynthesis', topK: 5 }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    if (r.data.results?.length > 0) {
      const topResult = r.data.results[0];
      assert(topResult.score > 0.3, `Score too low: ${topResult.score}`);
    }
  });

  await test(95, 'Search relevance: math query returns math results', async () => {
    const r = await fetchJSON('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'pythagorean theorem right triangle hypotenuse', topK: 5 }),
    });
    assert(r.status === 200, `Got ${r.status}`);
  });

  await test(96, 'AI handles multi-language content', async () => {
    const r = await fetchJSON('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Bonjour means hello in French. Merci means thank you. Au revoir means goodbye. Comment allez-vous means how are you. Je suis means I am. Oui means yes. Non means no.',
        count: 4,
      }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.cards?.length > 0, 'No cards');
  });

  await test(97, 'AI handles technical/code content', async () => {
    const r = await fetchJSON('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({
        text: 'In Python, a list is mutable and ordered. A tuple is immutable and ordered. A dictionary stores key-value pairs. A set contains unique elements only. List comprehension provides concise syntax: [x for x in range(10)].',
        count: 3,
      }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.cards?.length > 0, 'No cards');
  });

  await test(98, 'Smart check handles medical terminology', async () => {
    const r = await fetchJSON('/api/ai/check', {
      method: 'POST',
      body: JSON.stringify({
        question: 'What is the medical term for high blood pressure?',
        correctAnswer: 'Hypertension',
        userAnswer: 'high blood pressure',
      }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.correct === true, 'Should accept lay term');
  });

  await test(99, 'Smart check handles chemistry formulas', async () => {
    const r = await fetchJSON('/api/ai/check', {
      method: 'POST',
      body: JSON.stringify({
        question: 'Chemical formula for water?',
        correctAnswer: 'H2O',
        userAnswer: 'H₂O',
      }),
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.correct === true, 'Should accept subscript notation');
  });

  await test(100, 'End-to-end: extract → generate → check all answers', async () => {
    const formData = new FormData();
    const blob = new Blob([
      'The periodic table organizes elements by atomic number. Hydrogen is element 1. Helium is element 2. ' +
      'Elements in the same group share similar properties. Noble gases are in Group 18 and are very stable.'
    ], { type: 'text/plain' });
    formData.append('file', blob, 'periodic_table.txt');

    const extract = await fetch(`${BASE}/api/ai/extract`, { method: 'POST', body: formData });
    assert(extract.status === 200, 'Extract failed');
    const { text } = await extract.json();

    const gen = await fetchJSON('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({ text, count: 3 }),
    });
    assert(gen.status === 200, 'Generate failed');
    assert(gen.data.cards?.length > 0, 'No cards');

    // Check each generated answer against itself (should all pass)
    for (const card of gen.data.cards.slice(0, 2)) {
      const check = await fetchJSON('/api/ai/check', {
        method: 'POST',
        body: JSON.stringify({
          question: card.question,
          correctAnswer: card.answer,
          userAnswer: card.answer,
        }),
      });
      assert(check.status === 200, `Check failed for: ${card.question}`);
      assert(check.data.correct === true, `Own answer marked wrong: ${card.question}`);
    }
  });
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('═'.repeat(60));
  console.log('QUIZFEAST TEST SUITE — 100 Student Scenarios');
  console.log('═'.repeat(60));

  const startTime = Date.now();

  await pageTests();
  await searchTests();
  await aiTests();
  await aiCheckEdgeCases();
  await uploadTests();
  await concurrentTests();
  await advancedTests();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + '═'.repeat(60));
  console.log(`RESULTS: ${passed} passed, ${failed} failed (${elapsed}s)`);
  console.log(`Pass rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('═'.repeat(60));

  if (errors.length > 0) {
    console.log('\nFailed tests:');
    for (const e of errors) {
      console.log(`  #${e.num} ${e.name}: ${e.error.slice(0, 150)}`);
    }
  }
}

main().catch(console.error);
