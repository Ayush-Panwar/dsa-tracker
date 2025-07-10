import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { cache } from 'react'
import { Database } from '../database.types'
import type { SerializeOptions } from 'cookie'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const createClient = cache(async () => {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map(c => ({ name: c.name, value: c.value }))
        },
        setAll(cookiesToSet: { name: string; value: string; options?: SerializeOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
              cookieStore.set({ name, value, ...options })
            })
          } catch (error) {
            void error;
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
})

// Admin client with service-role key for token-based auth
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Function to get the current session
export async function getSession() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// Function to check if a user is authenticated
export async function isAuthenticated() {
  const session = await getSession()
  return !!session
}

// Function to get the current authenticated user, supports Bearer tokens
export async function getUser() {
  try {
    // Try bearer token first
    const hdrs = await headers();
    const authHeader = hdrs.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/, '').trim();
    
    // Debug log for token handling
    console.log(`Auth header present: ${!!authHeader}, Token length: ${token.length}`);
    
    if (token && token.length > 20) { // Basic validation that we have something token-like
      console.log('Attempting token-based auth');
      try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (error) {
          console.error('Error fetching user with token:', error);
        } else if (user) {
          console.log('Token auth successful for user:', user.id);
          return user;
        }
      } catch (tokenError) {
        console.error('Exception during token auth:', tokenError);
      }
    }
    
    // Fallback to cookie-based session
    console.log('Falling back to cookie-based auth');
    const supabase = await createClient();
    const { data: { user: cookieUser }, error: cookieError } = await supabase.auth.getUser();
    if (cookieError) {
      console.error('Error fetching user from cookie:', cookieError);
      return null;
    }
    return cookieUser;
  } catch (error) {
    console.error('Unexpected error in getUser:', error);
    return null;
  }
} 