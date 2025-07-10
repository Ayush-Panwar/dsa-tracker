import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ensureDbUser } from "@/utils/user";

interface SolutionVersionData {
  submissionId: string;
  code: string;
  language: string;
  versionNumber?: number;
  changelog?: string;
  codeChanges?: {
    addedLines: number;
    removedLines: number;
    modifiedLines: number;
  };
}

// GET solution versions for a submission
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const submissionId = searchParams.get("submissionId");
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);

    if (!submissionId) {
      return NextResponse.json(
        { error: "Missing required parameter: submissionId" },
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

    // Verify submission belongs to user
    const submission = await prisma.submission.findFirst({
      where: {
        id: submissionId,
        userId: user.id
      }
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found or not authorized" },
        { status: 404 }
      );
    }

    // Fetch versions
    const versions = await prisma.solutionVersion.findMany({
      where: {
        submissionId: submissionId
      },
      include: {
        codeChanges: true
      },
      orderBy: {
        versionNumber: 'desc'
      },
      skip,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.solutionVersion.count({
      where: {
        submissionId: submissionId
      }
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      versions,
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
    console.error("Error fetching solution versions:", error);
    return NextResponse.json(
      { error: "Failed to fetch solution versions" },
      { status: 500 }
    );
  }
}

// POST a new solution version
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
    const data: SolutionVersionData = await request.json();

    // Validate required fields
    if (!data.submissionId || !data.code || !data.language) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Begin transaction
    const result = await prisma.$transaction(async (tx) => {
      // Verify submission belongs to user
      const submission = await tx.submission.findFirst({
        where: {
          id: data.submissionId,
          userId: user.id
        }
      });

      if (!submission) {
        return { error: "Submission not found or not authorized" };
      }

      // Get the latest version number for this submission
      const latestVersion = await tx.solutionVersion.findFirst({
        where: {
          submissionId: submission.id
        },
        orderBy: {
          versionNumber: 'desc'
        }
      });

      const nextVersionNumber = data.versionNumber || 
        (latestVersion ? latestVersion.versionNumber + 1 : 1);

      // Create solution version
      const solutionVersion = await tx.solutionVersion.create({
        data: {
          submissionId: submission.id,
          code: data.code,
          language: data.language,
          versionNumber: nextVersionNumber,
          changelog: data.changelog || `Version ${nextVersionNumber}`
        }
      });

      // Create code changes if provided
      let codeChange = null;
      if (data.codeChanges) {
        codeChange = await tx.codeChange.create({
          data: {
            solutionVersionId: solutionVersion.id,
            addedLines: data.codeChanges.addedLines,
            removedLines: data.codeChanges.removedLines,
            modifiedLines: data.codeChanges.modifiedLines
          }
        });
      }

      return { solutionVersion, codeChange };
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating solution version:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create solution version" },
      { status: 500 }
    );
  }
} 
 
 
 