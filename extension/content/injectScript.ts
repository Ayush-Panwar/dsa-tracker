/**
 * This file is responsible for injecting the fetch interceptor script into the page context.
 * Since the content script runs in an isolated world, we need to inject a script tag
 * to access and modify objects in the page's JavaScript context.
 */

// The script to be injected as a string - this will run in the page context
const fetchInterceptorScript = `
(function() {
  // Store the original fetch function
  const originalFetch = window.fetch;
  console.log('[DSA Tracker Injected] Fetch interceptor installed');

  // Add a debug function to show visible notifications for debugging
  function showDebugNotification(message, type = 'info') {
    try {
      // Create notification element if it doesn't exist
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
      
      // Create notification
      const notification = document.createElement('div');
      notification.style.padding = '10px';
      notification.style.margin = '5px';
      notification.style.borderRadius = '5px';
      notification.style.fontSize = '12px';
      notification.style.fontFamily = 'monospace';
      notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      notification.style.opacity = '0.9';
      
      // Set color based on type
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
      
      // Add timestamp and message
      notification.textContent = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
      
      // Add to container
      container.appendChild(notification);
      
      // Remove after 10 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 10000);
    } catch (e) {
      // Ignore errors in debug function
      console.error('Error in debug notification:', e);
    }
  }

  // Replace window.fetch with our patched version
  window.fetch = async function(...args) {
    const [url, options] = args;
    
    // More verbose logging for debugging submission detection
    if (typeof url === 'string') {
      // Enhanced pattern matching for submission requests
      const submissionPatterns = [
        /\\/submit\\b/,
        /\\/submissions\\//,
        /\\/problems\\/[^/]+\\/submit/,
        /graphql/
      ];
      
      const isSubmit = submissionPatterns.some(pattern => pattern.test(url)) && 
                      options?.method === 'POST';
      
      if (isSubmit) {
        console.log('[DSA Tracker Injected] Potential submission request detected:', {
          url,
          method: options?.method,
          hasBody: !!options?.body
        });
        
        showDebugNotification('Potential submission request detected: ' + url.substring(0, 50), 'info');
        
        // Log the body for debugging if present
        if (options?.body) {
          try {
            const bodyContent = typeof options.body === 'string' 
              ? options.body 
              : options.body instanceof FormData 
                ? 'FormData object (cannot stringify)' 
                : JSON.stringify(options.body);
            console.log('[DSA Tracker Injected] Request body:', bodyContent.substring(0, 200) + (bodyContent.length > 200 ? '...' : ''));
            
            // Check for GraphQL submission
            if (url.includes('graphql') && typeof options.body === 'string') {
              try {
                const parsed = JSON.parse(options.body);
                if (parsed.operationName && 
                   (parsed.operationName === 'submitCode' || 
                    parsed.operationName === 'submitSolution' || 
                    parsed.operationName.includes('submission'))) {
                  console.log('[DSA Tracker Injected] GraphQL submission detected:', parsed.operationName);
                  showDebugNotification('GraphQL submission detected: ' + parsed.operationName, 'info');
                }
              } catch (e) {
                console.log('[DSA Tracker Injected] Failed to parse GraphQL body');
              }
            }
          } catch (e) {
            console.log('[DSA Tracker Injected] Could not log body');
          }
        }
      }
    }
    
    // Check if this is a submission request with improved pattern matching
    if (typeof url === 'string' && 
        ((url.includes('/problems/') && url.includes('/submit')) || 
         url.includes('/submissions/') || 
         (url.includes('graphql') && options?.body && 
          (typeof options.body === 'string' && 
           (options.body.includes('submitCode') || options.body.includes('submitSolution')))))) {
      try {
        // Generate a unique ID for this submission
        const submissionTime = Date.now();
        const submissionId = submissionTime + '-' + Math.random().toString(36).substring(2, 9);
        
        showDebugNotification('Processing submission request...', 'info');
        
        // Extract code and language from the request body
        const body = options.body;
        let lang, code, questionId;
        
        if (body instanceof FormData) {
          lang = body.get('lang');
          code = body.get('typed_code');
          questionId = body.get('question_id');
          console.log('[DSA Tracker Injected] Extracted from FormData:', { lang, codeLength: code?.length });
        } else if (typeof body === 'string') {
          try {
            // Try URL encoded form data
            if (body.includes('=') && body.includes('&')) {
              const parsed = new URLSearchParams(body);
              lang = parsed.get('lang');
              code = parsed.get('typed_code') || parsed.get('code');
              questionId = parsed.get('question_id') || parsed.get('questionId');
              console.log('[DSA Tracker Injected] Extracted from URLSearchParams:', { lang, codeLength: code?.length });
            } 
            // Try JSON format
            else {
              try {
                const parsed = JSON.parse(body);
                
                // Handle GraphQL submissions
                if (parsed.operationName && 
                   (parsed.operationName === 'submitCode' || 
                    parsed.operationName === 'submitSolution')) {
                  const variables = parsed.variables || {};
                  lang = variables.lang || variables.languageSlug;
                  code = variables.code || variables.sourceCode || variables.typedCode;
                  questionId = variables.questionId || variables.titleSlug;
                  console.log('[DSA Tracker Injected] Extracted from GraphQL:', { lang, codeLength: code?.length });
                } 
                // Handle regular JSON submissions
                else {
                  lang = parsed.lang || parsed.language;
                  code = parsed.typed_code || parsed.submission_code || parsed.code || parsed.sourceCode;
                  questionId = parsed.question_id || parsed.questionId || parsed.titleSlug;
                  console.log('[DSA Tracker Injected] Extracted from JSON:', { lang, codeLength: code?.length });
                }
              } catch (_) {
                // Not a format we recognize
                console.log('[DSA Tracker Injected] Could not extract data from body');
              }
            }
          } catch (_) {
            // Not a format we recognize
            console.log('[DSA Tracker Injected] Could not extract data from body');
          }
        }
        
        // If we couldn't extract the code, try to get it from the Monaco editor
        if (!code && window.monaco && window.monaco.editor) {
          try {
            const editors = window.monaco.editor.getEditors();
            if (editors && editors.length > 0) {
              code = editors[0].getValue();
              console.log('[DSA Tracker Injected] Got code from Monaco editor:', { codeLength: code.length });
            }
          } catch (e) {
            console.log('[DSA Tracker Injected] Failed to get code from Monaco editor');
          }
        }
        
        // Call the original fetch
        const response = await originalFetch.apply(this, args);
        
        // Clone the response so we can read it without consuming it
        const clonedResponse = response.clone();
        
        // Parse the response to get the submission_id
        try {
          const responseData = await clonedResponse.json();
          console.log('[DSA Tracker Injected] Submission response:', responseData);
          
          // Extract submission ID from various response formats
          let extractedSubmissionId = null;
          
          if (responseData.submission_id) {
            extractedSubmissionId = responseData.submission_id;
          } else if (responseData.submissionId) {
            extractedSubmissionId = responseData.submissionId;
          } else if (responseData.data && responseData.data.submitCode) {
            extractedSubmissionId = responseData.data.submitCode.id || responseData.data.submitCode.submissionId;
          } else if (responseData.data && responseData.data.submitSolution) {
            extractedSubmissionId = responseData.data.submitSolution.id || responseData.data.submitSolution.submissionId;
          } else if (responseData.interpret_id) {
            extractedSubmissionId = responseData.interpret_id;
          }
          
          if (extractedSubmissionId) {
            // Store submission data for later correlation
            window.__DSA_TRACKER_SUBMISSIONS = window.__DSA_TRACKER_SUBMISSIONS || {};
            window.__DSA_TRACKER_SUBMISSIONS[extractedSubmissionId] = {
              submissionId: extractedSubmissionId,
              trackerId: submissionId,
              code,
              lang,
              questionId,
              timestamp: submissionTime,
              status: 'pending'
            };
            
            console.log('[DSA Tracker Injected] Submission detected:', extractedSubmissionId);
            showDebugNotification('Submission detected: ' + extractedSubmissionId, 'success');
          }
        } catch (error) {
          console.error('[DSA Tracker Injected] Error parsing submission response:', error);
          showDebugNotification('Error parsing submission response: ' + error.message, 'error');
        }
        
        return response;
      } catch (error) {
        console.error('[DSA Tracker Injected] Error intercepting submission:', error);
        showDebugNotification('Error intercepting submission: ' + error.message, 'error');
        // Fall back to original fetch if our interception fails
        return originalFetch.apply(this, args);
      }
    } 
    // Check if this is a submission status check request with improved pattern matching
    else if (typeof url === 'string' && 
            (url.match(/\\/submissions\\/detail\\/\\d+\\/check/) || 
             url.match(/\\/submissions\\/\\d+/) ||
             url.match(/\\/check\\/\\d+/) ||
             url.match(/submission[_-]?id=\\d+/) ||
             url.includes('check_submission') ||
             (url.includes('graphql') && options?.body && 
              typeof options.body === 'string' && options.body.includes('submissionDetails')))) {
      try {
        // Extract submission ID from URL or body
        let submissionId = null;
        
        // Try to extract from URL first
        const urlMatches = url.match(/\\/submissions\\/detail\\/(\\d+)\\/check/) || 
                          url.match(/\\/submissions\\/(\\d+)/) ||
                          url.match(/\\/check\\/(\\d+)/) ||
                          url.match(/submission[_-]?id=(\\d+)/);
                        
        if (urlMatches && urlMatches[1]) {
          submissionId = urlMatches[1];
        }
        // If not found in URL, try to extract from body for GraphQL requests
        else if (url.includes('graphql') && options?.body && typeof options.body === 'string') {
          try {
            const parsed = JSON.parse(options.body);
            if (parsed.variables && parsed.variables.submissionId) {
              submissionId = parsed.variables.submissionId;
            }
          } catch (_) {
            // Ignore parsing errors
          }
        }
        
        if (submissionId) {
          console.log('[DSA Tracker Injected] Checking submission status for:', submissionId);
          showDebugNotification('Checking submission status: ' + submissionId, 'info');
          
          // Call the original fetch
          const response = await originalFetch.apply(this, args);
          
          // Clone the response so we can read it without consuming it
          const clonedResponse = response.clone();
          
          try {
            // Parse the response to check the status
            const responseData = await clonedResponse.json();
            console.log('[DSA Tracker Injected] Status check response:', responseData);
            
            // Check various status fields that might indicate acceptance
            let isAccepted = false;
            
            // Handle different response formats
            if (responseData.status_msg === "Accepted" || responseData.statusDisplay === "Accepted") {
              isAccepted = true;
            } else if (responseData.status_code === 10 || responseData.statusCode === 10) {
              isAccepted = true;
            } else if (responseData.state === "SUCCESS" || responseData.judgeResult === "SUCCESS") {
              isAccepted = true;
            } else if (responseData.status === "Accepted") {
              isAccepted = true;
            } else if (responseData.data && responseData.data.submissionDetails) {
              const details = responseData.data.submissionDetails;
              isAccepted = details.status === "Accepted" || 
                          details.statusDisplay === "Accepted" ||
                          details.statusCode === 10;
            }
            
            // If this is a final result and the submission was accepted
            if (responseData && 
                isAccepted && 
                window.__DSA_TRACKER_SUBMISSIONS && 
                window.__DSA_TRACKER_SUBMISSIONS[submissionId]) {
              
              // Get the stored submission data
              const submissionData = window.__DSA_TRACKER_SUBMISSIONS[submissionId];
              submissionData.status = 'accepted';
              
              console.log('[DSA Tracker Injected] ACCEPTED submission detected:', submissionId);
              showDebugNotification('ACCEPTED submission detected: ' + submissionId, 'success');
              
              // Extract runtime and memory from different response formats
              let runtime = null;
              let memory = null;
              
              if (responseData.status_runtime) {
                runtime = responseData.status_runtime;
              } else if (responseData.runtime) {
                runtime = responseData.runtime;
              } else if (responseData.data && responseData.data.submissionDetails) {
                runtime = responseData.data.submissionDetails.runtime;
                memory = responseData.data.submissionDetails.memory;
              }
              
              if (responseData.status_memory) {
                memory = responseData.status_memory;
              } else if (responseData.memory) {
                memory = responseData.memory;
              }
              
              // Notify our extension via a custom event
              window.dispatchEvent(new CustomEvent('DSA_TRACKER_SUBMISSION_ACCEPTED', {
                detail: {
                  submissionId,
                  trackerId: submissionData.trackerId,
                  code: submissionData.code,
                  lang: submissionData.lang,
                  questionId: submissionData.questionId,
                  runtime: runtime,
                  memory: memory,
                  timestamp: submissionData.timestamp
                }
              }));
              
              // Clean up after successful detection
              delete window.__DSA_TRACKER_SUBMISSIONS[submissionId];
            }
          } catch (error) {
            console.error('[DSA Tracker Injected] Error parsing status check response:', error);
            showDebugNotification('Error parsing status check: ' + error.message, 'error');
          }
          
          return response;
        }
      } catch (error) {
        console.error('[DSA Tracker Injected] Error intercepting status check:', error);
        showDebugNotification('Error intercepting status check: ' + error.message, 'error');
      }
    }
    
    // For all other requests, just use the original fetch
    return originalFetch.apply(this, args);
  };
  
  // Clean up old submissions after 5 minutes
  setInterval(() => {
    if (window.__DSA_TRACKER_SUBMISSIONS) {
      const now = Date.now();
      Object.keys(window.__DSA_TRACKER_SUBMISSIONS).forEach(id => {
        const submission = window.__DSA_TRACKER_SUBMISSIONS[id];
        if (now - submission.timestamp > 5 * 60 * 1000) {
          delete window.__DSA_TRACKER_SUBMISSIONS[id];
        }
      });
    }
  }, 60 * 1000); // Check every minute
  
  console.log('[DSA Tracker Injected] Fetch interceptor installed and ready');
  showDebugNotification('DSA Tracker fetch interceptor installed and ready', 'success');
})();
`;

// Reference fetchInterceptorScript to avoid linter 'assigned but never used'
void fetchInterceptorScript;

/**
 * Injects the fetch interceptor script into the page context
 */
export function injectFetchInterceptor(): void {
  try {
    // Create a script element pointing to our external interceptor bundle
    const scriptElement = document.createElement('script');
    scriptElement.src = chrome.runtime.getURL('pageFetchInterceptor.js');
    scriptElement.type = 'text/javascript';
    // Append to page
    (document.head || document.documentElement).appendChild(scriptElement);
    // Remove after loading
    scriptElement.onload = () => scriptElement.remove();
    console.log('[DSA Tracker] Injected external fetch interceptor');
  } catch (error) {
    console.error('[DSA Tracker] Failed to inject external fetch interceptor:', error);
  }
}

/**
 * Interface for the data structure of an accepted submission
 */
export interface AcceptedSubmissionData {
  submissionId: string;
  trackerId: string;
  code?: string;
  lang?: string;
  questionId?: string;
  runtime?: string;
  memory?: string;
  timestamp: number;
}

/**
 * Listen for the custom event from the injected script
 */
export function listenForAcceptedSubmissions(callback: (data: AcceptedSubmissionData) => void): void {
  console.log('[DSA Tracker] Setting up listener for accepted submissions');
  
  window.addEventListener('DSA_TRACKER_SUBMISSION_ACCEPTED', ((event: CustomEvent<AcceptedSubmissionData>) => {
    console.log('[DSA Tracker] Received accepted submission event:', event.detail);
    callback(event.detail);
  }) as EventListener);
  
  console.log('[DSA Tracker] Listener for accepted submissions set up');
} 