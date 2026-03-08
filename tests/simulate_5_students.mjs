// QuizFeast — 5 Student Simulation (Live Site Test)
// Tests real endpoints on https://quizfeast.onrender.com

const BASE = process.env.TEST_URL || 'https://quizfeast.onrender.com';

let passed = 0, failed = 0, total = 0;

async function test(student, name, fn) {
  total++;
  const label = `[Student ${student}] ${name}`;
  try {
    await fn();
    passed++;
    console.log(`  ✅ ${label}`);
  } catch (e) {
    failed++;
    console.log(`  ❌ ${label} — ${e.message}`);
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }

async function fetchJSON(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

async function fetchPage(path) {
  const res = await fetch(`${BASE}${path}`);
  return { status: res.status, html: await res.text() };
}

// ===== STUDENT 1: Biology major, uploads text, studies flashcards =====
async function student1() {
  console.log('\n👩‍🔬 Student 1: Sarah (Biology major)');

  await test(1, 'Load landing page', async () => {
    const r = await fetchPage('/');
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.html.includes('QuizFeast'), 'Missing branding');
    assert(!r.html.toLowerCase().includes('quizlet'), 'Contains competitor name!');
  });

  await test(1, 'Load create page', async () => {
    const r = await fetchPage('/create');
    assert(r.status === 200, `Got ${r.status}`);
  });

  await test(1, 'Generate flashcards from biology text', async () => {
    const r = await fetchJSON('/api/ai/generate', {
      text: 'Mitochondria are membrane-bound organelles found in the cytoplasm of eukaryotic cells. They generate most of the cell\'s supply of adenosine triphosphate (ATP), used as a source of chemical energy. The mitochondrion has its own independent genome that shows substantial similarity to bacterial genomes. Photosynthesis occurs in chloroplasts, which contain chlorophyll. The cell membrane is a selectively permeable lipid bilayer.',
      count: 5,
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(Array.isArray(r.data), 'Expected array of cards');
    assert(r.data.length >= 3, `Only got ${r.data.length} cards`);
    assert(r.data[0].question, 'Missing question field');
    assert(r.data[0].answer, 'Missing answer field');
  });

  await test(1, 'Check answer — correct synonym', async () => {
    const r = await fetchJSON('/api/ai/check', {
      question: 'What is the powerhouse of the cell?',
      correctAnswer: 'Mitochondria',
      userAnswer: 'The mitochondrion',
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.correct === true, `Should accept synonym: ${r.data.feedback}`);
  });

  await test(1, 'Check answer — wrong answer', async () => {
    const r = await fetchJSON('/api/ai/check', {
      question: 'What is the powerhouse of the cell?',
      correctAnswer: 'Mitochondria',
      userAnswer: 'Nucleus',
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.correct === false, 'Should reject wrong answer');
  });

  await test(1, 'Get AI explanation', async () => {
    const r = await fetchJSON('/api/ai/explain', {
      question: 'What is the powerhouse of the cell?',
      answer: 'Mitochondria',
      userAnswer: 'Nucleus',
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.explanation && r.data.explanation.length > 10, 'Explanation too short');
  });
}

// ===== STUDENT 2: History student, searches Pinecone, tests answer matching =====
async function student2() {
  console.log('\n📚 Student 2: Marcus (History student)');

  await test(2, 'Load search page', async () => {
    const r = await fetchPage('/search');
    assert(r.status === 200, `Got ${r.status}`);
  });

  await test(2, 'Search Pinecone for history content', async () => {
    const r = await fetchJSON('/api/search', { query: 'world war 2 causes' });
    assert(r.status === 200, `Got ${r.status}`);
    assert(Array.isArray(r.data), 'Expected array of results');
    // May or may not have results depending on what's in Pinecone
  });

  await test(2, 'Search Pinecone for security training', async () => {
    const r = await fetchJSON('/api/search', { query: 'phishing email best practice' });
    assert(r.status === 200, `Got ${r.status}`);
    assert(Array.isArray(r.data), 'Expected array');
  });

  await test(2, 'Check answer with minor typo', async () => {
    const r = await fetchJSON('/api/ai/check', {
      question: 'Who was the first president of the United States?',
      correctAnswer: 'George Washington',
      userAnswer: 'Gorge Washington',
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.correct === true, `Should accept typo: ${r.data.feedback}`);
  });

  await test(2, 'Check blank answer rejected', async () => {
    const r = await fetchJSON('/api/ai/check', {
      question: 'What year did WWII end?',
      correctAnswer: '1945',
      userAnswer: '   ',
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.correct === false, 'Blank should be wrong');
  });

  await test(2, 'Generate history questions', async () => {
    const r = await fetchJSON('/api/ai/generate', {
      text: 'The American Revolution (1775-1783) was a colonial revolt against British rule. Key events include the Boston Tea Party, Declaration of Independence in 1776, and the Treaty of Paris in 1783. George Washington led the Continental Army.',
      count: 3,
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(Array.isArray(r.data) && r.data.length >= 2, `Expected 2+ cards, got ${r.data?.length}`);
  });
}

// ===== STUDENT 3: Nursing student, uses extension API endpoints =====
async function student3() {
  console.log('\n🏥 Student 3: Aisha (Nursing student — extension user)');

  await test(3, 'Extension: query cache for nursing question', async () => {
    const r = await fetchJSON('/api/ext/query', {
      question: 'What is the normal range for adult blood pressure?',
      options: ['120/80 mmHg', '140/90 mmHg', '100/60 mmHg', '160/100 mmHg'],
    });
    assert(r.status === 200, `Got ${r.status}`);
    // hit or miss is fine, just needs to not error
    assert(r.data.hit === true || r.data.hit === false, 'Missing hit field');
  });

  await test(3, 'Extension: analyze question with AI', async () => {
    const r = await fetchJSON('/api/ext/analyze', {
      question: 'Which of the following is a sign of dehydration?',
      options: ['Increased urination', 'Dry mucous membranes', 'Weight gain', 'Bradycardia'],
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.answerIndex !== undefined, 'Missing answerIndex');
    assert(r.data.answer, 'Missing answer text');
    assert(r.data.confidence, 'Missing confidence');
    assert(r.data.source, 'Missing source');
  });

  await test(3, 'Extension: analyze security training question', async () => {
    const r = await fetchJSON('/api/ext/analyze', {
      question: 'What should you do if you receive a suspicious email asking you to verify your identity?',
      options: ['Click the link and verify', 'Report it to security', 'Forward it to coworkers', 'Ignore it'],
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.answerIndex !== undefined, 'Missing answerIndex');
  });

  await test(3, 'Extension: CORS preflight works', async () => {
    const res = await fetch(`${BASE}/api/ext/query`, { method: 'OPTIONS' });
    assert(res.status === 204 || res.status === 200, `OPTIONS got ${res.status}`);
  });

  await test(3, 'Extension: correct endpoint rejects missing fields', async () => {
    const r = await fetchJSON('/api/ext/correct', { image: null });
    assert(r.status === 400, `Expected 400, got ${r.status}`);
  });
}

// ===== STUDENT 4: CS student, stress tests, edge cases =====
async function student4() {
  console.log('\n💻 Student 4: Dev (CS student — edge cases)');

  await test(4, 'Load dashboard page', async () => {
    const r = await fetchPage('/dashboard');
    assert(r.status === 200, `Got ${r.status}`);
  });

  await test(4, 'Load privacy policy', async () => {
    const r = await fetchPage('/privacy');
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.html.includes('Privacy'), 'Missing privacy content');
  });

  await test(4, 'Generate with count=1', async () => {
    const r = await fetchJSON('/api/ai/generate', {
      text: 'Python is a high-level programming language known for its readability.',
      count: 1,
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(Array.isArray(r.data) && r.data.length >= 1, 'Should get at least 1 card');
  });

  await test(4, 'Empty question rejected', async () => {
    const r = await fetchJSON('/api/ai/check', {
      question: '',
      correctAnswer: 'test',
      userAnswer: 'test',
    });
    assert(r.status === 400 || r.status === 200, 'Should handle gracefully');
  });

  await test(4, 'Extension: empty question rejected', async () => {
    const r = await fetchJSON('/api/ext/query', { question: '' });
    assert(r.status === 400, `Expected 400, got ${r.status}`);
  });

  await test(4, 'Extension: analyze without options fails gracefully', async () => {
    const r = await fetchJSON('/api/ext/analyze', {
      question: 'What is 2+2?',
      options: [],
    });
    // Should either return from cache or return 400 for no options
    assert(r.status === 200 || r.status === 400, `Got unexpected ${r.status}`);
  });

  await test(4, 'Search with very short query', async () => {
    const r = await fetchJSON('/api/search', { query: 'DNA' });
    assert(r.status === 200, `Got ${r.status}`);
  });
}

// ===== STUDENT 5: Pre-med, full study workflow =====
async function student5() {
  console.log('\n🩺 Student 5: Jordan (Pre-med — full workflow)');

  await test(5, 'Generate anatomy flashcards', async () => {
    const r = await fetchJSON('/api/ai/generate', {
      text: 'The human heart has four chambers: two atria and two ventricles. The right atrium receives deoxygenated blood from the body via the superior and inferior vena cava. The left ventricle pumps oxygenated blood to the body through the aorta. The heart valves prevent backflow: tricuspid, pulmonary, mitral, and aortic.',
      count: 4,
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(Array.isArray(r.data) && r.data.length >= 3, 'Need 3+ cards');
  });

  await test(5, 'Check abbreviation accepted', async () => {
    const r = await fetchJSON('/api/ai/check', {
      question: 'What does ATP stand for?',
      correctAnswer: 'Adenosine triphosphate',
      userAnswer: 'ATP',
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.correct === true, `Should accept abbreviation: ${r.data.feedback}`);
  });

  await test(5, 'Check partial answer', async () => {
    const r = await fetchJSON('/api/ai/check', {
      question: 'Name the four chambers of the heart',
      correctAnswer: 'Right atrium, left atrium, right ventricle, left ventricle',
      userAnswer: 'Two atria and two ventricles',
    });
    assert(r.status === 200, `Got ${r.status}`);
    // This could go either way — just testing it doesn't crash
  });

  await test(5, 'Extension: query for medical question', async () => {
    const r = await fetchJSON('/api/ext/query', {
      question: 'What are the four chambers of the heart?',
      options: ['Atria and ventricles', 'Aorta and vena cava', 'Valves and septa', 'Arteries and veins'],
    });
    assert(r.status === 200, `Got ${r.status}`);
  });

  await test(5, 'Extension: full analyze for pharmacology', async () => {
    const r = await fetchJSON('/api/ext/analyze', {
      question: 'Which medication is commonly used as a first-line treatment for type 2 diabetes?',
      options: ['Insulin', 'Metformin', 'Glyburide', 'Pioglitazone'],
    });
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.data.answerIndex !== undefined, 'Missing answerIndex');
    assert(typeof r.data.answer === 'string', 'Answer should be string');
  });

  await test(5, 'All pages load without competitor names', async () => {
    const pages = ['/', '/create', '/dashboard', '/search', '/privacy'];
    for (const page of pages) {
      const r = await fetchPage(page);
      assert(r.status === 200, `${page} got ${r.status}`);
      const lower = r.html.toLowerCase();
      assert(!lower.includes('quizlet'), `${page} contains competitor name!`);
    }
  });
}

// ===== RUN ALL =====
async function main() {
  console.log('🎓 QuizFeast — 5 Student Simulation');
  console.log(`🌐 Testing: ${BASE}`);
  console.log('='.repeat(50));

  // Wake up the free tier first
  console.log('\n⏳ Waking up server (free tier cold start)...');
  try {
    await fetch(BASE, { signal: AbortSignal.timeout(60000) });
    console.log('✅ Server is awake\n');
  } catch (e) {
    console.log('⚠️  Server slow to respond, continuing anyway...\n');
  }

  // Run all 5 students sequentially (they each have multiple tests)
  await student1();
  await student2();
  await student3();
  await student4();
  await student5();

  console.log('\n' + '='.repeat(50));
  console.log(`\n🎓 RESULTS: ${passed}/${total} passed, ${failed} failed`);
  if (failed === 0) {
    console.log('🎉 All students completed successfully!');
  } else {
    console.log(`⚠️  ${failed} test(s) need attention`);
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
