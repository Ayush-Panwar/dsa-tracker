import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';
import { ensureDbUser } from '@/lib/db-utils';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Use Supabase to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.user) {
      console.error('Extension login error:', error);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Get the user from our database or create them if they don't exist
    const dbUser = await ensureDbUser(data.user);

    // Create a token that expires in 1 hour
    const expiresIn = 3600; // 1 hour in seconds

    // Create extension token
    const extensionToken = await prisma.extensionToken.create({
      data: {
        token: data.session?.access_token || '',
        name: 'Extension Login',
        userId: dbUser.id,
        lastUsed: new Date()
      }
    });

    return NextResponse.json({
      token: extensionToken.token,
      refreshToken: data.session?.refresh_token || '',
      expiresIn,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
      },
    });
  } catch (error) {
    console.error('Extension login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
 
 
 