// QuizFeast Extension - Content Script
// Floating UI for screenshot-based quiz answering

(function() {
  'use strict';

  let isProcessing = false;
  let lastQuestion = null;
  let lastAnswer = null;
  let ghostMode = false;

  // ===== SVG ICONS =====
  const ICONS = {
    logo: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="qf-brain-icon">
      <!-- Brain shape -->
      <path class="qf-brain-shape" d="M12 2C9.5 2 7.5 3.2 6.3 5c-1.5.3-2.8 1.2-3.5 2.5C2.3 8.3 2 9.1 2 10c0 1.2.5 2.3 1.3 3.1-.2.6-.3 1.2-.3 1.9 0 2.2 1.3 4 3.2 4.8.5 1.8 2 3.2 4 3.2 1.1 0 1.8-.5 1.8-.5s.7.5 1.8.5c2 0 3.5-1.4 4-3.2 1.9-.8 3.2-2.6 3.2-4.8 0-.7-.1-1.3-.3-1.9.8-.8 1.3-1.9 1.3-3.1 0-.9-.3-1.7-.8-2.5-.7-1.3-2-2.2-3.5-2.5C16.5 3.2 14.5 2 12 2z" fill="currentColor" opacity="0.9"/>
      <!-- Brain fold line -->
      <path class="qf-brain-fold" d="M12 4c0 2-1 3.5-1 5.5S12 13 12 15s-1 3.5-1 4.5" stroke="rgba(0,0,0,0.2)" stroke-width="0.8" fill="none"/>
      <!-- Neural connections -->
      <line class="qf-neuron-line n1" x1="6" y1="8" x2="10" y2="11" stroke="rgba(255,255,255,0.6)" stroke-width="0.5"/>
      <line class="qf-neuron-line n2" x1="14" y1="7" x2="17" y2="10" stroke="rgba(255,255,255,0.6)" stroke-width="0.5"/>
      <line class="qf-neuron-line n3" x1="7" y1="13" x2="11" y2="15" stroke="rgba(255,255,255,0.6)" stroke-width="0.5"/>
      <line class="qf-neuron-line n4" x1="13" y1="12" x2="17" y2="14" stroke="rgba(255,255,255,0.6)" stroke-width="0.5"/>
      <line class="qf-neuron-line n5" x1="9" y1="6" x2="12" y2="9" stroke="rgba(255,255,255,0.6)" stroke-width="0.5"/>
      <!-- Neuron firing dots -->
      <circle class="qf-neuron n1" cx="6" cy="8" r="1.2" fill="#fbbf24"/>
      <circle class="qf-neuron n2" cx="14" cy="7" r="1" fill="#34d399"/>
      <circle class="qf-neuron n3" cx="10" cy="11" r="1.1" fill="#818cf8"/>
      <circle class="qf-neuron n4" cx="17" cy="10" r="0.9" fill="#f472b6"/>
      <circle class="qf-neuron n5" cx="7" cy="13" r="1" fill="#fbbf24"/>
      <circle class="qf-neuron n6" cx="13" cy="15" r="1.1" fill="#34d399"/>
      <circle class="qf-neuron n7" cx="17" cy="14" r="0.9" fill="#818cf8"/>
      <circle class="qf-neuron n8" cx="9" cy="6" r="1" fill="#f472b6"/>
    </svg>`,
    camera: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z"/><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>`,
    ghost: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C7.58 2 4 5.58 4 10v10.5c0 .83.67 1.5 1.5 1.5s1.08-.39 1.35-.88l.65-1.12.65 1.12c.27.49.81.88 1.35.88s1.08-.39 1.35-.88L11.5 20l.65 1.12c.27.49.81.88 1.35.88s1.08-.39 1.35-.88l.65-1.12.65 1.12c.27.49.81.88 1.35.88s1.5-.67 1.5-1.5V10c0-4.42-3.58-8-8-8zm-2 11c-.83 0-1.5-.67-1.5-1.5S9.17 10 10 10s1.5.67 1.5 1.5S10.83 13 10 13zm4 0c-.83 0-1.5-.67-1.5-1.5S13.17 10 14 10s1.5.67 1.5 1.5S14.83 13 14 13z"/></svg>`,
    wrong: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`,
    check: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`,
    close: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>`,
    sparkle: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/></svg>`,
  };

  function init() {
    console.log('[QuizFeast] Content script loaded');
    chrome.runtime.onMessage.addListener(handleMessage);
    // Load ghost mode preference
    chrome.storage.local.get(['ghostMode'], (data) => {
      ghostMode = data.ghostMode || false;
      createFloatingUI();
      if (ghostMode) {
        const container = document.getElementById('qf-helper-float');
        if (container) container.classList.add('qf-ghost');
      }
    });
  }

  function handleMessage(request, sender, sendResponse) {
    switch(request.action) {
      case 'snapshotProcessing':
        unghostToShowResult();
        updateStatus('Analyzing screenshot...', 'info', true);
        sendResponse({ status: 'ok' });
        break;

      case 'snapshotResult':
        isProcessing = false;
        // Un-ghost to show the result
        unghostToShowResult();
        if (request.error) {
          updateStatus(`Error: ${request.error}`, 'error');
        } else {
          clearStatus();
          lastQuestion = 'Screenshot question';
          lastAnswer = request.answer;
          const preview = document.getElementById('qf-answer-preview');
          if (preview) {
            preview.innerHTML = `<div class="qf-ai-answer"><strong>${ICONS.sparkle} AI Answer</strong>${request.answer}</div>`;
          }
          showWrongAnswerButton();
        }
        sendResponse({ status: 'received' });
        break;

      case 'scan':
        sendResponse({ status: 'scanned' });
        break;

      case 'getQuestion':
        const questionData = detectQuestion();
        sendResponse({ question: questionData });
        break;

      case 'autoAnswer':
        if (request.answer !== undefined) {
          selectAnswer(request.answer, request.autoSubmit);
        }
        sendResponse({ status: 'done' });
        break;

      case 'startAutoMode':
        startAutoMode();
        sendResponse({ status: 'started' });
        break;

      case 'stopAutoMode':
        stopAutoMode();
        sendResponse({ status: 'stopped' });
        break;

      case 'toggleGhost':
        toggleGhostMode();
        sendResponse({ status: ghostMode ? 'ghost_on' : 'ghost_off' });
        break;
    }
    return true;
  }

  // Detect quiz questions on the page
  function detectQuestion() {
    const selectors = [
      '.question-text', '.quiz-question', '.assessment-question',
      '[class*="question"]', '[class*="Question"]',
      '.prompt', '.stem', '.question-body',
    ];

    let questionText = null;
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim().length > 10) {
        questionText = el.textContent.trim();
        break;
      }
    }

    const optionSelectors = [
      '.answer-option', '.quiz-option', '.choice',
      '[class*="option"]', '[class*="answer"]', '[class*="choice"]',
      'input[type="radio"] + label', '.radio-label',
    ];

    const options = [];
    for (const sel of optionSelectors) {
      const els = document.querySelectorAll(sel);
      if (els.length >= 2) {
        els.forEach((el, i) => {
          options.push({ text: el.textContent.trim(), index: i, element: el });
        });
        break;
      }
    }

    return questionText ? { questionText, options } : null;
  }

  function selectAnswer(answerIndex, autoSubmit) {
    const optionSelectors = [
      '.answer-option', '.quiz-option', '.choice',
      '[class*="option"]', '[class*="answer"]', '[class*="choice"]',
      'input[type="radio"]',
    ];

    for (const sel of optionSelectors) {
      const els = document.querySelectorAll(sel);
      if (els.length >= 2 && answerIndex < els.length) {
        els[answerIndex].click();
        break;
      }
    }

    if (autoSubmit) {
      setTimeout(() => {
        const submitSelectors = [
          'button[type="submit"]', '.submit-btn', '.next-btn',
          '[class*="submit"]', '[class*="next"]',
        ];
        for (const sel of submitSelectors) {
          const btn = document.querySelector(sel);
          if (btn) { btn.click(); break; }
        }
      }, 500);
    }
  }

  let autoModeInterval = null;

  function startAutoMode() {
    updateStatus('Auto mode active', 'success');
    autoModeInterval = setInterval(async () => {
      const questionData = detectQuestion();
      if (questionData) {
        const result = await chrome.runtime.sendMessage({
          action: 'analyzeQuestion',
          question: questionData.questionText,
          options: questionData.options.map(o => o.text)
        });
        if (result && result.answerIndex !== undefined) {
          selectAnswer(result.answerIndex, true);
        }
      }
    }, 3000);
  }

  function stopAutoMode() {
    if (autoModeInterval) {
      clearInterval(autoModeInterval);
      autoModeInterval = null;
    }
    updateStatus('Auto mode stopped', 'info');
  }

  // ===== GHOST MODE =====
  function unghostToShowResult() {
    const container = document.getElementById('qf-helper-float');
    if (container && container.classList.contains('qf-ghost')) {
      container.classList.remove('qf-ghost');
      const panel = document.getElementById('qf-helper-panel');
      if (panel) panel.classList.add('visible');
    }
  }

  function toggleGhostMode() {
    ghostMode = !ghostMode;
    const container = document.getElementById('qf-helper-float');
    if (container) {
      container.classList.toggle('qf-ghost', ghostMode);
    }
    chrome.storage.local.set({ ghostMode });

    if (ghostMode) {
      showGhostToast();
    }
  }

  function showGhostToast() {
    const existing = document.querySelector('.qf-ghost-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'qf-ghost-toast';
    toast.innerHTML = `Ghost mode ON \u2014 <kbd>Alt+S</kbd> answer \u2014 <kbd>Alt+G</kbd> un-ghost`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // ===== FLOATING UI =====
  function createFloatingUI() {
    const existing = document.getElementById('qf-helper-float');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'qf-helper-float';
    container.innerHTML = `
      <div class="qf-ghost-btn" id="qf-ghost-btn" title="Ghost Mode (Alt+G)">
        ${ICONS.ghost}
      </div>
      <div class="qf-helper-btn" id="qf-helper-main-btn">
        <span class="qf-icon">${ICONS.logo}</span>
      </div>
      <div class="qf-ghost-reveal" id="qf-ghost-reveal" title="Click to un-ghost (Alt+G)">
        ${ICONS.ghost}
      </div>
      <div class="qf-helper-panel" id="qf-helper-panel">
        <div class="qf-panel-header">
          ${ICONS.logo}
          <span>QuizFeast</span>
          <div class="qf-header-actions">
            <button class="qf-header-action-btn" id="qf-ghost-panel-btn" title="Ghost Mode (Alt+G)">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" fill="white"/></svg>
            </button>
            <button class="qf-header-action-btn" id="qf-close-panel-btn" title="Close Panel">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill="white"/></svg>
            </button>
          </div>
        </div>
        <div class="qf-panel-content">
          <button id="qf-snap-panel-btn" class="qf-btn qf-btn-camera">
            ${ICONS.camera} Snapshot Answer
          </button>
          <button id="qf-wrong-btn" class="qf-btn qf-btn-wrong" style="display:none;">
            ${ICONS.wrong} Wrong? Flag It
          </button>
          <div id="qf-status" class="qf-status"></div>
          <div id="qf-answer-preview" class="qf-answer-preview"></div>
          <div class="qf-shortcut-hint">
            <kbd>Alt+S</kbd> instant answer &nbsp; <kbd>Alt+G</kbd> ghost mode
          </div>
          <a class="qf-vetaid-ad" href="https://vetaid.ai" target="_blank" rel="noopener" title="VetAid — AI-Powered VA Claims">
            <div class="qf-vetaid-logo">
              <svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="qf-va-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#ffc857"/>
                    <stop offset="50%" style="stop-color:#ff6b35"/>
                    <stop offset="100%" style="stop-color:#ffc857"/>
                  </linearGradient>
                </defs>
                <path d="M18 3L4 9v9c0 8.3 5.9 16.1 14 18 8.1-1.9 14-9.7 14-18V9L18 3z" fill="none" stroke="url(#qf-va-grad)" stroke-width="1.5"/>
                <path d="M12 18l4 4 8-8" fill="none" stroke="#00c48c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="18" cy="10" r="1.5" fill="#ffc857" opacity="0.6"/>
              </svg>
            </div>
            <div class="qf-vetaid-text">
              <div class="qf-vetaid-brand">VetAid.ai</div>
              <div class="qf-vetaid-tagline">Get your <strong>100% VA rating</strong>. AI-powered claims in 2 hours.</div>
            </div>
            <div class="qf-vetaid-badge">Free</div>
          </a>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    document.getElementById('qf-helper-main-btn').addEventListener('click', togglePanel);
    document.getElementById('qf-snap-panel-btn').addEventListener('click', takeSnapshot);
    document.getElementById('qf-wrong-btn').addEventListener('click', reportWrongAnswer);
    document.getElementById('qf-ghost-btn').addEventListener('click', toggleGhostMode);
    document.getElementById('qf-ghost-panel-btn').addEventListener('click', toggleGhostMode);
    document.getElementById('qf-close-panel-btn').addEventListener('click', togglePanel);
    document.getElementById('qf-ghost-reveal').addEventListener('click', toggleGhostMode);
  }

  function showWrongAnswerButton() {
    const btn = document.getElementById('qf-wrong-btn');
    if (btn) btn.style.display = 'flex';
  }

  function hideWrongAnswerButton() {
    const btn = document.getElementById('qf-wrong-btn');
    if (btn) btn.style.display = 'none';
  }

  async function reportWrongAnswer() {
    if (!lastQuestion) {
      updateStatus('No previous question to correct', 'warning');
      return;
    }

    updateStatus('Learning correct answer...', 'info', true);

    try {
      const response = await chrome.runtime.sendMessage({ action: 'takeScreenshot' });

      if (response.error) {
        updateStatus(`Error: ${response.error}`, 'error');
        return;
      }

      const correctionResponse = await chrome.runtime.sendMessage({
        action: 'correctAnswer',
        imageData: response.imageData,
        originalQuestion: lastQuestion,
        wrongAnswer: lastAnswer
      });

      if (correctionResponse.error) {
        updateStatus(`Error: ${correctionResponse.error}`, 'error');
        return;
      }

      const preview = document.getElementById('qf-answer-preview');

      if (correctionResponse.rejected) {
        updateStatus('Thanks for the feedback!', 'success');
        hideWrongAnswerButton();
        if (preview) {
          preview.innerHTML = `<div class="qf-correction"><strong>${ICONS.check} Feedback received</strong></div>`;
        }
      } else {
        updateStatus(`Learned! Correct answer: ${correctionResponse.correctAnswer}`, 'success');
        hideWrongAnswerButton();
        if (preview) {
          preview.innerHTML = `<div class="qf-correction">
            <strong>${ICONS.check} Correction saved</strong>
            Was: ${lastAnswer}<br>
            Now: ${correctionResponse.correctAnswer}
          </div>`;
        }
      }
    } catch (error) {
      updateStatus(`Error: ${error.message}`, 'error');
    }
  }

  async function takeSnapshot() {
    if (isProcessing) {
      updateStatus('Already processing...', 'warning');
      return;
    }

    isProcessing = true;
    updateStatus('Taking screenshot...', 'info', true);

    // Un-ghost temporarily to show status
    const container = document.getElementById('qf-helper-float');
    const wasGhost = container?.classList.contains('qf-ghost');
    if (wasGhost) {
      container.classList.remove('qf-ghost');
      const panel = document.getElementById('qf-helper-panel');
      if (panel) panel.classList.add('visible');
    }

    try {
      const response = await chrome.runtime.sendMessage({ action: 'takeScreenshot' });

      if (response.error) {
        updateStatus(`Error: ${response.error}`, 'error');
        isProcessing = false;
        return;
      }

      updateStatus('Analyzing image...', 'info', true);

      const analysisResponse = await chrome.runtime.sendMessage({
        action: 'analyzeScreenshot',
        imageData: response.imageData
      });

      if (analysisResponse.error) {
        updateStatus(`Error: ${analysisResponse.error}`, 'error');
        isProcessing = false;
        return;
      }

      const answer = analysisResponse.answer;
      clearStatus();

      lastQuestion = 'Screenshot question';
      lastAnswer = answer;

      const preview = document.getElementById('qf-answer-preview');
      if (preview) {
        preview.innerHTML = `<div class="qf-ai-answer"><strong>${ICONS.sparkle} AI Answer</strong>${answer}</div>`;
      }

      showWrongAnswerButton();
      isProcessing = false;

    } catch (error) {
      updateStatus(`Error: ${error.message}`, 'error');
      isProcessing = false;
    }
  }

  function togglePanel() {
    const panel = document.getElementById('qf-helper-panel');
    panel.classList.toggle('visible');
  }

  function clearStatus() {
    const status = document.getElementById('qf-status');
    if (status) {
      status.innerHTML = '';
      status.className = 'qf-status';
      status.style.display = 'none';
    }
  }

  function updateStatus(message, type = 'info', showSpinner = false) {
    const status = document.getElementById('qf-status');
    if (status) {
      status.style.display = '';
      const spinnerHtml = showSpinner ? '<div class="qf-spinner"></div>' : '';
      status.innerHTML = `${spinnerHtml}<span>${message}</span>`;
      status.className = `qf-status qf-status-${type}`;
    }
    console.log(`[QuizFeast] ${message}`);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
