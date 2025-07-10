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

  return extensionToken || null;
}

interface ProblemData {
  url: string;
  title: string;
  difficulty: string;
  tags?: string[];
}

interface SubmissionData {
  problemUrl: string;
  status: string;
  language: string;
  code: string;
  submittedAt: string | Date;
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
    const { problems, submissions } = await request.json();

    // Process problems
    const processedProblems = [];
    if (problems && Array.isArray(problems)) {
      for (const problemData of problems as ProblemData[]) {
        const { url, title, difficulty, tags = [] } = problemData;

        if (!url || !title) continue;

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
              userId, // Associate with the user
            },
          });

          // Process tags
          for (const tagName of tags) {
            const tag = await prisma.tag.findFirst({
              where: { 
                name: tagName,
                userId, 
              },
            });

            if (tag) {
              await prisma.problemTag.create({
                data: {
                  problemId: problem.id,
                  tagId: tag.id,
                },
              });
            }
          }
        }

        processedProblems.push(problem);
      }
    }

    // Process submissions
    const processedSubmissions = [];
    if (submissions && Array.isArray(submissions)) {
      for (const submissionData of submissions as SubmissionData[]) {
        const { problemUrl, status, language, code, submittedAt } = submissionData;

        if (!problemUrl || !status) continue;

        // Find the problem
        const problem = await prisma.problem.findFirst({
          where: { url: problemUrl },
        });

        if (!problem) continue;

        // Create submission
        const submission = await prisma.submission.create({
          data: {
            userId,
            problemId: problem.id,
            status,
            language: language || "UNKNOWN",
            code: code || "",
            submittedAt: submittedAt ? new Date(submittedAt) : new Date(),
          },
        });

        processedSubmissions.push(submission);

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
      }
    }

    return NextResponse.json({
      success: true,
      processed: {
        problems: processedProblems.length,
        submissions: processedSubmissions.length,
      },
    });
  } catch (error) {
    console.error("Error syncing data:", error);
    return NextResponse.json(
      { error: "Failed to sync data" },
      { status: 500 }
    );
  }
} 