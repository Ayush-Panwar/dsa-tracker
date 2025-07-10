"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format, parseISO, eachDayOfInterval, subDays } from "date-fns"

interface ActivityData {
  date: string
  count: number
}

interface ActivityHeatmapProps {
  className?: string
}

export default function ActivityHeatmap({ className }: ActivityHeatmapProps) {
  const [data, setData] = useState<ActivityData[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [currentStreak, setCurrentStreak] = useState<number>(0)
  const [longestStreak, setLongestStreak] = useState<number>(0)

  useEffect(() => {
    async function fetchActivityData() {
      try {
        setLoading(true)
        const response = await fetch("/api/user/analytics")
        
        if (!response.ok) {
          throw new Error("Failed to fetch activity data")
        }
        
        const analyticsData = await response.json()
        
        if (analyticsData.activityData) {
          setData(analyticsData.activityData)
          
          // Get streak data
          if (analyticsData.stats) {
            setCurrentStreak(analyticsData.stats.streak || 0)
            setLongestStreak(analyticsData.stats.longestStreak || 0)
          }
        } else {
          // Generate empty data for the last 90 days
          setData(generateEmptyData(90))
        }
      } catch (err) {
        console.error("Error fetching activity data:", err)
        setError("Failed to load activity data")
      } finally {
        setLoading(false)
      }
    }
    
    fetchActivityData()
  }, [])

  // Generate empty data for the past n days
  const generateEmptyData = (days: number): ActivityData[] => {
    const today = new Date()
    const startDate = subDays(today, days)
    
    const dateRange = eachDayOfInterval({ start: startDate, end: today })
    
    return dateRange.map(date => ({
      date: format(date, "yyyy-MM-dd"),
      count: 0
    }))
  }

  // Helper function to determine cell color based on activity count
  const getCellColor = (count: number) => {
    if (count === 0) return "bg-neutral-100 dark:bg-neutral-800"
    if (count <= 1) return "bg-green-200 dark:bg-green-900"
    if (count <= 3) return "bg-green-300 dark:bg-green-700"
    if (count <= 5) return "bg-green-400 dark:bg-green-600"
    return "bg-green-500 dark:bg-green-500"
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Activity Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Activity Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 text-center h-64 flex items-center justify-center">{error}</div>
        </CardContent>
      </Card>
    )
  }

  // Group data by week and day
  const weeks: ActivityData[][] = []
  let currentWeek: ActivityData[] = []
  
  // Helper function to get the day of the week (0 = Sunday, 6 = Saturday)
  const getDayOfWeek = (dateString: string) => parseISO(dateString).getDay()
  
  // Fill in days before the first day
  const firstDate = data[0]?.date
  if (firstDate) {
    const firstDay = getDayOfWeek(firstDate)
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push({ date: "", count: -1 }) // -1 indicates an empty cell
    }
  }
  
  // Process all actual data
  data.forEach(day => {
    const dayOfWeek = getDayOfWeek(day.date)
    
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push([...currentWeek])
      currentWeek = []
    }
    
    currentWeek.push(day)
    
    // If it's the last day in the data, push the current week
    if (day === data[data.length - 1]) {
      // Fill remaining days in the week
      const remainingDays = 6 - dayOfWeek
      for (let i = 0; i < remainingDays; i++) {
        currentWeek.push({ date: "", count: -1 })
      }
      weeks.push([...currentWeek])
    }
  })

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Activity Heatmap</span>
          <div className="text-sm font-normal space-x-4">
            <span>Current streak: <span className="font-bold">{currentStreak} days</span></span>
            <span>Longest streak: <span className="font-bold">{longestStreak} days</span></span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          <div className="text-xs text-muted-foreground mb-1 grid grid-cols-7 gap-1">
            <div className="text-center">Sun</div>
            <div className="text-center">Mon</div>
            <div className="text-center">Tue</div>
            <div className="text-center">Wed</div>
            <div className="text-center">Thu</div>
            <div className="text-center">Fri</div>
            <div className="text-center">Sat</div>
          </div>
          
          <div className="grid gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`h-4 rounded ${day.count < 0 ? 'bg-transparent' : getCellColor(day.count)}`}
                    title={day.date ? `${format(parseISO(day.date), "MMM d, yyyy")}: ${day.count} problems` : ""}
                  />
                ))}
              </div>
            ))}
          </div>
          
          <div className="flex justify-end items-center mt-4">
            <div className="text-xs text-muted-foreground mr-2">Less</div>
            <div className="flex gap-1">
              <div className="h-3 w-3 rounded bg-neutral-100 dark:bg-neutral-800" />
              <div className="h-3 w-3 rounded bg-green-200 dark:bg-green-900" />
              <div className="h-3 w-3 rounded bg-green-300 dark:bg-green-700" />
              <div className="h-3 w-3 rounded bg-green-400 dark:bg-green-600" />
              <div className="h-3 w-3 rounded bg-green-500 dark:bg-green-500" />
            </div>
            <div className="text-xs text-muted-foreground ml-2">More</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 
 
 
 