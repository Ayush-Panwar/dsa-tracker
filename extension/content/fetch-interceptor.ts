/**
 * This is the entry point for the fetch interceptor content script.
 * It runs at document_start to ensure we can intercept network requests
 * before the page's JavaScript has a chance to make any.
 */

import { injectFetchInterceptor, listenForAcceptedSubmissions, AcceptedSubmissionData } from './injectScript';

// Log that the fetch interceptor content script is running
console.log('[DSA Tracker] Fetch interceptor content script loaded');

// Inject the fetch interceptor as soon as possible
injectFetchInterceptor();

// Listen for accepted submissions and send them to the background script
listenForAcceptedSubmissions((submissionData: AcceptedSubmissionData) => {
  console.log('[DSA Tracker] Received accepted submission in content script:', submissionData);
  
  // Send the accepted submission data to the background script
  chrome.runtime.sendMessage({
    type: 'ACCEPTED_SUBMISSION',
    data: submissionData
  }, response => {
    if (chrome.runtime.lastError) {
      console.error('[DSA Tracker] Error sending accepted submission to background:', chrome.runtime.lastError);
    } else {
      console.log('[DSA Tracker] Background script response to accepted submission:', response);
    }
  });
}); 