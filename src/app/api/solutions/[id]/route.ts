import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@lib/supabase/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/solutions/[id] - Get solution details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get user session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Find the solution by ID
    const solution = await prisma.submission.findUnique({
      where: { id },
      include: {
        problem: true,
        errors: true,
      },
    });
    
    if (!solution) {
      return NextResponse.json(
        { error: 'Solution not found' },
        { status: 404 }
      );
    }
    
    // Verify user has access to the solution
    const problem = await prisma.problem.findFirst({
      where: {
        id: solution.problemId,
        userId: user.id,
      },
    });
    
    if (!problem) {
      return NextResponse.json(
        { error: 'Not authorized to access this solution' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(solution);
  } catch (error) {
    console.error('Error fetching solution:', error);
    return NextResponse.json(
      { error: 'Failed to fetch solution' },
      { status: 500 }
    );
  }
}

// PUT /api/solutions/[id] - Update solution
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get user session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Find the solution by ID
    const existingSolution = await prisma.submission.findUnique({
      where: { id },
      include: {
        problem: true,
      },
    });
    
    if (!existingSolution) {
      return NextResponse.json(
        { error: 'Solution not found' },
        { status: 404 }
      );
    }
    
    // Verify user has access to the solution
    const problem = await prisma.problem.findFirst({
      where: {
        id: existingSolution.problemId,
        userId: user.id,
      },
    });
    
    if (!problem) {
      return NextResponse.json(
        { error: 'Not authorized to update this solution' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { code, language, status, runtime, memory } = body;
    
    // Update solution
    const updatedSolution = await prisma.submission.update({
      where: { id },
      data: {
        ...(code && { code }),
        ...(language && { language }),
        ...(status && { status }),
        ...(runtime !== undefined && { runtime }),
        ...(memory !== undefined && { memory }),
      },
    });
    
    // If solution status is "Accepted" and was previously not accepted, update user statistics
    if (status === 'Accepted' && existingSolution.status !== 'Accepted') {
      // Check if this is the first accepted solution for this problem
      const acceptedSolutions = await prisma.submission.count({
        where: {
          problemId: existingSolution.problemId,
          status: 'Accepted',
          id: { not: id },
        },
      });
      
      if (acceptedSolutions === 0) {
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
              lastSolved: new Date(),
            },
          });
        } else {
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
          
          // Update stats based on difficulty
          await prisma.statistics.update({
            where: { id: stats.id },
            data: {
              totalSolved: stats.totalSolved + 1,
              [problem.difficulty.toLowerCase() + 'Count']: 
                stats[problem.difficulty.toLowerCase() + 'Count' as keyof typeof stats] as number + 1,
              streak: newStreak,
              lastSolved: today,
            },
          });
        }
      }
    }
    
    return NextResponse.json(updatedSolution);
  } catch (error) {
    console.error('Error updating solution:', error);
    return NextResponse.json(
      { error: 'Failed to update solution' },
      { status: 500 }
    );
  }
} 