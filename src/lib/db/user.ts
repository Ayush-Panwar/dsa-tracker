import { sql } from "@vercel/postgres";

interface SessionUser {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
  };
}

/**
 * Ensures that a user exists in the database
 */
export async function ensureDbUser(sessionUser: SessionUser) {
  if (!sessionUser) {
    throw new Error("No authenticated user provided");
  }

  const { id, email, user_metadata } = sessionUser;
  const name = user_metadata?.name || email;

  // Check if user exists
  const userResult = await sql`
    SELECT id FROM "User" WHERE id = ${id}
  `;

  // If user doesn't exist, create them
  if (userResult.rowCount === 0) {
    await sql`
      INSERT INTO "User" (id, email, name, created_at, updated_at)
      VALUES (${id}, ${email}, ${name}, NOW(), NOW())
    `;
  }

  return { id, email, name };
} 
 
 
 