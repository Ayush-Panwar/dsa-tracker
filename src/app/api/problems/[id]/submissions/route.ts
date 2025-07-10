import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/supabase/server'
import { differenceInDays } from 'date-fns'

// POST /api/problems/[id]/submissions - Add a new submission to a problem
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = session.user.id
    const { id } = await params
    const { language, status, code, runtime, memory, errors } = await request.json()
    
    if (!language || !code || !status) {
      return NextResponse.json(
        { error: 'Language, code, and status are required' },
        { status: 400 }
      )
    }
    
    // Check if problem exists and belongs to user
    const problem = await prisma.problem.findUnique({
      where: {
        id,
        userId
      }
    })
    
    if (!problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 })
    }
    
    // Create the submission
    const submission = await prisma.submission.create({
      data: {
        language,
        status,
        code,
        runtime,
        memory,
        problem: {
          connect: { id }
        },
        user: {
          connect: { userId }
        },
        errors: {
          create: Array.isArray(errors) ? errors.map((error: { errorMessage: string, errorType: string, testCase?: string }) => ({
            errorMessage: error.errorMessage,
            errorType: error.errorType,
            testCase: error.testCase
          })) : []
        }
      },
      include: {
        errors: true
      }
    })
    
    // If the submission is successful and the problem status isn't already "Solved",
    // update the problem status
    if (status === 'Accepted' && problem.status !== 'Solved') {
      await prisma.problem.update({
        where: { id },
        data: { status: 'Solved' }
      })
      
      // Update activity for today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Get or create activity for today
      await prisma.activity.upsert({
        where: {
          date_userId: {
            date: today,
            userId
          }
        },
        update: {
          problemsSolved: {
            increment: 1
          }
        },
        create: {
          date: today,
          problemsSolved: 1,
          problemsAttempted: 0,
          userId
        }
      })
      
      // Update user statistics
      await prisma.statistics.upsert({
        where: { userId },
        update: {
          totalSolved: {
            increment: 1
          },
          lastSolved: new Date(),
          [problem.difficulty.toLowerCase() + 'Count']: {
            increment: 1
          }
        },
        create: {
          userId,
          totalSolved: 1,
          lastSolved: new Date(),
          [problem.difficulty.toLowerCase() + 'Count']: 1
        }
      })
      
      // Update streak
      const stats = await prisma.statistics.findUnique({
        where: { userId }
      });
      
      if (stats) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const lastSolved = stats.lastSolved;
        let newStreak = stats.streak || 0;
        let longestStreak = stats.longestStreak || 0;
        
        if (lastSolved) {
          const lastSolvedDate = new Date(lastSolved);
          lastSolvedDate.setHours(0, 0, 0, 0);
          
          const dayDifference = differenceInDays(today, lastSolvedDate);
          
          if (dayDifference === 0) {
            // Already solved today, streak stays the same
          } else if (dayDifference === 1) {
            // Solved yesterday, increment streak
            newStreak += 1;
          } else {
            // Streak broken, reset to 1
            newStreak = 1;
          }
        } else {
          // First time solving, start streak at 1
          newStreak = 1;
        }
        
        // Update longest streak if current streak is longer
        if (newStreak > longestStreak) {
          longestStreak = newStreak;
        }
        
        // Update the statistics with new streak values
        await prisma.statistics.update({
          where: { userId },
          data: {
            streak: newStreak,
            longestStreak: longestStreak
          }
        });
      }
    } else if (status !== 'Accepted' && problem.status === 'Todo') {
      // If the submission failed but the user attempted it, update to "Attempted"
      await prisma.problem.update({
        where: { id },
        data: { status: 'Attempted' }
      })
      
      // Update activity for today - increment attempted count
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      await prisma.activity.upsert({
        where: {
          date_userId: {
            date: today,
            userId
          }
        },
        update: {
          problemsAttempted: {
            increment: 1
          }
        },
        create: {
          date: today,
          problemsSolved: 0,
          problemsAttempted: 1,
          userId
        }
      })
    }
    
    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    console.error('Error creating submission:', error)
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    )
  }
}

// GET /api/problems/[id]/submissions - Get all submissions for a problem
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = session.user.id
    const { id } = await params
    
    // Check if problem exists and belongs to user
    const problem = await prisma.problem.findUnique({
      where: {
        id,
        userId
      }
    })
    
    if (!problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 })
    }
    
    // Get submissions for the problem
    const submissions = await prisma.submission.findMany({
      where: {
        problemId: id
      },
      include: {
        errors: true
      },
      orderBy: {
        submittedAt: 'desc'
      }
    })
    
    return NextResponse.json(submissions)
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
} 