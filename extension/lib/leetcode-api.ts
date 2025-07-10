/**
 * LeetCode API service for accessing LeetCode's GraphQL API
 * This provides a more reliable way to get problem data than DOM scraping
 */

// Problem data from GraphQL API
export interface LeetCodeProblem {
  questionId: string;          // LeetCode's internal ID (numeric)
  questionFrontendId: string;  // Problem number as shown on LeetCode
  title: string;               // Problem title
  titleSlug: string;           // URL-friendly slug (used in URLs)
  difficulty: string;          // Easy, Medium, Hard
  content: string;             // HTML content of the problem
  topicTags: {                 // Categories/tags for the problem
    name: string;
    slug: string;
  }[];
  exampleTestcases: string;    // Example test cases
  codeSnippets?: {             // Code templates
    lang: string;
    langSlug: string;
    code: string;
  }[];
}

// Submission data from GraphQL API
export interface LeetCodeSubmission {
  id: string;
  statusDisplay: string;  // "Accepted", "Wrong Answer", etc.
  lang: string;           // Programming language
  runtime: string;        // Runtime in ms
  timestamp: string;      // Submission time
  url: string;            // URL to the submission
  memory: string;         // Memory usage
  code: string;           // Submitted code
}

/**
 * Service for interacting with LeetCode's GraphQL API
 */
export class LeetCodeAPI {
  private endpoint = 'https://leetcode.com/graphql';
  
  /**
   * Fetch problem data by title slug (URL slug)
   */
  async getProblemData(titleSlug: string): Promise<LeetCodeProblem | null> {
    const query = `
      query questionData($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionId
          questionFrontendId
          title
          titleSlug
          content
          difficulty
          topicTags {
            name
            slug
          }
          exampleTestcases
          codeSnippets {
            lang
            langSlug
            code
          }
        }
      }
    `;
    
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        credentials: 'include',  // Important: includes cookies for authentication
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { titleSlug }
        })
      });
      
      const data = await response.json();
      
      if (data.errors) {
        console.error('GraphQL API error:', data.errors);
        return null;
      }
      
      return data.data.question;
    } catch (error) {
      console.error('Error fetching problem data:', error);
      return null;
    }
  }
  
  /**
   * Fetch user's submissions for a problem
   */
  async getSubmissions(titleSlug: string, limit = 20): Promise<LeetCodeSubmission[]> {
    const query = `
      query submissionList($questionSlug: String!, $limit: Int!) {
        submissionList(questionSlug: $questionSlug, limit: $limit) {
          submissions {
            id
            statusDisplay
            lang
            runtime
            timestamp
            url
            memory
            code
          }
        }
      }
    `;
    
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        credentials: 'include',  // Important: includes cookies for authentication
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { 
            questionSlug: titleSlug,
            limit
          }
        })
      });
      
      const data = await response.json();
      
      if (data.errors) {
        console.error('GraphQL API error:', data.errors);
        return [];
      }
      
      return data.data.submissionList.submissions;
    } catch (error) {
      console.error('Error fetching submissions:', error);
      return [];
    }
  }
  
  /**
   * Fetch details for a specific submission by ID
   */
  async getSubmissionDetail(submissionId: string): Promise<{
    code: string;
    runtime: string;
    memory: string;
    statusDisplay: string;
    timestamp: string;
    lang: string;
    passedTestCaseCnt: number;
    totalTestCaseCnt: number;
    statusRuntime: string;
    runtimeError: string | null;
    compileError: string | null;
  } | null> {
    const query = `
      query submissionDetails($submissionId: ID!) {
        submissionDetails(submissionId: $submissionId) {
          code
          runtime
          memory
          statusDisplay
          timestamp
          lang
          passedTestCaseCnt
          totalTestCaseCnt
          statusRuntime
          runtimeError
          compileError
        }
      }
    `;
    
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { submissionId }
        })
      });
      
      const data = await response.json();
      
      if (data.errors) {
        console.error('GraphQL API error:', data.errors);
        return null;
      }
      
      return data.data.submissionDetails;
    } catch (error) {
      console.error('Error fetching submission details:', error);
      return null;
    }
  }
} 
 
 
 