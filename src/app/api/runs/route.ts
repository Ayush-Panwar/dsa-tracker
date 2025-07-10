import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ensureDbUser } from "@/utils/user";

interface CodeRunData {
  problemId: string;
  code: string;
  language: string;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
  status: string;
  errorMessage?: string;
  executionTime?: string;
  memoryUsed?: string;
}

// POST a new code run
export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const authUser = await getUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure user exists in database
    const user = await ensureDbUser(authUser.id, {
      name: authUser.user_metadata?.name,
      email: authUser.email
    });

    // Parse request body
    const data: CodeRunData = await request.json();

    // Validate required fields
    if (!data.problemId || !data.code || !data.language) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Begin transaction
    const result = await prisma.$transaction(async (tx) => {
      // Verify problem belongs to user
      const problem = await tx.problem.findFirst({
        where: {
          id: data.problemId,
          userId: user.id
        }
      });

      // If problem doesn't exist, it might be a new problem
      let problemId = data.problemId;
      if (!problem) {
        // Try to find by platformId
        const platformProblem = await tx.problem.findFirst({
          where: {
            platformId: data.problemId,
            userId: user.id
          }
        });

        if (platformProblem) {
          problemId = platformProblem.id;
        } else {
          // We'll need to create a problem record later or return an error
          // For now, we'll just continue with the provided ID
          console.log(`Problem not found: ${data.problemId}`);
        }
      }

      // Create a submission record
      const submission = await tx.submission.create({
        data: {
          code: data.code,
          language: data.language,
          status: data.status || "Run",
          runtime: data.executionTime,
          memory: data.memoryUsed,
          submittedAt: new Date(),
          problemId: problemId,
          userId: user.id
        }
      });

      // If there's an error, create an error record
      let error = null;
      if (data.errorMessage) {
        error = await tx.error.create({
          data: {
            errorMessage: data.errorMessage,
            errorType: data.status === "Accepted" ? "logical" : "runtime",
            submissionId: submission.id
          }
        });
      }

      // Return the submission
      return { submission, error };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error tracking code run:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to track code run" },
      { status: 500 }
    );
  }
}

// GET code runs for a problem
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const problemId = searchParams.get("problemId");
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);

    if (!problemId) {
      return NextResponse.json(
        { error: "Missing required parameter: problemId" },
        { status: 400 }
      );
    }

    // Authenticate the user
    const authUser = await getUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure user exists in database
    const user = await ensureDbUser(authUser.id, {
      name: authUser.user_metadata?.name,
      email: authUser.email
    });

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch runs (submissions with "Run" status)
    const runs = await prisma.submission.findMany({
      where: {
        problemId: problemId,
        userId: user.id,
        status: "Run"
      },
      include: {
        errors: true
      },
      orderBy: {
        submittedAt: 'desc'
      },
      skip,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.submission.count({
      where: {
        problemId: problemId,
        userId: user.id,
        status: "Run"
      }
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      runs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage
      }
    });
  } catch (error) {
    console.error("Error fetching code runs:", error);
    return NextResponse.json(
      { error: "Failed to fetch code runs" },
      { status: 500 }
    );
  }
} 
 
 
 