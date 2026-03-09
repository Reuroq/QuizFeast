// QuizFeast Extension - Popup Script

document.addEventListener('DOMContentLoaded', init);

function init() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  document.getElementById('btn-scan').addEventListener('click', scanPage);
  document.getElementById('btn-answer').addEventListener('click', answerQuestion);
  document.getElementById('btn-auto').addEventListener('click', toggleAutoMode);
  document.getElementById('btn-ghost').addEventListener('click', toggleGhostMode);
  document.getElementById('btn-save').addEventListener('click', saveSettings);

  loadSettings();
  loadGhostState();
}

function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`tab-${tabName}`).classList.add('active');
}

function updateStatus(message, type = 'info', showSpinner = false) {
  const status = document.getElementById('status');
  const icons = {
    info: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>',
    success: '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>',
    error: '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>',
    warning: '<svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
  };
  const spinnerHtml = showSpinner ? '<div class="spinner"></div>' : (icons[type] || icons.info);
  status.innerHTML = `${spinnerHtml}<span>${message}</span>`;
  status.className = `status status-${type}`;
}

async function loadSettings() {
  const settings = await chrome.runtime.sendMessage({ action: 'getSettings' });

  if (settings.serverUrl) {
    document.getElementById('server-url').value = settings.serverUrl;
  }
  if (settings.autoSubmit !== undefined) {
    document.getElementById('auto-submit').checked = settings.autoSubmit;
  }
  if (settings.delayMs) {
    document.getElementById('delay-ms').value = settings.delayMs;
  }
}

async function loadGhostState() {
  const data = await chrome.storage.local.get(['ghostMode']);
  const btn = document.getElementById('btn-ghost');
  if (data.ghostMode) {
    btn.classList.add('active');
    btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 2C7.58 2 4 5.58 4 10v10.5c0 .83.67 1.5 1.5 1.5s1.08-.39 1.35-.88l.65-1.12.65 1.12c.27.49.81.88 1.35.88s1.08-.39 1.35-.88L11.5 20l.65 1.12c.27.49.81.88 1.35.88s1.08-.39 1.35-.88l.65-1.12.65 1.12c.27.49.81.88 1.35.88s1.5-.67 1.5-1.5V10c0-4.42-3.58-8-8-8zm-2 11c-.83 0-1.5-.67-1.5-1.5S9.17 10 10 10s1.5.67 1.5 1.5S10.83 13 10 13zm4 0c-.83 0-1.5-.67-1.5-1.5S13.17 10 14 10s1.5.67 1.5 1.5S14.83 13 14 13z"/></svg> Ghost Mode ON`;
  }
}

async function saveSettings() {
  const settings = {
    serverUrl: document.getElementById('server-url').value.trim() || 'https://quizfeast.onrender.com',
    autoSubmit: document.getElementById('auto-submit').checked,
    delayMs: parseInt(document.getElementById('delay-ms').value) || 1000,
  };

  await chrome.runtime.sendMessage({ action: 'saveSettings', settings });
  updateStatus('Settings saved!', 'success');
  setTimeout(() => updateStatus('Ready', 'info'), 2000);
}

async function scanPage() {
  updateStatus('Scanning page...', 'info', true);
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, { action: 'scan' });
    updateStatus('Scan complete', 'success');
  } catch (error) {
    updateStatus('Error: Make sure you\'re on a quiz page', 'error');
  }
}

async function answerQuestion() {
  updateStatus('Analyzing question...', 'info', true);
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const questionData = await chrome.tabs.sendMessage(tab.id, { action: 'getQuestion' });

    if (!questionData.question || !questionData.question.questionText) {
      updateStatus('No question found on page', 'warning');
      return;
    }

    const result = await chrome.runtime.sendMessage({
      action: 'analyzeQuestion',
      question: questionData.question.questionText,
      options: questionData.question.options.map(o => o.text)
    });

    if (result.error) {
      updateStatus(`Error: ${result.error}`, 'error');
      return;
    }

    const settings = await chrome.runtime.sendMessage({ action: 'getSettings' });
    await chrome.tabs.sendMessage(tab.id, {
      action: 'autoAnswer',
      answer: result.answerIndex,
      autoSubmit: settings.autoSubmit !== false
    });

    updateStatus(`Answered: Option ${result.answerIndex + 1} (${result.confidence})`, 'success');
  } catch (error) {
    updateStatus(`Error: ${error.message}`, 'error');
  }
}

let autoModeActive = false;

async function toggleAutoMode() {
  const btn = document.getElementById('btn-auto');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!autoModeActive) {
      await chrome.tabs.sendMessage(tab.id, { action: 'startAutoMode' });
      autoModeActive = true;
      btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M6 6h12v12H6z"/></svg> Stop Auto Mode`;
      btn.classList.remove('btn-success');
      btn.classList.add('btn-danger');
      updateStatus('Auto mode ACTIVE', 'success');
    } else {
      await chrome.tabs.sendMessage(tab.id, { action: 'stopAutoMode' });
      autoModeActive = false;
      btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg> Start Full Auto Mode`;
      btn.classList.remove('btn-danger');
      btn.classList.add('btn-success');
      updateStatus('Auto mode stopped', 'info');
    }
  } catch (error) {
    updateStatus('Error: Make sure you\'re on a quiz page', 'error');
  }
}

async function toggleGhostMode() {
  const btn = document.getElementById('btn-ghost');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'toggleGhost' });

    if (response.status === 'ghost_on') {
      btn.classList.add('active');
      btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 2C7.58 2 4 5.58 4 10v10.5c0 .83.67 1.5 1.5 1.5s1.08-.39 1.35-.88l.65-1.12.65 1.12c.27.49.81.88 1.35.88s1.08-.39 1.35-.88L11.5 20l.65 1.12c.27.49.81.88 1.35.88s1.08-.39 1.35-.88l.65-1.12.65 1.12c.27.49.81.88 1.35.88s1.5-.67 1.5-1.5V10c0-4.42-3.58-8-8-8zm-2 11c-.83 0-1.5-.67-1.5-1.5S9.17 10 10 10s1.5.67 1.5 1.5S10.83 13 10 13zm4 0c-.83 0-1.5-.67-1.5-1.5S13.17 10 14 10s1.5.67 1.5 1.5S14.83 13 14 13z"/></svg> Ghost Mode ON`;
      updateStatus('Ghost mode enabled \u2014 UI hidden on page', 'success');
    } else {
      btn.classList.remove('active');
      btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 2C7.58 2 4 5.58 4 10v10.5c0 .83.67 1.5 1.5 1.5s1.08-.39 1.35-.88l.65-1.12.65 1.12c.27.49.81.88 1.35.88s1.08-.39 1.35-.88L11.5 20l.65 1.12c.27.49.81.88 1.35.88s1.08-.39 1.35-.88l.65-1.12.65 1.12c.27.49.81.88 1.35.88s1.5-.67 1.5-1.5V10c0-4.42-3.58-8-8-8zm-2 11c-.83 0-1.5-.67-1.5-1.5S9.17 10 10 10s1.5.67 1.5 1.5S10.83 13 10 13zm4 0c-.83 0-1.5-.67-1.5-1.5S13.17 10 14 10s1.5.67 1.5 1.5S14.83 13 14 13z"/></svg> Ghost Mode`;
      updateStatus('Ghost mode disabled \u2014 UI visible', 'info');
    }
  } catch (error) {
    // If no active tab, toggle storage directly
    const data = await chrome.storage.local.get(['ghostMode']);
    const newState = !data.ghostMode;
    await chrome.storage.local.set({ ghostMode: newState });
    if (newState) {
      btn.classList.add('active');
      btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 2C7.58 2 4 5.58 4 10v10.5c0 .83.67 1.5 1.5 1.5s1.08-.39 1.35-.88l.65-1.12.65 1.12c.27.49.81.88 1.35.88s1.08-.39 1.35-.88L11.5 20l.65 1.12c.27.49.81.88 1.35.88s1.08-.39 1.35-.88l.65-1.12.65 1.12c.27.49.81.88 1.35.88s1.5-.67 1.5-1.5V10c0-4.42-3.58-8-8-8zm-2 11c-.83 0-1.5-.67-1.5-1.5S9.17 10 10 10s1.5.67 1.5 1.5S10.83 13 10 13zm4 0c-.83 0-1.5-.67-1.5-1.5S13.17 10 14 10s1.5.67 1.5 1.5S14.83 13 14 13z"/></svg> Ghost Mode ON`;
    } else {
      btn.classList.remove('active');
      btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 2C7.58 2 4 5.58 4 10v10.5c0 .83.67 1.5 1.5 1.5s1.08-.39 1.35-.88l.65-1.12.65 1.12c.27.49.81.88 1.35.88s1.08-.39 1.35-.88L11.5 20l.65 1.12c.27.49.81.88 1.35.88s1.08-.39 1.35-.88l.65-1.12.65 1.12c.27.49.81.88 1.35.88s1.5-.67 1.5-1.5V10c0-4.42-3.58-8-8-8zm-2 11c-.83 0-1.5-.67-1.5-1.5S9.17 10 10 10s1.5.67 1.5 1.5S10.83 13 10 13zm4 0c-.83 0-1.5-.67-1.5-1.5S13.17 10 14 10s1.5.67 1.5 1.5S14.83 13 14 13z"/></svg> Ghost Mode`;
    }
    updateStatus(newState ? 'Ghost mode saved \u2014 refresh page to apply' : 'Ghost mode off \u2014 refresh page to apply', 'info');
  }
}
