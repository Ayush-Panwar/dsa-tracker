import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ensureDbUser } from "@/utils/user";

/**
 * Helper function to assign consistent colors to tags based on their name
 */
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

interface SubmissionTrackData {
  problemId: string;
  leetcodeSubmissionId: string;
  code: string;
  language: string;
  status: string;
  runtime?: string;
  memory?: string;
  errorMessage?: string;
  platformTitle?: string; // Added to get problem title from LeetCode
  platformDifficulty?: string; // Added to get difficulty from LeetCode
  platformUrl?: string; // Added to get URL from LeetCode
  platformDescription?: string; // Added to get problem description from LeetCode
  platformTags?: string[]; // Added to get problem tags from LeetCode
  versionInfo?: {
    versionNumber?: number;
    changelog?: string;
  };
}

// Add CORS headers for the Chrome extension
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  
  // Check if the request is coming from our Chrome extension
  if (origin.startsWith('chrome-extension://')) {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400', // 24 hours
      },
    });
  }
  
  // For other origins, return a basic response
  return new NextResponse(null, { status: 200 });
}

// POST a new submission tracking request
export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin') || '';
    
    // Authenticate the user
    const authUser = await getUser();
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { 
          status: 401,
          headers: getCorsHeaders(origin)
        }
      );
    }

    // Ensure user exists in database
    const user = await ensureDbUser(authUser.id, {
      name: authUser.user_metadata?.name,
      email: authUser.email
    });

    // Parse request body
    const data: SubmissionTrackData = await request.json();

    // Validate required fields
    if (!data.problemId || !data.code || !data.language || !data.leetcodeSubmissionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { 
          status: 400,
          headers: getCorsHeaders(origin)
        }
      );
    }

    // Implement transaction with retry logic
    let result;
    let retries = 3;

    while (retries > 0) {
      try {
        // Begin transaction with a timeout
        result = await prisma.$transaction(async (tx) => {
          // Try to find the problem by platformId first
          let problem = await tx.problem.findFirst({
            where: {
              platformId: data.problemId,
              userId: user.id
            }
          });

          // If problem doesn't exist, try by ID
          if (!problem) {
            problem = await tx.problem.findFirst({
              where: {
                id: data.problemId,
                userId: user.id
              }
            });
          }

          // If problem still doesn't exist, create it
          // This happens when user runs/submits code for a problem that's not in their database
          if (!problem) {
            console.log(`Creating new problem for submission: ${data.problemId}`);
            problem = await tx.problem.create({
              data: {
                platformId: data.problemId,
                title: data.platformTitle || `LeetCode Problem ${data.problemId}`,
                platform: "LeetCode",
                difficulty: data.platformDifficulty || "Medium",
                url: data.platformUrl || `https://leetcode.com/problems/${data.problemId}/`,
                description: data.platformDescription || "",
                status: data.status === "Accepted" ? "Solved" : "Attempted",
                userId: user.id
              }
            });
            console.log(`Created new problem: ${problem.id}`);
            
            // Process tags if they exist
            if (data.platformTags && Array.isArray(data.platformTags) && data.platformTags.length > 0) {
              for (const tagName of data.platformTags) {
                if (!tagName) continue;
                
                // Find or create tag
                let tag = await tx.tag.findFirst({
                  where: { 
                    name: tagName,
                    userId: user.id, 
                  },
                });

                if (!tag) {
                  // Create tag with a reasonable color
                  tag = await tx.tag.create({
                    data: {
                      name: tagName,
                      color: getTagColor(tagName), // Helper function to assign colors
                      userId: user.id,
                    }
                  });
                }

                // Associate tag with problem
                await tx.problemTag.create({
                  data: {
                    problemId: problem.id,
                    tagId: tag.id,
                  },
                });
              }
            }
          }

          // Now we have a valid problem ID to use
          const problemId = problem.id;

          // Check if submission with this LeetCode ID already exists
          const existingSubmission = await tx.submission.findFirst({
            where: {
              userId: user.id,
              problemId: problemId,
              externalId: data.leetcodeSubmissionId
            }
          });

          // Create a submission record if it doesn't exist
          let submission;
          if (existingSubmission) {
            submission = existingSubmission;
          } else {
            submission = await tx.submission.create({
              data: {
                code: data.code,
                language: data.language,
                status: data.status,
                runtime: data.runtime,
                memory: data.memory,
                submittedAt: new Date(),
                problemId: problemId,
                userId: user.id,
                externalId: data.leetcodeSubmissionId
              }
            });
          }

          // If there's an error, create an error record
          let error = null;
          if (data.errorMessage && !existingSubmission) {
            error = await tx.error.create({
              data: {
                errorMessage: data.errorMessage,
                errorType: data.status === "Accepted" ? "logical" : "runtime",
                submissionId: submission.id
              }
            });
          }

          // Create solution version if needed
          let solutionVersion = null;
          if (data.versionInfo) {
            // Get the latest version number for this submission
            const latestVersion = await tx.solutionVersion.findFirst({
              where: {
                submissionId: submission.id
              },
              orderBy: {
                versionNumber: 'desc'
              }
            });

            const nextVersionNumber = latestVersion
              ? latestVersion.versionNumber + 1
              : data.versionInfo.versionNumber || 1;

            solutionVersion = await tx.solutionVersion.create({
              data: {
                submissionId: submission.id,
                code: data.code,
                language: data.language,
                versionNumber: nextVersionNumber,
                changelog: data.versionInfo.changelog || `Submission - ${data.status}`
              }
            });
          }

          // If this is a successful submission, update problem status
          if (data.status === "Accepted") {
            await tx.problem.update({
              where: { id: problem.id },
              data: {
                status: "Solved",
                lastAttempted: new Date()
              }
            });
          } else {
            // If not solved but attempted, update status
            await tx.problem.update({
              where: { id: problem.id },
              data: {
                status: problem.status === "Solved" ? "Solved" : "Attempted",
                lastAttempted: new Date()
              }
            });
          }

          // Return the submission and related data
          return { 
            submission, 
            error, 
            solutionVersion,
            isNew: !existingSubmission
          };
        }, {
          // Set a reasonable timeout for the transaction
          timeout: 10000 // 10 seconds
        });
        
        // If we got here, the transaction succeeded, so break out of the retry loop
        break;
      } catch (error) {
        retries--;
        
        // Only retry on transaction errors (P2028)
        if (!isPrismaTransactionError(error) || retries <= 0) {
          throw error;
        }
        
        // Wait a bit before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 500 * (3 - retries)));
        
        // Log retry attempt
        console.log(`Retrying transaction after error (${retries} attempts left)`);
      }
    }

    return NextResponse.json(
      result, 
      { 
        status: 201,
        headers: getCorsHeaders(origin)
      }
    );
  } catch (error) {
    console.error("Error tracking submission:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to track submission" },
      { 
        status: 500,
        headers: getCorsHeaders(request.headers.get('origin') || '')
      }
    );
  }
}

// Helper function to check if an error is a Prisma transaction error
function isPrismaTransactionError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    return error.code === 'P2028'; // Transaction API error code
  }
  return false;
}

// Helper function to get CORS headers
function getCorsHeaders(origin: string) {
  // Only allow the Chrome extension origin or specific origins you trust
  const headers: Record<string, string> = {};
  
  if (origin.startsWith('chrome-extension://')) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Client-Info';
  }
  
  return headers;
} 
 
 
 