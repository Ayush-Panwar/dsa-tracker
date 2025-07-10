"use client"

import { useEffect, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

// Define the difficulty colors
const DIFFICULTY_COLORS = {
  Easy: "#4ade80",   // green
  Medium: "#facc15", // yellow
  Hard: "#f87171",   // red
}

interface DifficultyData {
  difficulty: string
  count: number
}

interface DifficultyItem {
  difficulty: string
  _count: {
    id: number
  }
}

export default function DifficultyDistribution() {
  const [data, setData] = useState<DifficultyData[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDifficultyDistribution() {
      try {
        setLoading(true)
        const response = await fetch("/api/user/analytics")
        
        if (!response.ok) {
          throw new Error("Failed to fetch difficulty distribution")
        }
        
        const analyticsData = await response.json()
        
        if (analyticsData.distribution && analyticsData.distribution.problemsByDifficulty) {
          // Transform the data for the pie chart
          const chartData = analyticsData.distribution.problemsByDifficulty.map((item: DifficultyItem) => ({
            difficulty: item.difficulty,
            count: item._count.id
          }))
          
          setData(chartData)
        } else {
          setData([
            { difficulty: "Easy", count: 0 },
            { difficulty: "Medium", count: 0 },
            { difficulty: "Hard", count: 0 }
          ])
        }
      } catch (err) {
        console.error("Error fetching difficulty distribution:", err)
        setError("Failed to load difficulty distribution")
      } finally {
        setLoading(false)
      }
    }
    
    fetchDifficultyDistribution()
  }, [])

  // Calculate total problems
  const totalProblems = data.reduce((sum, item) => sum + item.count, 0)

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

  if (totalProblems === 0) {
    return (
      <div className="text-center h-full flex flex-col items-center justify-center text-muted-foreground">
        <p className="font-medium">No problem data available</p>
        <p className="text-sm mt-2">Start solving problems to see your distribution</p>
      </div>
    )
  }

  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
            nameKey="difficulty"
            label={({ difficulty, count }) => `${difficulty}: ${count}`}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={DIFFICULTY_COLORS[entry.difficulty as keyof typeof DIFFICULTY_COLORS] || "#9ca3af"} 
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number, name: string) => [`${value} problems (${Math.round(value / totalProblems * 100)}%)`, name]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
} 
 
 
 