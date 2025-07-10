/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./lib/error-analyzer.ts":
/*!*******************************!*\
  !*** ./lib/error-analyzer.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ErrorCategory: () => (/* binding */ ErrorCategory),
/* harmony export */   ErrorPattern: () => (/* binding */ ErrorPattern),
/* harmony export */   ErrorType: () => (/* binding */ ErrorType),
/* harmony export */   analyzeError: () => (/* binding */ analyzeError),
/* harmony export */   calculateErrorSimilarity: () => (/* binding */ calculateErrorSimilarity),
/* harmony export */   clearErrorPatterns: () => (/* binding */ clearErrorPatterns),
/* harmony export */   findSimilarErrors: () => (/* binding */ findSimilarErrors),
/* harmony export */   getFrequentErrorPatterns: () => (/* binding */ getFrequentErrorPatterns)
/* harmony export */ });
/**
 * Error Analysis Module for DSA Tracker
 * Analyzes code errors and classifies them into patterns to help users learn from mistakes
 */
// Error types classification
var ErrorType;
(function (ErrorType) {
    ErrorType["SYNTAX"] = "syntax";
    ErrorType["RUNTIME"] = "runtime";
    ErrorType["LOGICAL"] = "logical";
    ErrorType["TIME_LIMIT"] = "time_limit";
    ErrorType["MEMORY_LIMIT"] = "memory_limit";
    ErrorType["WRONG_ANSWER"] = "wrong_answer";
    ErrorType["COMPILATION"] = "compilation";
    ErrorType["UNKNOWN"] = "unknown";
})(ErrorType || (ErrorType = {}));
// Error pattern categorization
var ErrorPattern;
(function (ErrorPattern) {
    ErrorPattern["OFF_BY_ONE"] = "off_by_one";
    ErrorPattern["NULL_POINTER"] = "null_pointer";
    ErrorPattern["EDGE_CASE"] = "edge_case";
    ErrorPattern["BOUNDARY_CONDITION"] = "boundary_condition";
    ErrorPattern["INFINITE_LOOP"] = "infinite_loop";
    ErrorPattern["ARRAY_OUT_OF_BOUNDS"] = "array_out_of_bounds";
    ErrorPattern["STACK_OVERFLOW"] = "stack_overflow";
    ErrorPattern["INCORRECT_LOGIC"] = "incorrect_logic";
    ErrorPattern["TYPE_ERROR"] = "type_error";
    ErrorPattern["ASSIGNMENT_ERROR"] = "assignment_error";
    ErrorPattern["ALGORITHM_ERROR"] = "algorithm_error";
    ErrorPattern["DIVISION_BY_ZERO"] = "division_by_zero";
    ErrorPattern["UNCAUGHT_EXCEPTION"] = "uncaught_exception";
    ErrorPattern["UNDEFINED_VARIABLE"] = "undefined_variable";
    ErrorPattern["OTHER"] = "other";
})(ErrorPattern || (ErrorPattern = {}));
// Categories of common programming concepts where errors occur
var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["LOOPS"] = "loops";
    ErrorCategory["CONDITIONALS"] = "conditionals";
    ErrorCategory["RECURSION"] = "recursion";
    ErrorCategory["DATA_STRUCTURES"] = "data_structures";
    ErrorCategory["ALGORITHMS"] = "algorithms";
    ErrorCategory["SYNTAX"] = "syntax";
    ErrorCategory["OPTIMIZATION"] = "optimization";
    ErrorCategory["VARIABLE_MANAGEMENT"] = "variable_management";
    ErrorCategory["TYPE_HANDLING"] = "type_handling";
    ErrorCategory["EDGE_CASES"] = "edge_cases";
    ErrorCategory["ERROR_HANDLING"] = "error_handling";
    ErrorCategory["OTHER"] = "other";
})(ErrorCategory || (ErrorCategory = {}));
// Store of error patterns for frequency analysis
const errorPatterns = {};
/**
 * Analyzes an error from a LeetCode submission or run
 */
function analyzeError(statusMessage, errorMessage, code, language, failedTestCase, expectedOutput, actualOutput, problemId, problemTitle, problemDifficulty) {
    // Initialize the error analysis object
    const analysis = {
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
    analysis.errorPattern = determineErrorPattern(analysis.errorType, errorMessage || '', code, expectedOutput, actualOutput);
    // Categorize the error
    analysis.errorCategory = categorizeError(analysis.errorType, analysis.errorPattern, code);
    // Record this error pattern for frequency analysis
    recordErrorPattern(analysis);
    return analysis;
}
/**
 * Determines the type of error based on status message and error text
 */
function determineErrorType(statusMessage, errorMessage) {
    const status = statusMessage?.toLowerCase() || '';
    const error = errorMessage?.toLowerCase() || '';
    if (status.includes('time limit exceeded') || error.includes('time limit exceeded')) {
        return ErrorType.TIME_LIMIT;
    }
    else if (status.includes('memory limit exceeded') || error.includes('memory limit exceeded')) {
        return ErrorType.MEMORY_LIMIT;
    }
    else if (status.includes('wrong answer') || status.includes('output limit exceeded')) {
        return ErrorType.WRONG_ANSWER;
    }
    else if (status.includes('compile error') || error.includes('syntax error') || error.includes('cannot compile')) {
        return ErrorType.COMPILATION;
    }
    else if (status.includes('runtime error') ||
        error.includes('null') ||
        error.includes('undefined') ||
        error.includes('cannot read property') ||
        error.includes('index out of bounds') ||
        error.includes('division by zero')) {
        return ErrorType.RUNTIME;
    }
    else if (status.includes('accepted with warning') ||
        status.includes('presentation error') ||
        status.includes('partially correct')) {
        return ErrorType.LOGICAL;
    }
    else if (status.includes('accepted')) {
        // Even accepted solutions might have logical improvements
        return ErrorType.LOGICAL;
    }
    return ErrorType.UNKNOWN;
}
/**
 * Extracts line and column information from error messages
 */
function extractLineInfo(errorMessage, language) {
    // Different languages have different error message formats
    const lineMatches = {
        // JavaScript/TypeScript line extraction patterns
        javascript: [
            /line\s+(\d+)[,\s]+column\s+(\d+)/i, // line X, column Y
            /at\s+line\s+(\d+)/i, // at line X
            /:(\d+):(\d+)/ // filename:X:Y
        ],
        typescript: [
            /line\s+(\d+)[,\s]+column\s+(\d+)/i,
            /at\s+line\s+(\d+)/i,
            /:(\d+):(\d+)/
        ],
        python: [
            /line\s+(\d+)/i, // line X
            /File\s+".*",\s+line\s+(\d+)/i // File "...", line X
        ],
        java: [
            /\.java:(\d+)/, // filename.java:X
            /line\s+(\d+)/i // line X
        ],
        cpp: [
            /\.cpp:(\d+):(\d+)/, // filename.cpp:X:Y
            /line\s+(\d+)/i // line X
        ],
        csharp: [
            /\.cs:(\d+)/, // filename.cs:X
            /line\s+(\d+)/i // line X
        ],
        go: [
            /\.go:(\d+):(\d+)/, // filename.go:X:Y
            /line\s+(\d+)/i // line X
        ]
    };
    // Default to javascript patterns if language not recognized
    const patterns = lineMatches[language] || lineMatches.javascript;
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
function extractCodeSnippet(code, lineNumber, contextLines = 2) {
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
function determineErrorPattern(errorType, errorMessage, code, expectedOutput, actualOutput) {
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
function analyzeOutputDifference(expected, actual) {
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
function categorizeError(errorType, errorPattern, code) {
    // Map error patterns to categories
    const patternToCategory = {
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
function recordErrorPattern(analysis) {
    if (!analysis.errorPattern)
        return;
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
async function sendErrorToBackend(analysis) {
    try {
        // Get API base URL from storage
        // @ts-expect-error - process.env.API_BASE_URL is injected by webpack.DefinePlugin
        const apiBaseUrl = localStorage.getItem('apiBaseUrl') || "http://localhost:3000" || 0;
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
    }
    catch (error) {
        console.error('Error sending error data to backend:', error);
    }
}
/**
 * Get the most frequent error patterns for a user
 */
function getFrequentErrorPatterns() {
    return Object.entries(errorPatterns)
        .map(([pattern, data]) => ({
        pattern: pattern,
        count: data.count,
        problems: Array.from(data.problems),
        examples: data.examples
    }))
        .sort((a, b) => b.count - a.count);
}
/**
 * Find similar errors to a given error
 */
function findSimilarErrors(errorPattern, errorMessage) {
    // First check for exact pattern match
    if (errorPatterns[errorPattern]) {
        return errorPatterns[errorPattern].examples.filter(e => e !== errorMessage);
    }
    // Otherwise find errors with same type
    const similarErrors = [];
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
function calculateErrorSimilarity(error1, error2) {
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
function clearErrorPatterns() {
    Object.keys(errorPatterns).forEach(key => {
        delete errorPatterns[key];
    });
}


/***/ }),

/***/ "./lib/leetcode-api.ts":
/*!*****************************!*\
  !*** ./lib/leetcode-api.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LeetCodeAPI: () => (/* binding */ LeetCodeAPI)
/* harmony export */ });
/**
 * LeetCode API service for accessing LeetCode's GraphQL API
 * This provides a more reliable way to get problem data than DOM scraping
 */
/**
 * Service for interacting with LeetCode's GraphQL API
 */
class LeetCodeAPI {
    constructor() {
        this.endpoint = 'https://leetcode.com/graphql';
    }
    /**
     * Fetch problem data by title slug (URL slug)
     */
    async getProblemData(titleSlug) {
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
                credentials: 'include', // Important: includes cookies for authentication
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
        }
        catch (error) {
            console.error('Error fetching problem data:', error);
            return null;
        }
    }
    /**
     * Fetch user's submissions for a problem
     */
    async getSubmissions(titleSlug, limit = 20) {
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
                credentials: 'include', // Important: includes cookies for authentication
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
        }
        catch (error) {
            console.error('Error fetching submissions:', error);
            return [];
        }
    }
    /**
     * Fetch details for a specific submission by ID
     */
    async getSubmissionDetail(submissionId) {
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
        }
        catch (error) {
            console.error('Error fetching submission details:', error);
            return null;
        }
    }
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!****************************!*\
  !*** ./content/content.ts ***!
  \****************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _lib_leetcode_api__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../lib/leetcode-api */ "./lib/leetcode-api.ts");
/* harmony import */ var _lib_error_analyzer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../lib/error-analyzer */ "./lib/error-analyzer.ts");


// Initialize the LeetCode API
const leetcodeApi = new _lib_leetcode_api__WEBPACK_IMPORTED_MODULE_0__.LeetCodeAPI();
// Track solution versions for the current problem
const solutionVersionsMap = {};
let currentLanguage = 'unknown';
// Global variables for problem identification
let problemId = '';
let problemTitle = '';
// Add this at the top level, before other functions
// Global flag to track if Monaco is ready
let isMonacoReady = false;
// Global helper to get Monaco editors with safety checks
function getMonacoEditors() {
    try {
        // Try the standard approach first
        if (window.monaco && window.monaco.editor && typeof window.monaco.editor.getEditors === 'function') {
            const editors = window.monaco.editor.getEditors();
            if (editors && Array.isArray(editors) && editors.length > 0) {
                return editors;
            }
        }
        // If standard approach fails, try alternative methods
        // Method 1: Look for monaco through _monaco property that some implementations use
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const windowAny = window;
        if (windowAny._monaco && windowAny._monaco.editor && typeof windowAny._monaco.editor.getEditors === 'function') {
            const editors = windowAny._monaco.editor.getEditors();
            if (editors && Array.isArray(editors) && editors.length > 0) {
                console.log("DSA Tracker: Found Monaco editors via _monaco property");
                return editors;
            }
        }
        // Method 2: Try to find monaco in window properties
        for (const key in window) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const prop = window[key];
                if (prop && typeof prop === 'object' && prop.editor && typeof prop.editor.getEditors === 'function') {
                    const editors = prop.editor.getEditors();
                    if (editors && Array.isArray(editors) && editors.length > 0) {
                        console.log(`DSA Tracker: Found Monaco editors via window.${key}`);
                        return editors;
                    }
                }
            }
            catch (err) {
                void err; // Acknowledge unused variable
                // Ignore property access errors
            }
        }
        // Method 3: Try to find the editor instance directly in the DOM
        const monacoElements = document.querySelectorAll('.monaco-editor');
        if (monacoElements.length > 0) {
            // Some Monaco implementations store editor instances in DOM data
            for (let i = 0; i < monacoElements.length; i++) {
                try {
                    const editorElement = monacoElements[i];
                    // Try to get editor instance from DOM element
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const editorInstance = editorElement._tokenization?.editor ||
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        editorElement.editor ||
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        editorElement.__editor;
                    if (editorInstance && typeof editorInstance.getValue === 'function') {
                        console.log("DSA Tracker: Found Monaco editor instance in DOM element");
                        return [editorInstance];
                    }
                }
                catch (err) {
                    void err; // Acknowledge unused variable
                    // Ignore property access errors
                }
            }
        }
    }
    catch (e) {
        void e; // Acknowledge unused variable
        console.error("DSA Tracker: Error accessing Monaco editors", e);
    }
    return null;
}
// For debugging
console.log("DSA Tracker: Content script loaded on " + window.location.href);
// Initialize tracking when the page loads
initializeTracking();
// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.log("DSA Tracker: Received message", message);
    if (message.action === 'getProblemInfo') {
        getProblemInfo().then(sendResponse);
        return true; // Required to use sendResponse asynchronously
    }
    else if (message.action === 'captureError') {
        captureError().then(sendResponse);
        return true; // Required to use sendResponse asynchronously
    }
    else if (message.action === 'extractTestCases') {
        extractTestCases().then(sendResponse);
        return true; // Required to use sendResponse asynchronously
    }
    else if (message.action === 'initializeTracking') {
        initializeTracking();
        sendResponse({ success: true });
        return true;
    }
    else if (message.action === 'getSolutionVersions') {
        const titleSlug = getUrlSlug();
        const versions = titleSlug ? solutionVersionsMap[titleSlug] || [] : [];
        sendResponse({ versions });
        return true;
    }
    return false; // Default case
});
// Initialize tracking by setting up network interceptors
async function initializeTracking() {
    // Detect current programming language
    detectLanguage();
    // Set up network interception - this is where we'll capture Run and Submit actions
    setupNetworkInterception();
    // Set up language change detection
    setupLanguageChangeDetection();
    // Get the URL slug, but don't create a problem yet - only load existing solutions
    const titleSlug = getUrlSlug();
    if (titleSlug) {
        const versions = await loadSolutionVersions(titleSlug);
        solutionVersionsMap[titleSlug] = versions;
        console.log(`DSA Tracker: Loaded ${versions.length} saved solution versions for ${titleSlug}`);
    }
    console.log("DSA Tracker: Tracking initialized for", window.location.href);
}
// Get the current URL slug from the window location
function getUrlSlug() {
    const path = window.location.pathname;
    const match = path.match(/\/problems\/([^/]+)/);
    return match ? match[1] : null;
}
// Detect the programming language currently being used
function detectLanguage() {
    // Look for language selector in the UI with updated selectors
    const languageSelector = document.querySelector('.ant-select-selection-item') ||
        document.querySelector('[data-cy="lang-select"]') ||
        document.querySelector('.select-lang') ||
        document.querySelector('.relative.text-label-1') || // New selector
        document.querySelector('[data-mode]') || // Code editor might have data-mode attribute
        document.querySelector('[data-track-load="code_editor"]'); // Another possible selector
    if (languageSelector && languageSelector.textContent) {
        const text = languageSelector.textContent.toLowerCase();
        if (text.includes('javascript'))
            currentLanguage = 'javascript';
        else if (text.includes('typescript'))
            currentLanguage = 'typescript';
        else if (text.includes('python'))
            currentLanguage = 'python';
        else if (text.includes('java'))
            currentLanguage = 'java';
        else if (text.includes('c++'))
            currentLanguage = 'cpp';
        else if (text.includes('c#'))
            currentLanguage = 'csharp';
        else if (text.includes('go'))
            currentLanguage = 'go';
        else if (text.includes('case 1'))
            currentLanguage = 'java'; // LeetCode shows "case 1" for Java sometimes
        else if (text.includes('case 2'))
            currentLanguage = 'python'; // LeetCode shows "case 2" for Python sometimes
        else
            currentLanguage = text.trim();
        console.log("DSA Tracker: Detected language:", currentLanguage);
    }
    else {
        // Try alternative approach - check code editor attributes
        const editorElement = document.querySelector('.monaco-editor');
        if (editorElement) {
            const editorLanguage = editorElement.getAttribute('data-language') ||
                editorElement.getAttribute('data-mode');
            if (editorLanguage) {
                currentLanguage = editorLanguage.toLowerCase();
                console.log("DSA Tracker: Detected language from editor:", currentLanguage);
                return;
            }
        }
        // Try to infer from code content
        const tryDetectFromCode = () => {
            // Get code from editor or textarea
            let code = '';
            if (window.monaco?.editor) {
                try {
                    const editors = window.monaco.editor.getEditors();
                    if (editors?.length > 0) {
                        code = editors[0].getValue() || '';
                    }
                }
                catch (err) {
                    void err; // Acknowledge unused variable
                    // Ignore errors
                }
            }
            if (!code) {
                // Try textareas
                const textareas = document.querySelectorAll('textarea');
                for (const textarea of textareas) {
                    if (textarea.value?.length > 20) {
                        code = textarea.value;
                        break;
                    }
                }
            }
            // Analyze code to guess the language
            if (code) {
                if (code.includes('public class') || code.includes('import java.')) {
                    return 'java';
                }
                else if (code.includes('func ') && code.includes('package ')) {
                    return 'go';
                }
                else if (code.includes('def ') && code.includes(':')) {
                    return 'python';
                }
                else if (code.includes('function') || code.includes('const ') || code.includes('let ')) {
                    return 'javascript';
                }
                else if (code.includes('#include') || code.includes('vector<')) {
                    return 'cpp';
                }
            }
            return null;
        };
        // Try to detect from code
        const detectedLang = tryDetectFromCode();
        if (detectedLang) {
            currentLanguage = detectedLang;
            console.log("DSA Tracker: Detected language from code:", currentLanguage);
            return;
        }
        // Try to infer from URL or problem metadata
        if (window.location.pathname.includes('/java/') || document.querySelector('.java-code')) {
            currentLanguage = 'java';
        }
        else if (window.location.pathname.includes('/python/') || document.querySelector('.python-code')) {
            currentLanguage = 'python';
        }
        else if (window.location.pathname.includes('/javascript/') || document.querySelector('.js-code')) {
            currentLanguage = 'javascript';
        }
        else {
            // Default to JavaScript if we can't detect
            currentLanguage = 'javascript';
            console.log("DSA Tracker: Could not detect language, defaulting to JavaScript");
        }
    }
}
// Setup detection for language changes
function setupLanguageChangeDetection() {
    // Watch for changes to the language selector with updated selectors
    const observer = new MutationObserver(() => {
        detectLanguage();
    });
    const languageSelector = document.querySelector('.ant-select-selection-item') ||
        document.querySelector('[data-cy="lang-select"]') ||
        document.querySelector('.select-lang') ||
        document.querySelector('.relative.text-label-1') || // New selector
        document.querySelector('[data-track-load="code_editor"]'); // Another selector
    if (languageSelector) {
        observer.observe(languageSelector, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }
    // Also observe the monaco editor for language changes
    const editorElement = document.querySelector('.monaco-editor');
    if (editorElement) {
        observer.observe(editorElement, {
            attributes: true,
            attributeFilter: ['data-language', 'data-mode'],
            subtree: true
        });
    }
}
// Set up interception of network requests
function setupNetworkInterception() {
    // Prevent double-patching fetch
    if (window.fetch.isPatchedByDSATracker) {
        console.log("DSA Tracker: Fetch is already patched.");
        return;
    }
    console.log("DSA Tracker: Setting up network interception");
    // Store the original fetch function
    const originalFetch = window.fetch;
    // Monkey patch fetch to intercept network requests
    window.fetch = async function (input, init) {
        const url = typeof input === 'string'
            ? input
            : input instanceof Request ? input.url : input.toString();
        // Only debug important requests to reduce console noise
        const isCodeRun = (url.includes('/interpret_solution/') ||
            url.includes('/problems/') && url.includes('/interpret_solution'));
        const isSubmission = (url.includes('/submit/') ||
            url.includes('/problems/') && url.includes('/submit'));
        // For debugging important requests
        if (isCodeRun || isSubmission) {
            console.log("DSA Tracker: IMPORTANT REQUEST DETECTED:", {
                url,
                isCodeRun,
                isSubmission,
                method: init?.method || 'GET',
                hasBody: !!init?.body
            });
            // Fix the issue with possibly undefined 'init' parameter
            // Log the body for debugging if present
            if (init?.body) {
                try {
                    const bodyContent = typeof init.body === 'string'
                        ? init.body
                        : init.body instanceof FormData
                            ? 'FormData object (cannot stringify)'
                            : JSON.stringify(init.body);
                    console.log("DSA Tracker: Request body:", bodyContent);
                }
                catch (e) {
                    void e; // Acknowledge unused variable
                    console.log("DSA Tracker: Could not log body");
                }
            }
        }
        // Continue with the original fetch to get the response
        const response = await originalFetch.apply(this, [input, init]);
        try {
            // Only process important requests - Run and Submit actions
            if (isCodeRun || isSubmission) {
                // Clone the response so we can read it multiple times
                const responseClone = response.clone();
                // Get problem metadata
                const problemId = getProblemIdFromUrl(window.location.href);
                if (!problemId) {
                    console.warn("DSA Tracker: Not on a problem page, skipping interception logic.");
                    return response; // Not on a problem page
                }
                const problemTitle = document.querySelector('div[data-cy="question-title"]')?.textContent?.trim() || '';
                // For code runs (checking solution)
                if (isCodeRun) {
                    console.log("DSA Tracker: Detected code run request");
                    // Extract the code from the request body
                    let code = '';
                    let language = '';
                    let inputData = '';
                    if (init && init.body) {
                        try {
                            // If it's a string, parse it as JSON
                            const body = typeof init.body === 'string'
                                ? JSON.parse(init.body)
                                : init.body;
                            console.log("DSA Tracker: Request body keys:", Object.keys(body));
                            // Extract code and language
                            if (body.typed_code) {
                                code = body.typed_code;
                                console.log("DSA Tracker: Extracted code (length):", code.length);
                            }
                            else if (body.question && body.question.code) {
                                // Alternative location in newer LeetCode versions
                                code = body.question.code;
                                console.log("DSA Tracker: Extracted code from alternative location (length):", code.length);
                            }
                            if (body.lang) {
                                language = body.lang;
                                console.log("DSA Tracker: Extracted language:", language);
                            }
                            else if (body.lang_slug) {
                                language = body.lang_slug;
                                console.log("DSA Tracker: Extracted language from lang_slug:", language);
                            }
                            else if (body.question && body.question.lang) {
                                language = body.question.lang;
                                console.log("DSA Tracker: Extracted language from question.lang:", language);
                            }
                            if (body.data_input) {
                                inputData = body.data_input;
                                console.log("DSA Tracker: Extracted input data (length):", inputData.length);
                            }
                            else if (body.params) {
                                inputData = body.params;
                                console.log("DSA Tracker: Extracted input data from params (length):", inputData.length);
                            }
                        }
                        catch (e) {
                            void e; // Acknowledge unused variable
                            console.error("DSA Tracker: Error parsing request body", e);
                        }
                    }
                    if (code && language) {
                        // Generate a unique ID for this run
                        const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                        // Create a new solution version for this run
                        const version = {
                            id: runId,
                            problemId,
                            code,
                            language,
                            status: 'running',
                            timestamp: Date.now(),
                            isSubmission: false,
                            runId,
                            input: inputData,
                            expectedOutput: '', // Will be filled from the response
                        };
                        // Get previous versions to compare changes
                        const previousVersions = await getVersionsFromStorage(problemId);
                        if (previousVersions.length > 0) {
                            // Calculate changes compared to the latest version
                            const latestVersion = previousVersions[0];
                            version.changes = calculateCodeChanges(latestVersion.code, code);
                        }
                        // Store the new version temporarily
                        await storeVersionInStorage(version);
                        // Process the response to update status and results
                        responseClone.json().then(async (data) => {
                            try {
                                console.log("DSA Tracker: Run response keys:", Object.keys(data));
                                // Handle different response formats
                                const isSuccess = data.run_success !== undefined
                                    ? data.run_success
                                    : data.state === 'SUCCESS';
                                // Update the version with results
                                version.status = isSuccess ? 'passed' : 'failed';
                                // Extract output based on different response formats
                                if (data.code_answer) {
                                    version.output = Array.isArray(data.code_answer)
                                        ? data.code_answer.join('\n')
                                        : String(data.code_answer);
                                }
                                else if (data.code_output) {
                                    version.output = Array.isArray(data.code_output)
                                        ? data.code_output.join('\n')
                                        : String(data.code_output);
                                }
                                else if (data.stdout) {
                                    version.output = data.stdout;
                                }
                                // Extract expected output
                                if (data.expected_code_answer) {
                                    version.expectedOutput = Array.isArray(data.expected_code_answer)
                                        ? data.expected_code_answer.join('\n')
                                        : String(data.expected_code_answer);
                                }
                                else if (data.expected_output) {
                                    version.expectedOutput = data.expected_output;
                                }
                                // Extract runtime metrics
                                version.executionTime = data.status_runtime || data.runtime || '';
                                version.memoryUsed = data.status_memory || data.memory || '';
                                // If there's an error, analyze it
                                if (!isSuccess) {
                                    const errorMessage = data.status_msg || data.error_msg || data.message || 'Unknown error';
                                    version.errorMessage = errorMessage;
                                    // Analyze the error
                                    const analyzer = new ErrorAnalyzer();
                                    version.errorAnalysis = analyzer.analyzeError({
                                        errorMessage: errorMessage,
                                        language: language,
                                        code: code,
                                        problemId: problemId,
                                        problemTitle: problemTitle,
                                        failedTestCase: inputData
                                    });
                                }
                                console.log("DSA Tracker: Processed run response:", {
                                    status: version.status,
                                    hasOutput: !!version.output,
                                    hasError: !!version.errorMessage
                                });
                                // Update the stored version
                                await storeVersionInStorage(version);
                                // Send the code run to the backend
                                await sendCodeRunToBackend(version);
                            }
                            catch (err) {
                                void err; // Acknowledge unused variable
                                console.error("DSA Tracker: Error processing code run response", err);
                            }
                        }).catch(e => {
                            void e; // Acknowledge unused variable
                            console.error("DSA Tracker: Error processing code run response JSON", e);
                        });
                    }
                    // For submissions
                    if (isSubmission) {
                        console.log("DSA Tracker: Detected submission request");
                        // Extract the code from the request body
                        let code = '';
                        let language = '';
                        if (init && init.body) {
                            try {
                                // If it's a string, parse it as JSON
                                const body = typeof init.body === 'string'
                                    ? JSON.parse(init.body)
                                    : init.body;
                                console.log("DSA Tracker: Submission request body keys:", Object.keys(body));
                                // Extract code and language
                                if (body.typed_code) {
                                    code = body.typed_code;
                                    console.log("DSA Tracker: Extracted submission code (length):", code.length);
                                }
                                else if (body.question && body.question.code) {
                                    // Alternative location in newer LeetCode versions
                                    code = body.question.code;
                                    console.log("DSA Tracker: Extracted submission code from alternative location (length):", code.length);
                                }
                                else if (body.submission_code) {
                                    code = body.submission_code;
                                    console.log("DSA Tracker: Extracted submission code from submission_code (length):", code.length);
                                }
                                if (body.lang) {
                                    language = body.lang;
                                    console.log("DSA Tracker: Extracted submission language:", language);
                                }
                                else if (body.lang_slug) {
                                    language = body.lang_slug;
                                    console.log("DSA Tracker: Extracted submission language from lang_slug:", language);
                                }
                                else if (body.question && body.question.lang) {
                                    language = body.question.lang;
                                    console.log("DSA Tracker: Extracted submission language from question.lang:", language);
                                }
                            }
                            catch (e) {
                                void e; // Acknowledge unused variable
                                console.error("DSA Tracker: Error parsing submission request body", e);
                            }
                        }
                        if (code && language) {
                            // Generate a unique ID for this submission
                            const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                            // Create a new solution version for this submission
                            const version = {
                                id: submissionId,
                                problemId,
                                code,
                                language,
                                status: 'submitted',
                                timestamp: Date.now(),
                                isSubmission: true,
                                submissionId,
                            };
                            // Get previous versions to compare changes
                            const previousVersions = await getVersionsFromStorage(problemId);
                            if (previousVersions.length > 0) {
                                // Calculate changes compared to the latest version
                                const latestVersion = previousVersions[0];
                                version.changes = calculateCodeChanges(latestVersion.code, code);
                            }
                            // Store the new version temporarily
                            await storeVersionInStorage(version);
                            // Process the response to update status and results
                            responseClone.json().then(async (data) => {
                                try {
                                    console.log("DSA Tracker: Submission response keys:", Object.keys(data));
                                    // Extract submission ID from response
                                    if (data.submission_id) {
                                        version.submissionId = data.submission_id;
                                    }
                                    else if (data.id) {
                                        version.submissionId = data.id;
                                    }
                                    // Update the version with results
                                    // 10 is the code for "Accepted" in most LeetCode responses
                                    const isAccepted = data.status_code === 10 || data.status === 'Accepted' || data.state === 'SUCCESS';
                                    version.status = isAccepted ? 'accepted' : 'failed';
                                    // Extract runtime metrics
                                    version.executionTime = data.status_runtime || data.runtime || '';
                                    version.memoryUsed = data.status_memory || data.memory || '';
                                    // If there's an error, analyze it
                                    if (!isAccepted) {
                                        const errorMessage = data.status_msg || data.error_msg || data.message || 'Unknown error';
                                        version.errorMessage = errorMessage;
                                        // Determine test case input if available
                                        const failedTestCase = data.input || data.last_testcase || '';
                                        // Analyze the error
                                        const analyzer = new ErrorAnalyzer();
                                        version.errorAnalysis = analyzer.analyzeError({
                                            errorMessage: errorMessage,
                                            language: language,
                                            code: code,
                                            problemId: problemId,
                                            problemTitle: problemTitle,
                                            failedTestCase: failedTestCase
                                        });
                                    }
                                    console.log("DSA Tracker: Processed submission response:", {
                                        status: version.status,
                                        isAccepted: isAccepted,
                                        hasError: !!version.errorMessage
                                    });
                                    // Update the stored version
                                    await storeVersionInStorage(version);
                                    // Send the submission to the backend
                                    await sendSubmissionToBackend(version);
                                }
                                catch (err) {
                                    void err; // Acknowledge unused variable
                                    console.error("DSA Tracker: Error processing submission response", err);
                                }
                            }).catch(e => {
                                void e; // Acknowledge unused variable
                                console.error("DSA Tracker: Error processing submission response JSON", e);
                            });
                        }
                        else {
                            console.log("DSA Tracker: Failed to extract code or language from submission request body");
                        }
                    }
                }
            }
        }
        catch (error) {
            void error; // Acknowledge unused variable
            console.error("DSA Tracker: Error in fetch interception", error);
        }
        // Always return the original response
        return response;
    };
    // Mark fetch as patched
    window.fetch.isPatchedByDSATracker = true;
    console.log("DSA Tracker: Network interception setup complete");
}
// Calculate code changes function
function calculateCodeChanges(oldCode, newCode) {
    if (!oldCode || !newCode) {
        return { addedLines: 0, removedLines: 0, modifiedLines: 0 };
    }
    const oldLines = oldCode.split('\n');
    const newLines = newCode.split('\n');
    const addedLines = Math.max(0, newLines.length - oldLines.length);
    const removedLines = Math.max(0, oldLines.length - newLines.length);
    // Simple diff - count lines that are different
    let modifiedLines = 0;
    const minLength = Math.min(oldLines.length, newLines.length);
    for (let i = 0; i < minLength; i++) {
        if (oldLines[i] !== newLines[i]) {
            modifiedLines++;
        }
    }
    return { addedLines, removedLines, modifiedLines };
}
// Store a solution version to local storage and send to backend
function storeSolutionVersion(titleSlug, version) {
    try {
        // Store locally first
        chrome.storage.local.get(['solutionVersions'], (result) => {
            const allVersions = result.solutionVersions || {};
            allVersions[titleSlug] = allVersions[titleSlug] || [];
            // Find if we already have this version
            const existingIndex = allVersions[titleSlug].findIndex((v) => v.id === version.id);
            if (existingIndex >= 0) {
                // Update existing version
                allVersions[titleSlug][existingIndex] = version;
            }
            else {
                // Add new version
                allVersions[titleSlug].push(version);
            }
            // Limit to 50 versions per problem to prevent storage issues
            if (allVersions[titleSlug].length > 50) {
                allVersions[titleSlug] = allVersions[titleSlug].slice(-50);
            }
            // Save back to local storage
            chrome.storage.local.set({ solutionVersions: allVersions }, () => {
                console.log("DSA Tracker: Saved solution version to local storage");
            });
        });
        // If this is a submission with a submissionId, send to backend
        if (version.isSubmission && version.submissionId) {
            sendVersionToBackend(version);
        }
    }
    catch (error) {
        void error; // Acknowledge unused variable
        console.error("DSA Tracker: Error storing solution version:", error);
    }
}
// Send solution version to backend
async function sendVersionToBackend(version) {
    try {
        // Get API base URL and auth token
        // @ts-expect-error - process.env.API_BASE_URL is injected by webpack.DefinePlugin
        const apiBaseUrl = localStorage.getItem('apiBaseUrl') || "http://localhost:3000" || 0;
        const token = localStorage.getItem('token');
        // Only proceed if we have a token
        if (!token) {
            console.log("DSA Tracker: Not sending solution version to backend - no authentication token");
            return;
        }
        // Extract or create a submission ID
        const submissionId = version.submissionId;
        // If there's no submissionId but we have a problem tracked in our system,
        // we'll need to first create a submission record
        if (!submissionId) {
            // We could make an API call to create a submission first
            // For now, we'll skip versions without a submissionId
            return;
        }
        // Include code changes data for AI analysis if available
        const codeChanges = version.changes ? {
            addedLines: version.changes.addedLines,
            removedLines: version.changes.removedLines,
            modifiedLines: version.changes.modifiedLines
        } : undefined;
        // Prepare version data
        const versionData = {
            submissionId: submissionId,
            code: version.code,
            language: version.language,
            versionNumber: undefined, // Let the backend assign a number
            changelog: `${version.isSubmission ? 'Submission' : 'Run'} - ${version.status}`,
            codeChanges: codeChanges // Include code changes for AI analysis
        };
        // Send to solution versions API
        const response = await fetch(`${apiBaseUrl}/api/solutions/versions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(versionData)
        });
        if (!response.ok) {
            void response.text().then(text => console.error('Failed to send solution version to backend:', text));
        }
        else {
            console.log("DSA Tracker: Saved solution version to backend");
        }
    }
    catch (error) {
        void error; // Acknowledge unused variable
        console.error("DSA Tracker: Error sending solution version to backend:", error);
    }
}
// Load solution versions from local storage
function loadSolutionVersions(titleSlug) {
    return new Promise((resolve) => {
        chrome.storage.local.get(['solutionVersions'], (result) => {
            const allVersions = result.solutionVersions || {};
            const versions = allVersions[titleSlug] || [];
            resolve(versions);
        });
    });
}
// Extract problem information using the GraphQL API
async function getProblemInfo() {
    try {
        const titleSlug = getUrlSlug();
        if (!titleSlug) {
            return { success: false, message: 'Not a LeetCode problem page' };
        }
        // Use the GraphQL API to get problem data
        const problemData = await leetcodeApi.getProblemData(titleSlug);
        if (!problemData) {
            return { success: false, message: 'Failed to fetch problem data' };
        }
        // Transform the problem data to the expected format
        const problem = {
            title: problemData.title,
            leetcodeId: problemData.titleSlug,
            difficulty: problemData.difficulty,
            url: window.location.href,
            timestamp: Date.now(),
            description: problemData.content,
            examples: problemData.exampleTestcases,
            tags: problemData.topicTags.map(tag => tag.name)
        };
        return { success: true, problem };
    }
    catch (error) {
        void error; // Acknowledge unused variable
        console.error('Error extracting problem info:', error);
        return { success: false, message: 'Error extracting problem info', error: String(error) };
    }
}
// Extract error information from the page
async function captureError() {
    try {
        const titleSlug = getUrlSlug();
        if (!titleSlug) {
            return { success: false, message: 'Not a LeetCode problem page' };
        }
        // Get problem data from the API
        const problemData = await leetcodeApi.getProblemData(titleSlug);
        if (!problemData) {
            return { success: false, message: 'Failed to fetch problem data' };
        }
        // Get the latest submission (if any)
        const submissions = await leetcodeApi.getSubmissions(titleSlug, 1);
        if (!submissions || submissions.length === 0) {
            return { success: false, message: 'No submissions found' };
        }
        const latestSubmission = submissions[0];
        // Create error data object
        const errorData = {
            problemId: problemData.questionFrontendId,
            problemTitle: problemData.title,
            language: latestSubmission.lang,
            code: latestSubmission.code,
            error: latestSubmission.statusDisplay !== 'Accepted' ? latestSubmission.statusDisplay : 'No error',
            timestamp: new Date().toISOString(),
            url: window.location.href,
        };
        return { success: true, error: errorData };
    }
    catch (error) {
        void error; // Acknowledge unused variable
        console.error('Error capturing error:', error);
        return { success: false, message: 'Error capturing error data', error: String(error) };
    }
}
// Extract test cases from the problem
async function extractTestCases() {
    try {
        const titleSlug = getUrlSlug();
        if (!titleSlug) {
            return { success: false, message: 'Not a LeetCode problem page' };
        }
        // Get problem data from the API
        const problemData = await leetcodeApi.getProblemData(titleSlug);
        if (!problemData) {
            return { success: false, message: 'Failed to fetch problem data' };
        }
        // Parse example test cases
        const testCases = problemData.exampleTestcases.split('\n');
        // Get the latest submission (if any)
        const submissions = await leetcodeApi.getSubmissions(titleSlug, 1);
        // Create test case data object
        const testCaseData = {
            problemId: problemData.questionFrontendId,
            problemTitle: problemData.title,
            language: submissions.length > 0 ? submissions[0].lang : 'unknown',
            testCases: testCases,
            timestamp: new Date().toISOString(),
            url: window.location.href,
        };
        return { success: true, testCase: testCaseData };
    }
    catch (error) {
        void error; // Acknowledge unused variable
        console.error('Error extracting test cases:', error);
        return { success: false, message: 'Error extracting test cases', error: String(error) };
    }
}
// Send code run data to backend via background script (to avoid CORS)
async function sendCodeRunToBackend(_version) {
    void _version; // Acknowledge unused parameter
    // No longer sending code runs to backend - only tracking accepted submissions
    console.log("DSA Tracker: Code runs are no longer tracked");
    // Function kept for compatibility with existing code
}
// Send submission data to backend via background script
async function sendSubmissionToBackend(version) {
    try {
        // Instead of direct fetch, send message to background script
        chrome.runtime.sendMessage({
            action: 'sendSubmission',
            data: {
                problemId: version.problemId,
                code: version.code,
                language: version.language,
                status: version.status,
                executionTime: version.executionTime || null,
                memoryUsed: version.memoryUsed || null,
                externalId: version.submissionId || null,
                errorMessage: version.errorMessage || null,
                errorAnalysis: version.errorAnalysis || null
            }
        }, (response) => {
            if (response && response.success) {
                console.log("DSA Tracker: Successfully sent submission to backend via background script");
            }
            else {
                console.log("DSA Tracker: Failed to send submission to backend", response?.error || "Unknown error");
            }
        });
    }
    catch (error) {
        void error; // Acknowledge unused variable
        console.error("DSA Tracker: Error sending submission to backend", error);
    }
}
// Helper function to get problem ID from URL
function getProblemIdFromUrl(url) {
    const match = url.match(/\/problems\/([^/]+)/);
    return match ? match[1] : null;
}
// Helper class for error analysis
class ErrorAnalyzer {
    analyzeError(params) {
        return (0,_lib_error_analyzer__WEBPACK_IMPORTED_MODULE_1__.analyzeError)('error', // status
        params.errorMessage, params.code, params.language, params.failedTestCase, // input
        undefined, // expected output
        undefined, // actual output
        params.problemId, params.problemTitle, undefined // difficulty
        );
    }
}
// Store version in local storage
async function storeVersionInStorage(version) {
    await storeSolutionVersion(version.problemId, version);
}
// Get versions from local storage
async function getVersionsFromStorage(problemId) {
    return await loadSolutionVersions(problemId);
}
// Get problem details from the DOM
async function getProblemDetailsFromDOM() {
    // Try multiple selectors to find the problem title
    const titleElement = document.querySelector('div[data-cy="question-title"]') ||
        document.querySelector('.css-v3d350') ||
        document.querySelector('.question-title') ||
        document.querySelector('h4.mb-4') || // New selector
        document.querySelector('.text-title-large') || // New selector
        document.querySelector('h4[data-track-load="description_content"]'); // Another possible selector
    if (titleElement) {
        problemTitle = titleElement.textContent?.trim() || '';
        console.log("DSA Tracker: Found problem title:", problemTitle);
    }
    else {
        // Try alternative approach - look for title in the document title
        const docTitle = document.title;
        if (docTitle && docTitle.includes('-')) {
            problemTitle = docTitle.split('-')[0].trim();
            console.log("DSA Tracker: Extracted problem title from document title:", problemTitle);
        }
        else {
            console.warn("DSA Tracker: Could not find problem title element");
        }
    }
    // Extract problem ID from URL
    const urlMatch = window.location.pathname.match(/problems\/([^/]+)/);
    if (urlMatch && urlMatch[1]) {
        problemId = urlMatch[1];
        console.log("DSA Tracker: Extracted problem ID from URL:", problemId);
    }
    else {
        console.warn("DSA Tracker: Could not extract problem ID from URL");
        // Try to get problem ID from breadcrumb or other elements
        const breadcrumbElement = document.querySelector('.breadcrumb');
        if (breadcrumbElement) {
            const text = breadcrumbElement.textContent || '';
            const match = text.match(/(\d+)\.\s/);
            if (match && match[1]) {
                problemId = match[1];
                console.log("DSA Tracker: Extracted problem ID from breadcrumb:", problemId);
            }
        }
    }
}
// Initialize storage service
async function initializeStorageService() {
    try {
        // Any initialization needed for storage
        console.log("DSA Tracker: Storage service initialized");
    }
    catch (error) {
        void error; // Acknowledge unused variable
        console.error("DSA Tracker: Error initializing storage service:", error);
    }
}
// Add debug mode function 
function setupDebugMode() {
    console.log("%cDSA Tracker: Advanced Debug Mode Activated", "color: blue; font-weight: bold; font-size: 14px");
    // 1. FETCH DEBUG - Log all fetch calls with full details
    const origFetch = window.fetch;
    window.fetch = async function (input, init) {
        const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
        const method = init?.method || 'GET';
        console.log(`%cDSA-DEBUG FETCH: ${method} ${url}`, 'color: red; font-weight: bold');
        if (init?.body) {
            try {
                const bodyContent = typeof init.body === 'string'
                    ? init.body
                    : init.body instanceof FormData
                        ? '[FormData]'
                        : JSON.stringify(init.body);
                console.log(`%cDSA-DEBUG BODY: ${bodyContent.substring(0, 500)}`, 'color: purple');
            }
            catch (e) {
                void e; // Acknowledge unused variable
                console.log(`%cDSA-DEBUG BODY: [Could not stringify]`, 'color: purple');
            }
        }
        // Especially look for Run-related URLs
        if (url.includes('interpret') || url.includes('solution') || url.includes('run')) {
            console.log(`%cPOTENTIAL RUN REQUEST DETECTED: ${url}`, 'color: red; background: yellow; font-size: 14px');
        }
        const response = await origFetch.apply(this, [input, init]);
        // Debug response for run-related requests
        if (url.includes('interpret') || url.includes('solution') || url.includes('run')) {
            response.clone().text().then(text => {
                try {
                    console.log(`%cRUN RESPONSE:`, 'color: blue; background: yellow; font-size: 14px', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
                }
                catch (e) {
                    void e; // Acknowledge unused variable
                    console.log(`%cRUN RESPONSE: [Could not display]`, 'color: blue');
                }
            }).catch(err => {
                console.log(`%cRUN RESPONSE ERROR: ${err}`, 'color: red');
            });
        }
        return response;
    };
    // 2. BUTTON CLICK DEBUG - Find all potential Run buttons
    function findRunButtons() {
        // Using multiple selectors to find run buttons
        const buttonSelectors = [
            'button[data-cy="run-code-btn"]',
            'button[title="Run"]',
            'button[title*="un"]'
        ];
        buttonSelectors.forEach(selector => {
            try {
                const buttons = document.querySelectorAll(selector);
                buttons.forEach(btn => {
                    if (!btn.hasAttribute('dsa-tracked')) {
                        btn.setAttribute('dsa-tracked', 'true');
                        console.log(`%cDSA-DEBUG Found Run Button with selector "${selector}":`, 'color: green; font-weight: bold', btn);
                        btn.addEventListener('click', () => {
                            console.log(`%cDSA-DEBUG Run Button CLICKED!`, 'color: green; background: yellow; font-size: 14px');
                            // Capture code right after click
                            setTimeout(captureCurrentCode, 100);
                        });
                    }
                });
            }
            catch (e) {
                void e; // Acknowledge unused variable
                // Some selectors might not be valid, ignore errors
            }
        });
        // Specifically look for the Monaco editor run button which might be different
        const monacoButtons = document.querySelectorAll('.monaco-editor-container .action-item');
        monacoButtons.forEach(btn => {
            if (!btn.hasAttribute('dsa-tracked') &&
                (btn.textContent?.includes('Run') ||
                    btn.getAttribute('title')?.includes('Run'))) {
                btn.setAttribute('dsa-tracked', 'true');
                console.log(`%cDSA-DEBUG Found Monaco Run Button:`, 'color: green; font-weight: bold', btn);
                btn.addEventListener('click', () => {
                    console.log(`%cDSA-DEBUG Monaco Run Button CLICKED!`, 'color: green; background: yellow; font-size: 14px');
                    setTimeout(captureCurrentCode, 100);
                });
            }
        });
    }
    // 3. Monitor for DOM changes to detect new buttons
    const observer = new MutationObserver(() => {
        findRunButtons();
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'data-cy']
    });
    // Initial button scan
    findRunButtons();
    // 4. Try to capture code from editor
    function captureCurrentCode() {
        // Try different methods to get code
        let code = '';
        // Method 1: Check if Monaco editor exists
        const monaco = window.monaco;
        if (monaco && monaco.editor) {
            try {
                const editors = monaco.editor.getEditors();
                if (editors?.length > 0) {
                    code = editors[0].getValue();
                    console.log(`%cDSA-DEBUG Captured code from Monaco editor (${code.length} chars)`, 'color: blue');
                }
            }
            catch (err) {
                void err; // Acknowledge unused variable
                // Ignore errors
            }
        }
        // Method 2: Try to find CodeMirror
        if (!code) {
            const cmElement = document.querySelector('.CodeMirror');
            if (cmElement && cmElement.CodeMirror) {
                code = cmElement.CodeMirror.getValue();
                console.log("DSA Tracker: Got code from CodeMirror", code.length);
            }
        }
        // Try CodeMirror if Monaco failed
        if (!code) {
            const cmElement = document.querySelector('.CodeMirror');
            if (cmElement && cmElement.CodeMirror) {
                try {
                    code = cmElement.CodeMirror.getValue();
                }
                catch (e) {
                    console.log("DSA Tracker: Error getting code from CodeMirror", e);
                }
            }
        }
        // Method 3: Try to find textarea elements that might contain code
        if (!code) {
            const textareas = document.querySelectorAll('textarea.inputarea');
            if (textareas.length > 0) {
                const textarea = textareas[0];
                code = textarea.value;
                console.log(`%cDSA-DEBUG Captured code from textarea (${code.length} chars)`, 'color: blue');
            }
        }
        if (code) {
            console.log(`%cCaptured code snippet:`, 'color: blue', code.substring(0, 100) + '...');
        }
        else {
            console.log(`%cDSA-DEBUG Could not capture code from any editor`, 'color: red');
        }
    }
    // 5. Check for XMLHttpRequest usage (alternative to fetch)
    const origXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url, async = true, username, password) {
        const urlStr = url.toString();
        console.log(`%cDSA-DEBUG XHR: ${method} ${urlStr}`, 'color: orange; font-weight: bold');
        // Especially look for Run-related URLs
        if (urlStr.includes('interpret') || urlStr.includes('solution') || urlStr.includes('run')) {
            console.log(`%cPOTENTIAL XHR RUN REQUEST DETECTED: ${urlStr}`, 'color: orange; background: yellow; font-size: 14px');
            // Monitor this XHR
            this.addEventListener('load', function () {
                console.log(`%cRUN XHR RESPONSE:`, 'color: blue; background: yellow; font-size: 14px', this.responseText?.substring(0, 500));
            });
        }
        return origXHROpen.call(this, method, url, async, username, password);
    };
    console.log("%cDSA Tracker: Debug Mode Setup Complete", "color: blue; font-weight: bold");
}
// Instead of defining the cleanup function inside, we'll use a module-level variable
let visualTrackingIntervals = [];
function setupVisualRunTracking() {
    console.log("DSA Tracker: Setting up visual run tracking");
    // Track elements that signal a code run is in progress
    let runInProgress = false;
    let lastRunTimestamp = 0;
    // Updated selectors for run buttons based on current LeetCode UI
    const runButtonSelectors = [
        '[data-cy="run-code-btn"]',
        'button[title="Run"]',
        'button[title="Run Code"]',
        'button[data-e2e-locator="console-run-button"]',
        'button.runcode-wrapper__run-btn',
        '.monaco-editor button.codicon-play',
        '.monaco-action-bar .actions-container .action-item',
        '.btn-success',
        '.ant-btn-primary',
        '.submit__2ISl'
    ];
    // Function to check if an element is a Run button by its text content or attributes
    function isRunButton(element) {
        // Check text content
        const text = element.textContent?.toLowerCase() || '';
        if (text.includes('run') || text.includes('execute') || text.includes('test')) {
            return true;
        }
        // Check aria-label
        const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
        if (ariaLabel.includes('run') || ariaLabel.includes('execute') || ariaLabel.includes('test')) {
            return true;
        }
        // Check for common class names and attributes
        const className = element.className;
        if ((typeof className === 'string' && (className.includes('run') ||
            className.includes('execute') ||
            className.includes('play'))) ||
            element.getAttribute('data-cy')?.includes('run') ||
            element.getAttribute('data-test')?.includes('run')) {
            return true;
        }
        return false;
    }
    // Function to check for active Run indicators with updated selectors
    function checkForRunIndicators() {
        // Look for typical loading indicators that appear during a run
        const loadingIndicators = [
            '.ant-spin-spinning',
            '.loading-indicator',
            '.spinner',
            '.executing-indicator',
            '[role="progressbar"]',
            '.testcase-loading',
            '.preloader__Preloader',
            '.jsx-ProgressCircle',
            'div[class*="loading"]',
            'div[class*="spinner"]'
        ];
        for (const selector of loadingIndicators) {
            try {
                const indicator = document.querySelector(selector);
                if (indicator && indicator.offsetParent !== null) {
                    // Visible loading indicator found
                    if (!runInProgress) {
                        // This is a new run starting
                        runInProgress = true;
                        lastRunTimestamp = Date.now();
                        console.log("DSA Tracker: Run detected via loading indicator", selector);
                        // Capture code from editor
                        setTimeout(() => captureCodeAfterRunDetection(), 100);
                    }
                    return;
                }
            }
            catch (error) {
                void error; // Acknowledge unused variable
                // Ignore errors from invalid selectors
            }
        }
        // Also check for result panels that appear after a run
        const resultSelectors = [
            '.result__23wN',
            '.result-container',
            '[data-e2e-locator="console-result-container"]',
            'div[class*="result"]',
            '.testcase-result'
        ];
        let resultPanelFound = false;
        for (const selector of resultSelectors) {
            try {
                const resultPanel = document.querySelector(selector);
                if (resultPanel && resultPanel.offsetParent !== null) {
                    resultPanelFound = true;
                    // If we were tracking a run and now see results, log it
                    if (runInProgress && Date.now() - lastRunTimestamp > 500) {
                        console.log("DSA Tracker: Run result panel found", selector);
                        // Don't reset runInProgress yet, wait for the next cycle
                    }
                    break;
                }
            }
            catch (error) {
                void error; // Acknowledge unused variable
                // Ignore errors from invalid selectors
            }
        }
        // No loading indicators found, check if we need to reset
        if (runInProgress && Date.now() - lastRunTimestamp > 5000 && !resultPanelFound) {
            // It's been 5 seconds since we detected a run in progress
            // and no loading indicators are visible anymore
            runInProgress = false;
            console.log("DSA Tracker: Run appears to have completed");
        }
    }
    // Set up a DOM observer to watch for Run button activity
    const observer = new MutationObserver((mutations) => {
        // Check if any mutations involve Run buttons
        for (const mutation of mutations) {
            if (mutation.type === 'attributes' &&
                mutation.target instanceof HTMLElement) {
                const target = mutation.target;
                // Check if this is a Run button changing state (like becoming disabled during a run)
                let isTargetRunButton = false;
                // First check if it matches one of our selectors
                for (const selector of runButtonSelectors) {
                    try {
                        if (target.matches(selector)) {
                            // For general button selectors, additional check may be needed
                            isTargetRunButton = isRunButton(target);
                            break;
                        }
                    }
                    catch (e) {
                        void e; // Acknowledge unused variable
                        // Ignore invalid selector errors
                    }
                }
                if (isTargetRunButton) {
                    // Cast to HTMLButtonElement if it's a button
                    const isDisabled = target instanceof HTMLButtonElement ?
                        (target.disabled || target.hasAttribute('disabled')) :
                        target.hasAttribute('disabled');
                    console.log("DSA Tracker: Run button state changed", {
                        disabled: isDisabled,
                        className: target.className
                    });
                    // If button was just disabled, it likely means a run started
                    if (isDisabled && !runInProgress) {
                        runInProgress = true;
                        lastRunTimestamp = Date.now();
                        setTimeout(() => captureCodeAfterRunDetection(), 100);
                    }
                }
            }
            // Also look for new loading indicators that might have appeared
            if (mutation.type === 'childList') {
                checkForRunIndicators();
            }
        }
    });
    // Start observing the entire document for button state changes
    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['disabled', 'class'],
        childList: true,
        subtree: true
    });
    // Store intervals in the module-level array
    const checkInterval = setInterval(checkForRunIndicators, 1000);
    visualTrackingIntervals.push(checkInterval);
    // Initial check for run buttons to monitor
    function findRunButtons() {
        for (const selector of runButtonSelectors) {
            try {
                const buttons = document.querySelectorAll(selector);
                buttons.forEach(button => {
                    // For general selectors, check text content
                    let isRun = true;
                    if (selector === 'button' ||
                        selector === '.ant-btn' ||
                        selector === '.ant-btn-primary' ||
                        selector.includes('action-item')) {
                        isRun = isRunButton(button);
                    }
                    if (isRun) {
                        // console.log("DSA Tracker: Found run button", selector, button);
                        // Add direct click listener
                        if (!button.hasAttribute('dsa-tracker-monitored')) {
                            button.setAttribute('dsa-tracker-monitored', 'true');
                            button.addEventListener('click', () => {
                                console.log("DSA Tracker: Run button clicked directly");
                                runInProgress = true;
                                lastRunTimestamp = Date.now();
                                setTimeout(() => captureCodeAfterRunDetection(), 100);
                            });
                        }
                    }
                });
            }
            catch (e) {
                void e; // Acknowledge unused variable
                // Ignore invalid selector errors
            }
        }
    }
    // Run the initial button finder
    findRunButtons();
    // Also check periodically for new buttons
    const buttonCheckInterval = setInterval(findRunButtons, 3000);
    visualTrackingIntervals.push(buttonCheckInterval);
    console.log("DSA Tracker: Visual run tracking setup complete");
}
// Modify the injectRunInterception function
function injectRunInterception() {
    console.log("DSA Tracker: Setting up run interception with CSP-safe method");
    // Observe the DOM for Monaco editor being added
    const editorObserver = new MutationObserver(() => {
        // Check if Monaco editor has been added to the page
        const monacoElement = document.querySelector('.monaco-editor');
        if (monacoElement) {
            console.log("DSA Tracker: Monaco editor detected");
            // Poll for the editor object to be available in window
            const checkForMonaco = setInterval(() => {
                // Check if monaco is available on window
                if (window.monaco && window.monaco.editor) {
                    clearInterval(checkForMonaco);
                    isMonacoReady = true; // Set global flag
                    console.log("DSA Tracker: Monaco editor API available, setting up monitoring");
                    // Monitor for editor changes
                    try {
                        const editors = window.monaco.editor.getEditors();
                        if (editors && editors.length > 0) {
                            const editor = editors[0];
                            // Hook into editor change events to detect modifications
                            if (editor.onDidChangeModelContent) {
                                editor.onDidChangeModelContent((event) => {
                                    void event; // Acknowledge unused variable
                                    console.log("DSA Tracker: Editor content changed");
                                });
                            }
                            console.log("DSA Tracker: Successfully set up Monaco editor monitoring");
                        }
                    }
                    catch (e) {
                        void e; // Acknowledge unused variable
                        console.error("DSA Tracker: Error setting up Monaco monitoring", e);
                    }
                }
            }, 1000);
            // Safety cleanup - don't poll forever
            setTimeout(() => {
                clearInterval(checkForMonaco);
                if (!isMonacoReady) {
                    console.log("DSA Tracker: Monaco detection timed out after 30 seconds");
                }
            }, 30000);
        }
    });
    // Start observing for editor
    editorObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
    console.log("DSA Tracker: Page script injection setup complete (CSP-safe method)");
}
// Add DOM events monitoring to capture key user interactions
function monitorDomEvents() {
    console.log("DSA Tracker: Setting up DOM events monitoring");
    // Listen for keypress events that might indicate Run action (Ctrl+Enter is common)
    document.addEventListener('keydown', (e) => {
        // Check for Ctrl+Enter, which is often used to run code
        if (e.ctrlKey && e.key === 'Enter') {
            console.log("DSA Tracker: Detected Ctrl+Enter shortcut, likely a code run");
            // Wait a short time for the run to start, then capture code
            setTimeout(() => {
                // Try to get code from the active editor
                const code = getCurrentCode();
                if (code) {
                    handleCodeRun(code, currentLanguage);
                }
            }, 100);
        }
    });
    // Function to get current code from any available editor
    function getCurrentCode() {
        let code = '';
        // Try Monaco editor first using our helper
        const editors = getMonacoEditors();
        if (editors) {
            try {
                code = editors[0].getValue();
            }
            catch (e) {
                void e; // Acknowledge unused variable
                console.log("DSA Tracker: Error getting code from Monaco", e);
            }
        }
        // Try CodeMirror if Monaco failed
        if (!code) {
            const cmElement = document.querySelector('.CodeMirror');
            if (cmElement && cmElement.CodeMirror) {
                try {
                    code = cmElement.CodeMirror.getValue();
                }
                catch (e) {
                    void e; // Acknowledge unused variable
                    console.log("DSA Tracker: Error getting code from CodeMirror", e);
                }
            }
        }
        // Try textareas as last resort
        if (!code) {
            const textareas = document.querySelectorAll('textarea');
            for (const textarea of textareas) {
                if (textarea.value && textarea.value.length > 20) {
                    code = textarea.value;
                    break;
                }
            }
        }
        return code;
    }
    console.log("DSA Tracker: DOM events monitoring setup complete");
}
// Define cleanup function at module level
function cleanupVisualTracking() {
    console.log("DSA Tracker: Cleaning up visual run tracking");
    visualTrackingIntervals.forEach(interval => clearInterval(interval));
    visualTrackingIntervals = [];
}
// Add a cleanup listener to ensure intervals are cleared when the extension is unloaded
window.addEventListener('beforeunload', () => {
    cleanupVisualTracking();
});
// Add this function to handle code runs when detected
function handleCodeRun(code, language) {
    console.log(`DSA Tracker: Code run detected - ${code.length} chars, language: ${language}`);
    // No longer tracking code runs - only tracking accepted submissions via fetch interceptor
    // This function is kept as a placeholder to maintain compatibility with existing code
}
// Add a function to get code from Monaco using the background script
async function getMonacoCodeCSPSafe() {
    return new Promise((resolve) => {
        try {
            // Set up retry mechanism with backoff
            let retries = 0;
            const maxRetries = 3;
            const attemptToGetCode = () => {
                console.log(`DSA Tracker: Attempting to get Monaco code (attempt ${retries + 1}/${maxRetries})`);
                // Create a one-time message to get the code
                chrome.runtime.sendMessage({
                    action: 'get-monaco-code',
                    tabId: tabId // Use the tab ID we stored
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error("DSA Tracker: Error in message response:", chrome.runtime.lastError);
                        if (retries < maxRetries) {
                            retries++;
                            setTimeout(attemptToGetCode, 500 * retries); // Exponential backoff
                        }
                        else {
                            resolve(null);
                        }
                        return;
                    }
                    if (response && response.code) {
                        console.log(`DSA Tracker: Successfully got code from background script (${response.code.length} chars)`);
                        console.log("DSA Tracker: Background script code content:", response.code.substring(0, 200) + (response.code.length > 200 ? '...' : ''));
                        // Log information about the source of the code if available
                        if (response.source) {
                            console.log(`DSA Tracker: Code was extracted using method: ${response.source}`);
                        }
                        resolve(response.code);
                    }
                    else {
                        console.log("DSA Tracker: No code received from background script", response);
                        if (retries < maxRetries) {
                            retries++;
                            setTimeout(attemptToGetCode, 500 * retries); // Exponential backoff
                        }
                        else {
                            resolve(null);
                        }
                    }
                });
            };
            // Start the first attempt
            attemptToGetCode();
            // Set a timeout in case the message doesn't get a response
            setTimeout(() => {
                if (retries >= maxRetries) {
                    console.log("DSA Tracker: Timed out waiting for Monaco code");
                    resolve(null);
                }
            }, 5000);
        }
        catch (error) {
            console.error("DSA Tracker: Error getting Monaco code (CSP-safe)", error);
            resolve(null);
        }
    });
}
// Function to capture code when a run is detected
async function captureCodeAfterRunDetection() {
    // Improved logging to better understand the Monaco state
    console.log("DSA Tracker: Capturing code after run detection", {
        windowMonaco: window.monaco !== undefined,
        hasEditor: window.monaco?.editor !== undefined,
        hasGetEditors: typeof window.monaco?.editor?.getEditors === 'function',
        monacoReady: isMonacoReady,
        monacoElements: document.querySelectorAll('.monaco-editor').length
    });
    // Try to find the code editor
    let code = '';
    const language = currentLanguage;
    try {
        // Try to get code directly from Monaco API
        if (window.monaco && window.monaco.editor && typeof window.monaco.editor.getEditors === 'function') {
            const editors = window.monaco.editor.getEditors();
            if (editors && editors.length > 0) {
                code = editors[0].getValue();
                console.log("DSA Tracker: Got code directly from Monaco API:", code.substring(0, 200) + (code.length > 200 ? '...' : ''));
                handleCodeRun(code, language);
                return;
            }
        }
        // If direct access fails, try using the background script (CSP-safe method)
        console.log("DSA Tracker: Direct Monaco API access failed, trying background script");
        const cspSafeCode = await getMonacoCodeCSPSafe();
        if (cspSafeCode) {
            code = cspSafeCode;
            console.log("DSA Tracker: Got code via CSP-safe method", code.length);
            console.log("DSA Tracker: CSP-safe code content:", code.substring(0, 200) + (code.length > 200 ? '...' : ''));
            handleCodeRun(code, language);
            return;
        }
        // If both methods failed, log the failure
        console.log("DSA Tracker: Failed to capture code from Monaco editor API");
    }
    catch (err) {
        console.error("DSA Tracker: Error capturing code", err);
    }
}
// Add this function to inject a script into the page context to access Monaco directly
// Commented out as it causes CSP issues - using accessMonacoWithoutInlineScript instead
/*
function injectScriptToAccessMonaco() {
  console.log("DSA Tracker: Injecting script to access Monaco directly");
  
  // Create a script element to execute in the page's context
  const script = document.createElement('script');
  script.textContent = `
    // This code runs in the page context with direct access to window.monaco
    (function() {
      function checkForMonaco() {
        if (window.monaco && window.monaco.editor) {
          console.log("MonacoDetected: Monaco editor found in page context");
          
          // Create a custom event to notify our extension
          const event = new CustomEvent('monaco-editor-detected', {
            detail: { found: true }
          });
          document.dispatchEvent(event);
          
          // Set up a function to get code from Monaco when requested
          window.getMonacoCode = function() {
            try {
              const editors = window.monaco.editor.getEditors();
              if (editors && editors.length > 0) {
                const code = editors[0].getValue();
                return code;
              }
            } catch (e) {
              console.error("Error getting Monaco code:", e);
            }
            return null;
          };
          
          // Create a function to listen for editor changes
          window.setupMonacoChangeListener = function() {
            try {
              const editors = window.monaco.editor.getEditors();
              if (editors && editors.length > 0) {
                editors[0].onDidChangeModelContent((event) => {
                  document.dispatchEvent(new CustomEvent('monaco-content-changed'));
                });
                return true;
              }
            } catch (e) {
              console.error("Error setting up Monaco change listener:", e);
            }
            return false;
          };
          
          // Notify that we can get code
          document.dispatchEvent(new CustomEvent('monaco-code-available'));
          
          // Try to set up the change listener
          if (window.setupMonacoChangeListener()) {
            console.log("MonacoDetected: Change listener set up successfully");
          }
          
          // No need to check anymore
          clearInterval(checkInterval);
        }
      }
      
      // Check immediately
      checkForMonaco();
      
      // And also set up an interval to check regularly
      const checkInterval = setInterval(checkForMonaco, 1000);
      
      // Stop checking after 30 seconds to avoid memory leaks
      setTimeout(() => {
        clearInterval(checkInterval);
      }, 30000);
    })();
  `;
  
  // Inject the script
  (document.head || document.documentElement).appendChild(script);
  
  // Remove the script after injection (the code will continue to run)
  script.remove();
  
  // Listen for the custom event from our injected script
  document.addEventListener('monaco-editor-detected', (event) => {
    console.log("DSA Tracker: Received monaco-editor-detected event", (event as CustomEvent).detail);
    isMonacoReady = true;
  });
  
  // Listen for code availability
  document.addEventListener('monaco-code-available', () => {
    console.log("DSA Tracker: Monaco code retrieval is now available");
  });
  
  // Listen for content changes
  document.addEventListener('monaco-content-changed', () => {
    console.log("DSA Tracker: Monaco content changed");
  });
}
*/
// Add this function to access Monaco editor using chrome.scripting API instead of inline script injection
async function accessMonacoWithoutInlineScript() {
    console.log("DSA Tracker: Setting up Monaco access without inline scripts");
    try {
        // Create a port for communication with the background script
        const port = chrome.runtime.connect({ name: "monaco-access" });
        // Set up listener for messages from the background script
        port.onMessage.addListener((message) => {
            if (message.action === 'monaco-detected') {
                console.log("DSA Tracker: Background script detected Monaco editor");
                isMonacoReady = true;
            }
            else if (message.action === 'monaco-code') {
                console.log("DSA Tracker: Received code from background script", message.code?.length || 0);
                if (message.code) {
                    handleCodeRun(message.code, currentLanguage);
                }
            }
        });
        // Listen for button clicks to request code
        document.addEventListener('click', (event) => {
            const target = event.target;
            if (target.matches('button') &&
                (target.textContent?.toLowerCase().includes('run') ||
                    target.getAttribute('aria-label')?.toLowerCase().includes('run'))) {
                console.log("DSA Tracker: Run button clicked, requesting code from background");
                // Delay slightly to let the code update in the editor
                setTimeout(() => {
                    port.postMessage({ action: 'get-monaco-code' });
                }, 100);
            }
        }, true);
        // Request Monaco detection
        port.postMessage({ action: 'detect-monaco' });
    }
    catch (error) {
        console.error("DSA Tracker: Error setting up Monaco access without inline scripts", error);
    }
}
// Store the tab ID for later use
let tabId;
// Update the initialization function to include the tab ID detection
function initTabId() {
    chrome.runtime.sendMessage({ action: 'get-tab-id' }, (response) => {
        if (response && response.tabId) {
            tabId = response.tabId;
            console.log("DSA Tracker: Got tab ID:", tabId);
        }
    });
}
// Update the main initialization function to include our new approaches
async function initializeExtension() {
    console.log("DSA Tracker: Initializing extension on LeetCode");
    try {
        // Setup debug mode first to catch everything
        setupDebugMode();
        // Get the tab ID for communication with background script
        initTabId();
        // Set up all our interception approaches (redundancy is good!)
        // 1. Use CSP-safe Monaco access via the background script
        // This is the primary approach that works with strict CSP policies
        accessMonacoWithoutInlineScript();
        // 2. Try the CSP-safe script injection method
        injectRunInterception();
        // 3. Set up visual run tracking for button/UI based detection
        setupVisualRunTracking();
        // 4. Monitor DOM events for keyboard shortcuts and other interactions
        monitorDomEvents();
        // Load problem ID and title
        await getProblemDetailsFromDOM();
        // Initialize storage service
        await initializeStorageService();
        // 5. Set up network interception for code runs and submissions
        setupNetworkInterception();
        // Add debug information to help troubleshoot
        console.log("DSA Tracker: Extension initialized with:", {
            problemId: problemId,
            problemTitle: problemTitle,
            url: window.location.href,
            networkInterceptionActive: true,
            pageScriptInjected: true,
            visualTrackingActive: true,
            domEventsMonitored: true,
            usingCSPSafeApproach: true
        });
        // Add a visible indicator during development to confirm the extension is running
        const isDevelopment = true; // Set manually for now
        if (isDevelopment) {
            const indicator = document.createElement('div');
            indicator.style.position = 'fixed';
            indicator.style.bottom = '10px';
            indicator.style.right = '10px';
            indicator.style.padding = '5px 10px';
            indicator.style.background = 'rgba(0, 128, 0, 0.7)';
            indicator.style.color = 'white';
            indicator.style.borderRadius = '4px';
            indicator.style.fontSize = '12px';
            indicator.style.zIndex = '9999';
            indicator.textContent = 'DSA Tracker Active (CSP-Safe)';
            document.body.appendChild(indicator);
        }
    }
    catch (error) {
        void error; // Acknowledge unused variable
        console.error("DSA Tracker: Error initializing extension:", error);
    }
}
// Check if page is a LeetCode problem page and initialize
function checkIfLeetCodeProblemPage() {
    // Check if URL matches a LeetCode problem page pattern
    const isProblemPage = window.location.href.includes('leetcode.com/problems/') ||
        document.querySelector('[data-cy="question-title"]') !== null ||
        document.querySelector('.question-title') !== null;
    if (isProblemPage) {
        console.log("DSA Tracker: Detected LeetCode problem page");
        // Wait for page to fully load
        if (document.readyState === 'complete') {
            initializeExtension();
        }
        else {
            window.addEventListener('load', initializeExtension);
        }
    }
    else {
        console.log("DSA Tracker: Not a LeetCode problem page, extension not initialized");
    }
}
// Start the extension initialization process
checkIfLeetCodeProblemPage();
// Also initialize when page URL changes (for SPA navigation)
let lastUrl = window.location.href;
new MutationObserver(() => {
    if (lastUrl !== window.location.href) {
        lastUrl = window.location.href;
        console.log("DSA Tracker: URL changed, checking if it's a problem page");
        checkIfLeetCodeProblemPage();
    }
}).observe(document, { subtree: true, childList: true });

})();

/******/ })()
;
//# sourceMappingURL=content.js.map