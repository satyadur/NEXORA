"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  getTeacherDashboardApi, 
  getTeacherAnalyticsApi,
} from "@/lib/api/teacher.api";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
  Bar,
  BarChart,
} from "recharts";

import {
  Loader2,
  Users,
  BookOpen,
  FileText,
  Clock,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Download,
  RefreshCcw,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  School,
} from "lucide-react";
import { toast } from "sonner";

// ================= TYPES =================

interface DashboardStats {
  classrooms: number;
  assignments: number;
  questions: number;
  totalStudents: number;
  pendingEvaluations: number;
  evaluatedCount: number;
  totalSubmissions: number;
  averageScore: number;
  completionRate: number;
}

interface DashboardPerformance {
  distribution: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  };
  topAssignments: Array<{
    title: string;
    avgScore: number;
    submissions: number;
    maxMarks: number;
  }>;
  topStudents: Array<{
    name: string;
    email: string;
    avgScore: number;
    submissions: number;
    totalScore: number;
  }>;
}

interface DashboardTrends {
  daily: Array<{
    date: string;
    submissions: number;
    evaluated: number;
    assignments: number;
    pending: number;
  }>;
  weekly: {
    thisWeek: number;
    lastWeek: number;
    change: number;
  };
}

interface DashboardSummary {
  expectedSubmissions: number;
  completionRate: number;
  averageScore: number;
  totalMarksAwarded: number;
}

interface DashboardResponse {
  success: boolean;
  data: {
    stats: DashboardStats;
    performance: DashboardPerformance;
    trends: DashboardTrends;
    summary: DashboardSummary;
  };
}

interface TrendPoint {
  date: string;
  submissions: number;
  evaluated: number;
  displayDate: string;
}

interface DistributionData {
  name: string;
  value: number;
  color: string;
}

// ================= CHART CONFIG =================

const chartConfig = {
  submissions: {
    label: "Submissions",
    color: "var(--chart-1)",
  },
  evaluated: {
    label: "Evaluated",
    color: "var(--chart-2)",
  },
  completed: {
    label: "Completed",
    color: "var(--chart-1)",
  },
  pending: {
    label: "Pending",
    color: "var(--chart-4)",
  },
  notSubmitted: {
    label: "Not Submitted",
    color: "var(--chart-3)",
  },
  excellent: {
    label: "Excellent",
    color: "var(--chart-1)",
  },
  good: {
    label: "Good",
    color: "var(--chart-2)",
  },
  average: {
    label: "Average",
    color: "var(--chart-3)",
  },
  poor: {
    label: "Poor",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

const DISTRIBUTION_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
];

// ================= CUSTOM HOOK =================

function useDashboardData(timeRange: string) {
  const { data: dashboardResponse, isLoading: statsLoading, error: statsError, refetch: refetchStats, isFetching: isFetchingStats } = 
    useQuery<DashboardResponse>({
      queryKey: ["teacher-dashboard"],
      queryFn: getTeacherDashboardApi,
      refetchOnMount: "always",
    });

  const { data: analyticsResponse, isLoading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = 
    useQuery<any>({
      queryKey: ["teacher-analytics"],
      queryFn: getTeacherAnalyticsApi,
      refetchOnMount: "always",
    });

  // Extract data from response
  const dashboardData = dashboardResponse?.data;
  const analyticsData = analyticsResponse?.data || analyticsResponse;

  // Generate trend data with stable dependencies
  const trendData = React.useMemo<TrendPoint[]>(() => {
    const trends = dashboardData?.trends;
    
    if (trends?.daily && trends.daily.length > 0) {
      const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      return trends.daily.slice(-days).map((item) => ({
        date: item.date,
        submissions: item.submissions || 0,
        evaluated: item.evaluated || 0,
        displayDate: new Date(item.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
      }));
    }

    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      return {
        date: date.toISOString().split('T')[0],
        submissions: 0,
        evaluated: 0,
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };
    });
  }, [dashboardData?.trends, timeRange]);

  // Distribution data with stable dependencies
  const distributionData = React.useMemo<DistributionData[]>(() => {
    const distribution = dashboardData?.performance?.distribution;
    if (!distribution) return [];

    return [
      { name: "Excellent (80-100%)", value: distribution.excellent || 0, color: DISTRIBUTION_COLORS[0] },
      { name: "Good (60-79%)", value: distribution.good || 0, color: DISTRIBUTION_COLORS[1] },
      { name: "Average (40-59%)", value: distribution.average || 0, color: DISTRIBUTION_COLORS[2] },
      { name: "Poor (0-39%)", value: distribution.poor || 0, color: DISTRIBUTION_COLORS[3] },
    ].filter(item => item.value > 0);
  }, [dashboardData?.performance]);

  return {
    stats: dashboardData?.stats,
    analytics: analyticsData,
    performance: dashboardData?.performance,
    trends: dashboardData?.trends,
    summary: dashboardData?.summary,
    isLoading: statsLoading || analyticsLoading,
    error: statsError || analyticsError,
    isFetching: isFetchingStats,
    refetch: () => {
      refetchStats();
      refetchAnalytics();
    },
    trendData,
    distributionData,
    topAssignments: dashboardData?.performance?.topAssignments || [],
    topStudents: dashboardData?.performance?.topStudents || [],
  };
}

// ================= COMPONENT =================

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [timeRange, setTimeRange] = React.useState("30d");
  const [activeTab, setActiveTab] = React.useState("overview");

  const {
    stats,
    analytics,
    trends,
    summary,
    isLoading,
    error,
    isFetching,
    refetch,
    trendData,
    distributionData,
    topAssignments,
    topStudents,
  } = useDashboardData(timeRange);

  // Safe number formatting
  const safeNumber = (value: unknown): number => {
    if (value === null || value === undefined) return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  // Calculate safe values
  const classrooms = safeNumber(stats?.classrooms);
  const totalStudents = safeNumber(stats?.totalStudents);
  const assignments = safeNumber(stats?.assignments);
  const questions = safeNumber(stats?.questions);
  const pendingEvaluations = safeNumber(stats?.pendingEvaluations);
  const evaluatedCount = safeNumber(stats?.evaluatedCount);
  const totalSubmissions = safeNumber(stats?.totalSubmissions);
  const averageScore = safeNumber(stats?.averageScore);
  const completionRate = safeNumber(stats?.completionRate);
  
  const totalPossible = safeNumber(summary?.expectedSubmissions) || (assignments * totalStudents);
  const hasTrendData = trendData.some(d => d.submissions > 0);

  // Handlers
  const handleRefresh = React.useCallback(() => {
    refetch();
    toast.success("Dashboard refreshed", {
      description: "Latest data has been loaded",
    });
  }, [refetch]);

  const handleExport = React.useCallback(() => {
    if (!stats) return;
    
    const csvContent = [
      ["Metric", "Value"],
      ["Classrooms", classrooms],
      ["Assignments", assignments],
      ["Questions", questions],
      ["Total Students", totalStudents],
      ["Total Submissions", totalSubmissions],
      ["Evaluated", evaluatedCount],
      ["Pending Evaluations", pendingEvaluations],
      ["Average Score", `${averageScore.toFixed(1)}%`],
      ["Completion Rate", `${completionRate.toFixed(1)}%`],
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Dashboard exported successfully");
  }, [stats, classrooms, assignments, questions, totalStudents, totalSubmissions, evaluatedCount, pendingEvaluations, averageScore, completionRate]);

  // Loading State
  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="size-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Failed to Load Dashboard</h2>
            <p className="text-muted-foreground">
              There was an error loading your dashboard. Please try again.
            </p>
            <Button onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Teacher Dashboard
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <GraduationCap className="h-4 w-4" />
            Monitor your teaching analytics and student performance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[130px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isFetching} className="gap-2">
            <RefreshCcw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Classrooms"
          value={classrooms}
          icon={<School className="h-5 w-5 text-blue-600" />}
          bgColor="bg-blue-100 dark:bg-blue-900/20"
          description="Active classrooms"
        />
        <StatCard
          title="Students"
          value={totalStudents}
          icon={<Users className="h-5 w-5 text-green-600" />}
          bgColor="bg-green-100 dark:bg-green-900/20"
          description="Enrolled students"
        />
        <StatCard
          title="Assignments"
          value={assignments}
          icon={<FileText className="h-5 w-5 text-purple-600" />}
          bgColor="bg-purple-100 dark:bg-purple-900/20"
          description={`${questions} questions total`}
        />
        <StatCard
          title="Pending Reviews"
          value={pendingEvaluations}
          icon={<Clock className="h-5 w-5 text-yellow-600" />}
          bgColor="bg-yellow-100 dark:bg-yellow-900/20"
          description={`${evaluatedCount} evaluated`}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SecondaryStatCard
          title="Average Score"
          value={`${averageScore.toFixed(1)}%`}
          badge={averageScore >= 60 ? "Good" : "Needs Improvement"}
          badgeVariant={averageScore >= 60 ? "default" : "destructive"}
          progress={averageScore}
        />
        <SecondaryStatCard
          title="Total Submissions"
          value={totalSubmissions}
          badge="Total"
          badgeVariant="secondary"
          progress={totalPossible > 0 ? (totalSubmissions / totalPossible) * 100 : 0}
          footer={`Out of ${totalPossible} expected`}
        />
        <EvaluatedCard
          evaluatedCount={evaluatedCount}
          totalSubmissions={totalSubmissions}
        />
        <WeeklyTrendCard
          thisWeek={trends?.weekly?.thisWeek || 0}
          lastWeek={trends?.weekly?.lastWeek || 0}
          change={trends?.weekly?.change || 0}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <LineChartIcon className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-2">
            <Users className="h-4 w-4" />
            Top Students
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <ActivityChart
            data={trendData}
            timeRange={timeRange}
            totalSubmissions={totalSubmissions}
            hasData={hasTrendData}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <ScoreDistribution data={distributionData} />
            <TopAssignments assignments={topAssignments} />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <SubmissionStatus
              totalSubmissions={totalSubmissions}
              pendingEvaluations={pendingEvaluations}
              evaluatedCount={evaluatedCount}
              totalPossible={totalPossible}
              totalStudents={totalStudents}
              assignments={assignments}
            />
            <QuickActions />
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <TopStudentsList students={topStudents} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ================= SUB-COMPONENTS =================

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  bgColor: string;
  description: string;
}

function StatCard({ title, value, icon, bgColor, description }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`h-10 w-10 rounded-full ${bgColor} flex items-center justify-center`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

interface SecondaryStatCardProps {
  title: string;
  value: number | string;
  badge: string;
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
  progress: number;
  footer?: string;
}

function SecondaryStatCard({ title, value, badge, badgeVariant, progress, footer }: SecondaryStatCardProps) {
  const safeProgress = isNaN(progress) ? 0 : Math.min(100, Math.max(0, progress));
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between mb-2">
          <div className="text-3xl font-bold">{value}</div>
          <Badge variant={badgeVariant}>{badge}</Badge>
        </div>
        <Progress value={safeProgress} className="h-2" />
        {footer && <p className="text-xs text-muted-foreground mt-2">{footer}</p>}
      </CardContent>
    </Card>
  );
}

interface EvaluatedCardProps {
  evaluatedCount: number;
  totalSubmissions: number;
}

function EvaluatedCard({ evaluatedCount, totalSubmissions }: EvaluatedCardProps) {
  const safeEvaluated = isNaN(evaluatedCount) ? 0 : evaluatedCount;
  const safeTotal = isNaN(totalSubmissions) ? 0 : totalSubmissions;
  const percentage = safeTotal > 0 ? (safeEvaluated / safeTotal) * 100 : 0;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Evaluated</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{safeEvaluated}</div>
        <div className="flex items-center gap-2 mt-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-sm text-muted-foreground">
            {percentage.toFixed(1)}% of submissions
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

interface WeeklyTrendCardProps {
  thisWeek: number;
  lastWeek: number;
  change: number;
}

function WeeklyTrendCard({ thisWeek, lastWeek, change }: WeeklyTrendCardProps) {
  const safeThisWeek = isNaN(thisWeek) ? 0 : thisWeek;
  const safeLastWeek = isNaN(lastWeek) ? 0 : lastWeek;
  const safeChange = isNaN(change) ? 0 : change;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div className="text-3xl font-bold">{safeThisWeek}</div>
          <div className={`flex items-center gap-1 text-sm px-2 py-1 rounded-full ${
            safeChange >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {safeChange >= 0 ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}
            {Math.abs(safeChange).toFixed(1)}%
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          vs last week ({safeLastWeek})
        </p>
      </CardContent>
    </Card>
  );
}

interface ActivityChartProps {
  data: TrendPoint[];
  timeRange: string;
  totalSubmissions: number;
  hasData: boolean;
}

function ActivityChart({ data, timeRange, totalSubmissions, hasData }: ActivityChartProps) {
  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Overview</CardTitle>
          <CardDescription>Submissions over time</CardDescription>
        </CardHeader>
        <CardContent className="py-16 text-center">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <LineChartIcon className="h-16 w-16 mb-4 opacity-20" />
            <h3 className="text-lg font-semibold mb-2">No activity data available</h3>
            <p className="text-sm max-w-md">
              Submissions will appear here once students start submitting.
              You have {totalSubmissions} total submissions.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Activity Overview</CardTitle>
            <CardDescription>
              Submissions over time
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            Last {timeRange}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillSubmissions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-submissions)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-submissions)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="displayDate"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDecimals={false}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              type="monotone"
              dataKey="submissions"
              stroke="var(--color-submissions)"
              fill="url(#fillSubmissions)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex justify-between text-sm border-t pt-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[var(--color-submissions)]" />
          <span>Submissions</span>
        </div>
        <span className="text-muted-foreground">
          Total: {totalSubmissions} submissions
        </span>
      </CardFooter>
    </Card>
  );
}

interface ScoreDistributionProps {
  data: DistributionData[];
}

function ScoreDistribution({ data }: ScoreDistributionProps) {
  const hasData = data.length > 0;

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Score Distribution
          </CardTitle>
          <CardDescription>Breakdown of student performance</CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <PieChartIcon className="h-12 w-12 mb-4 opacity-20" />
            <p>No distribution data available</p>
            <p className="text-sm">Scores will appear once submissions are evaluated</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          Score Distribution
        </CardTitle>
        <CardDescription>
          Breakdown of student performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <ChartTooltip
              content={<ChartTooltipContent indicator="dot" />}
            />
          </PieChart>
        </ChartContainer>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs flex-1">{item.name}</span>
              <span className="text-xs font-bold">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface TopAssignmentsProps {
  assignments: Array<{
    title: string;
    avgScore: number;
    submissions: number;
    maxMarks: number;
  }>;
}

function TopAssignments({ assignments }: TopAssignmentsProps) {
  if (!assignments || assignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Top Assignments
          </CardTitle>
          <CardDescription>Assignments with highest scores</CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Award className="h-12 w-12 mb-4 opacity-20" />
            <p>No assignment data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Top Assignments
        </CardTitle>
        <CardDescription>
          Assignments with highest average scores
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assignments.slice(0, 5).map((assignment, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                #{index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{assignment.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Progress 
                    value={(assignment.avgScore / assignment.maxMarks) * 100} 
                    className="h-1.5 flex-1" 
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {assignment.avgScore.toFixed(1)}/{assignment.maxMarks}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {assignment.submissions} submissions
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface SubmissionStatusProps {
  totalSubmissions: number;
  pendingEvaluations: number;
  evaluatedCount: number;
  totalPossible: number;
  totalStudents: number;
  assignments: number;
}

function SubmissionStatus({ 
  totalSubmissions, 
  pendingEvaluations, 
  evaluatedCount, 
  totalPossible,
  totalStudents,
  assignments 
}: SubmissionStatusProps) {
  const notSubmitted = Math.max(0, totalPossible - totalSubmissions);
  const completionRate = totalPossible > 0 ? (totalSubmissions / totalPossible) * 100 : 0;
  const evaluatedRate = totalSubmissions > 0 ? (evaluatedCount / totalSubmissions) * 100 : 0;

  const chartData = [
    { name: "Evaluated", value: evaluatedCount, color: "var(--chart-1)" },
    { name: "Pending", value: pendingEvaluations, color: "var(--chart-4)" },
    { name: "Not Submitted", value: notSubmitted, color: "var(--chart-3)" },
  ].filter(item => item.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submission Status</CardTitle>
        <CardDescription>Overview of submission progress</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {chartData.length > 0 && (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                width={100}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Completion Rate</span>
              <span className="font-medium">{completionRate.toFixed(1)}%</span>
            </div>
            <Progress 
              value={completionRate} 
              className="h-2 bg-muted [&>div]:bg-[hsl(var(--chart-1))]"
            />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Evaluation Progress</span>
              <span className="font-medium">{evaluatedRate.toFixed(1)}%</span>
            </div>
            <Progress 
              value={evaluatedRate} 
              className="h-2 bg-muted [&>div]:bg-[hsl(var(--chart-2))]"
            />
          </div>
        </div>

        <div className="pt-4 border-t grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Students</p>
            <p className="text-xl font-bold">{totalStudents}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Assignments</p>
            <p className="text-xl font-bold">{assignments}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Expected Submissions</p>
            <p className="text-xl font-bold">{totalPossible}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Actual Submissions</p>
            <p className="text-xl font-bold text-primary">{totalSubmissions}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TopStudentsListProps {
  students: Array<{
    name: string;
    email: string;
    avgScore: number;
    submissions: number;
    totalScore: number;
  }>;
}

function TopStudentsList({ students }: TopStudentsListProps) {
  if (!students || students.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Students</CardTitle>
          <CardDescription>Students with highest average scores</CardDescription>
        </CardHeader>
        <CardContent className="py-16 text-center">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Users className="h-16 w-16 mb-4 opacity-20" />
            <h3 className="text-lg font-semibold mb-2">No student data available</h3>
            <p className="text-sm">Student performance will appear once submissions are evaluated</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performing Students</CardTitle>
        <CardDescription>
          Students with highest average scores
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {students.map((student, index) => (
            <div key={index} className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-muted/30 to-transparent border">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-lg">
                #{index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold truncate">{student.name}</p>
                  <Badge className={
                    student.avgScore >= 80 ? 'bg-green-100 text-green-800 border-green-200' :
                    student.avgScore >= 60 ? 'bg-blue-100 text-blue-800 border-blue-200' :
                    'bg-yellow-100 text-yellow-800 border-yellow-200'
                  }>
                    {student.avgScore.toFixed(1)}% avg
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-muted-foreground">{student.submissions} submissions</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">Total: {student.totalScore} marks</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  const router = useRouter();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Navigate to key sections</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          className="w-full justify-start gap-3 h-12" 
          variant="outline"
          onClick={() => router.push("/teacher/classrooms")}
        >
          <School className="h-5 w-5" />
          <span>Manage Classrooms</span>
        </Button>
        <Button 
          className="w-full justify-start gap-3 h-12" 
          variant="outline"
          onClick={() => router.push("/teacher/assignments")}
        >
          <FileText className="h-5 w-5" />
          <span>View Assignments</span>
        </Button>
        <Button 
          className="w-full justify-start gap-3 h-12" 
          variant="outline"
          onClick={() => router.push("/teacher/submissions")}
        >
          <Eye className="h-5 w-5" />
          <span>Review Submissions</span>
        </Button>
      </CardContent>
    </Card>
  );
}