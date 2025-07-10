/* eslint-disable no-unused-vars */
// pageFetchInterceptor.js

// This script runs in the page context to intercept fetch and capture submissions.
;(function() {
  // Store the original fetch function
  const originalFetch = window.fetch;
  console.log('[DSA Tracker Injected] Fetch interceptor installed');

  // Add a debug function to show visible notifications for debugging
  function showDebugNotification(message, type = 'info') {
    try {
      let container = document.getElementById('dsa-tracker-debug-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'dsa-tracker-debug-container';
        container.style.position = 'fixed';
        container.style.bottom = '10px';
        container.style.right = '10px';
        container.style.zIndex = '10000';
        container.style.maxWidth = '300px';
        container.style.maxHeight = '400px';
        container.style.overflow = 'auto';
        document.body.appendChild(container);
      }
      const notification = document.createElement('div');
      notification.style.padding = '10px';
      notification.style.margin = '5px';
      notification.style.borderRadius = '5px';
      notification.style.fontSize = '12px';
      notification.style.fontFamily = 'monospace';
      notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      notification.style.opacity = '0.9';
      if (type === 'error') {
        notification.style.backgroundColor = '#ffcccc';
        notification.style.color = '#990000';
      } else if (type === 'success') {
        notification.style.backgroundColor = '#ccffcc';
        notification.style.color = '#006600';
      } else {
        notification.style.backgroundColor = '#e6f7ff';
        notification.style.color = '#0066cc';
      }
      notification.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
      container.appendChild(notification);
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 10000);
    } catch (e) {
      console.error('Error in debug notification:', e);
    }
  }

  window.fetch = async function(...args) {
    const [url, options] = args;

    // Early bail if no URL
    if (typeof url !== 'string') {
      return originalFetch.apply(this, args);
    }

    // Detect potential submission calls
    const submissionPatterns = [
      /\/submit\b/,
      /\/submissions\//,
      /\/problems\/[^^/]+\/submit/,
      /graphql/
    ];
    const isSubmit = submissionPatterns.some(pattern => pattern.test(url)) && options && options.method === 'POST';
    if (isSubmit) {
      console.log('[DSA Tracker Injected] Potential submission request detected:', { url, method: options.method, hasBody: !!options.body });
      showDebugNotification('Potential submission request detected: ' + url.substring(0, 50), 'info');
    }

    if (isSubmit) {
      try {
        const submissionTime = Date.now();
        const trackerId = submissionTime + '-' + Math.random().toString(36).substring(2, 9);
        showDebugNotification('Processing submission request...', 'info');
        let lang, code, questionId;
        const body = options.body;
        if (body instanceof FormData) {
          lang = body.get('lang');
          const raw = body.get('typed_code');
          code = typeof raw === 'string' ? raw : null;
          questionId = body.get('question_id');
          console.log('[DSA Tracker Injected] Extracted from FormData:', { lang, codeLength: code ? code.length : 0 });
        } else if (typeof body === 'string') {
          if (body.includes('=') && body.includes('&')) {
            const parsed = new URLSearchParams(body);
            lang = parsed.get('lang');
            code = parsed.get('typed_code') || parsed.get('code');
            questionId = parsed.get('question_id') || parsed.get('questionId');
            console.log('[DSA Tracker Injected] Extracted from URLSearchParams:', { lang, codeLength: code ? code.length : 0 });
          } else {
            try {
              const parsed = JSON.parse(body);
              if (parsed.operationName === 'submitCode' || parsed.operationName === 'submitSolution') {
                const vars = parsed.variables || {};
                lang = vars.lang || vars.languageSlug;
                code = vars.code || vars.sourceCode || vars.typedCode;
                questionId = vars.submissionId || vars.titleSlug;
                console.log('[DSA Tracker Injected] Extracted from GraphQL:', { lang, codeLength: code ? code.length : 0 });
              } else {
                lang = parsed.lang || parsed.language;
                code = parsed.typed_code || parsed.submission_code || parsed.code || parsed.sourceCode;
                questionId = parsed.question_id || parsed.questionId || parsed.titleSlug;
                console.log('[DSA Tracker Injected] Extracted from JSON:', { lang, codeLength: code ? code.length : 0 });
              }
            } catch {
              console.log('[DSA Tracker Injected] Could not extract data from body');
            }
          }
        }

        // Fallback from Monaco
        if (!code && window.monaco && window.monaco.editor && typeof window.monaco.editor.getEditors === 'function') {
          try {
            const editors = window.monaco.editor.getEditors();
            if (editors.length > 0) {
              code = editors[0].getValue();
              console.log('[DSA Tracker Injected] Got code from Monaco editor:', { codeLength: code.length });
            }
          } catch {
            console.log('[DSA Tracker Injected] Failed to get code from Monaco editor');
          }
        }

        const response = await originalFetch.apply(this, args);
        const clonedResponse = response.clone();
        try {
          const responseData = await clonedResponse.json();
          console.log('[DSA Tracker Injected] Submission response:', responseData);
          let extractedSubmissionId = null;
          if (responseData.submission_id) extractedSubmissionId = responseData.submission_id;
          else if (responseData.submissionId) extractedSubmissionId = responseData.submissionId;
          else if (responseData.data && responseData.data.submitCode) extractedSubmissionId = responseData.data.submitCode.id || responseData.data.submitCode.submissionId;
          else if (responseData.data && responseData.data.submitSolution) extractedSubmissionId = responseData.data.submitSolution.id || responseData.data.submitSolution.submissionId;
          else if (responseData.interpret_id) extractedSubmissionId = responseData.interpret_id;
          if (extractedSubmissionId) {
            window.__DSA_TRACKER_SUBMISSIONS = window.__DSA_TRACKER_SUBMISSIONS || {};
            window.__DSA_TRACKER_SUBMISSIONS[extractedSubmissionId] = { submissionId: extractedSubmissionId, trackerId, code, lang, questionId, timestamp: submissionTime, status: 'pending' };
            console.log('[DSA Tracker Injected] Submission detected:', extractedSubmissionId);
            showDebugNotification('Submission detected: ' + extractedSubmissionId, 'success');
          }
        } catch (e) {
          console.error('[DSA Tracker Injected] Error parsing submission response:', e);
          showDebugNotification('Error parsing submission response: ' + e.message, 'error');
        }
        return response;
      } catch (e) {
        console.error('[DSA Tracker Injected] Error intercepting submission:', e);
        showDebugNotification('Error intercepting submission: ' + e.message, 'error');
        return originalFetch.apply(this, args);
      }
    }

    // Status check
    if (typeof url === 'string' && (
        /\/submissions\/detail\/\d+\/check/.test(url) || /\/submissions\/\d+/.test(url) || /\/check\/\d+/.test(url) || /submission[_-]?id=\d+/.test(url) || url.includes('check_submission') ||
        (url.includes('graphql') && options && typeof options.body === 'string' && options.body.includes('submissionDetails'))
      )) {
      try {
        let submissionId = null;
        const match1 = url.match(/\/submissions\/detail\/(\d+)\/check/);
        const match2 = url.match(/\/submissions\/(\d+)/);
        const match3 = url.match(/\/check\/(\d+)/);
        const match4 = url.match(/submission[_-]?id=(\d+)/);
        if (match1) submissionId = match1[1];
        else if (match2) submissionId = match2[1];
        else if (match3) submissionId = match3[1];
        else if (match4) submissionId = match4[1];
        else if (url.includes('graphql') && options && typeof options.body === 'string') {
          try { const p = JSON.parse(options.body); if (p.variables && p.variables.submissionId) submissionId = p.variables.submissionId; } catch {};
        }
        if (submissionId && window.__DSA_TRACKER_SUBMISSIONS && window.__DSA_TRACKER_SUBMISSIONS[submissionId]) {
          console.log('[DSA Tracker Injected] Checking submission status for:', submissionId);
          showDebugNotification('Checking submission status: ' + submissionId, 'info');
          const response = await originalFetch.apply(this, args);
          const clonedResponse = response.clone();
          try {
            const d = await clonedResponse.json();
            console.log('[DSA Tracker Injected] Status check response:', d);
            let isAccepted = d.status_msg === 'Accepted' || d.statusDisplay === 'Accepted' || d.status_code === 10 || d.statusCode === 10 || d.state === 'SUCCESS' || d.judgeResult === 'SUCCESS' || d.status === 'Accepted';
            if (!isAccepted && d.data && d.data.submissionDetails) {
              const det = d.data.submissionDetails;
              isAccepted = det.status === 'Accepted' || det.statusDisplay === 'Accepted' || det.statusCode === 10;
            }
            if (isAccepted) {
              const sd = window.__DSA_TRACKER_SUBMISSIONS[submissionId]; sd.status = 'accepted';
              console.log('[DSA Tracker Injected] ACCEPTED submission detected:', submissionId);
              showDebugNotification('ACCEPTED submission detected: ' + submissionId, 'success');
              let runtime = d.status_runtime || d.runtime || (d.data && d.data.submissionDetails && d.data.submissionDetails.runtime);
              let memory = d.status_memory || d.memory || (d.data && d.data.submissionDetails && d.data.submissionDetails.memory);
              window.dispatchEvent(new CustomEvent('DSA_TRACKER_SUBMISSION_ACCEPTED', { detail: { submissionId, trackerId: sd.trackerId, code: sd.code, lang: sd.lang, questionId: sd.questionId, runtime, memory, timestamp: sd.timestamp } }));
              delete window.__DSA_TRACKER_SUBMISSIONS[submissionId];
            }
          } catch (e) { console.error('[DSA Tracker Injected] Error parsing status check response:', e); showDebugNotification('Error parsing status check: ' + e.message, 'error'); }
          return response;
        }
      } catch (e) { console.error('[DSA Tracker Injected] Error intercepting status check:', e); showDebugNotification('Error intercepting status check: ' + e.message, 'error'); }
    }

    return originalFetch.apply(this, args);
  };

  // Cleanup pending submissions older than 5 minutes
  setInterval(() => {
    if (window.__DSA_TRACKER_SUBMISSIONS) {
      const now = Date.now();
      Object.keys(window.__DSA_TRACKER_SUBMISSIONS).forEach(id => {
        const s = window.__DSA_TRACKER_SUBMISSIONS[id];
        if (now - s.timestamp > 5 * 60 * 1000) {
          delete window.__DSA_TRACKER_SUBMISSIONS[id];
        }
      });
    }
  }, 60 * 1000);

  console.log('[DSA Tracker Injected] Fetch interceptor installed and ready');
  showDebugNotification('DSA Tracker fetch interceptor installed and ready', 'success');
})(); 