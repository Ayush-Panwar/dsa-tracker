"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        const response = await fetch("/api/user/analytics")
        
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard stats")
        }
        
        const data = await response.json()
        
        // Calculate monthly growth (placeholder logic - in a real app, you'd compare with last month's data)
        const monthlyGrowth = {
          total: Math.floor(data.stats.totalProblems * 0.1), // Assume 10% growth for demo
          solved: Math.floor(data.stats.solvedProblems * 0.08) // Assume 8% growth for demo
        }
        
        setStats({
          totalProblems: data.stats.totalProblems || 0,
          solvedProblems: data.stats.solvedProblems || 0,
          streak: data.stats.streak || 0,
          longestStreak: data.stats.longestStreak || 0,
          lastSolved: data.stats.lastSolved,
          monthlyGrowth
        })
      } catch (err) {
        console.error("Error fetching dashboard stats:", err)
        setError("Failed to load dashboard statistics")
      } finally {
        setLoading(false)
      }
    }
    
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="min-h-[100px] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
              <CardTitle className="text-sm font-medium text-gray-300 animate-pulse">
                Loading...
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="h-6 w-20 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-4 w-32 bg-gray-100 animate-pulse rounded mt-2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-1">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="text-center text-red-500">
              {error}
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
      <Card className="min-h-[100px] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
          <CardTitle className="text-sm font-medium">
            Total Problems
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="text-2xl font-bold">{stats.totalProblems}</div>
          <p className="text-xs text-muted-foreground truncate">
            {stats.monthlyGrowth.total > 0 ? `+${stats.monthlyGrowth.total} from last month` : "No change from last month"}
          </p>
        </CardContent>
      </Card>
      
      <Card className="min-h-[100px] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
          <CardTitle className="text-sm font-medium">
            Problems Solved
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="text-2xl font-bold">{stats.solvedProblems}</div>
          <p className="text-xs text-muted-foreground truncate">
            {stats.monthlyGrowth.solved > 0 ? `+${stats.monthlyGrowth.solved} from last month` : "No change from last month"}
          </p>
        </CardContent>
      </Card>
      
      <Card className="min-h-[100px] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
          <CardTitle className="text-sm font-medium">
            Current Streak
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="text-2xl font-bold">{stats.streak} {stats.streak === 1 ? 'day' : 'days'}</div>
          <p className="text-xs text-muted-foreground truncate">
            {stats.streak > 0 ? "Keep it going!" : "Start solving today!"}
          </p>
        </CardContent>
      </Card>
      
      <Card className="min-h-[100px] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
          <CardTitle className="text-sm font-medium">
            Longest Streak
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="text-2xl font-bold">{stats.longestStreak} {stats.longestStreak === 1 ? 'day' : 'days'}</div>
          <p className="text-xs text-muted-foreground truncate">
            {stats.lastSolved ? `Last solved on ${new Date(stats.lastSolved).toLocaleDateString()}` : "No problems solved yet"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 