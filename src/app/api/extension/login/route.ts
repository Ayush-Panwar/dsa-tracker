import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';
import { ensureDbUser } from '@/lib/db-utils';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Add CORS headers for the Chrome extension
export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') || '';
  
  // Check if the request is coming from our Chrome extension
  if (origin.startsWith('chrome-extension://')) {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400', // 24 hours
      },
    });
  }
  
  // For other origins, return a basic response
  return new NextResponse(null, { status: 200 });
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin') || '';
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' }, 
        { 
          status: 400,
          headers: getCorsHeaders(origin),
        }
      );
    }

    // Use Supabase to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.user) {
      console.error('Extension login error:', error);
      return NextResponse.json(
        { error: 'Invalid credentials' }, 
        { 
          status: 401,
          headers: getCorsHeaders(origin),
        }
      );
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

    return NextResponse.json(
      {
        token: extensionToken.token,
        refreshToken: data.session?.refresh_token || '',
        expiresIn,
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
        },
      },
      { 
        headers: getCorsHeaders(origin),
      }
    );
  } catch (error) {
    console.error('Extension login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { 
        status: 500,
        headers: getCorsHeaders(request.headers.get('origin') || ''),
      }
    );
  }
}

// Helper function to get CORS headers
function getCorsHeaders(origin: string) {
  // Only allow the Chrome extension origin or specific origins you trust
  const headers: Record<string, string> = {};
  
  if (origin.startsWith('chrome-extension://')) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Client-Info';
  }
  
  return headers;
} 
 
 
 