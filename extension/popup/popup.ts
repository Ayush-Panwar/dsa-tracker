import { storageService, AuthData } from '../lib/storage';

// Add a configurable API URL that can be updated easily
// @ts-expect-error - process.env.API_BASE_URL is injected by webpack.DefinePlugin
const API_BASE_URL: string = process.env.API_BASE_URL || 'http://localhost:3000';

// Add interfaces for problem data types
// interface Example {
//   input: string;
//   output: string;
//   explanation?: string;
// }

interface ProblemInfo {
  title: string;
  difficulty: string;
  leetcodeId: string;
  url: string;
  timestamp: number;
  description?: string;
  examples?: string;
  tags?: string[];
}

document.addEventListener('DOMContentLoaded', async () => {
  const loginSection = document.getElementById('login-section');
  const problemSection = document.getElementById('problem-section');
  const connectionStatus = document.getElementById('connection-status');
  const loginForm = document.getElementById('login-form') as HTMLFormElement;
  const loginError = document.getElementById('login-error');
  const logoutBtn = document.getElementById('logout-btn');
  const trackBtn = document.getElementById('track-btn');
  const actionStatus = document.getElementById('action-status');
  const errorPatternsBtn = document.getElementById('error-patterns-btn');
  
  // Check if user is logged in
  const authData = await storageService.getAuth();
  
  if (authData && isTokenValid(authData)) {
    showLoggedInState(authData);
  } else {
    showLoggedOutState();
  }
  
  // Handle login form submission
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    
    if (!emailInput || !passwordInput) return;
    
    const email = emailInput.value;
    const password = passwordInput.value;
    
    if (!email || !password) {
      if (loginError) loginError.textContent = 'Please enter both email and password';
      return;
    }
    
    try {
      // Show loading status
      if (loginError) loginError.textContent = 'Logging in...';
      
      // Call the API to authenticate
      const response = await fetch(`${API_BASE_URL}/api/extension/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Info': 'dsa-tracker-extension/1.0.0' // Supabase client info
        },
        body: JSON.stringify({ email, password }),
        credentials: 'same-origin' // Changed from 'include' to 'same-origin'
      });
      
      // Get the response data
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Login failed. Check your credentials.');
      }
      
      console.log('Login successful:', data);
      
      // Check if we have the expected data structure
      if (!data.token || !data.user || !data.user.id) {
        throw new Error('Invalid response from server');
      }
      
      // Extract and store all cookies from the response
      const cookies: Record<string, string> = {};
      // The Headers.getAll method is not available in all browsers,
      // so we need to handle both cases
      let setCookieHeaders: string[] = [];
      const cookieHeader = response.headers.get('set-cookie');
      if (cookieHeader) {
        setCookieHeaders = [cookieHeader];
      }
      
      if (setCookieHeaders && setCookieHeaders.length > 0) {
        console.log('Got cookies from login response:', setCookieHeaders);
        
        // Parse the cookies
        for (const cookieStr of setCookieHeaders) {
          if (!cookieStr) continue;
          const cookieParts = cookieStr.split(';')[0].split('=');
          if (cookieParts.length >= 2) {
            const name = cookieParts[0].trim();
            const value = cookieParts.slice(1).join('=').trim();
            cookies[name] = value;
          }
        }
      }
      
      // Create cookie string for future requests
      let cookieString = '';
      for (const [name, value] of Object.entries(cookies)) {
        cookieString += `${name}=${value}; `;
      }
      
      // Check for Supabase auth cookies (for debugging purposes)
      const supabaseCookies = Object.keys(cookies).filter(name => 
        name.startsWith('sb-') || 
        name.startsWith('supabase-') || 
        name.includes('auth-token')
      );
      
      if (supabaseCookies.length > 0) {
        console.log('Found Supabase auth cookies:', supabaseCookies);
      } else {
        console.log('No Supabase auth cookies found, using token authentication');
      }
      
      console.log('Session cookies parsed:', Object.keys(cookies));
      
      // Check for token in data.session for Supabase
      let accessToken = data.token;
      let refreshToken = data.refreshToken || '';
      
      // Some Supabase implementations might include session data
      if (data.session) {
        if (data.session.access_token) {
          accessToken = data.session.access_token;
          console.log('Using access_token from session data');
        }
        
        if (data.session.refresh_token) {
          refreshToken = data.session.refresh_token;
          console.log('Using refresh_token from session data');
        }
      }
      
      // Save auth data with cookies
      await storageService.saveAuth({
        token: accessToken,
        refreshToken: refreshToken,
        expiresAt: Date.now() + ((data.expiresIn || 3600) * 1000),
        sessionCookie: cookieString, // Store all cookies
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
        },
      });
      
      // Test the saved credentials immediately
      try {
        const testAuth = await storageService.getAuth();
        console.log('Testing auth credentials...');
        
        const testResponse = await fetch(`${API_BASE_URL}/api/user/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testAuth?.token}`,
            'X-Client-Info': 'dsa-tracker-extension/1.0.0',
            'Cookie': testAuth?.sessionCookie || ''
          },
          credentials: 'same-origin'
        });
        
        if (testResponse.ok) {
          console.log('Auth test successful!');
        } else {
          console.warn('Auth test failed:', await testResponse.text());
          // Try to extract anon key and other details from page for debugging
          console.log('Attempting to extract Supabase config from backend...');
          const configResponse = await fetch(`${API_BASE_URL}/api/config`, {
            method: 'GET',
            credentials: 'same-origin'
          });
          
          if (configResponse.ok) {
            console.log('Config data:', await configResponse.json());
          }
        }
      } catch (testError) {
        console.warn('Auth test error:', testError);
      }
      
      // Get the saved auth data and confirm it was stored
      const savedAuth = await storageService.getAuth();
      if (!savedAuth || !savedAuth.token) {
        throw new Error('Failed to save authentication data');
      }
      
      showLoggedInState(savedAuth);
      
    } catch (error) {
      console.error('Login error:', error);
      if (loginError) loginError.textContent = error instanceof Error ? error.message : 'Login failed';
    }
  });
  
  // Handle logout
  logoutBtn?.addEventListener('click', async () => {
    await storageService.clearAuth();
    showLoggedOutState();
  });
  
  // Helper function to create auth headers for Supabase
  async function createAuthHeaders(): Promise<Record<string, string>> {
    const authData = await storageService.getAuth();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Client-Info': 'dsa-tracker-extension/1.0.0'
    };
    
    // Check for Supabase session data in different formats
    if (authData?.token) {
      headers['Authorization'] = `Bearer ${authData.token}`;
    }
    
    // Add all available cookies to increase chances of successful auth
    if (authData?.sessionCookie) {
      headers['Cookie'] = authData.sessionCookie;
    }
    
    return headers;
  }
  
  // Handle tracking problems
  trackBtn?.addEventListener('click', async () => {
    // First check if we're on a LeetCode problem page
    chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.id) {
        setActionStatus('Error: Cannot access current tab');
        return;
      }

      if (!tab.url?.includes('leetcode.com/problems/')) {
        setActionStatus('Not on a LeetCode problem page');
        return;
      }
      
      setActionStatus('Tracking problem...');
      
      try {
        // Get problem info from content script
        const response = await new Promise<{problem?: ProblemInfo, error?: string}>((resolve) => {
          chrome.tabs.sendMessage(
            tab.id as number, 
            {action: 'getProblemInfo'}, 
            (response) => {
              // Handle case where content script doesn't respond
              if (!response) {
                console.error("DSA Tracker: No response from content script");
                resolve({ error: "Content script not responding - refresh the page" });
                return;
              }
              resolve(response);
            }
          );
          
          // Set a timeout in case the message never returns
          setTimeout(() => {
            resolve({ error: "Content script timeout - refresh the page" });
          }, 5000);
        });
        
        console.log("DSA Tracker: Response from content script", response);
        
        if (response.error) {
          setActionStatus(`Error: ${response.error}`);
          return;
        }
        
        if (!response.problem) {
          setActionStatus('Error: Could not get problem info');
          return;
        }
        
        const problem = response.problem;
        const authData = await storageService.getAuth();
        
        if (!authData) {
          setActionStatus('Error: Not logged in');
          return;
        }
        
        // Get authentication headers
        const headers = await createAuthHeaders();
        
        // Send to backend API
        const requestBody = {
          title: problem.title,
          platformId: problem.leetcodeId,
          platform: 'LeetCode',
          difficulty: problem.difficulty !== 'Unknown' ? problem.difficulty : 'Medium',
          url: problem.url,
          status: 'Attempted',
          description: problem.description || null,
          examples: problem.examples || null,
          tags: problem.tags && problem.tags.length > 0 ? problem.tags.map(tag => ({
            name: tag,
            color: getTagColor(tag)
          })) : []
        };
        
        console.log("DSA Tracker: Sending problem to API:", requestBody);
        
        const apiResponse = await fetch(`${API_BASE_URL}/api/problems`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify(requestBody)
        });
        
        const responseText = await apiResponse.text();
        console.log("DSA Tracker: API response:", apiResponse.status, responseText);
        
        if (apiResponse.status === 401) {
          console.error("DSA Tracker: Authentication failed. Please try logging in again.");
          setActionStatus('Authentication failed. Please log in again.');
          return;
        }
        
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch (e) {
          console.error("DSA Tracker: Error parsing API response:", e);
          responseData = { error: "Invalid response format" };
        }
        
        if (apiResponse.ok) {
          setActionStatus('Problem tracked successfully!');
          console.log("DSA Tracker: Problem tracked successfully:", responseData);
          
          // Also save to local storage
          await storageService.addProblem({
            id: crypto.randomUUID(),
            title: problem.title,
            leetcodeId: problem.leetcodeId,
            difficulty: problem.difficulty as 'Easy' | 'Medium' | 'Hard',
            categories: [],
            url: problem.url,
            timestamp: problem.timestamp
          });
        } else {
          const isOnline = await storageService.getOnlineStatus();
          if (!isOnline) {
            // If offline, just store locally
            await storageService.addProblem({
              id: crypto.randomUUID(),
              title: problem.title,
              leetcodeId: problem.leetcodeId,
              difficulty: problem.difficulty as 'Easy' | 'Medium' | 'Hard',
              categories: [],
              url: problem.url,
              timestamp: problem.timestamp
            });
            setActionStatus('Offline: Problem saved locally');
          } else {
            // If online but API failed
            setActionStatus(`Error: ${responseData.error || 'Failed to track problem'}`);
          }
        }
      } catch (error) {
        console.error('Error tracking problem:', error);
        setActionStatus('Error tracking problem');
      }
    });
  });
  
  // Handle error patterns button click
  errorPatternsBtn?.addEventListener('click', async () => {
    const authData = await storageService.getAuth();
    
    if (!authData) {
      setActionStatus('Error: Not logged in');
      return;
    }
    
    // Store the token in localStorage for the error patterns page
    localStorage.setItem('token', authData.token);
    localStorage.setItem('apiBaseUrl', API_BASE_URL);
    
    // Open the error patterns page
    chrome.windows.create({
      url: chrome.runtime.getURL('popup/error-patterns.html'),
      type: 'popup',
      width: 800,
      height: 600
    });
  });
  
  // Helper functions
  function isTokenValid(authData: AuthData): boolean {
    return Date.now() < authData.expiresAt;
  }
  
  function showLoggedInState(authData: AuthData) {
    if (loginSection) loginSection.style.display = 'none';
    if (problemSection) problemSection.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'block';
    if (connectionStatus) {
      connectionStatus.textContent = 'Connected';
      connectionStatus.classList.add('connected');
    }
    
    // Update UI with user info
    const userName = authData.user.name || authData.user.email;
    const userElement = document.getElementById('user-info');
    if (userElement) {
      userElement.textContent = `${userName}`;
    }
    
    // Try to get current problem info from active tab
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      const tab = tabs[0];
      if (tab.url?.includes('leetcode.com/problems/')) {
        chrome.tabs.sendMessage(tab.id as number, {action: 'getProblemInfo'}, (response) => {
          if (response && response.problem) {
            updateProblemInfo(response.problem);
          }
        });
      }
    });
  }
  
  function showLoggedOutState() {
    if (loginSection) loginSection.style.display = 'block';
    if (problemSection) problemSection.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (connectionStatus) {
      connectionStatus.textContent = 'Not connected';
      connectionStatus.classList.remove('connected');
    }
  }
  
  function updateProblemInfo(problem: ProblemInfo) {
    const problemTitle = document.getElementById('problem-title');
    const problemDifficulty = document.getElementById('problem-difficulty');
    
    if (problemTitle) {
      problemTitle.textContent = problem.title;
    }
    
    if (problemDifficulty) {
      problemDifficulty.textContent = problem.difficulty;
      problemDifficulty.className = 'difficulty ' + problem.difficulty.toLowerCase();
    }
  }
  
  function setActionStatus(message: string) {
    if (actionStatus) {
      actionStatus.textContent = message;
      
      // Clear after 3 seconds
      setTimeout(() => {
        if (actionStatus) {
          actionStatus.textContent = '';
        }
      }, 3000);
    }
  }

  // Helper function to assign colors to tags
  function getTagColor(tag: string): string {
    // Map of common problem categories to colors
    const tagColors: Record<string, string> = {
      'array': '#2196F3',
      'string': '#4CAF50',
      'hash-table': '#FFC107',
      'math': '#9C27B0',
      'dynamic-programming': '#FF5722',
      'sorting': '#3F51B5',
      'greedy': '#00BCD4',
      'depth-first-search': '#795548',
      'binary-search': '#607D8B',
      'breadth-first-search': '#FF9800',
      'tree': '#8BC34A',
      'matrix': '#E91E63',
      'two-pointers': '#673AB7',
      'bit-manipulation': '#CDDC39',
      'heap': '#009688',
      'graph': '#FFEB3B',
      'design': '#FF4081',
      'simulation': '#03A9F4',
      'prefix-sum': '#FF5252',
      'stack': '#7986CB',
      'queue': '#FF8A65',
      'binary-tree': '#4DB6AC',
      'recursion': '#BA68C8',
      'linked-list': '#FFD54F'
    };

    // Normalize tag
    const normalizedTag = tag.toLowerCase().replace(/\s+/g, '-');
    
    // Return color or a default
    return tagColors[normalizedTag] || 
           tagColors[Object.keys(tagColors).find(key => normalizedTag.includes(key)) || ''] || 
           '#888888';
  }
}); 