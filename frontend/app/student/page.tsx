"use client";

import { useQuery } from "@tanstack/react-query";
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
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  Loader2,
  RefreshCcw,
  Trophy,
  ClipboardCheck,
  Activity,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  Target,
  Award,
  Calendar,
  ChevronRight,
  GraduationCap,
  PieChart as PieChartIcon,
  BarChart3,
  LineChart as LineChartIcon,
} from "lucide-react";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Pie,
  PieChart,
  Cell,
  Area,
  AreaChart,
} from "recharts";

import { getStudentDashboardApi } from "@/lib/api/student.api";

/* ================= TYPES ================= */

interface AssignmentPerformance {
  title: string;
  score: number;
  totalMarks: number;
  date: string;
}

interface StudentDashboardData {
  totalAssignments: number;
  completedAssignments: number;
  averageScore: number;
  assignmentPerformance: AssignmentPerformance[];
}

/* ================= CHART CONFIG ================= */

const chartConfig = {
  percentage: {
    label: "Score",
    color: "var(--chart-1)",
  },
  target: {
    label: "Target",
    color: "var(--chart-2)",
  },
  running: {
    label: "Running",
    color: "var(--chart-3)",
  },
  swimming: {
    label: "Swimming",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

/* ================= COMPONENT ================= */

export default function StudentDashboardPage() {
  const { data, isLoading, refetch, isFetching } =
    useQuery<StudentDashboardData>({
      queryKey: ["student-dashboard"],
      queryFn: getStudentDashboardApi,
      refetchOnMount: "always",
    });

  if (isLoading || !data) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin size-12 mx-auto text-primary" />
          <p className="text-muted-foreground animate-pulse">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  /* ================= SAFE DATA ================= */

  const performance = data.assignmentPerformance ?? [];

  const trendData = performance.map((a, index) => ({
    id: `assignment-${index}`,
    name: a.title.length > 20 ? a.title.substring(0, 20) + "..." : a.title,
    fullName: a.title,
    percentage: a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0,
    score: a.score,
    totalMarks: a.totalMarks,
    date: new Date(a.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    fullDate: new Date(a.date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }),
  }));

  const average = data.averageScore ?? 0;

  const completionRate =
    data.totalAssignments > 0
      ? (data.completedAssignments / data.totalAssignments) * 100
      : 0;

  /* ================= PERFORMANCE LEVEL ================= */

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { label: "Excellent", color: "text-green-600", badge: "bg-green-100 text-green-800 dark:bg-green-900/20" };
    if (score >= 75) return { label: "Good", color: "text-blue-600", badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/20" };
    if (score >= 60) return { label: "Satisfactory", color: "text-yellow-600", badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20" };
    if (score >= 40) return { label: "Needs Improvement", color: "text-orange-600", badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/20" };
    return { label: "Critical", color: "text-red-600", badge: "bg-red-100 text-red-800 dark:bg-red-900/20" };
  };

  const performanceInfo = getPerformanceLevel(average);

  const latest = trendData.length > 0 ? trendData[trendData.length - 1] : null;
  const previous = trendData.length > 1 ? trendData[trendData.length - 2] : null;
  const delta = latest && previous ? latest.percentage - previous.percentage : 0;

  // Pie chart data
  const pieData = performance.map((p, index) => ({
    name: p.title,
    value: (p.score / p.totalMarks) * 100,
    fill: COLORS[index % COLORS.length],
  }));

  // Calculate stats
  const pendingAssignments = data.totalAssignments - data.completedAssignments;
  const bestScore = performance.length > 0 
    ? Math.max(...performance.map(p => (p.score / p.totalMarks) * 100))
    : 0;
  const worstScore = performance.length > 0
    ? Math.min(...performance.map(p => (p.score / p.totalMarks) * 100))
    : 0;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* ================= HEADER ================= */}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Performance Dashboard
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <GraduationCap size={16} />
            Track your academic progress and improve strategically
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
            <Calendar size={14} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </span>
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCcw size={16} className={isFetching ? "animate-spin" : ""} />
            {isFetching ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* ================= QUICK STATS ================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Score
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy size={18} className="text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-bold">{average.toFixed(1)}%</div>
              <Badge variant="secondary" className={performanceInfo.badge}>
                {performanceInfo.label}
              </Badge>
            </div>
            <div className="mt-4">
              <Progress value={average} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <ClipboardCheck size={18} className="text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completionRate.toFixed(0)}%</div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {data.completedAssignments}/{data.totalAssignments} completed
              </span>
              {pendingAssignments > 0 && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                  {pendingAssignments} pending
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Best Performance
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Target size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{bestScore.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {performance.length > 0 ? performance[0].title : "No data"}
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recent Trend
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Activity size={18} className="text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            {latest ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold">{delta.toFixed(1)}%</span>
                  <div className={`flex items-center gap-1 ${
                    delta >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {delta >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From previous assignment
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Not enough data
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ================= MAIN CONTENT TABS ================= */}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <LineChartIcon size={16} />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 size={16} />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-2">
            <BookOpen size={16} />
            Assignments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            {/* Area Chart - Takes 4 columns */}
            <Card className="lg:col-span-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Performance Trend</CardTitle>
                    <CardDescription>
                      Your progress over time
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <TrendingUp size={14} />
                    {trendData.length} assignments
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <AreaChart
                    accessibilityLayer
                    data={trendData}
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  >
                    <CartesianGrid vertical={false} className="stroke-muted" />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => value}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      domain={[0, 100]}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          indicator="line"
                          formatter={(value, name, item) => {
                            const data = item.payload;
                            return (
                              <div className="space-y-1">
                                <p className="font-medium">{data.fullName}</p>
                                <p className="text-xs text-muted-foreground">{data.fullDate}</p>
                                <p className="text-sm">
                                  Score: <span className="font-medium">{data.score}/{data.totalMarks}</span>
                                </p>
                                <p className="text-sm">
                                  Percentage: <span className="font-medium text-primary">{value}%</span>
                                </p>
                              </div>
                            );
                          }}
                        />
                      }
                    />
                    <Area
                      dataKey="percentage"
                      type="monotone"
                      stroke="var(--color-percentage)"
                      strokeWidth={2}
                      fill="var(--color-percentage)"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Pie Chart - Takes 3 columns */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <PieChartIcon size={18} className="text-muted-foreground" />
                  <div>
                    <CardTitle>Performance Distribution</CardTitle>
                    <CardDescription>
                      Score breakdown by assignment
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name, item) => (
                            <div className="space-y-1">
                              <p className="font-medium">{item.payload.name}</p>
                              <p className="text-sm text-primary">{value}%</p>
                            </div>
                          )}
                        />
                      }
                    />
                  </PieChart>
                </ChartContainer>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {pieData.slice(0, 4).map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-xs truncate">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Assignments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Assignments</CardTitle>
                  <CardDescription>
                    Your latest performance details
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="gap-1">
                  View all <ChevronRight size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performance.slice(-3).reverse().map((item, index) => {
                  const percentage = (item.score / item.totalMarks) * 100;
                  const level = getPerformanceLevel(percentage);
                  return (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                      <Avatar className="h-10 w-10 bg-primary/10">
                        <AvatarFallback>
                          <BookOpen size={18} className="text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{item.title}</p>
                          <Badge variant="outline" className={level.badge}>
                            {level.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex-1">
                            <Progress value={percentage} className="h-2" />
                          </div>
                          <span className="text-sm font-medium whitespace-nowrap">
                            {item.score}/{item.totalMarks}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Assignment Comparison</CardTitle>
                <CardDescription>
                  Compare scores across assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <BarChart
                    accessibilityLayer
                    data={trendData}
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  >
                    <CartesianGrid vertical={false} className="stroke-muted" />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      domain={[0, 100]}
                    />
                    <ChartTooltip
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                      content={
                        <ChartTooltipContent
                          formatter={(value, name, item) => (
                            <div className="space-y-1">
                              <p className="font-medium">{item.payload.fullName}</p>
                              <p className="text-xs text-muted-foreground">{item.payload.fullDate}</p>
                              <p className="text-sm">
                                Score: <span className="font-medium">{item.payload.score}/{item.payload.totalMarks}</span>
                              </p>
                              <p className="text-sm text-primary">{value}%</p>
                            </div>
                          )}
                        />
                      }
                    />
                    <Bar
                      dataKey="percentage"
                      fill="var(--color-percentage)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
                <CardDescription>
                  Key metrics at a glance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-primary">{performance.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">Total Evaluated</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-green-600">{bestScore.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground mt-1">Highest Score</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-orange-600">{worstScore.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground mt-1">Lowest Score</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-blue-600">
                      {(average / 100 * data.totalAssignments).toFixed(1)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Weighted Score</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Performance Grade</span>
                    <Badge className={performanceInfo.badge}>{performanceInfo.label}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Completion Status</span>
                    <Badge variant={completionRate === 100 ? "default" : "secondary"}>
                      {completionRate === 100 ? "Complete" : "In Progress"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Trend Direction</span>
                    <div className={`flex items-center gap-1 ${
                      delta >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {delta >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      <span className="text-sm font-medium">
                        {delta >= 0 ? 'Improving' : 'Declining'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mini Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Progress Tracking</CardTitle>
              <CardDescription>
                Your improvement journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <LineChart
                  accessibilityLayer
                  data={trendData}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <CartesianGrid vertical={false} className="stroke-muted" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    domain={[0, 100]}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Line
                    type="monotone"
                    dataKey="percentage"
                    stroke="var(--color-percentage)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-percentage)" }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>All Assignments</CardTitle>
              <CardDescription>
                Complete history of your assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {performance.map((item, index) => {
                  const percentage = (item.score / item.totalMarks) * 100;
                  const level = getPerformanceLevel(percentage);
                  return (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <BookOpen size={18} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(item.date).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-medium">{item.score}/{item.totalMarks}</p>
                          <p className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</p>
                        </div>
                        <Badge className={level.badge}>{level.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ================= FOOTER ================= */}
      
      <CardFooter className="justify-center border-t pt-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Award size={16} className="text-primary" />
          Keep up the great work! Consistent effort leads to excellence.
        </div>
      </CardFooter>
    </div>
  );
}