"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { useAnalytics } from "@/contexts/analytics-context"

interface ActivityData {
  day: string
  count: number
}

export default function WeeklyActivityChart() {
  const { analyticsData, loading, error } = useAnalytics()
  const [data, setData] = useState<ActivityData[]>([])

  useEffect(() => {
    if (analyticsData?.weeklyActivity && analyticsData.weeklyActivity.length > 0) {
      // Format the data for the chart
      setData(analyticsData.weeklyActivity.map((item: { day: string; count: number }) => ({
        day: formatDayLabel(item.day),
        count: item.count
      })))
    } else if (!loading && !error) {
      // Create empty data for the past 7 days
      const emptyData = generateEmptyWeekData()
      setData(emptyData)
    }
  }, [analyticsData, loading, error])

  // Format day label (e.g., "2023-06-15" to "Thu")
  const formatDayLabel = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date)
    } catch (e) {
      console.error("Error formatting date:", e)
      return dateString
    }
  }

  // Generate empty data for the past 7 days
  const generateEmptyWeekData = (): ActivityData[] => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const today = new Date().getDay() // 0 = Sunday, 1 = Monday, etc.
    
    return Array(7).fill(0).map((_, i) => {
      const dayIndex = (today - 6 + i + 7) % 7 // Calculate the day index for the past 7 days
      return {
        day: days[dayIndex],
        count: 0
      }
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 text-center h-full flex items-center justify-center">
        <div>
          <p className="font-medium">{error}</p>
          <p className="text-sm mt-2">Please try again later</p>
        </div>
      </div>
    )
  }

  if (data.every(item => item.count === 0)) {
    return (
      <div className="text-center h-full flex flex-col items-center justify-center text-muted-foreground">
        <p className="font-medium">No activity data available</p>
        <p className="text-sm mt-2">Start solving problems to see your activity</p>
      </div>
    )
  }

  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <XAxis dataKey="day" />
          <YAxis allowDecimals={false} />
          <Tooltip 
            formatter={(value: number) => [`${value} problem${value !== 1 ? 's' : ''}`, 'Solved']}
          />
          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
} 
 
 
 