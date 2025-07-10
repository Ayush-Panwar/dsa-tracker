"use client"

import { useState, useEffect } from "react"
import { format, subDays, eachDayOfInterval } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAnalytics } from "@/contexts/analytics-context"

interface ActivityData {
  date: string
  count: number
}

interface ActivityHeatmapProps {
  className?: string
}

export default function ActivityHeatmap({ className }: ActivityHeatmapProps) {
  const { analyticsData, loading, error } = useAnalytics()
  const [data, setData] = useState<ActivityData[]>([])
  const [currentStreak, setCurrentStreak] = useState<number>(0)
  const [longestStreak, setLongestStreak] = useState<number>(0)

  useEffect(() => {
    if (analyticsData) {
      if (analyticsData.activityData) {
        setData(analyticsData.activityData)
        
        // Get streak data
        if (analyticsData.stats) {
          setCurrentStreak(analyticsData.stats.streak || 0)
          setLongestStreak(analyticsData.stats.longestStreak || 0)
        }
      } else if (!loading && !error) {
        // Generate empty data for the last 90 days
        setData(generateEmptyData(90))
      }
    }
  }, [analyticsData, loading, error])

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

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-[200px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 text-center h-[200px] flex items-center justify-center">
            <div>
              <p className="font-medium">{error}</p>
              <p className="text-sm mt-2">Please try again later</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-sm font-medium text-muted-foreground mb-1">Current Streak</div>
              <div className="text-2xl font-bold">{currentStreak} days</div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-sm font-medium text-muted-foreground mb-1">Longest Streak</div>
              <div className="text-2xl font-bold">{longestStreak} days</div>
            </div>
          </div>
          
          <div className="h-[200px] overflow-hidden">
            {/* Render your heatmap here using the data */}
            <div className="text-center text-muted-foreground py-8">
              {data.length > 0 ? (
                <div className="grid grid-cols-7 gap-1">
                  {data.slice(-49).map((day, i) => (
                    <div 
                      key={i} 
                      className={`aspect-square rounded-sm ${
                        day.count === 0 
                          ? 'bg-muted/30' 
                          : day.count < 3 
                            ? 'bg-green-300/60 dark:bg-green-800/60' 
                            : day.count < 5 
                              ? 'bg-green-400/80 dark:bg-green-700/80' 
                              : 'bg-green-500 dark:bg-green-600'
                      }`}
                      title={`${day.date}: ${day.count} problems`}
                    />
                  ))}
                </div>
              ) : (
                <p>No activity data available</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 
 
 
 