"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface ActivityData {
  day: string
  count: number
}

export default function WeeklyActivityChart() {
  const [data, setData] = useState<ActivityData[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchWeeklyActivity() {
      try {
        setLoading(true)
        const response = await fetch("/api/user/analytics")
        
        if (!response.ok) {
          throw new Error("Failed to fetch weekly activity")
        }
        
        const analyticsData = await response.json()
        
        if (analyticsData.weeklyActivity && analyticsData.weeklyActivity.length > 0) {
          // Format the data for the chart
          setData(analyticsData.weeklyActivity.map((item: { day: string; count: number }) => ({
            day: formatDayLabel(item.day),
            count: item.count
          })))
        } else {
          // Create empty data for the past 7 days
          const emptyData = generateEmptyWeekData()
          setData(emptyData)
        }
      } catch (err) {
        console.error("Error fetching weekly activity:", err)
        setError("Failed to load weekly activity")
      } finally {
        setLoading(false)
      }
    }
    
    fetchWeeklyActivity()
  }, [])

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
    const data: ActivityData[] = []
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
    
    for (let i = 6; i >= 0; i--) {
      const dayIndex = (dayOfWeek - i + 7) % 7
      data.push({
        day: days[dayIndex],
        count: 0
      })
    }
    
    return data
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

  if (data.length === 0 || data.every(item => item.count === 0)) {
    return (
      <div className="text-muted-foreground text-center h-full flex flex-col items-center justify-center">
        <div>
          <p className="font-medium">No activity data yet</p>
          <p className="text-sm mt-2">Solve some problems to see your activity!</p>
        </div>
        <button 
          onClick={async () => {
            try {
              setLoading(true);
              // Add a sample problem for today
              await fetch("/api/problems", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  title: "Sample Problem",
                  platform: "LeetCode",
                  difficulty: "Easy",
                  status: "Solved",
                  url: "https://leetcode.com/problems/sample",
                  description: "This is a sample problem for testing the activity chart.",
                  notes: "Added for testing purposes",
                  tags: [{ name: "Array", color: "#3b82f6" }]
                }),
              });
              
              // Refresh the data
              const response = await fetch("/api/user/analytics");
              const analyticsData = await response.json();
              
              if (analyticsData.weeklyActivity && analyticsData.weeklyActivity.length > 0) {
                setData(analyticsData.weeklyActivity.map((item: { day: string; count: number }) => ({
                  day: formatDayLabel(item.day),
                  count: item.count
                })));
              }
            } catch (err) {
              console.error("Error adding sample problem:", err);
            } finally {
              setLoading(false);
            }
          }}
          className="mt-4 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Add Sample Problem
        </button>
      </div>
    )
  }

  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" />
          <YAxis allowDecimals={false} />
          <Tooltip 
            formatter={(value: number) => [`${value} problems`, 'Problems Solved']}
            labelFormatter={(label: string) => `${label}`}
          />
          <Bar 
            dataKey="count" 
            name="Problems Solved" 
            fill="#3b82f6" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
} 
 
 
 