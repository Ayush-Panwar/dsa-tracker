"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAnalytics } from "@/contexts/analytics-context"

interface ProgressStats {
  total: number
  solved: number
  attempted: number
}

export default function ProblemSolvingProgress() {
  const { analyticsData, loading, error } = useAnalytics()
  const [data, setData] = useState<ProgressStats | null>(null)

  useEffect(() => {
    if (analyticsData?.stats) {
      setData({
        total: analyticsData.stats.totalProblems || 0,
        solved: analyticsData.stats.solvedProblems || 0,
        attempted: analyticsData.stats.attemptedProblems || 0
      })
    } else if (!loading && !error) {
      setData({
        total: 0,
        solved: 0,
        attempted: 0
      })
    }
  }, [analyticsData, loading, error])

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

  if (!data) {
    return null
  }

  const solvedPercentage = data.total > 0 ? Math.round((data.solved / data.total) * 100) : 0
  const attemptedPercentage = data.total > 0 ? Math.round((data.attempted / data.total) * 100) : 0
  const remainingPercentage = 100 - solvedPercentage - attemptedPercentage

  return (
    <Card>
      <CardHeader>
        <CardTitle>Problem Solving Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 float-left rounded-l-full" 
              style={{ width: `${solvedPercentage}%` }}
              title={`Solved: ${data.solved} (${solvedPercentage}%)`}
            />
            <div 
              className="h-full bg-yellow-500 float-left" 
              style={{ width: `${attemptedPercentage}%` }}
              title={`Attempted: ${data.attempted} (${attemptedPercentage}%)`}
            />
            <div 
              className="h-full bg-gray-300 dark:bg-gray-600 float-left rounded-r-full" 
              style={{ width: `${remainingPercentage}%` }}
              title={`Remaining: ${data.total - data.solved - data.attempted} (${remainingPercentage}%)`}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Solved</div>
              <div className="text-xl font-bold text-green-500">{data.solved}</div>
              <div className="text-xs text-muted-foreground">{solvedPercentage}%</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Attempted</div>
              <div className="text-xl font-bold text-yellow-500">{data.attempted}</div>
              <div className="text-xs text-muted-foreground">{attemptedPercentage}%</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Total</div>
              <div className="text-xl font-bold">{data.total}</div>
              <div className="text-xs text-muted-foreground">&nbsp;</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 
 
 
 