"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface DifficultyStats {
  Easy: number
  Medium: number
  Hard: number
}

interface DifficultyDistributionChartProps {
  initialData?: DifficultyStats
}

// Define the type for the label props
interface LabelProps {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
}

export default function DifficultyDistributionChart({ initialData }: DifficultyDistributionChartProps) {
  const [stats, setStats] = useState<DifficultyStats>(initialData || { Easy: 0, Medium: 0, Hard: 0 })
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (!initialData) {
      fetchDifficultyStats()
    }
  }, [initialData])
  
  async function fetchDifficultyStats() {
    try {
      setLoading(true)
      const res = await fetch('/api/user/stats')
      
      if (!res.ok) {
        throw new Error('Failed to fetch difficulty stats')
      }
      
      const data = await res.json()
      setStats({
        Easy: data.stats.solvedByDifficulty?.Easy || 0,
        Medium: data.stats.solvedByDifficulty?.Medium || 0,
        Hard: data.stats.solvedByDifficulty?.Hard || 0
      })
    } catch (err) {
      console.error('Error fetching difficulty stats:', err)
      setError('Failed to load difficulty distribution data')
    } finally {
      setLoading(false)
    }
  }
  
  // Format data for the chart
  const chartData = [
    { name: 'Easy', value: stats.Easy, color: '#4ade80' },
    { name: 'Medium', value: stats.Medium, color: '#f59e0b' },
    { name: 'Hard', value: stats.Hard, color: '#ef4444' }
  ].filter(item => item.value > 0)
  
  const RADIAN = Math.PI / 180
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: LabelProps) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    
    return percent > 0.05 ? (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null
  }
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Difficulty Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-[300px]">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Difficulty Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px]">
            <p className="text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  const totalSolved = stats.Easy + stats.Medium + stats.Hard
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Difficulty Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {totalSolved === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px]">
            <p className="text-muted-foreground">No problems solved yet</p>
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value} problems`, 'Solved']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 
 
 
 