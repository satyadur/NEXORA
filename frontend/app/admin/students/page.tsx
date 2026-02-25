// app/admin/students/page.tsx (or your StudentAdminSide component)
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

import {
  getStudentsApi,
  createStudentApi,
  deleteStudentApi,
  getStudentAnalyticsApi,
  Student,
  StudentAnalytics,
} from "@/lib/api/admin.api";

import { DataTable } from "./_components/data-table";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

import {
  MoreHorizontal,
  Trash2,
  BookOpen,
  Plus,
  Users,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  Clock,
  Award,
  RefreshCw,
  Loader2,
  Calendar,
  Mail,
  UserPlus,
  Eye,
  Edit,
} from "lucide-react";

export default function StudentAdminSide() {
  const router = useRouter();
  const queryClient = useQueryClient();

  /* ================= STATE ================= */
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState("students");

  // Form state (only for create)
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");

  /* ================= FETCH STUDENTS ================= */
  const { 
    data: students = [], 
    isLoading: studentsLoading,
    refetch: refetchStudents 
  } = useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: getStudentsApi,
  });

  /* ================= FETCH ANALYTICS ================= */
  const {
    data: analytics,
    isLoading: analyticsLoading,
    refetch: refetchAnalytics,
  } = useQuery<StudentAnalytics>({
    queryKey: ["student-analytics"],
    queryFn: getStudentAnalyticsApi,
  });

  /* ================= MUTATIONS ================= */
  const createMutation = useMutation({
    mutationFn: createStudentApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student-analytics"] });
      toast.success("Student Created", {
        description: "New student has been added successfully.",
      });
      setCreateOpen(false);
      resetCreateForm();
    },
    onError: (error: any) => {
      toast.error("Creation Failed", {
        description: error.response?.data?.message || "Please try again.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStudentApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student-analytics"] });
      toast.success("Student Deleted", {
        description: "Student has been removed from the system.",
      });
      setDeleteOpen(false);
      setSelectedStudent(null);
    },
  });

  /* ================= HANDLERS ================= */
  const resetCreateForm = () => {
    setCreateName("");
    setCreateEmail("");
    setCreatePassword("");
  };

  const handleRefresh = () => {
    refetchStudents();
    refetchAnalytics();
  };

  /* ================= TABLE COLUMNS ================= */
  const columns: ColumnDef<Student>[] = [
    {
      header: "ID",
      cell: ({ row }) => (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
          {row.original.uniqueId}
        </Badge>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary">
              {row.original.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-3 w-3" />
          {row.original.email}
        </div>
      ),
    },
    {
      header: "Status",
      cell: () => (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
          Active
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const student = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/admin/students/${student._id}`)}
              >
                <Eye className="mr-2 size-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/admin/students/${student._id}`)}
              >
                <Edit className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedStudent(student);
                  setDeleteOpen(true);
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (studentsLoading || analyticsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading student data...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
          <p className="text-muted-foreground">
            Manage students and track their academic performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => router.push("/admin/students/create")}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {analytics && (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.overview.totalStudents}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.overview.studentsWithSubmissions} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Submission Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.overview.submissionRate}%</div>
                <Progress value={analytics.overview.submissionRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.overview.overallAverageScore}</div>
                <p className="text-xs text-muted-foreground">out of 100</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attendance</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.attendance.avgAttendanceRate}%</div>
                <p className="text-xs text-muted-foreground">average attendance</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers & Needs Attention */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Top 3 Performers */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Top Performers
                </CardTitle>
                <CardDescription>Students with highest scores</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics.performers.top3.map((student, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Avg: {student.averageScore} • {student.totalSubmissions} subs
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600">
                      {student.averageScore}%
                    </Badge>
                  </div>
                ))}
                {analytics.performers.top3.length === 0 && (
                  <p className="text-sm text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>

            {/* Needs Attention */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-yellow-600" />
                  Needs Attention
                </CardTitle>
                <CardDescription>Students with lowest scores</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics.performers.bottom3.map((student, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Avg: {student.averageScore} • {student.totalSubmissions} subs
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">
                      {student.averageScore}%
                    </Badge>
                  </div>
                ))}
                {analytics.performers.bottom3.length === 0 && (
                  <p className="text-sm text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>

            {/* Pending Submissions */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Pending Work
                </CardTitle>
                <CardDescription>Students with pending assignments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics.pendingWork.studentsWithPending.slice(0, 3).map((student) => (
                  <div key={student._id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {student.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {student.count} pending assignment(s)
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
                      {student.count}
                    </Badge>
                  </div>
                ))}
                {analytics.pendingWork.studentsWithPending.length === 0 && (
                  <p className="text-sm text-muted-foreground">No pending work</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Classroom Distribution & Attendance */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Classroom Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Classroom Distribution</CardTitle>
                <CardDescription>
                  Average {analytics.classroomDistribution.avgStudentsPerClass.toFixed(1)} students per class
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.classroomDistribution.classrooms.slice(0, 5).map((cls, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{cls.name}</span>
                        <span className="text-muted-foreground">{cls.count} students</span>
                      </div>
                      <Progress 
                        value={(cls.count / Math.max(...analytics.classroomDistribution.classrooms.map(c => c.count), 1)) * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Attendance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Best Attendance</CardTitle>
                <CardDescription>Students with highest attendance rate</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics.attendance.topAttendance.map((student, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-green-100 text-green-600">
                        {student.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {student.presentCount}/{student.totalDays} days
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600">
                      {student.attendanceRate}%
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tabs for Students List */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="students">All Students</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="pending">Pending Work</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <DataTable columns={columns} data={students} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <Card>
            <CardContent className="p-0">
              <DataTable 
                columns={columns} 
                data={students.filter(s => 
                  analytics?.performers.top3.some(t => t.name === s.name)
                )} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardContent className="p-0">
              <DataTable 
                columns={columns} 
                data={students.filter(s => 
                  analytics?.pendingWork.studentsWithPending.some(p => p.name === s.name)
                )} 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>
              Create a new student account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                placeholder="e.g., John Doe"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                placeholder="student@example.com"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate({
                name: createName,
                email: createEmail,
                password: createPassword,
              })}
              disabled={!createName || !createEmail || !createPassword || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Student"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedStudent?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!selectedStudent) return;
                deleteMutation.mutate(selectedStudent._id);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Student"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}