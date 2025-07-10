import { NextRequest, NextResponse } from "next/server";
import { getUser } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ensureDbUser } from '@/utils/user';
import { checkAchievements } from '@/utils/achievements';


// Record type for submission filtering
type SubmissionWhere = {
  userId: string;
  problemId?: string;
  status?: string;
}

// Record type for statistics updates
type StatisticsUpdate = {
  totalSolved: number;
  easyCount?: number;
  mediumCount?: number;
  hardCount?: number;
  lastSolved?: Date;
  streak?: number;
  longestStreak?: number;
}

// GET /api/submissions - Get all submissions for the current user
export async function GET(request: NextRequest) {
  try {
    const authUser = await getUser();
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Ensure user exists in database
    const user = await ensureDbUser(authUser.id, {
      name: authUser.user_metadata?.name,
      email: authUser.email
    });
    
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const problemId = searchParams.get('problemId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    
    // Build filter conditions
    const where: SubmissionWhere = {
      userId: user.id
    };
    
    if (problemId) {
      where.problemId = problemId;
    }
    
    if (status) {
      where.status = status;
    }
    
    // Fetch submissions with pagination
    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: {
          problem: {
            select: {
              id: true,
              title: true,
              difficulty: true,
              platform: true,
              url: true
            }
          },
          errors: true
        },
        orderBy: {
          submittedAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.submission.count({ where })
    ]);
    
    return NextResponse.json({
      submissions,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

// POST /api/submissions - Create a new submission
export async function POST(request: NextRequest) {
  try {
    const authUser = await getUser();
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Ensure user exists in database
    const user = await ensureDbUser(authUser.id, {
      name: authUser.user_metadata?.name,
      email: authUser.email
    });
    
    // Get submission data from request
    const data = await request.json();
    const { problemId, code, language, status, runtime, memory, errors } = data;
    
    if (!problemId || !code || !language || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Verify the problem exists and belongs to the user
    const problem = await prisma.problem.findFirst({
      where: {
        id: problemId,
        userId: user.id
      }
    });
    
    if (!problem) {
      return NextResponse.json(
        { error: 'Problem not found or access denied' },
        { status: 404 }
      );
    }
    
    // Create the submission
    const submission = await prisma.submission.create({
      data: {
        code,
        language,
        status,
        runtime,
        memory,
        problemId,
        userId: user.id,
        submittedAt: new Date()
      }
    });
    
    // Create errors if provided
    if (errors && Array.isArray(errors)) {
      for (const error of errors) {
        await prisma.error.create({
          data: {
            errorMessage: error.errorMessage || error.message || "Unknown error",
            errorType: error.errorType || error.type || "Unknown",
            testCase: error.testCase,
            lineNumber: error.lineNumber,
            submissionId: submission.id,
          },
        });
      }
    }
    
    // If the submission is accepted and the problem status isn't already solved,
    // update the problem status
    if (status === 'Accepted' && problem.status !== 'Solved') {
      await prisma.problem.update({
        where: { id: problemId },
        data: { 
          status: 'Solved',
          lastAttempted: new Date()
        }
      });
      
      // Update user statistics
      await updateUserStatistics(user.id, problem.difficulty);
      
      // Record activity
      await recordUserActivity(user.id);
      
      // Check for achievements
      const newAchievements = await checkAchievements(user.id);
      
      // Get the created submission with errors
      const createdSubmission = await prisma.submission.findUnique({
        where: { id: submission.id },
        include: {
          errors: true,
          problem: true,
        },
      });
      
      // Return submission with any new achievements
      return NextResponse.json({
        submission: createdSubmission,
        newAchievements
      }, { status: 201 });
    } 
    // If not accepted but attempted, update problem status if it's still 'Todo'
    else if (problem.status === 'Todo') {
      await prisma.problem.update({
        where: { id: problemId },
        data: { 
          status: 'Attempted',
          lastAttempted: new Date()
        }
      });
      
      // Update activity for attempted problems
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const activity = await prisma.activity.findFirst({
        where: {
          userId: user.id,
          date: {
            equals: today
          }
        }
      });
      
      if (activity) {
        await prisma.activity.update({
          where: { id: activity.id },
          data: {
            problemsAttempted: activity.problemsAttempted + 1
          }
        });
      } else {
        await prisma.activity.create({
          data: {
            userId: user.id,
            date: today,
            problemsSolved: 0,
            problemsAttempted: 1,
            streakCount: 1
          }
        });
      }
    }
    
    // Get the created submission with errors
    const createdSubmission = await prisma.submission.findUnique({
      where: { id: submission.id },
      include: {
        errors: true,
        problem: true,
      },
    });
    
    return NextResponse.json(createdSubmission, { status: 201 });
  } catch (error) {
    console.error('Error creating submission:', error);
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    );
  }
}

// Helper function to update user statistics
async function updateUserStatistics(userId: string, difficulty: string) {
  // Get current statistics or create if not exists
  const stats = await prisma.statistics.findUnique({
    where: { userId }
  });
  
  if (stats) {
    // Update existing statistics
    const update: StatisticsUpdate = {
      totalSolved: stats.totalSolved + 1,
      lastSolved: new Date()
    };
    
    // Update the appropriate difficulty count
    if (difficulty === 'Easy') {
      update.easyCount = stats.easyCount + 1;
    } else if (difficulty === 'Medium') {
      update.mediumCount = stats.mediumCount + 1;
    } else if (difficulty === 'Hard') {
      update.hardCount = stats.hardCount + 1;
    }
    
    await prisma.statistics.update({
      where: { userId },
      data: update
    });
  } else {
    // Create new statistics record
    await prisma.statistics.create({
      data: {
        userId,
        totalSolved: 1,
        easyCount: difficulty === 'Easy' ? 1 : 0,
        mediumCount: difficulty === 'Medium' ? 1 : 0,
        hardCount: difficulty === 'Hard' ? 1 : 0,
        streak: 1,
        longestStreak: 1,
        lastSolved: new Date()
      }
    });
  }
}

// Helper function to record user activity and update streak
async function recordUserActivity(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day
  
  // Check if there's already an activity record for today
  const todayActivity = await prisma.activity.findFirst({
    where: {
      userId,
      date: {
        equals: today
      }
    }
  });
  
  // Get yesterday's activity to calculate streak
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const yesterdayActivity = await prisma.activity.findFirst({
    where: {
      userId,
      date: {
        equals: yesterday
      }
    },
    orderBy: {
      date: 'desc'
    }
  });
  
  // Calculate new streak count
  let newStreakCount = 1; // Default to 1 for a new day
  
  if (yesterdayActivity) {
    // Continue streak from yesterday
    newStreakCount = (yesterdayActivity.streakCount || 0) + 1;
  }
  
  if (todayActivity) {
    // Update existing activity for today
    await prisma.activity.update({
      where: { id: todayActivity.id },
      data: {
        problemsSolved: todayActivity.problemsSolved + 1,
        streakCount: newStreakCount
      }
    });
  } else {
    // Create new activity for today
    await prisma.activity.create({
      data: {
        userId,
        date: today,
        problemsSolved: 1,
        problemsAttempted: 0,
        streakCount: newStreakCount
      }
    });
  }
  
  // Update the user's current streak in statistics
  await prisma.statistics.update({
    where: { userId },
    data: {
      streak: newStreakCount,
      longestStreak: await updateLongestStreak(userId, newStreakCount)
    }
  });
}

// Helper function to update the longest streak
async function updateLongestStreak(userId: string, currentStreak: number): Promise<number> {
  const stats = await prisma.statistics.findUnique({
    where: { userId }
  });
  
  if (!stats) {
    return currentStreak;
  }
  
  return Math.max(stats.longestStreak || 0, currentStreak);
} 

