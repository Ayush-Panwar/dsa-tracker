"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAnalytics } from "@/contexts/analytics-context"

interface DashboardStats {
  totalProblems: number
  solvedProblems: number
  streak: number
  longestStreak: number
  lastSolved: string | null
  monthlyGrowth: {
    total: number
    solved: number
  }
}

export default function DashboardStats() {
  const { analyticsData, loading, error } = useAnalytics()
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    if (analyticsData?.stats) {
      // Calculate monthly growth (placeholder logic - in a real app, you'd compare with last month's data)
      const monthlyGrowth = {
        total: Math.floor((analyticsData.stats.totalProblems || 0) * 0.1), // Assume 10% growth for demo
        solved: Math.floor((analyticsData.stats.solvedProblems || 0) * 0.08) // Assume 8% growth for demo
      }
      
      setStats({
        totalProblems: analyticsData.stats.totalProblems || 0,
        solvedProblems: analyticsData.stats.solvedProblems || 0,
        streak: analyticsData.stats.streak || 0,
        longestStreak: analyticsData.stats.longestStreak || 0,
        lastSolved: analyticsData.stats.lastSolved,
        monthlyGrowth
      })
    }
  }, [analyticsData])

  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid gap-4 grid-cols-1">
        <Card>
          <CardContent className="pt-6">
            <div className="text-red-500 text-center">
              <p className="font-medium">{error}</p>
              <p className="text-sm mt-2">Please try again later</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Problems
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalProblems}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.monthlyGrowth.total > 0 ? (
              <span className="text-green-600">+{stats.monthlyGrowth.total} this month</span>
            ) : (
              <span>No growth this month</span>
            )}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Solved Problems
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.solvedProblems}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.monthlyGrowth.solved > 0 ? (
              <span className="text-green-600">+{stats.monthlyGrowth.solved} this month</span>
            ) : (
              <span>No growth this month</span>
            )}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Current Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.streak} days</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.lastSolved ? (
              <span>Last solved {new Date(stats.lastSolved).toLocaleDateString()}</span>
            ) : (
              <span>No recent activity</span>
            )}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Longest Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.longestStreak} days</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.streak >= stats.longestStreak ? (
              <span className="text-green-600">Current streak is your best!</span>
            ) : (
              <span>{stats.longestStreak - stats.streak} days to beat your record</span>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 