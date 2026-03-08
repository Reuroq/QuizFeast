// QuizFeast Extension - Content Script
// Floating UI for screenshot-based quiz answering

(function() {
  'use strict';

  let isProcessing = false;
  let lastQuestion = null;
  let lastAnswer = null;

  function init() {
    console.log('[QuizFeast] Content script loaded');
    chrome.runtime.onMessage.addListener(handleMessage);
    createFloatingUI();
  }

  function handleMessage(request, sender, sendResponse) {
    switch(request.action) {
      case 'snapshotResult':
        isProcessing = false;
        if (request.error) {
          updateStatus(`Error: ${request.error}`, 'error');
        } else {
          updateStatus('Answer found!', 'success');
          lastQuestion = 'Screenshot question';
          lastAnswer = request.answer;
          const preview = document.getElementById('qf-answer-preview');
          if (preview) {
            preview.innerHTML = `<div class="qf-ai-answer"><strong>AI Answer:</strong><br>${request.answer}</div>`;
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
    }
    return true;
  }

  // Detect quiz questions on the page
  function detectQuestion() {
    // Common quiz question selectors
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

    // Detect options
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

  // Select an answer option on the page
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

  function createFloatingUI() {
    const existing = document.getElementById('qf-helper-float');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'qf-helper-float';
    container.innerHTML = `
      <div class="qf-helper-btn" id="qf-helper-main-btn">
        <span class="qf-icon">Q</span>
      </div>
      <div class="qf-helper-btn qf-snapshot-btn" id="qf-snapshot-btn" title="Screenshot Answer (Alt+S)">
        <span class="qf-icon-cam">S</span>
      </div>
      <div class="qf-helper-panel" id="qf-helper-panel">
        <div class="qf-panel-header">QuizFeast</div>
        <div class="qf-panel-content">
          <button id="qf-snap-panel-btn" class="qf-btn qf-btn-camera">Snapshot Answer</button>
          <button id="qf-wrong-btn" class="qf-btn qf-btn-wrong" style="display:none;">Wrong Answer - Learn Correct</button>
          <div id="qf-status" class="qf-status"></div>
          <div id="qf-answer-preview" class="qf-answer-preview"></div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    document.getElementById('qf-helper-main-btn').addEventListener('click', togglePanel);
    document.getElementById('qf-snapshot-btn').addEventListener('click', takeSnapshot);
    document.getElementById('qf-snap-panel-btn').addEventListener('click', takeSnapshot);
    document.getElementById('qf-wrong-btn').addEventListener('click', reportWrongAnswer);
  }

  function showWrongAnswerButton() {
    const btn = document.getElementById('qf-wrong-btn');
    if (btn) btn.style.display = 'block';
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

    updateStatus('Learning correct answer...', 'info');

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
          preview.innerHTML = `<div class="qf-correction"><strong>Feedback received</strong></div>`;
        }
      } else {
        updateStatus(`Learned! Correct answer: ${correctionResponse.correctAnswer}`, 'success');
        hideWrongAnswerButton();
        if (preview) {
          preview.innerHTML = `<div class="qf-correction">
            <strong>Correction saved:</strong><br>
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
    updateStatus('Taking screenshot...', 'info');

    try {
      const response = await chrome.runtime.sendMessage({ action: 'takeScreenshot' });

      if (response.error) {
        updateStatus(`Error: ${response.error}`, 'error');
        isProcessing = false;
        return;
      }

      updateStatus('Analyzing image...', 'info');

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
      updateStatus(answer, 'success');

      lastQuestion = 'Screenshot question';
      lastAnswer = answer;

      const preview = document.getElementById('qf-answer-preview');
      if (preview) {
        preview.innerHTML = `<div class="qf-ai-answer"><strong>AI Answer:</strong><br>${answer}</div>`;
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

  function updateStatus(message, type = 'info') {
    const status = document.getElementById('qf-status');
    if (status) {
      status.textContent = message;
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
