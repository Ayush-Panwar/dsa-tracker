import { NextRequest, NextResponse } from "next/server";
import { getUser } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ensureDbUser } from '@/utils/user';

// GET /api/user/activities - Get user activities for streak/heatmap
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
    
    // Parse date range parameters
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    // Default to last 365 days if no range specified
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam 
      ? new Date(startDateParam)
      : new Date(endDate);
    
    if (!startDateParam) {
      // Default to 1 year ago if no start date
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    
    // Get activities in date range
    const activities = await prisma.activity.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        date: 'asc'
      }
    });
    
    // Get current streak from statistics
    const stats = await prisma.statistics.findUnique({
      where: { userId: user.id }
    });
    
    return NextResponse.json({
      activities,
      streak: stats?.streak || 0,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user activities' },
      { status: 500 }
    );
  }
}

// POST /api/user/activities - Record a new activity for current day
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
    
    const { problemsAttempted = 0, problemsSolved = 0 } = await request.json();
    
    // Get today's date (reset time to beginning of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if activity exists for today
    const existingActivity = await prisma.activity.findUnique({
      where: {
        date_userId: {
          date: today,
          userId: user.id
        }
      }
    });
    
    let activity;
    let newStreak = 0;
    
    // Calculate streak
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const yesterdayActivity = await prisma.activity.findFirst({
      where: {
        userId: user.id,
        date: yesterday,
        problemsSolved: { gt: 0 }
      }
    });
    
    // Get current stats
    const stats = await prisma.statistics.findUnique({
      where: { userId: user.id }
    });
    
    if (yesterdayActivity && stats) {
      newStreak = stats.streak + 1;
    } else if (problemsSolved > 0) {
      newStreak = 1; // Start new streak
    } else if (stats) {
      newStreak = stats.streak; // Maintain current streak
    }
    
    if (existingActivity) {
      // Update existing activity
      activity = await prisma.activity.update({
        where: {
          date_userId: {
            date: today,
            userId: user.id
          }
        },
        data: {
          problemsAttempted: existingActivity.problemsAttempted + problemsAttempted,
          problemsSolved: existingActivity.problemsSolved + problemsSolved,
          streakCount: problemsSolved > 0 ? newStreak : existingActivity.streakCount
        }
      });
    } else {
      // Create new activity
      activity = await prisma.activity.create({
        data: {
          date: today,
          userId: user.id,
          problemsAttempted,
          problemsSolved,
          streakCount: problemsSolved > 0 ? newStreak : 0
        }
      });
    }
    
    // Update statistics
    if (stats && problemsSolved > 0) {
      await prisma.statistics.update({
        where: { id: stats.id },
        data: {
          streak: newStreak,
          lastSolved: new Date(),
          totalSolved: stats.totalSolved + problemsSolved
        }
      });
    }
    
    return NextResponse.json(activity);
  } catch (error) {
    console.error('Error recording activity:', error);
    return NextResponse.json(
      { error: 'Failed to record activity' },
      { status: 500 }
    );
  }
} 
 
 
 