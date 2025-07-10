import { prisma } from '@/lib/prisma'
import { toast } from 'sonner'

// Define achievement types
export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  condition: (stats: UserStats) => boolean
}

// Define user stats interface
export interface UserStats {
  totalSolved: number
  easyCount: number
  mediumCount: number
  hardCount: number
  streak: number
  platforms?: Record<string, number>
  tags?: Record<string, number>
}

// Define user achievement type
interface UserAchievement {
  id: string
  userId: string
  achievementId: string
  earnedAt: Date
}

// Define achievements
export const achievements: Achievement[] = [
  {
    id: 'first_solved',
    title: 'First Steps',
    description: 'Solve your first problem',
    icon: '🎯',
    condition: (stats) => stats.totalSolved >= 1
  },
  {
    id: 'five_solved',
    title: 'Getting Started',
    description: 'Solve 5 problems',
    icon: '🔥',
    condition: (stats) => stats.totalSolved >= 5
  },
  {
    id: 'ten_solved',
    title: 'On a Roll',
    description: 'Solve 10 problems',
    icon: '🚀',
    condition: (stats) => stats.totalSolved >= 10
  },
  {
    id: 'twenty_five_solved',
    title: 'Problem Solver',
    description: 'Solve 25 problems',
    icon: '🧠',
    condition: (stats) => stats.totalSolved >= 25
  },
  {
    id: 'fifty_solved',
    title: 'Code Master',
    description: 'Solve 50 problems',
    icon: '👑',
    condition: (stats) => stats.totalSolved >= 50
  },
  {
    id: 'hundred_solved',
    title: 'Algorithm Expert',
    description: 'Solve 100 problems',
    icon: '🏆',
    condition: (stats) => stats.totalSolved >= 100
  },
  {
    id: 'first_hard',
    title: 'Hard Hitter',
    description: 'Solve your first hard problem',
    icon: '💪',
    condition: (stats) => stats.hardCount >= 1
  },
  {
    id: 'five_hard',
    title: 'Hard Mode',
    description: 'Solve 5 hard problems',
    icon: '🔥',
    condition: (stats) => stats.hardCount >= 5
  },
  {
    id: 'streak_3',
    title: 'Consistent',
    description: 'Maintain a 3-day streak',
    icon: '📆',
    condition: (stats) => stats.streak >= 3
  },
  {
    id: 'streak_7',
    title: 'Weekly Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🗓️',
    condition: (stats) => stats.streak >= 7
  },
  {
    id: 'streak_30',
    title: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: '🏅',
    condition: (stats) => stats.streak >= 30
  },
  {
    id: 'streak_100',
    title: 'Dedication',
    description: 'Maintain a 100-day streak',
    icon: '💎',
    condition: (stats) => stats.streak >= 100
  }
]

// Check for achievements and show notifications
export async function checkAchievements(userId: string, clientSide = false): Promise<string[]> {
  // Get user statistics
  const stats = await prisma.statistics.findUnique({
    where: { userId }
  })
  
  if (!stats) return []
  
  // Get user's existing achievements
  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true }
  })
  
  const existingAchievementIds = userAchievements.map((ua: { achievementId: string }) => ua.achievementId)
  
  // Prepare user stats
  const userStats: UserStats = {
    totalSolved: stats.totalSolved,
    easyCount: stats.easyCount,
    mediumCount: stats.mediumCount,
    hardCount: stats.hardCount,
    streak: stats.streak
  }
  
  // Check for new achievements
  const newAchievements = achievements.filter(achievement => 
    !existingAchievementIds.includes(achievement.id) && 
    achievement.condition(userStats)
  )
  
  if (newAchievements.length > 0) {
    // Record new achievements
    await Promise.all(newAchievements.map(achievement => 
      prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
          earnedAt: new Date()
        }
      })
    ))
    
    // Show notifications if on client side
    if (clientSide) {
      newAchievements.forEach(achievement => {
        toast.success(`Achievement Unlocked: ${achievement.title}`, {
          description: achievement.description,
          icon: achievement.icon,
          duration: 5000
        })
      })
    }
    
    return newAchievements.map(a => a.id)
  }
  
  return []
}

// Get all user achievements
export async function getUserAchievements(userId: string) {
  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    orderBy: { earnedAt: 'desc' }
  })
  
  return userAchievements.map((ua: UserAchievement) => {
    const achievement = achievements.find(a => a.id === ua.achievementId)
    return {
      ...ua,
      ...achievement
    }
  })
} 
 
 
 