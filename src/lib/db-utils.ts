import { prisma } from '@/lib/prisma'

interface UserData {
  name?: string | null
  email?: string | null
  imageUrl?: string | null
}

// Define Auth user interface to match Supabase user structure
interface AuthUser {
  id: string
  email?: string
  user_metadata?: {
    name?: string
    avatar_url?: string
  }
}

// Define database user return type
interface DbUser {
  id: string
  userId: string
  name: string | null
  email: string | null
  imageUrl: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Ensures a user exists in the database
 * @param user The auth provider's user object
 * @returns The database user object
 */
export async function ensureDbUser(user: AuthUser): Promise<DbUser> {
  if (!user || !user.id) {
    throw new Error('Invalid user object provided')
  }
  
  const userId = user.id
  
  try {
    const userData: UserData = {
      name: user.user_metadata?.name,
      email: user.email,
      imageUrl: user.user_metadata?.avatar_url,
    }
    
    // First check if a user exists with this userId
    let dbUser = await prisma.user.findUnique({
      where: { userId }
    })

    // If not found, check if a user exists with this email
    if (!dbUser && userData.email) {
      const userByEmail = await prisma.user.findUnique({
        where: { email: userData.email }
      })

      if (userByEmail) {
        // Update the existing user with the new userId to link accounts
        dbUser = await prisma.user.update({
          where: { id: userByEmail.id },
          data: { 
            userId,
            name: userData.name || userByEmail.name,
            imageUrl: userData.imageUrl || userByEmail.imageUrl
          }
        })
        return dbUser as DbUser
      }
    }

    // If no user exists at all, create a new one
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          userId,
          name: userData.name || null,
          email: userData.email || null,
          imageUrl: userData.imageUrl || null,
          statistics: {
            create: {
              totalSolved: 0,
              easyCount: 0,
              mediumCount: 0,
              hardCount: 0,
              streak: 0,
            },
          },
          preferences: {
            create: {},
          },
        },
      })
    } else {
      // Update existing user's info if needed
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          name: userData.name || dbUser.name,
          imageUrl: userData.imageUrl || dbUser.imageUrl
        }
      })
    }

    return dbUser as DbUser
  } catch (error) {
    console.error('Error ensuring user exists in database:', error)
    throw error
  }
} 
 
 
 