import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/supabase/server'

// GET /api/tags/:id - Get a specific tag
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = session.user.id
    const { id } = await params
    
    const tag = await prisma.tag.findUnique({
      where: {
        id,
        userId
      },
      include: {
        problems: true
      }
    })
    
    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }
    
    return NextResponse.json(tag)
  } catch (error) {
    console.error('Error fetching tag:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tag' },
      { status: 500 }
    )
  }
}

// PUT /api/tags/:id - Update a tag
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = session.user.id
    const { id } = await params
    const { name, color } = await request.json()
    
    // Check if tag exists and belongs to user
    const existingTag = await prisma.tag.findUnique({
      where: {
        id,
        userId
      }
    })
    
    if (!existingTag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }
    
    // If name is changing, check for duplicate
    if (name && name !== existingTag.name) {
      const duplicateTag = await prisma.tag.findUnique({
        where: {
          name_userId: {
            name,
            userId
          }
        }
      })
      
      if (duplicateTag) {
        return NextResponse.json(
          { error: 'A tag with this name already exists' },
          { status: 409 }
        )
      }
    }
    
    // Update the tag
    const updatedTag = await prisma.tag.update({
      where: {
        id
      },
      data: {
        name,
        color
      }
    })
    
    return NextResponse.json(updatedTag)
  } catch (error) {
    console.error('Error updating tag:', error)
    return NextResponse.json(
      { error: 'Failed to update tag' },
      { status: 500 }
    )
  }
}

// DELETE /api/tags/:id - Delete a tag
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = session.user.id
    const { id } = await params
    
    // Check if tag exists and belongs to user
    const existingTag = await prisma.tag.findUnique({
      where: {
        id,
        userId
      }
    })
    
    if (!existingTag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }
    
    // Delete the tag
    await prisma.tag.delete({
      where: {
        id
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tag:', error)
    return NextResponse.json(
      { error: 'Failed to delete tag' },
      { status: 500 }
    )
  }
} 
 
 
 