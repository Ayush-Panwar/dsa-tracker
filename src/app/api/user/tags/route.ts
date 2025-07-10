import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ensureDbUser } from "@/utils/user";

// GET /api/user/tags - Get all tags for the current user
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
    
    const tags = await prisma.tag.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

// POST /api/user/tags - Create a new tag
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
    
    const { name, color } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      );
    }
    
    // Check if tag already exists for this user
    const existingTag = await prisma.tag.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive' // Case-insensitive search
        },
        userId: user.id
      }
    });
    
    if (existingTag) {
      return NextResponse.json(existingTag);
    }
    
    // Create new tag
    const newTag = await prisma.tag.create({
      data: {
        name,
        color: color || '#888888',
        userId: user.id
      }
    });
    
    return NextResponse.json(newTag, { status: 201 });
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    );
  }
} 