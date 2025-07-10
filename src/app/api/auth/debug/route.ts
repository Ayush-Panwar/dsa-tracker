import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";

// This route helps troubleshoot authentication issues
export async function GET() {
  try {
    // Get the headers for debugging
    const headersList = await headers();
    const authHeader = headersList.get("authorization") || "No auth header";
    
    // Try to get the user with our special token handling
    const user = await getUser();
    
    // Also try the conventional method
    const supabase = await createClient();
    const { data: { user: cookieUser }, error: cookieError } = await supabase.auth.getUser();
    
    // Return all the information
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      headers: {
        authorization: authHeader.startsWith('Bearer ') 
          ? `Bearer ${authHeader.substring(7, 16)}...` // Show just part of the token for security
          : authHeader
      },
      userFromToken: user ? {
        id: user.id,
        email: user.email,
        authProviders: user.app_metadata?.providers || []
      } : null,
      userFromCookie: cookieUser ? {
        id: cookieUser.id,
        email: cookieUser.email,
        authProviders: cookieUser.app_metadata?.providers || []
      } : null,
      cookieError: cookieError ? cookieError.message : null
    });
  } catch (error) {
    console.error("Auth debug error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 