"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getStudentClassroomDetailsApi } from "@/lib/api/student.api";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Loader2,
  Users,
  User,
  BookOpen,
  Trophy,
  Clock,
  RefreshCcw,
  Calendar,
  Mail,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Hourglass,
  TrendingUp,
  GraduationCap,
  ChevronRight,
  FileText,
  Award,
  BarChart3,
} from "lucide-react";

import Link from "next/link";
import { useState } from "react";

/* ================= TYPES ================= */

interface Assignment {
  _id: string;
  title: string;
  totalMarks: number;
  deadline: string;
  submissionStatus: "EVALUATED" | "SUBMITTED" | "NOT_SUBMITTED";
  score: number | null;
}

interface ClassroomDetails {
  classroom: {
    _id: string;
    name: string;
    description?: string;
    inviteCode: string;
    teacher: {
      name: string;
      email: string;
    };
    studentsCount: number;
  };
  assignments: Assignment[];
}

/* ================= STATUS CONFIG ================= */

const statusConfig = {
  EVALUATED: {
    label: "Evaluated",
    variant: "default" as const,
    icon: CheckCircle2,
    color: "text-green-600 bg-green-100 dark:bg-green-900/20",
  },
  SUBMITTED: {
    label: "Submitted",
    variant: "secondary" as const,
    icon: Clock,
    color: "text-blue-600 bg-blue-100 dark:bg-blue-900/20",
  },
  NOT_SUBMITTED: {
    label: "Not Submitted",
    variant: "destructive" as const,
    icon: XCircle,
    color: "text-red-600 bg-red-100 dark:bg-red-900/20",
  },
};

/* ================= SKELETON COMPONENTS ================= */

function InfoCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-40" />
      </CardContent>
    </Card>
  );
}

function AssignmentSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}

/* ================= PAGE ================= */

export default function ClassroomDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading, refetch, isFetching } = useQuery<ClassroomDetails>({
    queryKey: ["student-classroom", id],
    queryFn: () => getStudentClassroomDetailsApi(id),
    refetchOnMount: "always",
  });

  const copyInviteCode = () => {
    if (data?.classroom.inviteCode) {
      navigator.clipboard.writeText(data.classroom.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Info Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <InfoCardSkeleton key={i} />
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <AssignmentSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { classroom, assignments } = data;

  const completedCount = assignments.filter(
    (a) => a.submissionStatus !== "NOT_SUBMITTED"
  ).length;

  const evaluatedCount = assignments.filter(
    (a) => a.submissionStatus === "EVALUATED"
  ).length;

  const progress = assignments.length > 0
    ? Math.round((completedCount / assignments.length) * 100)
    : 0;

  const averageScore = assignments
    .filter(a => a.score !== null)
    .reduce((acc, a) => acc + (a.score || 0), 0) / (evaluatedCount || 1);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isDeadlinePassed = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  const getDaysRemaining = (deadline: string) => {
    const diff = new Date(deadline).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* ================= HEADER ================= */}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {classroom.name}
            </h1>
            <Badge variant="outline" className="ml-2">
              <GraduationCap className="h-3 w-3 mr-1" />
              Student View
            </Badge>
          </div>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <BookOpen size={16} />
            {classroom.description || "Classroom Overview & Assignments"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCcw size={14} className={isFetching ? "animate-spin" : ""} />
            {isFetching ? "Refreshing..." : "Refresh"}
          </Button>
          <Button asChild size="sm">
            <Link href="/student/classrooms">
              Back to Classrooms
            </Link>
          </Button>
        </div>
      </div>

      {/* ================= INVITE CODE BANNER ================= */}

      <Card className="bg-muted/50 border-dashed">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Copy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Classroom Invite Code</p>
                <p className="text-2xl font-mono font-bold">{classroom.inviteCode}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyInviteCode}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Code
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ================= INFO CARDS ================= */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Teacher
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User size={18} className="text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(classroom.teacher.name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="font-medium leading-none">{classroom.teacher.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail size={12} />
                  {classroom.teacher.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Students
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Users size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{classroom.studentsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Enrolled in this class
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Progress
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <TrendingUp size={18} className="text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{progress}%</div>
            <div className="mt-2">
              <Progress value={progress} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {completedCount} of {assignments.length} completed
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Score
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
              <Trophy size={18} className="text-yellow-600 dark:text-yellow-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {evaluatedCount > 0 ? averageScore.toFixed(1) : '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {evaluatedCount} evaluated {evaluatedCount === 1 ? 'assignment' : 'assignments'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ================= TABS SECTION ================= */}

      <Tabs defaultValue="assignments" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="assignments" className="gap-2">
            <FileText size={16} />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 size={16} />
            Overview
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <Award size={16} />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          {/* Assignments Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Class Assignments</h2>
              <p className="text-sm text-muted-foreground">
                {assignments.length} total assignments • {completedCount} completed
              </p>
            </div>
            <Badge variant="outline" className="gap-1">
              <Clock size={14} />
              {assignments.filter(a => !isDeadlinePassed(a.deadline) && a.submissionStatus === "NOT_SUBMITTED").length} pending
            </Badge>
          </div>

          {assignments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <BookOpen className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Assignments Yet</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  The teacher hasn&apos;t published any assignments for this classroom yet.
                  Check back later for updates.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {assignments.map((assignment) => {
                const StatusIcon = statusConfig[assignment.submissionStatus].icon;
                const isLate = isDeadlinePassed(assignment.deadline) && 
                              assignment.submissionStatus === "NOT_SUBMITTED";
                const daysRemaining = getDaysRemaining(assignment.deadline);
                
                return (
                  <Card
                    key={assignment._id}
                    className="group hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <CardTitle className="line-clamp-1 text-lg">
                          {assignment.title}
                        </CardTitle>
                        <Badge 
                          variant={statusConfig[assignment.submissionStatus].variant}
                          className={`gap-1 ${statusConfig[assignment.submissionStatus].color}`}
                        >
                          <StatusIcon size={12} />
                          {statusConfig[assignment.submissionStatus].label}
                        </Badge>
                      </div>
                      <CardDescription>
                        {assignment.totalMarks} marks
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Deadline */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar size={16} />
                          <span>Due {new Date(assignment.deadline).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}</span>
                        </div>
                        {!isLate && assignment.submissionStatus === "NOT_SUBMITTED" && (
                          <Badge variant="outline" className="text-xs">
                            {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
                          </Badge>
                        )}
                        {isLate && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Overdue
                          </Badge>
                        )}
                      </div>

                      {/* Score if evaluated */}
                      {assignment.score !== null && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2">
                            <Trophy size={16} className="text-yellow-600" />
                            <span className="text-sm font-medium">Your Score</span>
                          </div>
                          <span className="text-lg font-bold text-primary">
                            {assignment.score}/{assignment.totalMarks}
                          </span>
                        </div>
                      )}

                      {/* Action Button */}
                      <Button 
                        asChild 
                        className="w-full gap-2 group-hover:translate-x-1 transition-transform"
                        variant={assignment.submissionStatus === "NOT_SUBMITTED" ? "default" : "outline"}
                      >
                        <Link href={`/student/assignments/${assignment._id}`}>
                          <BookOpen className="h-4 w-4" />
                          {assignment.submissionStatus === "NOT_SUBMITTED" 
                            ? "Start Assignment" 
                            : "View Submission"}
                          <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Classroom Overview</CardTitle>
              <CardDescription>
                Key information about this classroom
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Teacher Information</h3>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(classroom.teacher.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{classroom.teacher.name}</p>
                        <p className="text-sm text-muted-foreground">{classroom.teacher.email}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Class Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between p-2 rounded-lg bg-muted/30">
                        <span className="text-sm">Invite Code</span>
                        <span className="text-sm font-mono font-medium">{classroom.inviteCode}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded-lg bg-muted/30">
                        <span className="text-sm">Total Students</span>
                        <span className="text-sm font-medium">{classroom.studentsCount}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded-lg bg-muted/30">
                        <span className="text-sm">Total Assignments</span>
                        <span className="text-sm font-medium">{assignments.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm">
                        {classroom.description || "No description provided for this classroom."}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Quick Stats</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <p className="text-2xl font-bold text-primary">{completedCount}</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <p className="text-2xl font-bold text-yellow-600">{evaluatedCount}</p>
                        <p className="text-xs text-muted-foreground">Evaluated</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Performance Statistics</CardTitle>
              <CardDescription>
                Detailed analysis of your performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-primary">{assignments.length}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-yellow-600">{evaluatedCount}</p>
                    <p className="text-xs text-muted-foreground">Evaluated</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-blue-600">
                      {assignments.length - completedCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium mb-3">Submission Status Breakdown</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Not Submitted</span>
                        <span className="font-medium">
                          {assignments.filter(a => a.submissionStatus === "NOT_SUBMITTED").length}
                        </span>
                      </div>
                      <Progress 
                        value={(assignments.filter(a => a.submissionStatus === "NOT_SUBMITTED").length / assignments.length) * 100} 
                        className="h-2 bg-red-100 [&>div]:bg-red-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Submitted</span>
                        <span className="font-medium">
                          {assignments.filter(a => a.submissionStatus === "SUBMITTED").length}
                        </span>
                      </div>
                      <Progress 
                        value={(assignments.filter(a => a.submissionStatus === "SUBMITTED").length / assignments.length) * 100} 
                        className="h-2 bg-blue-100 [&>div]:bg-blue-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Evaluated</span>
                        <span className="font-medium">
                          {assignments.filter(a => a.submissionStatus === "EVALUATED").length}
                        </span>
                      </div>
                      <Progress 
                        value={(assignments.filter(a => a.submissionStatus === "EVALUATED").length / assignments.length) * 100} 
                        className="h-2 bg-green-100 [&>div]:bg-green-600"
                      />
                    </div>
                  </div>
                </div>

                {evaluatedCount > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-medium mb-3">Score Analysis</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-muted/50">
                          <p className="text-sm text-muted-foreground mb-1">Average Score</p>
                          <p className="text-2xl font-bold text-primary">{averageScore.toFixed(1)}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                          <p className="text-sm text-muted-foreground mb-1">Total Marks</p>
                          <p className="text-2xl font-bold text-primary">
                            {assignments.reduce((acc, a) => acc + a.totalMarks, 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ================= FOOTER ================= */}

      <CardFooter className="justify-center border-t pt-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <GraduationCap size={16} className="text-primary" />
          Stay on top of your assignments to succeed in this class.
        </div>
      </CardFooter>
    </div>
  );
}