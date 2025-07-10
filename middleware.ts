import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  try {
    // Handle CORS for API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
      // For API routes, add CORS headers to allow extension access
      const response = NextResponse.next()
      
      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      
      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        return new NextResponse(null, { 
          status: 200,
          headers: response.headers
        })
      }
      
      return response
    }
    
    // Handle duplicate /api/api/ pattern from extension
    // This happens because the extension's API_BASE_URL already includes /api
    if (request.nextUrl.pathname.startsWith('/api/api/')) {
      const correctedPath = request.nextUrl.pathname.replace('/api/api/', '/api/')
      const url = new URL(correctedPath, request.url)
      
      // For these routes, add CORS headers too
      const response = NextResponse.rewrite(url)
      
      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      
      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        return new NextResponse(null, { 
          status: 200,
          headers: response.headers
        })
      }
      
      return response
    }
    
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
    // redirect the user to /auth/signup
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