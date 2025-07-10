import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  try {
    // Update session with new auth cookies and get session data
    const result = await updateSession(request)
    const session = result.session
    const response = result.response
    
    const { pathname } = request.nextUrl
    
    // Auth condition redirect logic
    // If user is not signed in and the current path is not /auth/login,
    // redirect the user to /auth/login
    if (
      !session &&
      !pathname.startsWith('/auth/') &&
      !pathname.startsWith('/_next') &&
      !pathname.startsWith('/api/') &&
      pathname !== '/'
    ) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // If user is signed in and the current path is /auth/login,
    // redirect the user to /dashboard
    if (
      session &&
      (pathname.startsWith('/auth/login') ||
        pathname.startsWith('/auth/signup'))
    ) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Note: We don't create users in middleware because it should be stateless
    // User creation happens in dashboard or API routes

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // If middleware fails, allow the request to continue
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 