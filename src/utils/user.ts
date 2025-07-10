import { prisma } from "@/lib/prisma";

/**
 * Ensures that a user exists in the database for the provided Supabase user ID
 * Creates the user and associated records if they don't exist
 */
export async function ensureDbUser(supabaseUserId: string, metadata?: { name?: string; email?: string }) {
  // Check if user exists in database
  let user = await prisma.user.findUnique({
    where: { userId: supabaseUserId }
  });
  
  // If not, create the user
  if (!user) {
    console.log(`Creating new database user for auth ID: ${supabaseUserId}`);
    
    user = await prisma.user.create({
      data: {
        userId: supabaseUserId,
        name: metadata?.name || null,
        email: metadata?.email || null,
      }
    });
    
    // Initialize statistics
    await prisma.statistics.create({
      data: {
        userId: user.id
      }
    });
    
    // Initialize user preferences
    await prisma.preference.create({
      data: {
        userId: user.id
      }
    });
    
    // Create default tags
    const defaultTags = [
      { name: 'Array', color: '#FF5733' },
      { name: 'String', color: '#33FF57' },
      { name: 'Hash Table', color: '#3357FF' },
      { name: 'Dynamic Programming', color: '#F033FF' },
      { name: 'Math', color: '#FF33A8' },
    ];
    
    for (const tag of defaultTags) {
      await prisma.tag.create({
        data: {
          name: tag.name,
          color: tag.color,
          userId: user.id,
        }
      });
    }
  }
  
  return user;
} 
 
 
 