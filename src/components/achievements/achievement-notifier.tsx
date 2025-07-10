"use client"

import { useEffect } from 'react'
import { toast } from 'sonner'
import { achievements } from '@/utils/achievements'

interface AchievementNotifierProps {
  newAchievements?: string[]
}

export default function AchievementNotifier({ newAchievements }: AchievementNotifierProps) {
  useEffect(() => {
    if (newAchievements && newAchievements.length > 0) {
      // Show notifications for each achievement
      newAchievements.forEach(achievementId => {
        const achievement = achievements.find(a => a.id === achievementId)
        
        if (achievement) {
          toast.success(`Achievement Unlocked: ${achievement.title}`, {
            description: achievement.description,
            icon: achievement.icon,
            duration: 5000
          })
        }
      })
    }
  }, [newAchievements])
  
  // This component doesn't render anything
  return null
} 
 
 
 