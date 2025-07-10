import { NextResponse } from "next/server";
import { getUser } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { ensureDbUser } from '@/lib/db-utils'

// Define type for difficulty count
interface DifficultyCount {
  difficulty: string;
  _count: {
    id: number;
  };
}

// GET /api/user/stats - Get user statistics
export async function GET() {
  try {
    const authUser = await getUser()
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Ensure user exists in database
    const user = await ensureDbUser(authUser)
    
    // Get statistics
    const stats = await prisma.statistics.findUnique({
      where: { userId: user.id }
    })
    
    // If stats don't exist, return default values
    if (!stats) {
      return NextResponse.json({
        stats: {
          totalProblems: 0,
          solvedProblems: 0,
          attemptedProblems: 0,
          streak: 0,
          lastSolved: null,
          solvedByDifficulty: {
            Easy: 0,
            Medium: 0,
            Hard: 0
          }
        }
      })
    }
    
    // Count total problems
    const totalProblems = await prisma.problem.count({
      where: { userId: user.id }
    })
    
    // Count solved problems
    const solvedProblems = await prisma.problem.count({
      where: { 
        userId: user.id,
        status: 'Solved'
      }
    })
    
    // Count attempted problems
    const attemptedProblems = await prisma.problem.count({
      where: { 
        userId: user.id,
        status: 'Attempted'
      }
    })
    
    // Get problems by difficulty
    const problemsByDifficulty = await prisma.problem.groupBy({
      by: ['difficulty'],
      where: {
        userId: user.id,
        status: 'Solved'
      },
      _count: {
        id: true
      }
    })
    
    // Transform to format expected by frontend
    const solvedByDifficulty = {
      Easy: 0,
      Medium: 0,
      Hard: 0
    }
    
    problemsByDifficulty.forEach((item: DifficultyCount) => {
      if (item.difficulty in solvedByDifficulty) {
        solvedByDifficulty[item.difficulty as keyof typeof solvedByDifficulty] = item._count.id
      }
    })
    
    return NextResponse.json({
      stats: {
        totalProblems,
        solvedProblems,
        attemptedProblems,
        streak: stats.streak,
        lastSolved: stats.lastSolved,
        solvedByDifficulty
      }
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user statistics' },
      { status: 500 }
    )
  }
} 