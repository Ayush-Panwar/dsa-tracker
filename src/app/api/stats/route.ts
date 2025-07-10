import { NextResponse } from 'next/server';
import { createClient } from '@lib/supabase/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/stats - Get user statistics
export async function GET() {
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
    
    // Get user statistics
    const stats = await prisma.statistics.findFirst({
      where: { userId: user.id },
    });
    
    if (!stats) {
      // Create default statistics if not found
      const newStats = await prisma.statistics.create({
        data: {
          userId: user.id,
          totalSolved: 0,
          easyCount: 0,
          mediumCount: 0,
          hardCount: 0,
          streak: 0,
          longestStreak: 0,
        },
      });
      
      return NextResponse.json({
        ...newStats,
        difficultyDistribution: [],
        categoryStats: {},
        recentActivity: [],
        dailyActivity: {},
      });
    }
    
    // Get additional statistics
    const difficultyDistribution = await prisma.problem.groupBy({
      by: ['difficulty'],
      where: {
        userId: user.id,
        submissions: {
          some: {
            status: 'Accepted',
          },
        },
      },
      _count: {
        _all: true,
      },
    });
    
    // Get problems with their tags
    const problemsWithTags = await prisma.problem.findMany({
      where: {
        userId: user.id,
        submissions: {
          some: {
            status: 'Accepted',
          },
        },
      },
      include: {
        problemTags: {
          include: {
            tag: true
          }
        }
      }
    });
    
    // Process category data
    const categoryStats: Record<string, number> = {};
    problemsWithTags.forEach(problem => {
      problem.problemTags.forEach(problemTag => {
        const tagName = problemTag.tag.name;
        if (categoryStats[tagName]) {
          categoryStats[tagName]++;
        } else {
          categoryStats[tagName] = 1;
        }
      });
    });
    
    // Get recent activity
    const recentActivity = await prisma.submission.findMany({
      where: {
        problem: {
          userId: user.id,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      include: {
        problem: {
          select: {
            title: true,
            difficulty: true,
          },
        },
      },
    });
    
    // Get day-by-day activity for the last 30 days for streak heatmap
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activityData = await prisma.submission.groupBy({
      by: ['createdAt'],
      where: {
        problem: {
          userId: user.id,
        },
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _count: {
        _all: true,
      },
    });
    
    // Format the activity data for heatmap
    const dailyActivity: Record<string, number> = {};
    activityData.forEach((day) => {
      const dateKey = new Date(day.createdAt).toISOString().split('T')[0];
      dailyActivity[dateKey] = day._count._all;
    });
    
    return NextResponse.json({
      ...stats,
      difficultyDistribution,
      categoryStats,
      recentActivity,
      dailyActivity,
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

// PUT /api/stats - Update user statistics
export async function PUT(request: Request) {
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
    const { streakReset } = body;
    
    // Find user stats
    const stats = await prisma.statistics.findFirst({
      where: { userId: user.id },
    });
    
    if (!stats) {
      return NextResponse.json(
        { error: 'Statistics not found' },
        { status: 404 }
      );
    }
    
    // Update fields as needed
    interface StatisticsUpdate {
      streak?: number;
      // Add other possible fields here
    }
    
    const updateData: StatisticsUpdate = {};
    
    if (streakReset) {
      updateData.streak = 0;
    }
    
    // Only update if there are changes to make
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No updates specified' },
        { status: 400 }
      );
    }
    
    // Update statistics
    const updatedStats = await prisma.statistics.update({
      where: { id: stats.id },
      data: updateData,
    });
    
    return NextResponse.json(updatedStats);
  } catch (error) {
    console.error('Error updating statistics:', error);
    return NextResponse.json(
      { error: 'Failed to update statistics' },
      { status: 500 }
    );
  }
} 