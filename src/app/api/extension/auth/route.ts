import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { ensureDbUser } from '@/utils/user';

// POST /api/extension/auth - Generate a new extension token
export async function POST(request: Request) {
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
    
    const { name } = await request.json();
    
    // Generate a random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Create the extension token
    const extensionToken = await prisma.extensionToken.create({
      data: {
        token,
        name: name || 'Browser Extension',
        userId: user.id,
      }
    });
    
    return NextResponse.json({
      token: extensionToken.token,
      id: extensionToken.id
    });
  } catch (error) {
    console.error('Error generating extension token:', error);
    return NextResponse.json(
      { error: 'Failed to generate extension token' },
      { status: 500 }
    );
  }
}

// GET /api/extension/auth - List all extension tokens for the user
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
    
    // Get all tokens for the user (without exposing the actual token)
    const tokens = await prisma.extensionToken.findMany({
      where: { 
        userId: user.id,
        revoked: false
      },
      select: {
        id: true,
        name: true,
        lastUsed: true,
        createdAt: true
      }
    });
    
    return NextResponse.json(tokens);
  } catch (error) {
    console.error('Error fetching extension tokens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch extension tokens' },
      { status: 500 }
    );
  }
} 