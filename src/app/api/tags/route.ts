import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/supabase/server'

// GET /api/tags - Get all tags for the current user
export async function GET() {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = session.user.id
    
    const tags = await prisma.tag.findMany({
      where: {
        userId
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    return NextResponse.json(tags)
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}

// POST /api/tags - Create a new tag
export async function POST(request: Request) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = session.user.id
    const { name, color } = await request.json()
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }
    
    // Check if tag with the same name already exists for this user
    const existingTag = await prisma.tag.findUnique({
      where: {
        name_userId: {
          name,
          userId
        }
      }
    })
    
    if (existingTag) {
      return NextResponse.json(
        { error: 'A tag with this name already exists' },
        { status: 409 }
      )
    }
    
    const tag = await prisma.tag.create({
      data: {
        name,
        color: color || '#888888',
        userId
      }
    })
    
    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error('Error creating tag:', error)
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    )
  }
} 
 
 
 