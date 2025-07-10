import { NextResponse } from "next/server";
import { getUser } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { ensureDbUser } from "@/utils/user";
import { differenceInDays } from 'date-fns';

interface Tag {
  id: string;
  name: string;
  color: string;
  userId: string;
}

interface ProblemTag {
  tag: Tag;
}

interface Problem {
  id: string;
  title: string;
  platform: string;
  difficulty: string;
  status: string;
  url?: string;
  description?: string;
  notes?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  problemTags: ProblemTag[];
  submissions?: { submittedAt: Date }[];
}

interface TransformedProblem extends Omit<Problem, 'problemTags'> {
  tags: Tag[];
  latestSubmission?: Date | null;
}

// GET /api/problems - Get all problems for the current user
export async function GET() {
  try {
    const authUser = await getUser()
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Ensure user exists in database
    const user = await ensureDbUser(authUser.id, {
      name: authUser.user_metadata?.name,
      email: authUser.email
    })
    
    const problems = await prisma.problem.findMany({
      where: {
        userId: user.id
      },
      include: {
        problemTags: {
          include: {
            tag: true
          }
        },
        submissions: {
          orderBy: {
            submittedAt: 'desc'
          },
          take: 1,
          select: {
            submittedAt: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    }) as Problem[]
    
    // Transform the response to include tags directly and latest submission date
    const transformedProblems: TransformedProblem[] = problems.map((problem) => ({
      ...problem,
      tags: problem.problemTags.map(pt => pt.tag),
      latestSubmission: problem.submissions && problem.submissions.length > 0 
        ? problem.submissions[0].submittedAt 
        : null
    }))
    
    return NextResponse.json(transformedProblems)
  } catch (error) {
    console.error('Error fetching problems:', error)
    return NextResponse.json(
      { error: 'Failed to fetch problems' },
      { status: 500 }
    )
  }
}

// POST /api/problems - Create a new problem
export async function POST(request: Request) {
  try {
    const authUser = await getUser()
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Ensure user exists in database
    const user = await ensureDbUser(authUser.id, {
      name: authUser.user_metadata?.name,
      email: authUser.email
    })
    
    const { title, platform, difficulty, status, url, description, notes, tags, platformId, examples } = await request.json()
    
    console.log("Creating problem with data:", { 
      title, 
      platform, 
      difficulty, 
      platformId, 
      url,
      tagsCount: tags?.length || 0,
      descriptionLength: description?.length || 0,
      examplesLength: examples?.length || 0
    });
    
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }
    
    const problem = await prisma.problem.create({
      data: {
        title,
        platform: platform || 'Other',
        platformId: platformId || null,
        difficulty: difficulty || 'Medium',
        status: status || 'Todo',
        url,
        description,
        notes,
        examples: examples ? examples : null,
        userId: user.id,
        problemTags: {
          create: Array.isArray(tags) ? tags.map((tag: { name: string, color: string }) => ({
            tag: {
              connectOrCreate: {
                where: { name_userId: { name: tag.name, userId: user.id } },
                create: { name: tag.name, color: tag.color || '#888888', userId: user.id }
              }
            }
          })) : []
        }
      },
      include: {
        problemTags: {
          include: {
            tag: true
          }
        }
      }
    }) as Problem
    
    // If the problem is created with "Solved" status, update activity and statistics
    if (status === 'Solved') {
      // Update activity for today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Get or create activity for today
      await prisma.activity.upsert({
        where: {
          date_userId: {
            date: today,
            userId: user.id
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
          userId: user.id
        }
      })
      
      // Update user statistics
      await prisma.statistics.upsert({
        where: { userId: user.id },
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
          userId: user.id,
          totalSolved: 1,
          lastSolved: new Date(),
          [problem.difficulty.toLowerCase() + 'Count']: 1
        }
      })
      
      // Update streak
      const stats = await prisma.statistics.findUnique({
        where: { userId: user.id }
      });
      
      if (stats) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const lastSolved = stats.lastSolved;
        let newStreak = stats.streak || 0;
        // Use type assertion to handle the longestStreak property
        let longestStreak = (stats as unknown as { longestStreak?: number }).longestStreak || 0;
        
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
          where: { userId: user.id },
          data: {
            streak: newStreak,
            // Use type assertion to handle the longestStreak property
            ...(longestStreak > 0 ? { longestStreak: longestStreak } as unknown as Record<string, unknown> : {})
          }
        });
      }
    }
    
    // Transform the response to include tags directly
    const transformedProblem: TransformedProblem = {
      ...problem,
      tags: problem.problemTags.map(pt => pt.tag)
    }
    
    return NextResponse.json(transformedProblem, { status: 201 })
  } catch (error) {
    console.error('Error creating problem:', error)
    return NextResponse.json(
      { error: 'Failed to create problem' },
      { status: 500 }
    )
  }
} 