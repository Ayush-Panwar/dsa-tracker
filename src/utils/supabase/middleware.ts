import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  try {
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              try {
                return request.cookies.getAll().map(cookie => ({ 
                  name: cookie.name, 
                  value: cookie.value 
                }))
              } catch (cookieError) {
                console.error('Error in getAll cookies:', cookieError)
                return []
              }
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) => {
                  request.cookies.set(name, value) // Pass to server components
                  response.cookies.set({ name, value, ...options }) // Pass to browser
                })
              } catch (cookieSetError) {
                console.error('Error in setAll cookies:', cookieSetError)
              }
            },
          },
        }
      )

      // Get user data
      try {
        const { data } = await supabase.auth.getUser()
        return { 
          response, 
          session: data.user ? { user: data.user } : null 
        }
      } catch (userError) {
        console.error('Error getting user:', userError)
        return { response, session: null }
      }
    } catch (supabaseError) {
      console.error('Error creating Supabase client:', supabaseError)
      return { response, session: null }
    }
  } catch (error) {
    console.error('Unexpected error in updateSession:', error)
    // Return a default response if everything fails
    return { 
      response: NextResponse.next(), 
      session: null 
    }
  }
} 
 
 
 