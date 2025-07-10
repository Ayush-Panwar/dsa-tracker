"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface ProgressStats {
  total: number
  solved: number
  attempted: number
}

export default function ProblemSolvingProgress() {
  const [data, setData] = useState<ProgressStats | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProgressStats() {
      try {
        setLoading(true)
        const response = await fetch("/api/user/analytics")
        
        if (!response.ok) {
          throw new Error("Failed to fetch progress stats")
        }
        
        const analyticsData = await response.json()
        
        if (analyticsData.stats) {
          setData({
            total: analyticsData.stats.totalProblems || 0,
            solved: analyticsData.stats.solvedProblems || 0,
            attempted: analyticsData.stats.attemptedProblems || 0
          })
        } else {
          setData({
            total: 0,
            solved: 0,
            attempted: 0
          })
        }
      } catch (err) {
        console.error("Error fetching progress stats:", err)
        setError("Failed to load progress statistics")
      } finally {
        setLoading(false)
      }
    }
    
    fetchProgressStats()
  }, [])

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

  if (!data || (data.total === 0 && data.solved === 0 && data.attempted === 0)) {
    return (
      <div className="text-center h-full flex flex-col items-center justify-center text-muted-foreground">
        <p className="font-medium">No problem data available</p>
        <p className="text-sm mt-2">Start tracking problems to see your progress</p>
      </div>
    )
  }

  // Calculate completion percentage
  const completionPercentage = data.total > 0 
    ? Math.round((data.solved / data.total) * 100) 
    : 0

  // Format data for the chart
  const chartData = [
    { name: "Total", value: data.total },
    { name: "Attempted", value: data.attempted },
    { name: "Solved", value: data.solved }
  ]

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-2xl font-bold">{completionPercentage}% Complete</p>
          <p className="text-sm text-muted-foreground">
            {data.solved} of {data.total} problems solved
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">
            Attempted: <span className="font-bold">{data.attempted}</span>
          </p>
          <p className="text-sm font-medium">
            Remaining: <span className="font-bold">{data.total - data.solved}</span>
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" />
            <Tooltip formatter={(value: number) => [`${value} problems`]} />
            <Legend />
            <Bar 
              dataKey="value" 
              name="Problems" 
              fill="#3b82f6" 
              radius={[0, 4, 4, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
} 
 
 
 