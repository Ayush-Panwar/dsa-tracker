import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/supabase/server'
import { ensureDbUser } from '@/utils/user'

// GET /api/problems/:id - Get a specific problem
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    const { id } = await params;
    
    const problem = await prisma.problem.findUnique({
      where: {
        id,
        userId: user.id
      },
      include: {
        problemTags: {
          include: {
            tag: true
          }
        },
        submissions: {
          include: {
            errors: true
          },
          orderBy: {
            submittedAt: 'desc'
          }
        }
      }
    });
    
    if (!problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }
    
    // Transform the response to include tags directly
    const transformedProblem = {
      ...problem,
      tags: problem.problemTags.map(pt => pt.tag)
    };
    
    return NextResponse.json(transformedProblem);
  } catch (error) {
    console.error('Error fetching problem:', error);
    return NextResponse.json(
      { error: 'Failed to fetch problem' },
      { status: 500 }
    );
  }
}

// PUT /api/problems/:id - Update a problem
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    const { id } = await params;
    const { title, platform, difficulty, status, url, description, notes, tags } = await request.json();
    
    // Check if problem exists and belongs to user
    const existingProblem = await prisma.problem.findUnique({
      where: {
        id,
        userId: user.id
      }
    });
    
    if (!existingProblem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }
    
    // First update the problem's basic info
    await prisma.problem.update({
      where: {
        id
      },
      data: {
        title,
        platform,
        difficulty,
        status,
        url,
        description,
        notes,
      }
    });
    
    // If tags are provided, handle tag updates separately
    if (tags && Array.isArray(tags)) {
      // Delete existing problem-tag relationships
      await prisma.problemTag.deleteMany({
        where: {
          problemId: id
        }
      });
      
      // Create new problem-tag relationships
      for (const tagData of tags) {
        // Find or create the tag
        const tag = await prisma.tag.upsert({
          where: { 
            name_userId: { 
              name: tagData.name, 
              userId: user.id 
            } 
          },
          update: { 
            color: tagData.color || '#888888' 
          },
          create: { 
            name: tagData.name, 
            color: tagData.color || '#888888', 
            userId: user.id 
          }
        });
        
        // Create the problem-tag relationship
        await prisma.problemTag.create({
          data: {
            problemId: id,
            tagId: tag.id
          }
        });
      }
    }
    
    // Fetch the updated problem with tags
    const finalProblem = await prisma.problem.findUnique({
      where: {
        id
      },
      include: {
        problemTags: {
          include: {
            tag: true
          }
        }
      }
    });
    if (!finalProblem) {
      return NextResponse.json({ error: 'Failed to fetch updated problem' }, { status: 500 });
    }
    
    // Transform the response to include tags directly
    const transformedProblem = {
      ...finalProblem,
      tags: finalProblem.problemTags.map(pt => pt.tag)
    };
    
    return NextResponse.json(transformedProblem);
  } catch (error) {
    console.error('Error updating problem:', error);
    return NextResponse.json(
      { error: 'Failed to update problem' },
      { status: 500 }
    );
  }
}

// DELETE /api/problems/:id - Delete a problem
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    const { id } = await params;
    
    // Check if problem exists and belongs to user
    const existingProblem = await prisma.problem.findUnique({
      where: {
        id,
        userId: user.id
      }
    });
    
    if (!existingProblem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }
    
    // Delete the problem (cascade will handle related records)
    await prisma.problem.delete({
      where: {
        id
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting problem:', error);
    return NextResponse.json(
      { error: 'Failed to delete problem' },
      { status: 500 }
    );
  }
} 