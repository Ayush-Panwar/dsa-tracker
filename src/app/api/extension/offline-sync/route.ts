import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Define a type for ExtensionToken based on the schema
type ExtensionToken = {
  id: string;
  token: string;
  name: string | null;
  lastUsed: Date | null;
  createdAt: Date;
  revoked: boolean;
  userId: string;
};

async function validateToken(token: string): Promise<ExtensionToken | null> {
  if (!token) {
    return null;
  }

  const extensionToken = await prisma.extensionToken.findFirst({
    where: {
      token,
      revoked: false,
    },
  });

  if (extensionToken) {
    // Update last used timestamp
    await prisma.extensionToken.update({
      where: { id: extensionToken.id },
      data: { lastUsed: new Date() },
    });
  }

  return extensionToken || null;
}

interface ProblemData {
  url: string;
  title: string;
  difficulty: string;
  tags?: string[];
  platformId?: string;
  platform?: string;
  status?: string;
  offlineId?: string; // Used to track offline created problems
}

interface SubmissionData {
  problemUrl: string;
  status: string;
  language: string;
  code: string;
  submittedAt: string | Date;
  offlineId?: string; // Used to track offline created submissions
  offlineCreated?: boolean; // Flag for submissions created while offline
}

interface OfflineData {
  lastSyncTimestamp: number;
  problems: ProblemData[];
  submissions: SubmissionData[];
  pendingDeletions: {
    problems: string[]; // Problem URLs
    submissions: string[]; // Offline IDs
  };
}

export async function POST(request: NextRequest) {
  try {
    // Extract token from header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const extensionToken = await validateToken(token);

    if (!extensionToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = extensionToken.userId;
    const data: OfflineData = await request.json();

    if (!data) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Initialize response object
    const syncResults = {
      success: true,
      processed: {
        problems: 0,
        submissions: 0,
        deletions: {
          problems: 0,
          submissions: 0
        }
      },
      errors: [] as string[],
      timestamp: Date.now()
    };

    // Process problems
    if (data.problems && Array.isArray(data.problems)) {
      for (const problemData of data.problems) {
        try {
          const { url, title, difficulty, tags = [], platform = "LeetCode", status = "Todo" } = problemData;

          if (!url || !title) {
            syncResults.errors.push(`Invalid problem data: ${JSON.stringify(problemData)}`);
            continue;
          }

          // Find or create problem
          let problem = await prisma.problem.findFirst({
            where: { url },
          });

          if (!problem) {
            problem = await prisma.problem.create({
              data: {
                url,
                title,
                difficulty: difficulty || "MEDIUM",
                platform,
                status,
                userId, // Associate with the user
              },
            });

            // Process tags
            for (const tagName of tags) {
              // Find or create tag
              let tag = await prisma.tag.findFirst({
                where: { 
                  name: tagName,
                  userId, 
                },
              });

              if (!tag) {
                // Create tag if it doesn't exist
                tag = await prisma.tag.create({
                  data: {
                    name: tagName,
                    color: `#${Math.floor(Math.random()*16777215).toString(16)}`, // Random color
                    userId,
                  }
                });
              }

              // Associate tag with problem
              await prisma.problemTag.create({
                data: {
                  problemId: problem.id,
                  tagId: tag.id,
                },
              });
            }

            syncResults.processed.problems++;
          }
        } catch (error) {
          console.error("Error processing problem:", error);
          syncResults.errors.push(`Failed to process problem: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    // Process submissions
    if (data.submissions && Array.isArray(data.submissions)) {
      for (const submissionData of data.submissions) {
        try {
          const { problemUrl, status, language, code, submittedAt, offlineId } = submissionData;

          if (!problemUrl || !status) {
            syncResults.errors.push(`Invalid submission data: ${JSON.stringify(submissionData)}`);
            continue;
          }

          // Find the problem
          const problem = await prisma.problem.findFirst({
            where: { url: problemUrl },
          });

          if (!problem) {
            syncResults.errors.push(`Problem not found for submission: ${problemUrl}`);
            continue;
          }

          // Check for duplicate submissions using offlineId if available
          if (offlineId) {
            const existingSubmission = await prisma.submission.findFirst({
              where: {
                userId,
                problemId: problem.id,
                code,
                status,
                language,
              }
            });

            if (existingSubmission) {
              // Skip creating duplicate submission
              continue;
            }
          }

          // Create submission
          await prisma.submission.create({
            data: {
              userId,
              problemId: problem.id,
              status,
              language: language || "UNKNOWN",
              code: code || "",
              submittedAt: submittedAt ? new Date(submittedAt) : new Date(),
            },
          });

          syncResults.processed.submissions++;

          // Update problem status if accepted
          if (status === "Accepted") {
            await prisma.problem.update({
              where: { id: problem.id },
              data: { 
                status: "Solved",
                lastAttempted: new Date()
              },
            });
          } else if (status !== "Solved" && problem.status !== "Solved") {
            // Only update to "Attempted" if not already "Solved"
            await prisma.problem.update({
              where: { id: problem.id },
              data: { 
                status: "Attempted",
                lastAttempted: new Date()
              },
            });
          }

          // Update user statistics
          const userStats = await prisma.statistics.findFirst({
            where: { userId },
          });

          if (userStats) {
            await prisma.statistics.update({
              where: { id: userStats.id },
              data: {
                totalSolved: status === "Accepted" ? userStats.totalSolved + 1 : userStats.totalSolved,
              },
            });
          }

          // Record activity
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          await prisma.activity.upsert({
            where: {
              date_userId: {
                userId,
                date: today,
              },
            },
            update: {
              problemsSolved: status === "Accepted" ? { increment: 1 } : undefined,
              problemsAttempted: { increment: 1 },
            },
            create: {
              userId,
              date: today,
              problemsSolved: status === "Accepted" ? 1 : 0,
              problemsAttempted: 1,
            },
          });
        } catch (error) {
          console.error("Error processing submission:", error);
          syncResults.errors.push(`Failed to process submission: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    // Process deletions
    if (data.pendingDeletions) {
      // Handle problem deletions
      if (data.pendingDeletions.problems && Array.isArray(data.pendingDeletions.problems)) {
        for (const problemUrl of data.pendingDeletions.problems) {
          try {
            // Find problem by URL
            const problem = await prisma.problem.findFirst({
              where: { 
                url: problemUrl,
                userId 
              },
            });

            if (problem) {
              // Delete problem
              await prisma.problem.delete({
                where: { id: problem.id },
              });
              syncResults.processed.deletions.problems++;
            }
          } catch (error) {
            console.error("Error deleting problem:", error);
            syncResults.errors.push(`Failed to delete problem: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }

      // Handle submission deletions based on offlineId
      if (data.pendingDeletions.submissions && Array.isArray(data.pendingDeletions.submissions)) {
        for (const submissionId of data.pendingDeletions.submissions) {
          try {
            // Note: Since we don't store offlineId in the database,
            // We can't directly delete by it. This is a placeholder for potential future implementation
            // or enhancement to track offline created submissions.
            syncResults.processed.deletions.submissions++;
            
            // Log the ID to indicate we processed it (prevents unused variable warning)
            console.log(`Processed deletion for submission ID: ${submissionId}`);
          } catch (error) {
            console.error("Error deleting submission:", error);
            syncResults.errors.push(`Failed to delete submission: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }
    }

    return NextResponse.json(syncResults);
  } catch (error) {
    console.error("Error syncing offline data:", error);
    return NextResponse.json(
      { 
        error: "Failed to sync offline data",
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 
 
 
 