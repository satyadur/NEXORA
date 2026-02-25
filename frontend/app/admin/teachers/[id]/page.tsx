// app/admin/teachers/[id]/page.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";

import { getTeacherDetailsApi } from "@/lib/api/admin.api";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  ArrowLeft,
  Mail,
  BookOpen,
  Users,
  Calendar,
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Download,
  Printer,
  ChevronRight,
  FileText,
  BarChart3,
  Activity,
  Phone,
  MapPin,
  Briefcase,
  IndianRupee,
  CreditCard,
  Award,
  Star,
  BookMarked,
  FileCheck,
  Map,
  MapPin as MapPinIcon,
} from "lucide-react";

export default function TeacherDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params.id as string;

  const [activeTab, setActiveTab] = useState("overview");

  const {
    data: teacherData,
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useQuery({
    queryKey: ["teacher-details", teacherId],
    queryFn: () => getTeacherDetailsApi(teacherId),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading teacher details...</p>
      </div>
    );
  }

  if (error || !teacherData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Failed to load teacher details</p>
        <p className="text-sm text-muted-foreground">
          The teacher might not exist or you don't have permission to view.
        </p>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  const { teacher, classrooms, assignments, documents, payslips, stats, attendance } = teacherData;

  // Safely access employeeRecord data
  const employeeRecord = teacher.employeeRecord || {};
  const salary = employeeRecord.salary || {};

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PRESENT":
        return <Badge className="bg-green-500">Present</Badge>;
      case "LATE":
        return <Badge className="bg-yellow-500">Late</Badge>;
      case "ABSENT":
        return <Badge className="bg-red-500">Absent</Badge>;
      case "HALF_DAY":
        return <Badge className="bg-orange-500">Half Day</Badge>;
      case "ON_LEAVE":
        return <Badge className="bg-blue-500">On Leave</Badge>;
      case "HOLIDAY":
        return <Badge className="bg-purple-500">Holiday</Badge>;
      case "NO_RECORD":
        return <Badge variant="outline">No Record</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Teachers</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground font-medium">{teacher.name}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-1">Teacher Profile</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => refetch()}
                  disabled={isRefetching}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh data</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button variant="outline" size="icon">
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
          <Button onClick={() => router.push(`/admin/teachers/${teacherId}/edit`)}>
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Teacher Profile Card */}
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5" />
        <CardContent className="pt-0 px-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-6 -mt-16">
            <Avatar className="h-32 w-32 border-4 border-background">
              <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                {teacher.name?.charAt(0) || "T"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold">{teacher.name}</h2>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <Badge variant="outline" className="px-3 py-1">
                      <Mail className="h-3 w-3 mr-1" />
                      {teacher.email}
                    </Badge>
                    {teacher.phone && (
                      <Badge variant="outline" className="px-3 py-1">
                        <Phone className="h-3 w-3 mr-1" />
                        {teacher.phone}
                      </Badge>
                    )}
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      <GraduationCap className="h-3 w-3 mr-1" />
                      Teacher
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge className="bg-green-500">Active</Badge>
                  <Badge variant="outline">ID: {employeeRecord.employeeId || "N/A"}</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        {/* Quick Stats */}
        <div className="border-t bg-muted/50">
          <div className="grid grid-cols-2 md:grid-cols-6 divide-x divide-border">
            <div className="p-4 text-center">
              <p className="text-2xl font-bold">{stats?.totalClassrooms || 0}</p>
              <p className="text-xs text-muted-foreground">Classrooms</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold">
                {classrooms?.filter((c) => c.status === "ACTIVE").length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold">{stats?.totalStudents || 0}</p>
              <p className="text-xs text-muted-foreground">Students</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold">{stats?.totalAssignments || 0}</p>
              <p className="text-xs text-muted-foreground">Assignments</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold">{stats?.totalDocuments || 0}</p>
              <p className="text-xs text-muted-foreground">Documents</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold">{attendance?.summary?.totalDays || 0}</p>
              <p className="text-xs text-muted-foreground">Attendance</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="classrooms">Classrooms</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Employment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department</span>
                  <span className="font-medium">{employeeRecord.department || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Designation</span>
                  <span className="font-medium">{employeeRecord.designation || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Joining Date</span>
                  <span className="font-medium">
                    {employeeRecord.joiningDate ? format(new Date(employeeRecord.joiningDate), "PPP") : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contract Type</span>
                  <Badge variant="outline">{employeeRecord.contractType || "PERMANENT"}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <IndianRupee className="h-4 w-4" />
                  Salary Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Basic Salary</span>
                  <span className="font-medium">₹{salary.basic?.toLocaleString() || "0"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">HRA</span>
                  <span className="font-medium">₹{salary.hra?.toLocaleString() || "0"}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Net Salary</span>
                  <span className="text-primary">₹{salary.netSalary?.toLocaleString() || "0"}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Attendance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{stats?.attendance?.present || 0}</p>
                    <p className="text-xs text-muted-foreground">Present</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">{stats?.attendance?.late || 0}</p>
                    <p className="text-xs text-muted-foreground">Late</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{stats?.attendance?.absent || 0}</p>
                    <p className="text-xs text-muted-foreground">Absent</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{stats?.attendance?.onLeave || 0}</p>
                    <p className="text-xs text-muted-foreground">On Leave</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Attendance Rate</span>
                  <span className="text-lg font-bold text-primary">{stats?.attendance?.attendanceRate || "0"}%</span>
                </div>
                <Progress value={parseFloat(stats?.attendance?.attendanceRate || "0")} className="h-2 mt-2" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Personal Info Tab */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{teacher.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{teacher.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{teacher.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">
                    {teacher.dateOfBirth ? format(new Date(teacher.dateOfBirth), "PPP") : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium">{teacher.gender || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Blood Group</p>
                  <p className="font-medium">{teacher.bloodGroup || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aadhar Number</p>
                  <p className="font-medium">{teacher.aadharNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">PAN Number</p>
                  <p className="font-medium">{teacher.panNumber || "N/A"}</p>
                </div>
              </div>

              <Separator className="my-6" />

              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </h3>
                <p className="text-muted-foreground">
                  {teacher.address ? (
                    <>
                      {teacher.address.street && <>{teacher.address.street},<br /></>}
                      {teacher.address.city && <>{teacher.address.city}, </>}
                      {teacher.address.state && <>{teacher.address.state} - </>}
                      {teacher.address.pincode && <>{teacher.address.pincode}</>}
                      {teacher.address.country && <><br />{teacher.address.country}</>}
                    </>
                  ) : (
                    "No address provided"
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employment Tab */}
        <TabsContent value="employment">
          <Card>
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Employee ID</p>
                  <p className="font-medium">{employeeRecord.employeeId || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{employeeRecord.department || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Designation</p>
                  <p className="font-medium">{employeeRecord.designation || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Joining Date</p>
                  <p className="font-medium">
                    {employeeRecord.joiningDate ? format(new Date(employeeRecord.joiningDate), "PPP") : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contract Type</p>
                  <Badge variant="outline">{employeeRecord.contractType || "PERMANENT"}</Badge>
                </div>
              </div>

              <Separator className="my-6" />

              <div>
                <h3 className="font-semibold mb-4">Leave Balance</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{employeeRecord.leaves?.total || 0}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">{employeeRecord.leaves?.taken || 0}</p>
                    <p className="text-xs text-muted-foreground">Taken</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{employeeRecord.leaves?.remaining || 0}</p>
                    <p className="text-xs text-muted-foreground">Remaining</p>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div>
                <h3 className="font-semibold mb-4">Education</h3>
                {teacher.education && teacher.education.length > 0 ? (
                  <div className="space-y-4">
                    {teacher.education.map((edu, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Degree</p>
                              <p className="font-medium">{edu.degree}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Specialization</p>
                              <p className="font-medium">{edu.specialization}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">University</p>
                              <p className="font-medium">{edu.university}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Year</p>
                              <p className="font-medium">{edu.yearOfPassing}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No education details added</p>
                )}
              </div>

              <Separator className="my-6" />

              <div>
                <h3 className="font-semibold mb-4">Work Experience</h3>
                {teacher.experience && teacher.experience.length > 0 ? (
                  <div className="space-y-4">
                    {teacher.experience.map((exp, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{exp.position}</p>
                              <p className="text-sm text-muted-foreground">{exp.company}</p>
                              <p className="text-xs text-muted-foreground mt-1">{exp.duration}</p>
                            </div>
                            {exp.isCurrent && (
                              <Badge className="bg-green-500">Current</Badge>
                            )}
                          </div>
                          {exp.description && (
                            <p className="text-sm text-muted-foreground mt-2">{exp.description}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No work experience added</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          {/* Today's Status Card */}
          {attendance?.summary?.today && (
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="text-lg">Today's Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {getStatusBadge(attendance.summary.today.status)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Check In</p>
                    <p className="font-medium">
                      {attendance.summary.today.actualCheckIn 
                        ? format(new Date(attendance.summary.today.actualCheckIn.startTime), "hh:mm a")
                        : "Not checked in"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Check Out</p>
                    <p className="font-medium">
                      {attendance.summary.today.actualCheckOut
                        ? format(new Date(attendance.summary.today.actualCheckOut.startTime), "hh:mm a")
                        : "Not checked out"}
                    </p>
                  </div>
                </div>
                {attendance.summary.today.actualCheckIn?.address && (
                  <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPinIcon className="h-4 w-4 mt-0.5" />
                    <span>{attendance.summary.today.actualCheckIn.address.formattedAddress}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Attendance Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Attendance Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats?.attendance?.attendanceRate || "0"}%</div>
                <Progress value={parseFloat(stats?.attendance?.attendanceRate || "0")} className="h-2 mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Work Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.attendance?.avgWorkHours || "0"} hrs</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm">Present</span>
                    <p className="text-xl font-bold text-green-600">{stats?.attendance?.monthly?.present || 0}</p>
                  </div>
                  <div>
                    <span className="text-sm">Late</span>
                    <p className="text-xl font-bold text-yellow-600">{stats?.attendance?.monthly?.late || 0}</p>
                  </div>
                  <div>
                    <span className="text-sm">Absent</span>
                    <p className="text-xl font-bold text-red-600">{stats?.attendance?.monthly?.absent || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  This Year
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm">Present</span>
                    <p className="text-xl font-bold text-green-600">{stats?.attendance?.yearly?.present || 0}</p>
                  </div>
                  <div>
                    <span className="text-sm">Absent</span>
                    <p className="text-xl font-bold text-red-600">{stats?.attendance?.yearly?.absent || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Attendance Trend</CardTitle>
              <CardDescription>Last 30 days attendance record</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-10 gap-2">
                {attendance?.monthTrend?.map((day, index) => (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={`h-12 rounded-lg cursor-pointer ${
                          day.status === "PRESENT" ? "bg-green-500" :
                          day.status === "LATE" ? "bg-yellow-500" :
                          day.status === "ABSENT" ? "bg-red-500" :
                          day.status === "HALF_DAY" ? "bg-orange-500" :
                          day.status === "ON_LEAVE" ? "bg-blue-500" :
                          day.status === "HOLIDAY" ? "bg-purple-500" :
                          "bg-gray-200"
                        }`} />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">{day.date}</p>
                        <p className="text-sm">Status: {day.status}</p>
                        {day.workHours > 0 && (
                          <p className="text-sm">Hours: {day.workHours.toFixed(1)}h</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-xs">Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <span className="text-xs">Late</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-xs">Absent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-orange-500" />
                  <span className="text-xs">Half Day</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-xs">On Leave</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-purple-500" />
                  <span className="text-xs">Holiday</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-gray-200" />
                  <span className="text-xs">No Record</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance History</CardTitle>
              <CardDescription>Detailed attendance records</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Work Hours</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance?.records && attendance.records.length > 0 ? (
                    attendance.records.map((record) => (
                      <TableRow key={record._id}>
                        <TableCell>{format(new Date(record.date), "PPP")}</TableCell>
                        <TableCell>{record.dayOfWeek}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell>
                          {record.actualCheckIn 
                            ? format(new Date(record.actualCheckIn.startTime), "hh:mm a")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {record.actualCheckOut
                            ? format(new Date(record.actualCheckOut.startTime), "hh:mm a")
                            : "-"}
                        </TableCell>
                        <TableCell>{record.formattedWorkHours}</TableCell>
                        <TableCell>
                          {record.actualCheckIn?.address?.city || record.actualCheckIn?.address?.formattedAddress?.split(',')[0] || "N/A"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No attendance records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Classrooms Tab */}
        <TabsContent value="classrooms">
          {classrooms && classrooms.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {classrooms.map((cls) => (
                <ClassroomDetailCard key={cls._id} classroom={cls} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No Classrooms Assigned</p>
                <p className="text-sm text-muted-foreground">This teacher hasn't been assigned to any classrooms yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments">
          {assignments && assignments.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {assignments.map((assignment) => (
                <Card key={assignment._id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{assignment.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Marks</span>
                      <span className="font-medium">{assignment.totalMarks}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Deadline</span>
                      <span className="font-medium">
                        {format(new Date(assignment.deadline), "PP")}
                      </span>
                    </div>
                    <Badge variant={assignment.isPublished ? "default" : "secondary"}>
                      {assignment.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No Assignments Created</p>
                <p className="text-sm text-muted-foreground">This teacher hasn't created any assignments yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          {documents && documents.length > 0 ? (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">{doc.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {doc.documentType} • Uploaded on {doc.uploadedAt ? format(new Date(doc.uploadedAt), "PPP") : "N/A"}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No Documents</p>
                <p className="text-sm text-muted-foreground">No documents uploaded for this teacher.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Classroom Detail Card Component
function ClassroomDetailCard({ classroom }: { classroom: any }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{classroom.name}</CardTitle>
          <Badge variant={classroom.status === "ACTIVE" ? "default" : "secondary"}>
            {classroom.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />
            Students
          </span>
          <span className="font-medium">{classroom.students?.length || 0}</span>
        </div>
        <Progress 
          value={((classroom.students?.length || 0) / 30) * 100} 
          className="h-1.5"
        />
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="ghost" size="sm" className="w-full">
          View Classroom
          <ChevronRight className="h-4 w-4 ml-auto" />
        </Button>
      </CardFooter>
    </Card>
  );
}