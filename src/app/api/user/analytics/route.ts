import { NextResponse } from "next/server";
import { getUser } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ensureDbUser } from '@/lib/db-utils';
import { format, subDays, eachDayOfInterval } from 'date-fns';

// Define types for database responses
interface Activity {
  date: Date;
  problemsSolved: number;
  problemsAttempted: number;
  streakCount: number | null;
}

interface TagDetails {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: Date;
}

interface TagCount {
  tagId: string;
  _count: {
    problemId: number;
  };
}

interface TagWithCount extends TagDetails {
  count: number;
}

// GET /api/user/analytics - Get user analytics data for the dashboard
export async function GET() {
  try {
    const authUser = await getUser();
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Ensure user exists in database
    const user = await ensureDbUser(authUser);
    
    // Get today and calculate date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const last90Days = subDays(today, 90);
    const last7Days = subDays(today, 6);
    
    // Get user statistics
    const stats = await prisma.statistics.findUnique({
      where: { userId: user.id }
    });
    
    // Get total problems
    const totalProblems = await prisma.problem.count({
      where: { userId: user.id }
    });
    
    // Get solved problems
    const solvedProblems = await prisma.problem.count({
      where: { 
        userId: user.id,
        status: 'Solved'
      }
    });
    
    // Get attempted problems
    const attemptedProblems = await prisma.problem.count({
      where: { 
        userId: user.id,
        status: 'Attempted'
      }
    });
    
    // Get activity data for last 90 days
    const activities = await prisma.activity.findMany({
      where: {
        userId: user.id,
        date: {
          gte: last90Days
        }
      },
      orderBy: {
        date: 'asc'
      }
    });
    
    // Format activity data for heatmap
    const activityData = activities.map((activity: Activity) => ({
      date: format(activity.date, 'yyyy-MM-dd'),
      count: activity.problemsSolved
    }));
    
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
    });
    
    // Get problems by status
    const problemsByStatus = await prisma.problem.groupBy({
      by: ['status'],
      where: {
        userId: user.id
      },
      _count: {
        id: true
      }
    });
    
    // Get problems by platform
    const problemsByPlatform = await prisma.problem.groupBy({
      by: ['platform'],
      where: {
        userId: user.id,
        status: 'Solved'
      },
      _count: {
        id: true
      }
    });
    
    // Get weekly activity for chart
    const weeklyActivity: Array<{ day: string, count: number }> = [];
    
    // Create date range for past 7 days
    const dateRange = eachDayOfInterval({
      start: last7Days,
      end: today
    });
    
    // Get all submissions from the past 7 days
    const weeklySubmissions = await prisma.submission.findMany({
      where: {
        userId: user.id,
        submittedAt: {
          gte: last7Days
        },
        status: 'Accepted'
      },
      select: {
        submittedAt: true
      }
    });
    
    // Count submissions by day
    const submissionsByDay = new Map();
    weeklySubmissions.forEach(submission => {
      const dateStr = format(submission.submittedAt, 'yyyy-MM-dd');
      submissionsByDay.set(dateStr, (submissionsByDay.get(dateStr) || 0) + 1);
    });
    
    // If no submissions found, try to get problems directly
    if (weeklySubmissions.length === 0) {
      const recentSolvedProblems = await prisma.problem.findMany({
        where: {
          userId: user.id,
          status: 'Solved',
          updatedAt: {
            gte: last7Days
          }
        },
        select: {
          updatedAt: true
        }
      });
      
      recentSolvedProblems.forEach(problem => {
        const dateStr = format(problem.updatedAt, 'yyyy-MM-dd');
        submissionsByDay.set(dateStr, (submissionsByDay.get(dateStr) || 0) + 1);
      });
    }
    
    // Fill in data for each day in the range
    dateRange.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      weeklyActivity.push({
        day: dateStr,
        count: submissionsByDay.get(dateStr) || 0
      });
    });

    // If no activity is found at all, create some sample data
    const hasActivity = weeklyActivity.some(day => day.count > 0);
    if (!hasActivity) {
      // Create sample data for demonstration purposes
      /*
      const today = new Date();
      const yesterday = subDays(today, 1);
      const twoDaysAgo = subDays(today, 2);
      
      // Add some activity for the past few days
      for (const day of weeklyActivity) {
        const dayDate = new Date(day.day);
        if (format(dayDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
          day.count = 2; // Today
        } else if (format(dayDate, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
          day.count = 1; // Yesterday
        } else if (format(dayDate, 'yyyy-MM-dd') === format(twoDaysAgo, 'yyyy-MM-dd')) {
          day.count = 3; // Two days ago
        }
      }
      */
      // No sample data - show empty chart instead
    }
    
    // Get recent submissions
    const recentSubmissions = await prisma.submission.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        submittedAt: 'desc'
      },
      take: 5,
      include: {
        problem: {
          select: {
            title: true,
            difficulty: true,
            platform: true
          }
        }
      }
    });
    
    // Get recent problems
    const recentProblems = await prisma.problem.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5,
      include: {
        problemTags: {
          include: {
            tag: true
          }
        }
      }
    });
    
    // Get top tags
    const tags = await prisma.problemTag.groupBy({
      by: ['tagId'],
      where: {
        problem: {
          userId: user.id,
          status: 'Solved'
        }
      },
      _count: {
        problemId: true
      }
    }) as unknown as TagCount[];
    
    // Get tag details
    let topTags: TagWithCount[] = [];
    if (tags.length > 0) {
      const tagIds = tags.map(t => t.tagId);
      const tagDetails = await prisma.tag.findMany({
        where: {
          id: {
            in: tagIds
          }
        }
      }) as TagDetails[];
      
      // Merge counts with tag details
      topTags = tags.map(tag => {
        const details = tagDetails.find(t => t.id === tag.tagId);
        if (!details) {
          return null;
        }
        return {
          ...details,
          count: tag._count.problemId
        };
      }).filter((tag): tag is TagWithCount => tag !== null).sort((a, b) => b.count - a.count).slice(0, 5);
    }
    
    // Create success rate data
    const totalSubmissionsCount = await prisma.submission.count({
      where: { userId: user.id }
    });
    
    const successfulSubmissionsCount = await prisma.submission.count({
      where: {
        userId: user.id,
        status: 'Accepted'
      }
    });
    
    const successRate = totalSubmissionsCount > 0
      ? Math.round((successfulSubmissionsCount / totalSubmissionsCount) * 100)
      : 0;
    
    return NextResponse.json({
      stats: {
        totalProblems,
        solvedProblems,
        attemptedProblems,
        streak: stats?.streak || 0,
        lastSolved: stats?.lastSolved || null,
        // Use type assertion to handle the longestStreak property
        longestStreak: (stats as unknown as { longestStreak?: number })?.longestStreak || 0
      },
      activityData,
      distribution: {
        problemsByDifficulty,
        problemsByStatus,
        problemsByPlatform
      },
      weeklyActivity,
      recentSubmissions,
      recentProblems,
      topTags,
      successRate
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
} 