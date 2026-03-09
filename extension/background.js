// QuizFeast Extension - Background Service Worker
// All API calls go through the QuizFeast backend (no keys in extension)

const DEFAULT_SERVER = 'https://quizfeast.onrender.com';

// Security training knowledge base (local fallback - no API needed)
const SECURITY_KB = {
  patterns: [
    { keywords: ['phishing', 'suspicious email', 'click link', 'verify identity'], answer: 'report', altAnswer: 'delete' },
    { keywords: ['unknown sender', 'unexpected attachment'], answer: 'not open', altAnswer: 'report' },
    { keywords: ['password', 'strong password', 'best practice'], answer: 'complex', altAnswer: 'unique' },
    { keywords: ['share password', 'give password'], answer: 'never', altAnswer: 'no' },
    { keywords: ['password manager'], answer: 'use', altAnswer: 'recommended' },
    { keywords: ['pii', 'personally identifiable', 'sensitive data'], answer: 'protect', altAnswer: 'encrypt' },
    { keywords: ['tailgating', 'piggybacking'], answer: 'stop', altAnswer: 'report' },
    { keywords: ['badge', 'access card', 'credential'], answer: 'visible', altAnswer: 'report lost' },
    { keywords: ['clean desk', 'leave desk'], answer: 'lock', altAnswer: 'secure' },
    { keywords: ['social engineering', 'pretexting'], answer: 'verify', altAnswer: 'report' },
    { keywords: ['malware', 'virus', 'infected'], answer: 'disconnect', altAnswer: 'report' },
    { keywords: ['usb', 'removable media', 'thumb drive'], answer: 'scan', altAnswer: 'approved' },
    { keywords: ['public wifi', 'public network'], answer: 'vpn', altAnswer: 'avoid' },
    { keywords: ['insider threat', 'insider risk'], answer: 'report', altAnswer: 'indicators' },
    { keywords: ['spillage', 'data spill'], answer: 'report', altAnswer: 'notify' },
    { keywords: ['foreign travel', 'travel abroad'], answer: 'report', altAnswer: 'brief' },
    { keywords: ['opsec', 'operational security'], answer: 'protect', altAnswer: 'critical' },
    { keywords: ['security incident', 'report incident'], answer: 'immediately', altAnswer: 'security office' },
    { keywords: ['two-factor', '2fa', 'mfa', 'multi-factor'], answer: 'enable', altAnswer: 'use' },
    { keywords: ['software update', 'patch'], answer: 'install', altAnswer: 'apply' },
    { keywords: ['foreign contact', 'foreign national'], answer: 'report', altAnswer: 'notify' },
  ]
};

// Get server URL from settings
async function getServerUrl() {
  const settings = await chrome.storage.local.get(['serverUrl']);
  return settings.serverUrl || DEFAULT_SERVER;
}

// ===== API CALLS THROUGH QUIZFEAST BACKEND =====

async function queryCache(question, options) {
  const server = await getServerUrl();
  try {
    const response = await fetch(`${server}/api/ext/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, options }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.hit ? data : null;
  } catch (error) {
    console.log('[QuizFeast] Cache query failed:', error.message);
    return null;
  }
}

async function analyzeWithBackend(question, options) {
  const server = await getServerUrl();
  const response = await fetch(`${server}/api/ext/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, options }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server error ${response.status}`);
  }
  return await response.json();
}

async function analyzeScreenshotWithBackend(imageDataUrl) {
  const server = await getServerUrl();
  const response = await fetch(`${server}/api/ext/screenshot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageDataUrl }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server error ${response.status}`);
  }
  return await response.json();
}

async function correctAnswerWithBackend(imageDataUrl, originalQuestion, wrongAnswer) {
  const server = await getServerUrl();
  const response = await fetch(`${server}/api/ext/correct`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: imageDataUrl,
      originalQuestion,
      wrongAnswer,
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server error ${response.status}`);
  }
  return await response.json();
}

// ===== KNOWLEDGE BASE FALLBACK (local, no API needed) =====

function analyzeWithKB(question, options) {
  const questionLower = question.toLowerCase();
  const optionsLower = options.map(o => o.toLowerCase());

  let bestMatch = null;
  let bestScore = 0;

  for (const pattern of SECURITY_KB.patterns) {
    let score = 0;
    for (const keyword of pattern.keywords) {
      if (questionLower.includes(keyword)) score += 2;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = pattern;
    }
  }

  if (bestMatch && bestScore >= 2) {
    for (let i = 0; i < optionsLower.length; i++) {
      if (optionsLower[i].includes(bestMatch.answer) ||
          optionsLower[i].includes(bestMatch.altAnswer)) {
        return {
          answerIndex: i,
          confidence: bestScore >= 4 ? 'high' : 'medium',
          reason: `Matched pattern: ${bestMatch.keywords[0]}`,
          source: 'kb',
        };
      }
    }
  }

  // "All of the above" heuristic
  for (let i = 0; i < optionsLower.length; i++) {
    if (optionsLower[i].includes('all of the above') || optionsLower[i].includes('all the above')) {
      return { answerIndex: i, confidence: 'medium', reason: 'All of the above', source: 'heuristic' };
    }
  }

  // Security keyword heuristic
  for (const keyword of ['report', 'notify', 'security', 'supervisor', 'immediately']) {
    for (let i = 0; i < optionsLower.length; i++) {
      if (optionsLower[i].includes(keyword)) {
        return { answerIndex: i, confidence: 'medium', reason: `Security keyword: ${keyword}`, source: 'heuristic' };
      }
    }
  }

  // Longest answer fallback
  let longestIdx = 0;
  for (let i = 1; i < options.length; i++) {
    if (options[i].length > options[longestIdx].length) longestIdx = i;
  }
  return { answerIndex: longestIdx, confidence: 'low', reason: 'Longest answer', source: 'fallback' };
}

// ===== MAIN ANALYSIS FLOW =====

async function analyzeQuestion(question, options) {
  console.log('[QuizFeast] Analyzing:', question.substring(0, 80));

  // Step 1: Try Pinecone cache via backend
  try {
    const cacheResult = await queryCache(question, options);
    if (cacheResult?.answerIndex !== undefined) {
      console.log('[QuizFeast] Cache HIT');
      return cacheResult;
    }
  } catch (e) {
    console.log('[QuizFeast] Cache lookup failed:', e.message);
  }

  // Step 2: Try AI via backend
  try {
    const aiResult = await analyzeWithBackend(question, options);
    if (aiResult.answerIndex !== undefined) {
      console.log('[QuizFeast] AI answer:', aiResult.answer);
      return aiResult;
    }
  } catch (e) {
    console.log('[QuizFeast] AI failed, using KB:', e.message);
  }

  // Step 3: Local knowledge base fallback
  return analyzeWithKB(question, options);
}

// ===== MESSAGE HANDLING =====

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeQuestion') {
    analyzeQuestion(request.question, request.options)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }

  if (request.action === 'takeScreenshot') {
    const windowId = sender.tab ? sender.tab.windowId : null;
    chrome.tabs.captureVisibleTab(windowId, { format: 'png' }, (imageData) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ imageData });
      }
    });
    return true;
  }

  if (request.action === 'analyzeScreenshot') {
    analyzeScreenshotWithBackend(request.imageData)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }

  if (request.action === 'getSettings') {
    chrome.storage.local.get(['serverUrl', 'autoSubmit', 'delayMs'], (data) => {
      sendResponse(data);
    });
    return true;
  }

  if (request.action === 'saveSettings') {
    chrome.storage.local.set(request.settings, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'correctAnswer') {
    correctAnswerWithBackend(request.imageData, request.originalQuestion, request.wrongAnswer)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});

// Keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-ghost') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    chrome.tabs.sendMessage(tab.id, { action: 'toggleGhost' });
    return;
  }

  if (command === 'take-snapshot') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    // Show processing state immediately (ignore if content script not ready)
    chrome.tabs.sendMessage(tab.id, { action: 'snapshotProcessing' }).catch(() => {});

    chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' }, async (imageData) => {
      if (chrome.runtime.lastError) {
        chrome.tabs.sendMessage(tab.id, { action: 'snapshotResult', error: chrome.runtime.lastError.message });
        return;
      }
      try {
        const result = await analyzeScreenshotWithBackend(imageData);
        chrome.tabs.sendMessage(tab.id, { action: 'snapshotResult', answer: result.answer });
      } catch (error) {
        chrome.tabs.sendMessage(tab.id, { action: 'snapshotResult', error: error.message });
      }
    });
  }
});

// Set defaults on install (NO API KEYS)
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[QuizFeast] Extension installed');
  const existing = await chrome.storage.local.get(['serverUrl']);
  if (!existing.serverUrl) {
    await chrome.storage.local.set({
      serverUrl: DEFAULT_SERVER,
      autoSubmit: false,
      delayMs: 1000,
    });
  }
});
