"use client"

import { useQuery } from "@tanstack/react-query"
import { getAdminStats, getMonthlyGrowth } from "@/lib/api/auth.api"
import { SectionCards } from "@/components/section-cards"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DashboardSkeleton } from "./_components/dashboard-skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"

export default function Page() {
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError
  } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: getAdminStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  const {
    data: growth,
    isLoading: growthLoading,
    error: growthError
  } = useQuery({
    queryKey: ["monthly-growth"],
    queryFn: getMonthlyGrowth,
    staleTime: 1000 * 60 * 5,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  if (statsLoading || growthLoading) {
    return <DashboardSkeleton />
  }

  if (statsError || growthError) {
    return (
      <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load dashboard data. Please try again later.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
      
      {stats && <SectionCards stats={stats} />}
      {growth && <ChartAreaInteractive data={growth} />}
    </div>
  )
}