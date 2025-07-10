import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ensureDbUser } from "@/utils/user";

// DELETE /api/problems/:id/tags/:tagId - Remove a tag from a problem
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tagId: string }> }
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
    
    const { id, tagId } = await params;
    
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
    
    // Delete the association between problem and tag
    await prisma.problemTag.deleteMany({
      where: {
        problemId: id,
        tagId
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing tag from problem:', error);
    return NextResponse.json(
      { error: 'Failed to remove tag from problem' },
      { status: 500 }
    );
  }
} 