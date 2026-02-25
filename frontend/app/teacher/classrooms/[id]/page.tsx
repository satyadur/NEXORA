"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getClassroomAnalyticsApi,
  getClassroomStudentsApi,
  getTodayAttendanceApi,
  getAttendanceHistoryApi,
  markAttendanceApi,
} from "@/lib/api/teacher.api";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  Pie,
  PieChart,
  Cell,
  Line,
  LineChart,
  YAxis,
} from "recharts";

import {
  Loader2,
  ArrowLeft,
  Calendar,
  Users,
  BookOpen,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserX,
  BarChart3,
  PieChart as PieChartIcon,
  History,
  Download,
  RefreshCw,
} from "lucide-react";

export default function ClassroomPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const classroomId = id as string;

  const [activeTab, setActiveTab] = useState("overview");
  const [attendanceDialog, setAttendanceDialog] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState<Record<string, "PRESENT" | "ABSENT">>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch classroom analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["classroom-analytics", classroomId],
    queryFn: () => getClassroomAnalyticsApi(classroomId),
  });

  // Fetch students list
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["classroom-students", classroomId],
    queryFn: () => getClassroomStudentsApi(classroomId),
  });

  // Fetch today's attendance
  const { data: todayAttendance, refetch: refetchAttendance } = useQuery({
    queryKey: ["today-attendance", classroomId],
    queryFn: () => getTodayAttendanceApi(classroomId),
  });

  // Fetch attendance history
  const { data: attendanceHistoryList = [], refetch: refetchHistory } = useQuery({
    queryKey: ["attendance-history", classroomId],
    queryFn: () => getAttendanceHistoryApi(classroomId),
  });

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: (data: { attendanceData: { studentId: string; status: "PRESENT" | "ABSENT" }[] }) =>
      markAttendanceApi(classroomId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-attendance", classroomId] });
      queryClient.invalidateQueries({ queryKey: ["attendance-history", classroomId] });
      toast.success("Attendance Marked", {
        description: "Today's attendance has been recorded successfully.",
      });
      setAttendanceDialog(false);
      setAttendanceHistory({});
    },
    onError: (error: any) => {
      toast.error("Failed to Mark Attendance", {
        description: error.response?.data?.message || "Please try again.",
      });
    },
  });

  const handleMarkAttendance = () => {
    const attendanceData = students.map((student) => ({
      studentId: student._id,
      status: attendanceHistory[student._id] || "ABSENT",
    }));
    markAttendanceMutation.mutate({ attendanceData });
  };

  const handleSelectAll = (status: "PRESENT" | "ABSENT") => {
    const newAttendance: Record<string, "PRESENT" | "ABSENT"> = {};
    students.forEach((student) => {
      newAttendance[student._id] = status;
    });
    setAttendanceHistory(newAttendance);
  };

  if (analyticsLoading || studentsLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin size-8 text-primary" />
      </div>
    );
  }

  if (!analytics) return null;

  const { classroom, overview, assignmentAnalytics, distribution, studentPerformance } = analytics;

  const pieData = [
    { label: "Excellent (80-100)", value: distribution.excellent, color: "#22c55e" },
    { label: "Good (60-79)", value: distribution.good, color: "#3b82f6" },
    { label: "Average (40-59)", value: distribution.average, color: "#eab308" },
    { label: "Poor (0-39)", value: distribution.poor, color: "#ef4444" },
  ];

  const attendanceRate = todayAttendance?.attendanceRate || 0;
// Add this function before your component or inside it
const groupAttendanceByDate = (attendanceList: any[]) => {
  const groupedMap = new Map();
  
  attendanceList.forEach(record => {
    // Extract just the date part (YYYY-MM-DD)
    const dateObj = new Date(record.date);
    const dateKey = dateObj.toISOString().split('T')[0]; // Gets YYYY-MM-DD
    
    if (!groupedMap.has(dateKey)) {
      groupedMap.set(dateKey, {
        date: dateKey,
        presentCount: record.presentCount,
        absentCount: record.absentCount,
        totalStudents: record.totalStudents,
        attendanceRate: parseFloat(record.attendanceRate)
      });
    }
  });
  
  // Convert map to array and sort by date
  return Array.from(groupedMap.values())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// Then in your component, use the grouped data
const groupedAttendanceHistory = groupAttendanceByDate(attendanceHistoryList);

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{classroom.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={classroom.status === "ACTIVE" ? "default" : "secondary"}>
                {classroom.status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Classroom Analytics & Attendance
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => {
            refetchAttendance();
            refetchHistory();
          }}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setAttendanceDialog(true)}>
            <Calendar className="mr-2 h-4 w-4" />
            Take Attendance
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Enrolled in class</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalAssignments}</div>
            <p className="text-xs text-muted-foreground">Total published</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.averageScore}</div>
            <Progress value={overview.averageScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate}%</div>
            {todayAttendance ? (
              <p className="text-xs text-muted-foreground">
                {todayAttendance.presentCount} present / {todayAttendance.absentCount} absent
              </p>
            ) : (
              <p className="text-xs text-yellow-600">Not marked yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Assignment Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Assignment Performance</CardTitle>
                <CardDescription>Average score per assignment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ChartContainer
                    config={{
                      averageScore: {
                        label: "Average Score",
                        color: "var(--chart-1)",
                      },
                    }}
                    className="h-full w-full"
                  >
                    <BarChart data={assignmentAnalytics.slice(0, 10)}>
                      <CartesianGrid vertical={false} />
                      <XAxis 
                        dataKey="assignment" 
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => value.substring(0, 10) + "..."}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="averageScore"
                        fill="var(--color-averageScore)"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            {/* Score Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
                <CardDescription>Student performance categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ChartContainer
                    config={{}}
                    className="h-full w-full"
                  >
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {pieData.map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-muted-foreground">{item.label}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Students */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Student Activity</CardTitle>
              <CardDescription>Students with recent submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentPerformance.slice(0, 5).map((student) => (
                  <div key={student.studentId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{student.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {student.submittedAssignments} submissions
                        </p>
                      </div>
                    </div>
                    <Badge variant={student.averageScore > 60 ? "default" : "secondary"}>
                      {student.averageScore}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-6">
          {/* Today's Attendance Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Today's Attendance</CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </CardDescription>
              </div>
              <Button onClick={() => setAttendanceDialog(true)}>
                <Calendar className="mr-2 h-4 w-4" />
                {todayAttendance ? "Update Attendance" : "Mark Attendance"}
              </Button>
            </CardHeader>
            <CardContent>
              {todayAttendance ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <UserCheck className="h-8 w-8 mx-auto text-green-600 mb-2" />
                          <p className="text-2xl font-bold text-green-600">
                            {todayAttendance.presentCount}
                          </p>
                          <p className="text-xs text-muted-foreground">Present</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <UserX className="h-8 w-8 mx-auto text-red-600 mb-2" />
                          <p className="text-2xl font-bold text-red-600">
                            {todayAttendance.absentCount}
                          </p>
                          <p className="text-xs text-muted-foreground">Absent</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                          <p className="text-2xl font-bold text-blue-600">
                            {todayAttendance.totalStudents}
                          </p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <Progress value={todayAttendance.attendanceRate} className="h-2" />
                  <p className="text-sm text-center text-muted-foreground">
                    Attendance Rate: {todayAttendance.attendanceRate}%
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No attendance marked for today</p>
                  <Button variant="link" onClick={() => setAttendanceDialog(true)}>
                    Mark Attendance Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

 {/* Attendance History Chart */}
{groupedAttendanceHistory.length > 0 && (
  <Card>
    <CardHeader>
      <CardTitle>Attendance History</CardTitle>
      <CardDescription>Daily attendance trend (unique days)</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="h-[300px]">
        <ChartContainer
          config={{
            attendanceRate: {
              label: "Attendance Rate",
              color: "var(--chart-2)",
            },
          }}
          className="h-full w-full"
        >
          <LineChart data={groupedAttendanceHistory.slice(-10)}> {/* Show last 10 unique days */}
            <CartesianGrid vertical={false} />
            <XAxis 
              dataKey="date" 
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => {
                if (!value) return "";
                try {
                  const date = new Date(value);
                  // Check if date is valid
                  if (isNaN(date.getTime())) return "";
                  return date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  });
                } catch {
                  return "";
                }
              }}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <ChartTooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Date
                          </span>
                          <span className="font-bold text-xs">
                            {new Date(data.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Attendance
                          </span>
                          <span className="font-bold text-xs">
                            {data.attendanceRate}%
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Present: {data.presentCount} / {data.totalStudents}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="attendanceRate"
              stroke="var(--chart-2)"
              strokeWidth={2}
              dot={{ fill: "var(--chart-2)", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </div>
    </CardContent>
  </Card>
)}

          {/* Recent Attendance Records */}
          {todayAttendance && (
            <Card>
              <CardHeader>
                <CardTitle>Today's Attendance List</CardTitle>
                <CardDescription>All students attendance status</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayAttendance.records.map((record) => (
                      <TableRow key={record.studentId}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>{record.name[0]}</AvatarFallback>
                            </Avatar>
                            {record.name}
                          </div>
                        </TableCell>
                        <TableCell>{record.email}</TableCell>
                        <TableCell>
                          <Badge variant={record.status === "PRESENT" ? "default" : "destructive"}>
                            {record.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>All Assignments</CardTitle>
              <CardDescription>List of assignments with performance</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Average Score</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignmentAnalytics.map((assignment, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{assignment.assignment}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={assignment.averageScore} className="w-[60px]" />
                          <span>{assignment.averageScore}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={assignment.averageScore > 0 ? "default" : "secondary"}>
                          {assignment.averageScore > 0 ? "Attempted" : "No Submissions"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>All Students</CardTitle>
              <CardDescription>Complete list of enrolled students</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Submissions</TableHead>
                    <TableHead>Avg Score</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentPerformance.map((student) => (
                    <TableRow key={student.studentId}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>{student.name[0]}</AvatarFallback>
                          </Avatar>
                          {student.name}
                        </div>
                      </TableCell>
                      <TableCell>{students.find(s => s._id === student.studentId)?.email || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{student.submittedAssignments}</span>
                          <span className="text-muted-foreground">/ {overview.totalAssignments}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.averageScore > 60 ? "default" : "secondary"}>
                          {student.averageScore}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.submittedAssignments > 0 ? "default" : "secondary"}>
                          {student.submittedAssignments > 0 ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Attendance Dialog */}
      <Dialog open={attendanceDialog} onOpenChange={setAttendanceDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mark Attendance</DialogTitle>
            <DialogDescription>
              Mark attendance for {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Quick Actions */}
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleSelectAll("PRESENT")}
              >
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                Mark All Present
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleSelectAll("ABSENT")}
              >
                <XCircle className="mr-2 h-4 w-4 text-red-600" />
                Mark All Absent
              </Button>
            </div>

            {/* Student List */}
            <div className="space-y-2">
              {students.map((student) => (
                <div
                  key={student._id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={student.avatar} />
                      <AvatarFallback>{student.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={attendanceHistory[student._id] === "PRESENT" ? "default" : "outline"}
                      size="sm"
                      className={attendanceHistory[student._id] === "PRESENT" ? "bg-green-600 hover:bg-green-700" : ""}
                      onClick={() => setAttendanceHistory(prev => ({
                        ...prev,
                        [student._id]: "PRESENT"
                      }))}
                    >
                      Present
                    </Button>
                    <Button
                      variant={attendanceHistory[student._id] === "ABSENT" ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => setAttendanceHistory(prev => ({
                        ...prev,
                        [student._id]: "ABSENT"
                      }))}
                    >
                      Absent
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <p className="text-sm text-muted-foreground">
                {Object.values(attendanceHistory).filter(s => s === "PRESENT").length} Present,{' '}
                {Object.values(attendanceHistory).filter(s => s === "ABSENT").length} Absent
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setAttendanceDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleMarkAttendance}
                  disabled={markAttendanceMutation.isPending}
                >
                  {markAttendanceMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Attendance"
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}