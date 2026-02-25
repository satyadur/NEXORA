"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  TrendingUp,
  RefreshCcw,
  Users,
  BookOpen,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUp,
  ArrowDown,
  Loader2,
  Download,
  Printer,
  AlertTriangle,
  Lightbulb,
  Target,
  Zap,
  Brain,
  Sparkles,
  TrendingDown,
  BarChart3,
  GraduationCap,
  UserMinus,
  UserPlus,
  Mail,
  Phone,
  MessageSquare,
  Bell,
  Calendar,
  Rocket,
  Flame,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
} from "recharts";

import { getTeacherAnalyticsApi } from "@/lib/api/teacher.api";

const COLORS = {
  chart1: "var(--chart-1)",
  chart2: "var(--chart-2)",
  chart3: "var(--chart-3)",
  chart4: "var(--chart-4)",
  chart5: "var(--chart-5)",
  success: "#22c55e",
  info: "#3b82f6",
  warning: "#eab308",
  danger: "#ef4444",
  purple: "#a855f7",
  orange: "#f97316",
};

export default function StudentIntelligenceDashboard() {
  const [timeRange, setTimeRange] = useState<"7" | "30">("30");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showContactDialog, setShowContactDialog] = useState(false);

  const {
    data,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["teacher-analytics"],
    queryFn: getTeacherAnalyticsApi,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Brain className="h-12 w-12 animate-pulse text-primary" />
        <p className="text-muted-foreground">Analyzing student intelligence...</p>
      </div>
    );
  }

  if (!data?.success || !data.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <XCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Failed to load student data</p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  const { stats, performance, trends, summary } = data.data;

  // Prepare chart data for distribution
  const distributionData = [
    { name: "Excellent (80+)", value: performance.distribution.excellent, color: COLORS.success },
    { name: "Good (60-79)", value: performance.distribution.good, color: COLORS.info },
    { name: "Average (40-59)", value: performance.distribution.average, color: COLORS.warning },
    { name: "Poor (0-39)", value: performance.distribution.poor, color: COLORS.danger },
  ];

  // Prepare overview data
  const overviewData = [
    { name: "Assignments", value: stats.assignments, fill: COLORS.chart1 },
    { name: "Questions", value: stats.questions, fill: COLORS.chart2 },
    { name: "Submissions", value: stats.totalSubmissions, fill: COLORS.chart3 },
    { name: "Students", value: stats.totalStudents, fill: COLORS.chart4 },
  ];

  // Custom Progress component
  const CustomProgress = ({ value, color = "bg-primary" }: { value: number; color?: string }) => (
    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
      <div 
        className={`h-full transition-all ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );

  // Define Trophy icon (using Sparkles as fallback)
  const Trophy = (props: any) => <Sparkles {...props} />;

  // Generate AI-like insights based on real data
  const generateInsights = () => {
    const insights = [];
    
    // At-risk students insight
    if (performance.distribution.poor > 0) {
      insights.push({
        type: "warning",
        icon: AlertTriangle,
        title: `${performance.distribution.poor} Students Need Immediate Attention`,
        description: "These students are scoring below 40%. Early intervention recommended.",
        action: "View At-Risk Students",
        color: "text-red-600",
        bgColor: "bg-red-50",
      });
    }

    // Completion rate insight
    if (stats.completionRate < 50) {
      insights.push({
        type: "warning",
        icon: TrendingDown,
        title: "Low Submission Rate Detected",
        description: `Only ${stats.completionRate}% of expected submissions received. Consider sending reminders.`,
        action: "Send Reminders",
        color: "text-orange-600",
        bgColor: "bg-orange-50",
      });
    }

    // Top performer insight
    if (performance.topStudents.length > 0) {
      insights.push({
        type: "success",
        icon: Zap,
        title: `${performance.topStudents[0].name} is Your Top Performer`,
        description: `Average score of ${performance.topStudents[0].avgScore.toFixed(1)}% across ${performance.topStudents[0].submissions} submissions.`,
        action: "Celebrate Success",
        color: "text-green-600",
        bgColor: "bg-green-50",
      });
    }

    // Pending evaluations insight
    if (stats.pendingEvaluations > 0) {
      insights.push({
        type: "info",
        icon: Clock,
        title: `${stats.pendingEvaluations} Submissions Pending Evaluation`,
        description: "Timely feedback improves student performance by 40%.",
        action: "Review Now",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      });
    }

    // Engagement insight
    if (stats.totalStudents > 0 && stats.totalSubmissions === 0) {
      insights.push({
        type: "warning",
        icon: UserMinus,
        title: "Zero Engagement Detected",
        description: "No submissions from any student yet. Time to boost engagement!",
        action: "Engagement Strategies",
        color: "text-red-600",
        bgColor: "bg-red-50",
      });
    }

    return insights;
  };

  // Generate daily actionable recommendations
  const generateRecommendations = () => {
    const recommendations = [];
    
    // Personalized recommendations based on data patterns
    if (performance.distribution.poor > 0) {
      recommendations.push({
        icon: Lightbulb,
        title: "Schedule Remedial Sessions",
        description: `Organize extra classes for ${performance.distribution.poor} struggling students. Focus on fundamental concepts.`,
        impact: "High Impact",
        difficulty: "Medium",
      });
    }

    if (stats.pendingEvaluations > 0) {
      recommendations.push({
        icon: Rocket,
        title: "Quick Feedback Loop",
        description: "Grade pending submissions within 24 hours to maintain student motivation.",
        impact: "High Impact",
        difficulty: "Easy",
      });
    }

    if (stats.completionRate < 70) {
      recommendations.push({
        icon: Bell,
        title: "Automated Reminder Campaign",
        description: "Set up automated reminders for upcoming deadlines. Students respond well to gentle nudges.",
        impact: "Medium Impact",
        difficulty: "Easy",
      });
    }

    // Peer learning recommendation
    if (performance.topStudents.length > 0 && performance.distribution.poor > 0) {
      recommendations.push({
        icon: Users,
        title: "Peer Learning Program",
        description: `Pair ${performance.topStudents[0].name} with struggling students for peer tutoring.`,
        impact: "High Impact",
        difficulty: "Medium",
      });
    }

    // Gamification recommendation
    if (stats.totalSubmissions > 0) {
      recommendations.push({
        icon: Trophy,
        title: "Gamify the Learning",
        description: "Introduce leaderboards and achievement badges to boost engagement.",
        impact: "Medium Impact",
        difficulty: "Hard",
      });
    }

    return recommendations;
  };

  const insights = generateInsights();
  const recommendations = generateRecommendations();

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Student Intelligence Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            AI-powered insights to identify at-risk students and improve learning outcomes
          </p>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
                  <RefreshCcw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh intelligence</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Live Intelligence Feed */}
      {insights.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Live Intelligence Feed
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {insights.map((insight, index) => (
              <Card key={index} className={`border-l-4 ${insight.bgColor}`} style={{ borderLeftColor: insight.color.replace('text-', '') }}>
                <CardContent className="p-4 flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className={`p-2 rounded-full ${insight.bgColor}`}>
                      <insight.icon className={`h-5 w-5 ${insight.color}`} />
                    </div>
                    <div>
                      <h3 className="font-medium">{insight.title}</h3>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0">
                    {insight.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Key Risk Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At-Risk Students</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{performance.distribution.poor}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((performance.distribution.poor / stats.totalStudents) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Performers</CardTitle>
            <Zap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{performance.distribution.excellent}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Scoring 80% or above
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Interventions</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingEvaluations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Need immediate feedback
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
            <Flame className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.completionRate}%</div>
            <CustomProgress value={stats.completionRate} color="bg-blue-500" />
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="at-risk" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="at-risk">At-Risk Students</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        {/* At-Risk Students Tab */}
        <TabsContent value="at-risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Students Needing Immediate Attention
              </CardTitle>
              <CardDescription>
                These students are showing signs of struggle. Early intervention is critical.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {performance.atRiskStudents && performance.atRiskStudents.length > 0 ? (
                <div className="space-y-4">
                  {performance.atRiskStudents.map((student, index) => (
                    <Card key={student._id} className="border-red-200 bg-red-50/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-red-300">
                              <AvatarFallback className="bg-red-100 text-red-700">
                                {student.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{student.name}</h3>
                              <p className="text-xs text-muted-foreground">{student.email}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="destructive" className="text-xs">
                                  Risk: High
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  Avg: {student.avgScore?.toFixed(1)}%
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {student.riskReason}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedStudent(student);
                                setShowContactDialog(true);
                              }}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Contact
                            </Button>
                            <Button size="sm" variant="default">
                              <Target className="h-4 w-4 mr-2" />
                              Action Plan
                            </Button>
                          </div>
                        </div>
                        
                        {/* Intervention Plan */}
                        <div className="mt-4 p-3 bg-white rounded-lg border">
                          <h4 className="text-sm font-medium mb-2">Recommended Intervention:</h4>
                          <div className="grid gap-2 md:grid-cols-3">
                            <div className="flex items-center gap-2 text-xs">
                              <div className="h-2 w-2 rounded-full bg-red-500" />
                              <span>One-on-one tutoring</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <div className="h-2 w-2 rounded-full bg-yellow-500" />
                              <span>Extra practice materials</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <div className="h-2 w-2 rounded-full bg-blue-500" />
                              <span>Weekly progress check</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium">No at-risk students!</p>
                  <p className="text-sm text-muted-foreground">All students are performing well.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Intervention Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Intervention Tools</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
                <Mail className="h-5 w-5" />
                <span>Send Bulk Email</span>
                <span className="text-xs text-muted-foreground">To at-risk students</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
                <Calendar className="h-5 w-5" />
                <span>Schedule Extra Class</span>
                <span className="text-xs text-muted-foreground">Remedial session</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
                <BookOpen className="h-5 w-5" />
                <span>Create Practice Set</span>
                <span className="text-xs text-muted-foreground">Targeted exercises</span>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                AI-Powered Recommendations
              </CardTitle>
              <CardDescription>
                Daily actionable insights to improve student performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.length > 0 ? (
                  recommendations.map((rec, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <rec.icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-medium">{rec.title}</h3>
                              <div className="flex gap-2">
                                <Badge variant="outline" className="bg-green-50">
                                  Impact: {rec.impact}
                                </Badge>
                                <Badge variant="outline" className="bg-blue-50">
                                  {rec.difficulty}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{rec.description}</p>
                            <Button variant="link" className="px-0 mt-2 h-auto text-sm">
                              Implement Strategy →
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recommendations available at this time.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Success Stories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Success Stories</CardTitle>
              <CardDescription>Students who improved with intervention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No success stories yet. Implement recommendations to see results!</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Trends</CardTitle>
                <CardDescription>Weekly submission patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends.daily.slice(-7)}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { weekday: 'short' })} />
                      <YAxis />
                      <RechartsTooltip />
                      <Area type="monotone" dataKey="submissions" stroke={COLORS.chart1} fill={COLORS.chart1} fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Distribution</CardTitle>
                <CardDescription>Student performance breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
                <CardDescription>Breakdown of student performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {distributionData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-muted-foreground">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Overview</CardTitle>
                <CardDescription>Your teaching content metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={overviewData}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <RechartsTooltip />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {overviewData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Contact Student Dialog */}
      <AlertDialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Contact {selectedStudent?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              Choose a method to reach out to this student
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-3 py-4">
            <Button variant="outline" className="justify-start">
              <Mail className="h-4 w-4 mr-2" />
              Send Email to {selectedStudent?.email}
            </Button>
            <Button variant="outline" className="justify-start">
              <MessageSquare className="h-4 w-4 mr-2" />
              Send In-App Message
            </Button>
            <Button variant="outline" className="justify-start">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Meeting
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}