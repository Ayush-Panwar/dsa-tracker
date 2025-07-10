/**
 * Error Analysis Module for DSA Tracker
 * Analyzes code errors and classifies them into patterns to help users learn from mistakes
 */

// Error types classification
export enum ErrorType {
  SYNTAX = 'syntax',
  RUNTIME = 'runtime',
  LOGICAL = 'logical',
  TIME_LIMIT = 'time_limit',
  MEMORY_LIMIT = 'memory_limit',
  WRONG_ANSWER = 'wrong_answer',
  COMPILATION = 'compilation',
  UNKNOWN = 'unknown'
}

// Error pattern categorization
export enum ErrorPattern {
  OFF_BY_ONE = 'off_by_one',
  NULL_POINTER = 'null_pointer',
  EDGE_CASE = 'edge_case',
  BOUNDARY_CONDITION = 'boundary_condition',
  INFINITE_LOOP = 'infinite_loop',
  ARRAY_OUT_OF_BOUNDS = 'array_out_of_bounds',
  STACK_OVERFLOW = 'stack_overflow',
  INCORRECT_LOGIC = 'incorrect_logic',
  TYPE_ERROR = 'type_error',
  ASSIGNMENT_ERROR = 'assignment_error',
  ALGORITHM_ERROR = 'algorithm_error',
  DIVISION_BY_ZERO = 'division_by_zero',
  UNCAUGHT_EXCEPTION = 'uncaught_exception',
  UNDEFINED_VARIABLE = 'undefined_variable',
  OTHER = 'other'
}

// Categories of common programming concepts where errors occur
export enum ErrorCategory {
  LOOPS = 'loops',
  CONDITIONALS = 'conditionals',
  RECURSION = 'recursion',
  DATA_STRUCTURES = 'data_structures',
  ALGORITHMS = 'algorithms',
  SYNTAX = 'syntax',
  OPTIMIZATION = 'optimization',
  VARIABLE_MANAGEMENT = 'variable_management',
  TYPE_HANDLING = 'type_handling',
  EDGE_CASES = 'edge_cases',
  ERROR_HANDLING = 'error_handling',
  OTHER = 'other'
}

// Interface for analyzed error data
export interface ErrorAnalysis {
  errorType: ErrorType;
  errorPattern?: ErrorPattern;
  lineNumber?: number;
  columnNumber?: number;
  errorMessage: string;
  failedTestCase?: string;
  expectedOutput?: string;
  actualOutput?: string;
  errorCategory?: ErrorCategory;
  problemContext?: {
    problemId: string;
    title: string;
    difficulty: string;
  };
  codeSnippet?: string;
  suggestedFix?: string;
  frequency?: number;
  similarErrors?: string[];
}

// Track error patterns across problems
interface ErrorPatternStore {
  [pattern: string]: {
    count: number;
    lastSeen: number;
    problems: Set<string>;
    examples: string[];
  }
}

// Store of error patterns for frequency analysis
const errorPatterns: ErrorPatternStore = {};

/**
 * Analyzes an error from a LeetCode submission or run
 */
export function analyzeError(
  statusMessage: string,
  errorMessage: string | null,
  code: string,
  language: string,
  failedTestCase?: string,
  expectedOutput?: string,
  actualOutput?: string,
  problemId?: string,
  problemTitle?: string,
  problemDifficulty?: string
): ErrorAnalysis {
  // Initialize the error analysis object
  const analysis: ErrorAnalysis = {
    errorType: determineErrorType(statusMessage, errorMessage),
    errorMessage: errorMessage || statusMessage || 'Unknown error',
    problemContext: problemId ? {
      problemId,
      title: problemTitle || 'Unknown',
      difficulty: problemDifficulty || 'Unknown'
    } : undefined
  };

  // Extract line number from error message
  const lineInfo = extractLineInfo(errorMessage || '', language);
  if (lineInfo) {
    analysis.lineNumber = lineInfo.lineNumber;
    analysis.columnNumber = lineInfo.columnNumber;
    
    // Extract code snippet around the error
    if (analysis.lineNumber) {
      analysis.codeSnippet = extractCodeSnippet(code, analysis.lineNumber);
    }
  }

  // Add test case information if available
  if (failedTestCase) {
    analysis.failedTestCase = failedTestCase;
  }
  
  if (expectedOutput) {
    analysis.expectedOutput = expectedOutput;
  }
  
  if (actualOutput) {
    analysis.actualOutput = actualOutput;
  }

  // Determine error pattern
  analysis.errorPattern = determineErrorPattern(
    analysis.errorType,
    errorMessage || '',
    code,
    expectedOutput,
    actualOutput
  );

  // Categorize the error
  analysis.errorCategory = categorizeError(
    analysis.errorType,
    analysis.errorPattern,
    code
  );

  // Record this error pattern for frequency analysis
  recordErrorPattern(analysis);

  return analysis;
}

/**
 * Determines the type of error based on status message and error text
 */
function determineErrorType(statusMessage: string, errorMessage: string | null): ErrorType {
  const status = statusMessage?.toLowerCase() || '';
  const error = errorMessage?.toLowerCase() || '';

  if (status.includes('time limit exceeded') || error.includes('time limit exceeded')) {
    return ErrorType.TIME_LIMIT;
  } else if (status.includes('memory limit exceeded') || error.includes('memory limit exceeded')) {
    return ErrorType.MEMORY_LIMIT;
  } else if (status.includes('wrong answer') || status.includes('output limit exceeded')) {
    return ErrorType.WRONG_ANSWER;
  } else if (status.includes('compile error') || error.includes('syntax error') || error.includes('cannot compile')) {
    return ErrorType.COMPILATION;
  } else if (status.includes('runtime error') || 
            error.includes('null') || 
            error.includes('undefined') || 
            error.includes('cannot read property') ||
            error.includes('index out of bounds') ||
            error.includes('division by zero')) {
    return ErrorType.RUNTIME;
  } else if (status.includes('accepted with warning') || 
            status.includes('presentation error') ||
            status.includes('partially correct')) {
    return ErrorType.LOGICAL;
  } else if (status.includes('accepted')) {
    // Even accepted solutions might have logical improvements
    return ErrorType.LOGICAL;
  }

  return ErrorType.UNKNOWN;
}

/**
 * Extracts line and column information from error messages
 */
function extractLineInfo(errorMessage: string, language: string): { lineNumber: number, columnNumber?: number } | null {
  // Different languages have different error message formats
  const lineMatches = {
    // JavaScript/TypeScript line extraction patterns
    javascript: [
      /line\s+(\d+)[,\s]+column\s+(\d+)/i,  // line X, column Y
      /at\s+line\s+(\d+)/i,                 // at line X
      /:(\d+):(\d+)/                        // filename:X:Y
    ],
    typescript: [
      /line\s+(\d+)[,\s]+column\s+(\d+)/i,
      /at\s+line\s+(\d+)/i,
      /:(\d+):(\d+)/
    ],
    python: [
      /line\s+(\d+)/i,                     // line X
      /File\s+".*",\s+line\s+(\d+)/i       // File "...", line X
    ],
    java: [
      /\.java:(\d+)/,                      // filename.java:X
      /line\s+(\d+)/i                      // line X
    ],
    cpp: [
      /\.cpp:(\d+):(\d+)/,                 // filename.cpp:X:Y
      /line\s+(\d+)/i                      // line X
    ],
    csharp: [
      /\.cs:(\d+)/,                        // filename.cs:X
      /line\s+(\d+)/i                      // line X
    ],
    go: [
      /\.go:(\d+):(\d+)/,                  // filename.go:X:Y
      /line\s+(\d+)/i                      // line X
    ]
  };

  // Default to javascript patterns if language not recognized
  const patterns = lineMatches[language as keyof typeof lineMatches] || lineMatches.javascript;

  // Try each pattern for the given language
  for (const pattern of patterns) {
    const match = errorMessage.match(pattern);
    if (match) {
      return {
        lineNumber: parseInt(match[1], 10),
        columnNumber: match[2] ? parseInt(match[2], 10) : undefined
      };
    }
  }

  // Try numeric extraction as a fallback
  const numbersMatch = errorMessage.match(/(\d+)/g);
  if (numbersMatch && numbersMatch.length > 0) {
    // Get the first number that could reasonably be a line number
    const possibleLineNumber = parseInt(numbersMatch[0], 10);
    if (possibleLineNumber > 0 && possibleLineNumber < 1000) {
      return {
        lineNumber: possibleLineNumber
      };
    }
  }

  return null;
}

/**
 * Extracts the code snippet around the error line
 */
function extractCodeSnippet(code: string, lineNumber: number, contextLines: number = 2): string {
  const lines = code.split('\n');
  
  // Ensure line number is within range
  if (lineNumber <= 0 || lineNumber > lines.length) {
    return '';
  }
  
  // Get lines before and after the error line
  const startLine = Math.max(0, lineNumber - contextLines - 1);
  const endLine = Math.min(lines.length - 1, lineNumber + contextLines - 1);
  
  // Extract the snippet with line numbers
  let snippet = '';
  for (let i = startLine; i <= endLine; i++) {
    const isErrorLine = i === lineNumber - 1;
    const lineNum = i + 1;
    snippet += `${isErrorLine ? '➤ ' : '  '}${lineNum}: ${lines[i]}\n`;
  }
  
  return snippet.trim();
}

/**
 * Determines the error pattern based on the error type and message
 */
function determineErrorPattern(
  errorType: ErrorType,
  errorMessage: string,
  code: string,
  expectedOutput?: string,
  actualOutput?: string
): ErrorPattern {
  const message = errorMessage.toLowerCase();

  // Check for specific runtime errors
  if (errorType === ErrorType.RUNTIME) {
    if (message.includes('null') || 
        message.includes('undefined') || 
        message.includes('nil') ||
        message.includes('null pointer') || 
        message.includes('nullpointer') ||
        message.includes('cannot read property')) {
      return ErrorPattern.NULL_POINTER;
    }
    
    if (message.includes('index out of') || 
        message.includes('array index') ||
        message.includes('out of bounds') ||
        message.includes('range check')) {
      return ErrorPattern.ARRAY_OUT_OF_BOUNDS;
    }
    
    if (message.includes('stack') && 
        (message.includes('overflow') || message.includes('size'))) {
      return ErrorPattern.STACK_OVERFLOW;
    }
    
    if (message.includes('divide by zero') || 
        message.includes('division by zero') ||
        message.includes('zerodivision')) {
      return ErrorPattern.DIVISION_BY_ZERO;
    }
  }
  
  // Check for wrong answer errors
  if (errorType === ErrorType.WRONG_ANSWER) {
    // If we have expected and actual output, try to analyze differences
    if (expectedOutput && actualOutput) {
      return analyzeOutputDifference(expectedOutput, actualOutput);
    }
    
    // Look for common logical error patterns in the code
    if (/[<>]=?\s*[+-]1/.test(code) || /[+-]1\s*[<>]=?/.test(code)) {
      return ErrorPattern.OFF_BY_ONE;
    }
    
    if (code.includes('while') && !code.includes('break')) {
      return ErrorPattern.INFINITE_LOOP;
    }
  }
  
  // Check for time limit issues
  if (errorType === ErrorType.TIME_LIMIT) {
    if (code.includes('for') && code.includes('for')) {
      // Nested loops often cause time complexity issues
      return ErrorPattern.ALGORITHM_ERROR;
    }
    return ErrorPattern.INFINITE_LOOP;
  }
  
  // Check for compilation/syntax errors
  if (errorType === ErrorType.COMPILATION) {
    if (message.includes('type') || message.includes('cannot convert')) {
      return ErrorPattern.TYPE_ERROR;
    }
    
    if (message.includes('undeclared') || 
        message.includes('undefined') || 
        message.includes('not defined')) {
      return ErrorPattern.UNDEFINED_VARIABLE;
    }
    
    if (message.includes('assignment') || message.includes('cannot assign')) {
      return ErrorPattern.ASSIGNMENT_ERROR;
    }
  }
  
  // Default patterns based on error type
  switch (errorType) {
    case ErrorType.SYNTAX:
      return ErrorPattern.TYPE_ERROR;
    case ErrorType.LOGICAL:
      return ErrorPattern.INCORRECT_LOGIC;
    case ErrorType.MEMORY_LIMIT:
      return ErrorPattern.ALGORITHM_ERROR;
    default:
      return ErrorPattern.OTHER;
  }
}

/**
 * Analyze the difference between expected and actual output
 */
function analyzeOutputDifference(expected: string, actual: string): ErrorPattern {
  // Clean and parse outputs
  const cleanExpected = expected.trim();
  const cleanActual = actual.trim();
  
  // Check for exact equality (should never happen for wrong answers)
  if (cleanExpected === cleanActual) {
    return ErrorPattern.OTHER;
  }
  
  // Check for off-by-one errors
  const expectedNumbers = cleanExpected.match(/-?\d+/g) || [];
  const actualNumbers = cleanActual.match(/-?\d+/g) || [];
  
  if (expectedNumbers.length === actualNumbers.length) {
    let offByOneCount = 0;
    
    for (let i = 0; i < expectedNumbers.length; i++) {
      const expNum = parseInt(expectedNumbers[i], 10);
      const actNum = parseInt(actualNumbers[i], 10);
      
      if (Math.abs(expNum - actNum) === 1) {
        offByOneCount++;
      }
    }
    
    // If a significant portion are off by one
    if (offByOneCount > 0 && offByOneCount >= expectedNumbers.length * 0.3) {
      return ErrorPattern.OFF_BY_ONE;
    }
  }
  
  // Check for edge cases
  if (cleanExpected === '0' || cleanExpected === '-1' || cleanExpected === '1') {
    return ErrorPattern.EDGE_CASE;
  }
  
  // Check for boundary issues
  if (expectedNumbers.length > 0 && actualNumbers.length > 0) {
    const lastExpected = parseInt(expectedNumbers[expectedNumbers.length - 1], 10);
    const lastActual = parseInt(actualNumbers[actualNumbers.length - 1], 10);
    
    if (Math.abs(lastExpected - lastActual) === 1 || 
        lastExpected === 0 && lastActual !== 0 ||
        lastExpected !== 0 && lastActual === 0) {
      return ErrorPattern.BOUNDARY_CONDITION;
    }
  }
  
  return ErrorPattern.INCORRECT_LOGIC;
}

/**
 * Categorize the error into broader programming concepts
 */
function categorizeError(
  errorType: ErrorType,
  errorPattern: ErrorPattern | undefined,
  code: string
): ErrorCategory {
  // Map error patterns to categories
  const patternToCategory: Record<ErrorPattern, ErrorCategory> = {
    [ErrorPattern.OFF_BY_ONE]: ErrorCategory.LOOPS,
    [ErrorPattern.NULL_POINTER]: ErrorCategory.VARIABLE_MANAGEMENT,
    [ErrorPattern.EDGE_CASE]: ErrorCategory.EDGE_CASES,
    [ErrorPattern.BOUNDARY_CONDITION]: ErrorCategory.EDGE_CASES,
    [ErrorPattern.INFINITE_LOOP]: ErrorCategory.LOOPS,
    [ErrorPattern.ARRAY_OUT_OF_BOUNDS]: ErrorCategory.DATA_STRUCTURES,
    [ErrorPattern.STACK_OVERFLOW]: ErrorCategory.RECURSION,
    [ErrorPattern.INCORRECT_LOGIC]: ErrorCategory.ALGORITHMS,
    [ErrorPattern.TYPE_ERROR]: ErrorCategory.TYPE_HANDLING,
    [ErrorPattern.ASSIGNMENT_ERROR]: ErrorCategory.VARIABLE_MANAGEMENT,
    [ErrorPattern.ALGORITHM_ERROR]: ErrorCategory.ALGORITHMS,
    [ErrorPattern.DIVISION_BY_ZERO]: ErrorCategory.EDGE_CASES,
    [ErrorPattern.UNCAUGHT_EXCEPTION]: ErrorCategory.ERROR_HANDLING,
    [ErrorPattern.UNDEFINED_VARIABLE]: ErrorCategory.VARIABLE_MANAGEMENT,
    [ErrorPattern.OTHER]: ErrorCategory.OTHER
  };
  
  // If we have a pattern, use the mapping
  if (errorPattern && patternToCategory[errorPattern]) {
    return patternToCategory[errorPattern];
  }
  
  // Otherwise, determine category based on code content and error type
  const lowerCode = code.toLowerCase();
  
  if (errorType === ErrorType.TIME_LIMIT || errorType === ErrorType.MEMORY_LIMIT) {
    return ErrorCategory.OPTIMIZATION;
  }
  
  if (errorType === ErrorType.COMPILATION || errorType === ErrorType.SYNTAX) {
    return ErrorCategory.SYNTAX;
  }
  
  // Check for data structure issues
  if (lowerCode.includes('array') || 
      lowerCode.includes('list') ||
      lowerCode.includes('map') ||
      lowerCode.includes('set') ||
      lowerCode.includes('queue') ||
      lowerCode.includes('stack') ||
      lowerCode.includes('heap')) {
    return ErrorCategory.DATA_STRUCTURES;
  }
  
  // Check for loop issues
  if (lowerCode.includes('for') || 
      lowerCode.includes('while') ||
      lowerCode.includes('iterator') ||
      lowerCode.includes('index')) {
    return ErrorCategory.LOOPS;
  }
  
  // Check for conditional logic
  if (lowerCode.includes('if') || 
      lowerCode.includes('else') ||
      lowerCode.includes('switch') ||
      lowerCode.includes('case') ||
      lowerCode.includes('?') && lowerCode.includes(':')) {
    return ErrorCategory.CONDITIONALS;
  }
  
  // Check for recursion
  if ((code.match(/\w+\s*\([^)]*\)/g) || []).filter(call => {
    const funcName = call.split('(')[0].trim();
    return code.includes(`function ${funcName}`) || code.includes(`def ${funcName}`);
  }).length > 0) {
    return ErrorCategory.RECURSION;
  }
  
  return ErrorCategory.OTHER;
}

/**
 * Records error pattern for frequency analysis and sends to the backend
 */
function recordErrorPattern(analysis: ErrorAnalysis): void {
  if (!analysis.errorPattern) return;
  
  const pattern = analysis.errorPattern.toString();
  
  // Local tracking for immediate UI feedback
  if (!errorPatterns[pattern]) {
    errorPatterns[pattern] = {
      count: 0,
      lastSeen: Date.now(),
      problems: new Set(),
      examples: []
    };
  }
  
  // Update pattern data
  errorPatterns[pattern].count++;
  errorPatterns[pattern].lastSeen = Date.now();
  
  if (analysis.problemContext?.problemId) {
    errorPatterns[pattern].problems.add(analysis.problemContext.problemId);
  }
  
  // Keep up to 3 examples of this error pattern
  if (errorPatterns[pattern].examples.length < 3 && analysis.errorMessage) {
    errorPatterns[pattern].examples.push(analysis.errorMessage);
  }
  
  // Send to backend API if problem context is available
  if (analysis.problemContext?.problemId) {
    sendErrorToBackend(analysis);
  }
}

/**
 * Sends error data to the backend API for tracking and analysis
 */
async function sendErrorToBackend(analysis: ErrorAnalysis): Promise<void> {
  try {
    // Get API base URL from storage
    // @ts-expect-error - process.env.API_BASE_URL is injected by webpack.DefinePlugin
    const apiBaseUrl = localStorage.getItem('apiBaseUrl') || process.env.API_BASE_URL || 'http://localhost:3000';
    
    // Prepare error data
    const errorData = {
      errorMessage: analysis.errorMessage,
      errorType: analysis.errorType,
      errorSubtype: analysis.errorPattern,
      language: 'javascript', // Should be dynamic based on actual language
      code: analysis.codeSnippet || '',
      lineNumber: analysis.lineNumber,
      columnNumber: analysis.columnNumber,
      snippetContext: analysis.codeSnippet,
      testCase: analysis.failedTestCase,
      problemId: analysis.problemContext?.problemId,
      patternName: analysis.errorPattern,
      patternDescription: `${analysis.errorCategory || 'Unknown category'}: ${analysis.errorPattern}` 
    };
    
    // Send to error tracking API
    const response = await fetch(`${apiBaseUrl}/api/errors/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify(errorData)
    });
    
    if (!response.ok) {
      console.error('Failed to send error to backend:', await response.text());
    }
  } catch (error) {
    console.error('Error sending error data to backend:', error);
  }
}

/**
 * Get the most frequent error patterns for a user
 */
export function getFrequentErrorPatterns(): Array<{
  pattern: ErrorPattern;
  count: number;
  problems: string[];
  examples: string[];
}> {
  return Object.entries(errorPatterns)
    .map(([pattern, data]) => ({
      pattern: pattern as ErrorPattern,
      count: data.count,
      problems: Array.from(data.problems),
      examples: data.examples
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Find similar errors to a given error
 */
export function findSimilarErrors(
  errorPattern: ErrorPattern,
  errorMessage: string
): string[] {
  // First check for exact pattern match
  if (errorPatterns[errorPattern]) {
    return errorPatterns[errorPattern].examples.filter(e => e !== errorMessage);
  }
  
  // Otherwise find errors with same type
  const similarErrors: string[] = [];
  
  Object.entries(errorPatterns).forEach(([pattern, data]) => {
    // Skip if pattern doesn't match our criteria
    if (pattern !== errorPattern && pattern !== 'other') {
      return;
    }
    
    // Add examples that are not the current error
    data.examples.forEach(example => {
      if (example !== errorMessage && !similarErrors.includes(example)) {
        similarErrors.push(example);
      }
    });
  });
  
  return similarErrors.slice(0, 5); // Return at most 5 similar errors
}

/**
 * Calculate error similarity score between two errors
 */
export function calculateErrorSimilarity(error1: ErrorAnalysis, error2: ErrorAnalysis): number {
  let score = 0;
  
  // Same error type is important
  if (error1.errorType === error2.errorType) {
    score += 0.3;
  }
  
  // Same error pattern is even more important
  if (error1.errorPattern === error2.errorPattern) {
    score += 0.4;
  }
  
  // Same category adds some similarity
  if (error1.errorCategory === error2.errorCategory) {
    score += 0.2;
  }
  
  // Text similarity in error messages
  const message1 = error1.errorMessage.toLowerCase();
  const message2 = error2.errorMessage.toLowerCase();
  
  // Simple word overlap calculation
  const words1 = message1.split(/\s+/);
  const words2 = message2.split(/\s+/);
  
  const uniqueWords = new Set([...words1, ...words2]);
  let commonWords = 0;
  
  uniqueWords.forEach(word => {
    if (words1.includes(word) && words2.includes(word)) {
      commonWords++;
    }
  });
  
  const textSimilarity = uniqueWords.size > 0 ? commonWords / uniqueWords.size : 0;
  score += textSimilarity * 0.1;
  
  return Math.min(1, score);
}

/**
 * Clear error pattern history
 */
export function clearErrorPatterns(): void {
  Object.keys(errorPatterns).forEach(key => {
    delete errorPatterns[key];
  });
} 
 
 
 