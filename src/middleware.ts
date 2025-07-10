import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from './utils/supabase/middleware'

// List of paths that don't require authentication
const publicPaths = ['/', '/login', '/signup', '/forgot-password', '/reset-password']

export async function middleware(request: NextRequest) {
  // Update the session
  const { response, session } = await updateSession(request)
  
  // Get the pathname from the URL
  const { pathname } = request.nextUrl
  
  // Check if the path is public
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  )
  
  // If the path is not public and the user is not authenticated, redirect to login
  if (!isPublicPath && !session) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  // If the user is authenticated and trying to access login/signup pages, redirect to dashboard
  if (session && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return response
}

// Apply middleware to all routes except static files and API routes
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
} 