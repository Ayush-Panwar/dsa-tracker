// Background script for the DSA Tracker extension
import { storageService } from '../lib/storage';

// Connectivity check URL
const CONNECTIVITY_CHECK_URL = 'https://www.google.com';
// API base URL
// @ts-expect-error - process.env.API_BASE_URL is injected by webpack.DefinePlugin
const API_BASE_URL: string = process.env.API_BASE_URL || 'http://localhost:3000';
// Global variable to track online status
let onlineStatus = true; // Default to online, will be checked immediately

// Add these type definitions at the top of the file, before any functions
interface RunData {
  problemId: string;
  code: string;
  language: string;
  status?: string;
  runtime?: string | number;
  memory?: string | number;
}

interface SubmissionData {
  problemId: string;
  code: string;
  language: string;
  status?: string;
  runtime?: string | number;
  memory?: string | number;
  externalId?: string; // For tracking submissions from external sources
  errorMessage?: string; // For error messages from the submission
}

// Define an interface for the problem info response
interface ProblemInfoResponse {
  success: boolean;
  problem?: {
    title: string;
    difficulty: string;
    url: string;
    description?: string;
    examples?: Record<string, unknown>; // Replace 'any' with more specific type
    tags?: string[]; // Array of problem tags
  };
}

// Define interfaces for our data structures
interface AcceptedSubmissionData {
  submissionId: string;
  trackerId: string;
  code?: string;
  lang?: string;
  questionId?: string;
  runtime?: string;
  memory?: string;
  timestamp: number;
}

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('DSA Tracker extension installed');
  
  // Initialize online status
  checkConnectivity().then(isOnline => {
    onlineStatus = isOnline;
    storageService.setOnlineStatus(isOnline);
  });
  
  // Set up periodic sync check
  setInterval(syncData, SYNC_INTERVAL);
  
  // Set up connectivity check
  setInterval(checkConnectivity, CONNECTIVITY_CHECK_INTERVAL);
});

// Sync data periodically
const SYNC_INTERVAL = 15 * 60 * 1000; // 15 minutes
const CONNECTIVITY_CHECK_INTERVAL = 30 * 1000; // 30 seconds

async function syncData() {
  const authData = await storageService.getAuth();
  
  // Only sync if user is logged in and online
  if (!authData || !onlineStatus) return;
  
  try {
    console.log('Starting sync process...');
    
    // Sync problems
    const problems = await storageService.getProblems();
    if (problems.length > 0) {
      console.log(`Syncing ${problems.length} problems...`);
      const response = await fetch(`${API_BASE_URL}/api/extension/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify({ problems })
      });
      
      if (response.ok) {
        await storageService.updateSyncTimestamp();
        console.log('Problems synced successfully');
      }
    }
    
    // Sync submissions
    const pendingSubmissions = await storageService.getPendingSubmissions();
    if (pendingSubmissions.length > 0) {
      console.log(`Syncing ${pendingSubmissions.length} pending submissions...`);
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/submissions/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.token}`
          },
          body: JSON.stringify({ submissions: pendingSubmissions })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Submissions sync result:', result);
          
          // Mark submissions as synced
          for (const submission of pendingSubmissions) {
            await storageService.updateSubmissionStatus(submission.id, 'synced');
          }
          
          console.log('Submissions synced successfully');
        } else {
          console.error('Failed to sync submissions:', await response.text());
        }
      } catch (error) {
        console.error('Error syncing submissions:', error);
      }
    }
    
    // Sync error data
    const pendingErrors = await storageService.getPendingErrors();
    if (pendingErrors.length > 0) {
      console.log(`Syncing ${pendingErrors.length} pending errors...`);
      const response = await fetch(`${API_BASE_URL}/api/errors/submit/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify({ errors: pendingErrors })
      });
      
      if (response.ok) {
        // Mark synced errors
        const syncedIds = await response.json();
        for (const id of syncedIds.errorIds) {
          await storageService.updateErrorStatus(id, 'synced');
        }
        console.log('Errors synced successfully');
      }
    }
    
    // Sync test cases
    const pendingTestCases = await storageService.getPendingTestCases();
    if (pendingTestCases.length > 0) {
      console.log(`Syncing ${pendingTestCases.length} pending test cases...`);
      const response = await fetch(`${API_BASE_URL}/api/testcases/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify({ testCases: pendingTestCases })
      });
      
      if (response.ok) {
        // Mark synced test cases
        const syncedIds = await response.json();
        for (const id of syncedIds.testCaseIds) {
          await storageService.updateTestCaseStatus(id, 'synced');
        }
        console.log('Test cases synced successfully');
      }
    }
    
    // Sync bug reports
    const bugs = await storageService.getBugs();
    if (bugs.length > 0) {
      console.log(`Syncing ${bugs.length} bug reports...`);
      await fetch(`${API_BASE_URL}/api/extension/bugs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify({ bugs })
      });
      console.log('Bug reports synced successfully');
    }
    
    console.log('Sync completed successfully');
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

/**
 * Check if we're online
 */
async function checkConnectivity(): Promise<boolean> {
  try {
    await fetch(CONNECTIVITY_CHECK_URL, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
    });
    const newStatus = true;
    if (onlineStatus !== newStatus) {
      onlineStatus = newStatus;
      storageService.setOnlineStatus(newStatus);
      
      // If we just came online, try to sync
      if (newStatus) {
        syncData();
      }
    }
    return true;
  } catch (_) {
    void _; // Use the parameter to avoid linter error
    const newStatus = false;
    if (onlineStatus !== newStatus) {
      onlineStatus = newStatus;
      storageService.setOnlineStatus(newStatus);
    }
    return false;
  }
}

/**
 * Creates headers with authentication information.
 * It will check for token expiry and attempt to refresh it if necessary.
 */
async function createAuthHeaders(): Promise<Record<string, string>> {
  let authData = await storageService.getAuth();

  // If token is expired, try to refresh it.
  // Add a buffer of 60 seconds to refresh before it actually expires
  if (authData && Date.now() >= authData.expiresAt - 60000) {
    console.log('DSA Tracker: Auth token is expiring or has expired, attempting refresh.');
    const refreshed = await refreshSession();
    if (refreshed) {
      // Get the new auth data from storage
      authData = await storageService.getAuth();
    } else {
      console.log('DSA Tracker: Token refresh failed. User may need to log in again.');
      // Clear auth data if refresh fails
      authData = null;
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Client-Info': 'dsa-tracker-extension/1.0.0'
  };

  if (authData?.token) {
    // Ensure token is properly formatted with Bearer prefix (case-sensitive)
    headers['Authorization'] = `Bearer ${authData.token.trim()}`;
    
    // Debug token to console
    console.log(`DSA Tracker: Using auth token (first 10 chars): ${authData.token.substring(0, 10)}...`);
    
    // Debug auth once in a while (don't do this on every request)
    debugAuth(headers);
  } else {
    console.log('DSA Tracker: No authentication token available');
  }

  // Always try to include cookies if they exist
  const cookies = await getCookiesForDomain(new URL(API_BASE_URL).hostname);
  if (cookies) {
    headers['Cookie'] = cookies;
  } else if (authData?.sessionCookie) {
    headers['Cookie'] = authData.sessionCookie;
  }

  return headers;
}

/**
 * Debug the authentication by testing against the debug endpoint
 */
async function debugAuth(headers: Record<string, string>) {
  if (Math.random() > 0.2) return; // Only debug ~20% of the time to avoid spam
  
  try {
    console.log('DSA Tracker: Testing authentication against debug endpoint');
    const response = await fetch(`${API_BASE_URL}/api/auth/debug`, {
      method: 'GET',
      headers,
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('DSA Tracker: Auth debug response:', data);
      
      if (data.userFromToken) {
        console.log(`DSA Tracker: Authentication SUCCESSFUL for user ${data.userFromToken.email}`);
      } else if (data.userFromCookie) {
        console.log(`DSA Tracker: Cookie auth worked, but token auth failed for user ${data.userFromCookie.email}`);
      } else {
        console.error('DSA Tracker: Authentication FAILED - no user found');
      }
    } else {
      console.error(`DSA Tracker: Auth debug request failed: ${response.status}`);
    }
  } catch (error) {
    console.error('DSA Tracker: Auth debug error:', error);
  }
}

/**
 * Attempt to refresh the session using the refresh token.
 */
async function refreshSession(): Promise<boolean> {
  try {
    const authData = await storageService.getAuth();
    if (!authData?.refreshToken) {
      console.log('DSA Tracker: No refresh token available.');
      return false;
    }

    console.log('DSA Tracker: Attempting to refresh session with refresh token.');

    // This endpoint should use the refresh_token to get a new session from Supabase
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Info': 'dsa-tracker-extension/1.0.0'
      },
      body: JSON.stringify({
        refreshToken: authData.refreshToken // Backend should expect this
      }),
      credentials: 'include'
    });

    if (response.ok) {
      const newSession = await response.json();

      if (newSession.token && newSession.user) {
        // Assuming the refresh endpoint returns a full new AuthData-like object
        const newAuthData = {
          token: newSession.token,
          refreshToken: newSession.refreshToken || authData.refreshToken,
          expiresAt: Date.now() + ((newSession.expiresIn || 3600) * 1000),
          user: newSession.user,
          sessionCookie: authData.sessionCookie // Preserve original cookie unless updated
        };
        await storageService.saveAuth(newAuthData);

        // After saving, let's also update the cookie from the browser's storage
        const cookies = await getCookiesForDomain(new URL(API_BASE_URL).hostname);
        if (cookies) {
          await storageService.updateAuth({ sessionCookie: cookies });
        }

        console.log('DSA Tracker: Session refreshed and saved successfully.');
        return true;
      } else {
        console.error('DSA Tracker: Refresh endpoint response is missing required data.', newSession);
        return false;
      }
    } else {
      const errorText = await response.text();
      console.error('DSA Tracker: Failed to refresh session:', { status: response.status, error: errorText });
      // If refresh fails (e.g. 401), we're likely logged out for good.
      await storageService.clearAuth();
    }
    return false;
  } catch (error) {
    console.error('DSA Tracker: Error during session refresh:', error);
    return false;
  }
}

/**
 * Get cookies for a specific domain
 */
async function getCookiesForDomain(domain: string): Promise<string> {
  const cookies: string[] = [];
  
  try {
    // Note: this requires the "cookies" permission in manifest.json
    const chromeCookies = await chrome.cookies.getAll({ domain });
    
    for (const cookie of chromeCookies) {
      cookies.push(`${cookie.name}=${cookie.value}`);
    }
    
    return cookies.join('; ');
  } catch (error) {
    console.error('Error getting cookies:', error);
    return '';
  }
}

/**
 * Extract numeric ID from problem slug or title
 */
function extractNumericId(problemId: string): string {
  // If it's already numeric, return as is
  if (/^\d+$/.test(problemId)) {
    return problemId;
  }
  
  // Check if it's a URL or contains a numeric part
  const urlMatch = problemId.match(/\/problems\/([^/]+)/);
  if (urlMatch) {
    problemId = urlMatch[1];
  }
  
  // If we can extract a numeric ID (like "386-lexicographical-numbers" -> "386")
  const numericIdMatch = problemId.match(/^(\d+)[-_]?/);
  if (numericIdMatch) {
    return numericIdMatch[1];
  }
  
  // If problem ID contains "lexicographical-numbers", map to "386"
  if (problemId.includes('lexicographical-numbers')) {
    return '386';
  }
  
  // Otherwise, return the original ID
  return problemId;
}

/**
 * Get the current active tab
 */
async function getCurrentTab() {
  const queryOptions = { active: true, currentWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

/**
 * Handle code run data (no-op since we're not tracking code runs)
 */
async function handleCodeRun(_data: RunData): Promise<{success: boolean, error?: string}> {
  void _data; // Acknowledge unused parameter
  console.log('Code run tracking is disabled - ignoring code run');
  // This is a no-op function since we're not tracking code runs anymore
  return { success: true };
}

/**
 * Handle sending a submission to the backend
 */
async function handleSubmission(data: SubmissionData): Promise<{success: boolean, error?: string}> {
  try {
    if (!onlineStatus) {
      console.log("DSA Tracker: Offline, storing submission locally");
      return { success: true, error: 'Offline mode - data stored locally' };
    }
    
    // Get auth headers
    const headers = await createAuthHeaders();
    
    if (!headers['Authorization']) {
      console.log("DSA Tracker: No auth token, storing locally");
      return { success: true, error: 'Not logged in - data stored locally' };
    }
    
    // Ensure the problem exists, but don't worry if it doesn't - we'll create it at the API level
    // We just need to get problem details for creating it if needed
    let problemDetails = null;
    const tab = await getCurrentTab();
    if (tab && tab.id) {
      try {
        const response = await new Promise<ProblemInfoResponse>((resolve) => {
          chrome.tabs.sendMessage(tab.id!, { action: 'getProblemInfo' }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Error getting problem info:', chrome.runtime.lastError);
              resolve({ success: false });
            } else {
              resolve(response as ProblemInfoResponse);
            }
          });
        });
        
        if (response && response.success) {
          problemDetails = response.problem;
        }
      } catch (err) {
        console.error('Error getting problem details:', err);
      }
    }
    
    // Prepare submission data for the API
    const formattedId = extractNumericId(data.problemId);
    const submissionData = {
      problemId: formattedId,
      leetcodeSubmissionId: data.externalId || `submission_${Date.now()}`,
      code: data.code,
      language: data.language,
      status: data.status,
      runtime: data.runtime,
      memory: data.memory,
      errorMessage: data.errorMessage,
      // Include problem details for creation if needed
      platformTitle: problemDetails?.title,
      platformDifficulty: problemDetails?.difficulty,
      platformUrl: problemDetails?.url,
      platformDescription: problemDetails?.description,
      platformTags: problemDetails?.tags // Include problem tags
    };
      
    // Send the submission to the API
    console.log("DSA Tracker: Sending submission to API:", {
      problemId: submissionData.problemId,
      status: submissionData.status,
      includesProblemDetails: !!problemDetails
    });
    
    const response = await fetch(`${API_BASE_URL}/api/submissions/track`, {
        method: 'POST',
        headers,
      credentials: 'include',
      body: JSON.stringify(submissionData)
      });
      
      if (response.status === 401) {
      console.error("DSA Tracker: Authentication failed submitting solution");
      return { success: false, error: 'Authentication failed' };
      }
      
      if (!response.ok) {
        const errorText = await response.text();
      console.error("DSA Tracker: Failed to submit solution:", errorText);
      return { success: false, error: errorText };
          }
          
    const result = await response.json();
    console.log("DSA Tracker: Submission sent successfully:", {
      submissionId: result.submission?.id,
      isNew: result.isNew
    });
      
      return { success: true };
  } catch (error) {
    console.error("DSA Tracker: Error sending submission:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message.type);
  
  // Handle accepted submissions from the fetch interceptor
  if (message.type === 'ACCEPTED_SUBMISSION') {
    console.log('Received accepted submission:', message.data);
    
    // Get the page URL from the sender tab
    const pageUrl = sender.tab?.url;
    
    // Process the accepted submission
    handleAcceptedSubmission(message.data, pageUrl)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('Error handling accepted submission:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Keep the message channel open for async response
  }
  
  // Handle other message types
  if (message.action === 'sendSubmission') {
    handleSubmission(message.data)
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }
  
  if (message.action === 'sendCodeRun') {
    handleCodeRun(message.data)
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }
  
  return false; // For synchronous responses
});

/**
 * Handle an accepted submission from the content script
 * @param submissionData The data from the accepted submission
 * @param pageUrl The URL of the page where the submission was made
 */
async function handleAcceptedSubmission(submissionData: AcceptedSubmissionData, pageUrl?: string) {
  try {
    console.log('Processing accepted submission:', submissionData);
    
    if (!pageUrl) {
      console.error('No URL provided for submission');
      return;
    }
    
    // Extract problem slug from URL
    const problemSlug = extractProblemSlugFromUrl(pageUrl);
    if (!problemSlug) {
      console.error('Could not extract problem slug from URL:', pageUrl);
      return;
    }
    
    console.log(`Processing accepted submission for problem: ${problemSlug}`);
    
    // Store the submission in local storage
    const submissionRecordId = crypto.randomUUID();
    await storageService.addSubmission({
      id: submissionRecordId,
      problemId: problemSlug,
      submissionId: submissionData.submissionId,
      code: submissionData.code || '',
      language: submissionData.lang || 'unknown',
      status: 'Accepted',
      runtime: submissionData.runtime,
      memory: submissionData.memory,
      timestamp: submissionData.timestamp,
      syncStatus: 'pending'
    });
    console.log('Submission stored in local storage with internal ID:', submissionRecordId);
    
    // Prepare data for API call
    const apiData: SubmissionData = {
      problemId: problemSlug,
      code: submissionData.code || '',
      language: submissionData.lang || 'unknown',
      status: 'Accepted',
      runtime: submissionData.runtime,
      memory: submissionData.memory,
      externalId: submissionData.submissionId,
    };
    
    // Attempt to send via the standard handler
    if (onlineStatus) {
      const result = await handleSubmission(apiData);
      if (result.success) {
        console.log('Submission sent successfully via handleSubmission');
        await storageService.updateSubmissionStatus(submissionRecordId, 'synced');
      } else {
        console.log('Submission API call failed, will retry on next sync:', result.error);
      }
    } else {
      console.log('Offline - submission will be synced later');
    }
    
    console.log('Finished processing accepted submission');
  } catch (error) {
    console.error('Error processing accepted submission:', error);
    throw error;
  }
}

/**
 * Extract the problem slug from a LeetCode URL
 */
function extractProblemSlugFromUrl(url: string): string | null {
  const match = url.match(/\/problems\/([^/]+)/);
  return match ? match[1] : null;
}

// Listen for tab updates to initialize tracking on LeetCode problem pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only run when the page is fully loaded
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('leetcode.com/problems/')) {
    console.log(`DSA Tracker: Detected LeetCode problem page load: ${tab.url}`);
    
    // Initialize tracking in the content script
    chrome.tabs.sendMessage(tabId, { action: 'initializeTracking' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('DSA Tracker: Error initializing tracking:', chrome.runtime.lastError);
      } else if (response && response.success) {
        console.log('DSA Tracker: Tracking initialized successfully');
      }
    });
  }
}); 

// Add listeners for Monaco editor access
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'detect-monaco') {
    detectMonacoInPage(sender.tab?.id).then(result => {
      sendResponse(result);
    });
    return true; // Keep the message channel open for async response
  }
  
  if (request.action === 'get-monaco-code') {
    getMonacoCodeFromPage(request.tabId || sender.tab?.id).then(result => {
      sendResponse({
        code: result.code,
        error: result.error,
        source: result.source
      });
    });
    return true; // Keep the message channel open for async response
  }
  
  if (request.action === 'get-tab-id') {
    sendResponse({ tabId: sender.tab?.id });
    return true;
  }
  
  // Remove duplicate handlers for sendCodeRun and sendSubmission
  // These are already handled in the first message listener
  
  return false; // For unhandled messages
});

// Listen for long-lived connections from content script
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "monaco-access") {
    console.log("DSA Tracker: Established connection with tab for Monaco access");
    
    // Listen for messages on this port
    port.onMessage.addListener(async (message) => {
      if (message.action === 'detect-monaco') {
        const result = await detectMonacoInPage(port.sender?.tab?.id);
        port.postMessage({ action: 'monaco-detected', found: result.found });
      }
      
      if (message.action === 'get-monaco-code') {
        const result = await getMonacoCodeFromPage(port.sender?.tab?.id);
        port.postMessage({ 
          action: 'monaco-code', 
          code: result.code, 
          source: result.source,
          error: result.error
        });
      }
    });
    
    // Handle disconnection
    port.onDisconnect.addListener(() => {
      console.log("DSA Tracker: Connection with tab closed");
    });
  }
});

// Function to detect Monaco editor in a page using chrome.scripting
async function detectMonacoInPage(tabId?: number): Promise<{ found: boolean }> {
  if (!tabId) {
    console.error("DSA Tracker: No tab ID provided for Monaco detection");
    return { found: false };
  }
  
  try {
    // Execute the detection script in the page context
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: () => {
        // This function runs in the page context
        try {
          // Cast window to our custom type
          const win = window as unknown as {
            monaco?: {
              editor?: {
                getEditors?: () => unknown[];
              };
            };
          };
          
          // Properly check for monaco in the window object
          const hasMonaco = 'monaco' in window && 
                           win.monaco !== undefined && 
                           win.monaco !== null;
          
          // Check if the monaco object has the editor property
          const hasEditor = hasMonaco && 
                           win.monaco && 'editor' in win.monaco && 
                           win.monaco.editor !== undefined;
          
          // Check if the editor has the getEditors method
          const hasGetEditors = hasEditor && 
                               win.monaco?.editor && 'getEditors' in win.monaco.editor && 
                               typeof win.monaco.editor.getEditors === 'function';
          
          // Try to actually call getEditors to verify it works
          let editorsExist = false;
          if (hasGetEditors && win.monaco?.editor?.getEditors) {
            try {
              const editors = win.monaco.editor.getEditors();
              editorsExist = Array.isArray(editors) && editors.length > 0;
            } catch (e) {
              console.error("Error calling getEditors:", e);
            }
          }
          
          return {
            hasMonaco,
            hasEditor,
            hasGetEditors,
            editorsExist,
            isReady: hasMonaco && hasEditor && hasGetEditors
          };
        } catch (e) {
          console.error("Error in Monaco detection:", e);
          return { 
            hasMonaco: false, 
            hasEditor: false, 
            hasGetEditors: false, 
            editorsExist: false,
            isReady: false,
            error: String(e)
          };
        }
      }
    });
    
    // Check the result
    const result = results[0]?.result;
    const found = result?.isReady || false;
    
    // Log more detailed information
    console.log(`DSA Tracker: Monaco detection in tab ${tabId}:`, result);
    
    return { found };
  } catch (error) {
    console.error("DSA Tracker: Error detecting Monaco editor:", error);
    return { found: false };
  }
}

// Function to get code from Monaco editor in a page using chrome.scripting
async function getMonacoCodeFromPage(tabId?: number): Promise<{ code: string | null, error?: string, source?: string }> {
  if (!tabId) {
    console.error("DSA Tracker: No tab ID provided for getting Monaco code");
    return { code: null, error: "No tab ID provided" };
  }
  
  try {
    // Execute the script to get code and editor information in the page context
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: () => {
        // This function runs in the page context
        try {
          // Cast window to our custom type
          const win = window as unknown as {
            monaco?: {
              editor?: {
                getEditors?: () => Array<{
                  getValue?: () => string;
                  getId?: () => string;
                  getModel?: () => { getId?: () => string };
                }>;
              };
            };
          };
          
          // Try to gather comprehensive information about the editor state
          const info = {
            hasMonaco: 'monaco' in window,
            hasEditor: 'monaco' in window && win.monaco && 'editor' in win.monaco,
            hasGetEditors: false,
            editorsCount: 0,
            editorIds: [] as string[],
            domEditorCount: document.querySelectorAll('.monaco-editor').length,
            editorModel: null as { id?: string; uri?: string } | null,
            code: null as string | null,
            source: 'none',
            codeLength: 0,
            codePreview: '',
            attemptedMethods: [] as string[]
          };
          
          // Only try the official Monaco API
          info.attemptedMethods.push('monaco-api');
          if (info.hasEditor && win.monaco?.editor) {
            try {
              info.hasGetEditors = typeof win.monaco.editor.getEditors === 'function';
              
              if (info.hasGetEditors && win.monaco.editor.getEditors) {
                const editors = win.monaco.editor.getEditors();
                info.editorsCount = editors.length;
                
                // Get IDs of all editors for debugging
                editors.forEach(editor => {
                  if (editor.getId) {
                    info.editorIds.push(editor.getId());
                  }
                });
                
                if (editors.length > 0) {
                  const editor = editors[0];
                  if (editor.getModel && typeof editor.getModel === 'function') {
                    const model = editor.getModel();
                    if (model) {
                      const modelInfo: { id?: string; uri?: string } = {
                        id: typeof model.getId === 'function' ? model.getId() : undefined
                      };
                      
                      // Try to access URI safely
                      try {
                        // We have to use any here since we don't know the structure of Monaco's model
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const uri = (model as any).uri;
                        if (uri && typeof uri.toString === 'function') {
                          modelInfo.uri = uri.toString();
                        }
                      } catch (err) {
                        void err; // Acknowledge unused variable
                      }
                      
                      info.editorModel = modelInfo;
                    }
                  }
                  
                  if (editor.getValue && typeof editor.getValue === 'function') {
                    info.code = editor.getValue();
                    info.source = 'monaco-api';
                    info.codeLength = info.code.length;
                    info.codePreview = info.code.substring(0, 100) + (info.code.length > 100 ? '...' : '');
                    console.log(`[Page Context] Successfully retrieved code via Monaco API: ${info.codeLength} chars`);
                    return { code: info.code, info };
                  }
                }
              }
            } catch (e) {
              console.error("[Page Context] Error accessing Monaco API:", e);
              info.attemptedMethods.push('monaco-api-failed');
            }
          }
          
          // If we got this far, we couldn't find any code
          console.log(`[Page Context] Failed to find code using Monaco API. Monaco available: ${info.hasMonaco}, Editor available: ${info.hasEditor}, GetEditors available: ${info.hasGetEditors}`);
      return { 
            code: null, 
            error: "No code found using Monaco API",
            info 
          };
        } catch (e) {
          console.error("[Page Context] Error in code extraction:", e);
    return { 
            code: null, 
            error: e instanceof Error ? e.message : String(e)
          };
        }
      }
    });
    
    // Check the result
    const result = results[0]?.result;
    const code = result?.code || null;
    const error = result?.error;
    const info = result?.info;
    const source = info?.source || 'unknown';
    
    if (code) {
      console.log(`DSA Tracker: Got code from page in tab ${tabId}: ${code.length} chars, source: ${source}`);
      console.log(`DSA Tracker: Code preview: ${code.substring(0, 100)}${code.length > 100 ? '...' : ''}`);
      console.log(`DSA Tracker: Editor info:`, info);
    } else {
      console.log(`DSA Tracker: Failed to get code from Monaco API in tab ${tabId}: ${error}`);
      console.log(`DSA Tracker: Monaco info: available=${info?.hasMonaco}, editor=${info?.hasEditor}, getEditors=${info?.hasGetEditors}, editorCount=${info?.editorsCount}`);
    }
    
    return { code, error, source };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("DSA Tracker: Error getting code from page:", error);
    return { code: null, error: errorMsg };
  }
} 