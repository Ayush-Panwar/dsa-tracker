import { getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Redirect unauthenticated users to login
 */
export async function requireUser() {
  const user = await getUser();
  if (!user) {
    redirect('/auth/login');
  }
  return user;
}

// Re-export getUser for convenience
export { getUser }; 
 
 
 