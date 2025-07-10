import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ensureDbUser } from "@/utils/user";

// POST /api/problems/:id/tags - Add a tag to a problem
export async function POST(
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
    const { tagId } = await request.json();
    
    if (!tagId) {
      return NextResponse.json(
        { error: 'Tag ID is required' },
        { status: 400 }
      );
    }
    
    // Check if problem exists and belongs to the user
    const problem = await prisma.problem.findUnique({
      where: {
        id,
        userId: user.id
      }
    });
    
    if (!problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }
    
    // Check if tag exists and belongs to the user
    const tag = await prisma.tag.findUnique({
      where: {
        id: tagId,
        userId: user.id
      }
    });
    
    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }
    
    // Check if the tag is already associated with the problem
    const existingProblemTag = await prisma.problemTag.findFirst({
      where: {
        problemId: id,
        tagId
      }
    });
    
    if (existingProblemTag) {
      return NextResponse.json(
        { message: 'Tag already associated with problem' },
        { status: 200 }
      );
    }
    
    // Associate tag with problem
    const problemTag = await prisma.problemTag.create({
      data: {
        problemId: id,
        tagId
      },
      include: {
        tag: true
      }
    });
    
    return NextResponse.json(problemTag, { status: 201 });
  } catch (error) {
    console.error('Error adding tag to problem:', error);
    return NextResponse.json(
      { error: 'Failed to add tag to problem' },
      { status: 500 }
    );
  }
} 