import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { ensureDbUser } from '@/utils/user'

// DELETE /api/extension/auth/:id - Revoke an extension token
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    const { id } = await params
    
    // Check if token exists and belongs to user
    const token = await prisma.extensionToken.findFirst({
      where: {
        id,
        userId: user.id
      }
    })
    
    if (!token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 })
    }
    
    // Revoke the token
    await prisma.extensionToken.update({
      where: { id },
      data: { revoked: true }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error revoking extension token:', error)
    return NextResponse.json(
      { error: 'Failed to revoke extension token' },
      { status: 500 }
    )
  }
} 
 
 
 