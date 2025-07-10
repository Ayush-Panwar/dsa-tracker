import { Metadata } from "next"
import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDateRangePicker } from "@/components/dashboard/date-range-picker"
import WeeklyActivityChart from "@/components/dashboard/weekly-activity-chart"
import DifficultyDistribution from "@/components/dashboard/difficulty-distribution"
import DashboardStats from "@/components/dashboard/dashboard-stats"
import { AnalyticsProvider } from "@/contexts/analytics-context"

export const metadata: Metadata = {
  title: "Dashboard | DSA Tracker",
  description: "View your problem-solving progress and analytics.",
}

export default function DashboardPage() {
  return (
    <AnalyticsProvider>
      <div className="flex flex-col gap-6 max-w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <CalendarDateRangePicker />
            <Button asChild>
              <Link href="/problems/new">Add Problem</Link>
            </Button>
          </div>
        </div>

        {/* Dashboard stats cards */}
        <DashboardStats />
        
        {/* Charts section */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
          <Card className="col-span-1 lg:col-span-4 overflow-hidden">
            <CardHeader className="p-4">
              <CardTitle>Weekly Activity</CardTitle>
              <CardDescription>
                Your problem-solving activity for the past week
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 pl-2 pb-4 h-[260px]">
              <WeeklyActivityChart />
            </CardContent>
          </Card>
          <Card className="col-span-1 lg:col-span-3 overflow-hidden">
            <CardHeader className="p-4">
              <CardTitle>Difficulty Distribution</CardTitle>
              <CardDescription>
                Problems by difficulty level
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 pl-2 pb-4 h-[260px]">
              <DifficultyDistribution />
            </CardContent>
          </Card>
        </div>
      </div>
    </AnalyticsProvider>
  )
} 