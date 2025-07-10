import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware to handle CORS for extension routes
export function middleware(request: NextRequest) {
  // Get the origin from the request
  const origin = request.headers.get('origin') || '';
  
  // Check if the request is coming from our Chrome extension
  if (origin.startsWith('chrome-extension://')) {
    // For OPTIONS requests (preflight)
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400', // 24 hours
        },
      });
    }
    
    // For actual requests, clone the response and add CORS headers
    const response = NextResponse.next();
    
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return response;
  }
  
  // For other origins, proceed normally
  return NextResponse.next();
}

// Configure the middleware to run on all extension API routes
export const config = {
  matcher: '/api/extension/:path*',
}; 