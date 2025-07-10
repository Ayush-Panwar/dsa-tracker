import { NextRequest, NextResponse } from "next/server";
import { getUser } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ensureDbUser } from '@/utils/user';

// GET /api/user/preferences - Get user preferences
export async function GET() {
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
    
    // Fetch user preferences
    const preferences = await prisma.preference.findUnique({
      where: { userId: user.id }
    });
    
    if (!preferences) {
      // Create default preferences if none exist
      const defaultPreferences = await prisma.preference.create({
        data: {
          userId: user.id,
          theme: 'system',
          codeEditorTheme: 'default',
          notifications: true,
          dailyGoal: 1
        }
      });
      
      return NextResponse.json(defaultPreferences);
    }
    
    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user preferences' },
      { status: 500 }
    );
  }
}

// PUT /api/user/preferences - Update user preferences
export async function PUT(request: NextRequest) {
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
    
    const { theme, codeEditorTheme, notifications, dailyGoal } = await request.json();
    
    // Find existing preferences
    const existingPreferences = await prisma.preference.findUnique({
      where: { userId: user.id }
    });
    
    let preferences;
    
    if (existingPreferences) {
      // Update existing preferences
      preferences = await prisma.preference.update({
        where: { userId: user.id },
        data: {
          theme: theme !== undefined ? theme : existingPreferences.theme,
          codeEditorTheme: codeEditorTheme !== undefined ? codeEditorTheme : existingPreferences.codeEditorTheme,
          notifications: notifications !== undefined ? notifications : existingPreferences.notifications,
          dailyGoal: dailyGoal !== undefined ? dailyGoal : existingPreferences.dailyGoal
        }
      });
    } else {
      // Create new preferences
      preferences = await prisma.preference.create({
        data: {
          userId: user.id,
          theme: theme || 'system',
          codeEditorTheme: codeEditorTheme || 'default',
          notifications: notifications !== undefined ? notifications : true,
          dailyGoal: dailyGoal || 1
        }
      });
    }
    
    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update user preferences' },
      { status: 500 }
    );
  }
} 