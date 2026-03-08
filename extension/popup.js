// QuizFeast Extension - Popup Script

document.addEventListener('DOMContentLoaded', init);

function init() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  document.getElementById('btn-scan').addEventListener('click', scanPage);
  document.getElementById('btn-answer').addEventListener('click', answerQuestion);
  document.getElementById('btn-auto').addEventListener('click', toggleAutoMode);
  document.getElementById('btn-save').addEventListener('click', saveSettings);

  loadSettings();
}

function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`tab-${tabName}`).classList.add('active');
}

function updateStatus(message, type = 'info') {
  const status = document.getElementById('status');
  status.textContent = message;
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
  updateStatus('Scanning page...', 'info');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, { action: 'scan' });
    updateStatus('Scan complete', 'success');
  } catch (error) {
    updateStatus('Error: Make sure you\'re on a quiz page', 'error');
  }
}

async function answerQuestion() {
  updateStatus('Analyzing question...', 'info');
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
      btn.textContent = 'Stop Auto Mode';
      btn.classList.remove('btn-success');
      btn.classList.add('btn-danger');
      updateStatus('Auto mode ACTIVE', 'success');
    } else {
      await chrome.tabs.sendMessage(tab.id, { action: 'stopAutoMode' });
      autoModeActive = false;
      btn.textContent = 'Start Full Auto Mode';
      btn.classList.remove('btn-danger');
      btn.classList.add('btn-success');
      updateStatus('Auto mode stopped', 'info');
    }
  } catch (error) {
    updateStatus('Error: Make sure you\'re on a quiz page', 'error');
  }
}
