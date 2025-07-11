"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Define more specific types for the arrays that were using 'any'
interface Submission {
  id: string
  code: string
  language: string
  status: string
  runtime?: string
  memory?: string
  submittedAt: string
  problem: {
    title: string
    difficulty: string
    platform: string
  }
}

interface Problem {
  id: string
  title: string
  difficulty: string
  platform: string
  updatedAt: string
  problemTags?: Array<{
    tag: {
      id: string
      name: string
      color?: string
    }
  }>
}

interface Tag {
  id: string
  name: string
  color?: string
  count: number
}

// Define the analytics data structure based on your API response
interface AnalyticsData {
  stats: {
    totalProblems: number
    solvedProblems: number
    attemptedProblems: number
    streak: number
    lastSolved: string | null
    longestStreak: number
  }
  activityData: Array<{ date: string, count: number }>
  distribution: {
    problemsByDifficulty: Array<{ difficulty: string, _count: { id: number } }>
    problemsByStatus: Array<{ status: string, _count: { id: number } }>
    problemsByPlatform: Array<{ platform: string, _count: { id: number } }>
  }
  weeklyActivity: Array<{ day: string, count: number }>
  recentSubmissions: Submission[]
  recentProblems: Problem[]
  topTags: Tag[]
  successRate: number
}

interface AnalyticsContextType {
  analyticsData: AnalyticsData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined)

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch("/api/user/analytics")
      
      if (!response.ok) {
        throw new Error("Failed to fetch analytics data")
      }
      
      const data = await response.json()
      setAnalyticsData(data)
    } catch (err) {
      console.error("Error fetching analytics data:", err)
      setError("Failed to load analytics data")
    } finally {
      setLoading(false)
    }
  }

  // Fetch data when the provider mounts
  useEffect(() => {
    fetchAnalytics()
  }, [])

  const value = {
    analyticsData,
    loading,
    error,
    refetch: fetchAnalytics
  }

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  )
}

// Custom hook to use the analytics context
export function useAnalytics() {
  const context = useContext(AnalyticsContext)
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider')
  }
  return context
} 
 
 
 
 