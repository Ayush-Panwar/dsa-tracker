// Types for our storage
export interface AuthData {
  token: string;
  refreshToken: string;
  expiresAt: number;
  sessionCookie?: string; // Optional session cookie for session-based auth
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

// Problem and submission interfaces for API communication
export interface ProblemData {
  id: string;
  title: string;
  leetcodeId: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  categories: string[];
  url: string;
  description?: string;
  timestamp: number;
}

export interface SubmissionData {
  id: string;
  problemId: string;
  submissionId: string; // LeetCode submission ID
  code: string;
  language: string;
  status: string;
  runtime?: string;
  memory?: string;
  errorMessage?: string;
  timestamp: number;
  syncStatus: 'pending' | 'synced';
}

export interface ErrorData {
  id: string;
  userId: string;
  errorMessage: string;
  errorType: string;
  errorSubtype?: string;
  code: string;
  language: string;
  lineNumber?: number;
  columnNumber?: number;
  testCase?: string;
  problemId?: string;
  problemTitle?: string;
  timestamp: number;
  status: 'pending' | 'synced';
}

export interface TestCaseData {
  id: string;
  input: string;
  expectedOutput: string;
  description?: string;
  isPublic: boolean;
  problemId?: string;
  timestamp: number;
  status: 'pending' | 'synced';
}

export interface BugReport {
  id: string;
  problemId: string;
  description: string;
  bugType: string;
  codeSnippet?: string;
  timestamp: number;
}

// Storage keys
const AUTH_KEY = 'dsa_tracker_auth';
// @ts-expect-error - process.env.API_BASE_URL is injected by webpack.DefinePlugin
const API_BASE_URL: string = process.env.API_BASE_URL || 'http://localhost:3000';

// Storage API wrapper
class StorageService {
  // Auth methods
  async saveAuth(authData: AuthData): Promise<void> {
    return chrome.storage.local.set({ [AUTH_KEY]: authData });
  }

  async getAuth(): Promise<AuthData | null> {
    const result = await chrome.storage.local.get(AUTH_KEY);
    return result[AUTH_KEY] || null;
  }

  async updateAuth(authData: Partial<AuthData>): Promise<void> {
    const currentAuth = await this.getAuth();
    if (!currentAuth) return this.saveAuth(authData as AuthData);
    
    return this.saveAuth({
      ...currentAuth,
      ...authData
    });
  }

  async clearAuth(): Promise<void> {
    return chrome.storage.local.remove(AUTH_KEY);
  }

  // Network status methods
  async getOnlineStatus(): Promise<boolean> {
    try {
      const response = await fetch('https://www.google.com', { method: 'HEAD', mode: 'no-cors' });
      return response.type === 'opaque' || response.ok;
    } catch {
      // Ignore error and return offline status
      return false;
    }
  }

  async setOnlineStatus(isOnline: boolean): Promise<void> {
    // This is now just a no-op since we don't store this in local storage
    console.log(`Online status set to: ${isOnline}`);
  }

  // Problem methods - Direct API communication
  async getProblems(): Promise<ProblemData[]> {
    // Return empty array as we don't store locally anymore
    return [];
  }

  async addProblem(problem: ProblemData): Promise<void> {
    const authData = await this.getAuth();
    if (!authData) {
      console.error('Not authenticated, cannot add problem');
      return;
    }

    try {
      const isOnline = await this.getOnlineStatus();
      if (!isOnline) {
        console.log('Offline: Cannot add problem, no local storage available');
        return;
      }

      // Send directly to API
      await fetch(`${API_BASE_URL}/api/problems`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify(problem)
      });
    } catch (error) {
      console.error('Error adding problem:', error);
    }
  }

  // Submission methods - Direct API communication
  async getSubmissions(): Promise<SubmissionData[]> {
    // Return empty array as we don't store locally anymore
    return [];
  }

  async getPendingSubmissions(): Promise<SubmissionData[]> {
    // Return empty array as we don't store locally anymore
    return [];
  }

  async addSubmission(submission: SubmissionData): Promise<SubmissionData> {
    const authData = await this.getAuth();
    if (!authData) {
      console.error('Not authenticated, cannot add submission');
      return submission;
    }

    try {
      const isOnline = await this.getOnlineStatus();
      if (!isOnline) {
        console.log('Offline: Cannot add submission, no local storage available');
        return submission;
      }

      // Send directly to API
      const response = await fetch(`${API_BASE_URL}/api/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify(submission)
      });

      if (response.ok) {
        const result = await response.json();
        return result;
      }
    } catch (error) {
      console.error('Error adding submission:', error);
    }
    
    return submission;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateSubmissionStatus(_id: string, _syncStatus: 'pending' | 'synced'): Promise<void> {
    // No-op as we don't store locally anymore
  }

  // Error methods - Direct API communication
  async getPendingErrors(): Promise<ErrorData[]> {
    // Return empty array as we don't store locally anymore
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateErrorStatus(_id: string, _status: 'pending' | 'synced'): Promise<void> {
    // No-op as we don't store locally anymore
  }

  // Test case methods - Direct API communication
  async getPendingTestCases(): Promise<TestCaseData[]> {
    // Return empty array as we don't store locally anymore
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateTestCaseStatus(_id: string, _status: 'pending' | 'synced'): Promise<void> {
    // No-op as we don't store locally anymore
  }

  // Bug report methods - Direct API communication
  async getBugs(): Promise<BugReport[]> {
    // Return empty array as we don't store locally anymore
    return [];
  }

  // Sync timestamp methods
  async updateSyncTimestamp(): Promise<void> {
    // No-op as we don't store locally anymore
  }

  // Helper method to clear all storage (only used for debugging/reset)
  async clearAll(): Promise<void> {
    return chrome.storage.local.clear();
  }
}

// Export singleton instance
export const storageService = new StorageService(); 