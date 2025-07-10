import { NextResponse } from 'next/server';
import { createClient } from '@lib/supabase/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define type for filter conditions
interface SubmissionFilter {
  problemId: string;
  status?: string;
  language?: string;
}

// GET /api/solutions - List solutions with filtering options
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get user session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse query parameters for filtering
    const problemId = searchParams.get('problemId');
    const status = searchParams.get('status');
    const language = searchParams.get('language');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    if (!problemId) {
      return NextResponse.json(
        { error: 'Problem ID is required' },
        { status: 400 }
      );
    }
    
    // Verify user has access to the problem
    const problem = await prisma.problem.findFirst({
      where: {
        id: problemId,
        userId: user.id,
      },
    });
    
    if (!problem) {
      return NextResponse.json(
        { error: 'Problem not found' },
        { status: 404 }
      );
    }
    
    // Build filter conditions
    const where: SubmissionFilter = {
      problemId,
    };
    
    if (status) {
      where.status = status;
    }
    
    if (language) {
      where.language = language;
    }
    
    // Fetch solutions with filters
    const [solutions, totalCount] = await Promise.all([
      prisma.submission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          errors: true,
        },
      }),
      prisma.submission.count({ where }),
    ]);
    
    return NextResponse.json({
      solutions,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching solutions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch solutions' },
      { status: 500 }
    );
  }
}

// POST /api/solutions - Create a new solution
export async function POST(request: Request) {
  try {
    // Get user session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { problemId, code, language, status, runtime, memory } = body;
    
    // Validate required fields
    if (!problemId || !code || !language || !status) {
      return NextResponse.json(
        { error: 'Problem ID, code, language, and status are required fields' },
        { status: 400 }
      );
    }
    
    // Verify user has access to the problem
    const problem = await prisma.problem.findFirst({
      where: {
        id: problemId,
        userId: user.id,
      },
    });
    
    if (!problem) {
      return NextResponse.json(
        { error: 'Problem not found' },
        { status: 404 }
      );
    }
    
    // Create solution
    const solution = await prisma.submission.create({
      data: {
        code,
        language,
        status,
        runtime,
        memory,
        problemId,
        userId: user.id,
      },
    });
    
    // If solution status is "Accepted", update user statistics
    if (status === 'Accepted') {
      // Get existing stats or create new
      const stats = await prisma.statistics.findFirst({
        where: { userId: user.id },
      });
      
      if (!stats) {
        await prisma.statistics.create({
          data: {
            userId: user.id,
            totalSolved: 1,
            [problem.difficulty.toLowerCase() + 'Count']: 1,
            streak: 1,
            longestStreak: 1,
            lastSolved: new Date(),
          },
        });
      } else {
        // Check if this is a new problem solve or a repeated one
        const existingSolution = await prisma.submission.findFirst({
          where: {
            problemId,
            status: 'Accepted',
            id: { not: solution.id },
          },
        });
        
        // Update statistics if this is the first accepted solution for this problem
        if (!existingSolution) {
          const lastSolved = stats.lastSolved;
          const today = new Date();
          
          // Calculate streak
          let newStreak = stats.streak;
          if (!lastSolved) {
            newStreak = 1; // First problem ever solved
          } else {
            const lastSolvedDate = new Date(lastSolved);
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            // Check if solved yesterday or today
            if (lastSolvedDate.toDateString() === yesterday.toDateString() ||
                lastSolvedDate.toDateString() === today.toDateString()) {
              newStreak += 1;
            } else if (lastSolvedDate.toDateString() !== today.toDateString()) {
              // Reset streak if a day was missed
              newStreak = 1;
            }
          }
          
          // Calculate longest streak
          const longestStreak = Math.max(stats.longestStreak || 0, newStreak);
          
          // Update stats based on difficulty
          await prisma.statistics.update({
            where: { id: stats.id },
            data: {
              totalSolved: stats.totalSolved + 1,
              [problem.difficulty.toLowerCase() + 'Count']: 
                stats[problem.difficulty.toLowerCase() + 'Count' as keyof typeof stats] as number + 1,
              streak: newStreak,
              longestStreak: longestStreak,
              lastSolved: today,
            },
          });
        }
      }
    }
    
    return NextResponse.json(solution, { status: 201 });
  } catch (error) {
    console.error('Error creating solution:', error);
    return NextResponse.json(
      { error: 'Failed to create solution' },
      { status: 500 }
    );
  }
} 