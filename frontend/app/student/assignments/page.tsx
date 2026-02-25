"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyAssignmentsApi } from "@/lib/api/student.api";
import { useState } from "react";

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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

import {
  Loader2,
  BookOpen,
  Clock,
  Trophy,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Hourglass,
  Calendar,
  Filter,
  Search,
  RefreshCcw,
  GraduationCap,
  ChevronRight,
  TrendingUp,
  Award,
  BarChart3,
  FileText,
  Users,
  School,
} from "lucide-react";

import Link from "next/link";

/* ================= TYPES ================= */

interface Assignment {
  _id: string;
  title: string;
  totalMarks: number;
  deadline: string;
  classroom: {
    _id: string;
    name: string;
  };
  submissionStatus: "NOT_SUBMITTED" | "SUBMITTED" | "EVALUATED" | "MISSED";
  score: number | null;
}

/* ================= STATUS CONFIG ================= */

const statusConfig = {
  EVALUATED: {
    label: "Evaluated",
    variant: "default" as const,
    icon: CheckCircle2,
    color: "text-green-600 bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    progressColor: "bg-green-600",
  },
  SUBMITTED: {
    label: "Submitted",
    variant: "secondary" as const,
    icon: Hourglass,
    color: "text-blue-600 bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    progressColor: "bg-blue-600",
  },
  NOT_SUBMITTED: {
    label: "Not Submitted",
    variant: "outline" as const,
    icon: AlertCircle,
    color: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
    progressColor: "bg-yellow-600",
  },
  MISSED: {
    label: "Missed",
    variant: "destructive" as const,
    icon: XCircle,
    color: "text-red-600 bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    progressColor: "bg-red-600",
  },
};

/* ================= SKELETON COMPONENT ================= */

function AssignmentSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-2 w-full" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}

/* ================= PAGE ================= */

export default function StudentAssignmentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [classroomFilter, setClassroomFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("deadline");

  const { data, isLoading, refetch, isFetching } = useQuery<Assignment[]>({
    queryKey: ["student-assignments"],
    queryFn: getMyAssignmentsApi,
    refetchOnMount: "always",
  });

  /* ================= FILTERING AND SORTING ================= */

  const filteredAssignments = data?.filter((assignment) => {
    // Search filter
    const matchesSearch = 
      assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.classroom.name.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = 
      statusFilter === "all" || 
      assignment.submissionStatus === statusFilter;

    // Classroom filter
    const matchesClassroom = 
      classroomFilter === "all" || 
      assignment.classroom._id === classroomFilter;

    return matchesSearch && matchesStatus && matchesClassroom;
  });

  const sortedAssignments = filteredAssignments?.sort((a, b) => {
    switch (sortBy) {
      case "deadline":
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      case "title":
        return a.title.localeCompare(b.title);
      case "status":
        return a.submissionStatus.localeCompare(b.submissionStatus);
      default:
        return 0;
    }
  });

  /* ================= STATS ================= */

  const totalAssignments = data?.length || 0;
  const completedCount = data?.filter(a => a.submissionStatus !== "NOT_SUBMITTED" && a.submissionStatus !== "MISSED").length || 0;
  const evaluatedCount = data?.filter(a => a.submissionStatus === "EVALUATED").length || 0;
  const pendingCount = data?.filter(a => a.submissionStatus === "NOT_SUBMITTED").length || 0;
  const missedCount = data?.filter(a => a.submissionStatus === "MISSED").length || 0;

  const completionRate = totalAssignments > 0 ? Math.round((completedCount / totalAssignments) * 100) : 0;

  const uniqueClassrooms = data?.reduce((acc, assignment) => {
    if (!acc.find(c => c._id === assignment.classroom._id)) {
      acc.push(assignment.classroom);
    }
    return acc;
  }, [] as { _id: string; name: string }[]);

  const isDeadlinePassed = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  const getDaysRemaining = (deadline: string) => {
    const diff = new Date(deadline).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const getStatusCount = (status: string) => {
    return data?.filter(a => a.submissionStatus === status).length || 0;
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Controls Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <AssignmentSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center text-center pt-12 pb-12">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <BookOpen className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight mb-2">
              No Assignments Yet
            </h2>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Your teachers haven&apos;t assigned any work yet. Check back later or explore your classrooms.
            </p>
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/student/classrooms">
                  <School className="mr-2 h-4 w-4" />
                  View Classrooms
                </Link>
              </Button>
              <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCcw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* ================= HEADER ================= */}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            My Assignments
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <FileText size={16} />
            Track, submit, and manage all your academic work
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
        </div>
      </div>

      {/* ================= STATS CARDS ================= */}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText size={18} className="text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssignments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {uniqueClassrooms?.length || 0} classrooms
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {completionRate}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Evaluated
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Trophy size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{evaluatedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              With scores available
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
              <Hourglass size={18} className="text-yellow-600 dark:text-yellow-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Missed
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <XCircle size={18} className="text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{missedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Past deadline
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ================= FILTERS AND CONTROLS ================= */}

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assignments by title or classroom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="NOT_SUBMITTED">Not Submitted ({getStatusCount("NOT_SUBMITTED")})</SelectItem>
              <SelectItem value="SUBMITTED">Submitted ({getStatusCount("SUBMITTED")})</SelectItem>
              <SelectItem value="EVALUATED">Evaluated ({getStatusCount("EVALUATED")})</SelectItem>
              <SelectItem value="MISSED">Missed ({getStatusCount("MISSED")})</SelectItem>
            </SelectContent>
          </Select>

          <Select value={classroomFilter} onValueChange={setClassroomFilter}>
            <SelectTrigger className="w-[160px]">
              <Users className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Classroom" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classrooms</SelectItem>
              {uniqueClassrooms?.map((classroom) => (
                <SelectItem key={classroom._id} value={classroom._id}>
                  {classroom.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px]">
              <TrendingUp className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deadline">Deadline</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ================= RESULTS INFO ================= */}

      {sortedAssignments && sortedAssignments.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{sortedAssignments.length}</span> of{' '}
            <span className="font-medium">{data.length}</span> assignments
          </p>
          {(searchQuery || statusFilter !== "all" || classroomFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setClassroomFilter("all");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* ================= ASSIGNMENTS GRID ================= */}

      {sortedAssignments && sortedAssignments.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sortedAssignments.map((assignment) => {
            const StatusIcon = statusConfig[assignment.submissionStatus].icon;
            const deadlinePassed = isDeadlinePassed(assignment.deadline);
            const daysRemaining = getDaysRemaining(assignment.deadline);
            const isUrgent = daysRemaining <= 2 && daysRemaining > 0 && assignment.submissionStatus === "NOT_SUBMITTED";
            
            return (
              <Card
                key={assignment._id}
                className="group hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="line-clamp-1 text-lg">
                        {assignment.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <School size={14} />
                        {assignment.classroom.name}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={statusConfig[assignment.submissionStatus].variant}
                      className={`gap-1 ${statusConfig[assignment.submissionStatus].color}`}
                    >
                      <StatusIcon size={12} />
                      {statusConfig[assignment.submissionStatus].label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Deadline and Marks */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar size={16} />
                      <span>Due {new Date(assignment.deadline).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {assignment.totalMarks} marks
                    </Badge>
                  </div>

                  {/* Progress Bar for non-evaluated assignments */}
                  {assignment.submissionStatus !== "EVALUATED" && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {assignment.submissionStatus === "SUBMITTED" ? "100%" : "0%"}
                        </span>
                      </div>
                      <Progress 
                        value={assignment.submissionStatus === "SUBMITTED" ? 100 : 0} 
                        className={`h-1.5 ${
                          assignment.submissionStatus === "SUBMITTED" 
                            ? "bg-blue-100 [&>div]:bg-blue-600" 
                            : "bg-yellow-100 [&>div]:bg-yellow-600"
                        }`}
                      />
                    </div>
                  )}

                  {/* Score if evaluated */}
                  {assignment.score !== null && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Trophy size={16} className="text-yellow-600" />
                        <span className="text-sm font-medium">Your Score</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-primary">
                          {assignment.score}/{assignment.totalMarks}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {((assignment.score / assignment.totalMarks) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Status indicators */}
                  <div className="flex flex-wrap gap-2">
                    {deadlinePassed && assignment.submissionStatus === "NOT_SUBMITTED" && (
                      <Badge variant="destructive" className="gap-1 text-xs">
                        <AlertCircle className="h-3 w-3" />
                        Overdue
                      </Badge>
                    )}
                    {isUrgent && (
                      <Badge variant="outline" className="gap-1 text-xs text-orange-600 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                        <Clock className="h-3 w-3" />
                        {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
                      </Badge>
                    )}
                    {assignment.submissionStatus === "SUBMITTED" && (
                      <Badge variant="outline" className="gap-1 text-xs text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                        <Hourglass className="h-3 w-3" />
                        Awaiting evaluation
                      </Badge>
                    )}
                  </div>

                  <Separator />

                  {/* Action Button */}
                  <Button 
                    asChild 
                    className="w-full gap-2 group-hover:translate-x-1 transition-transform"
                    variant={assignment.submissionStatus === "NOT_SUBMITTED" && !deadlinePassed ? "default" : "outline"}
                  >
                    <Link
  href={
    assignment.submissionStatus === "NOT_SUBMITTED"
      ? `/student/assignments/${assignment._id}/start`
      : `/student/submissions/`
  }
  className="flex items-center gap-2 group"
>
  <BookOpen className="h-4 w-4" />

  {assignment.submissionStatus === "NOT_SUBMITTED"
    ? deadlinePassed
      ? "View Details"
      : "Start Assignment"
    : "View Submission"}

  <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
</Link>

                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No matching assignments</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
              No assignments match your current filters. Try adjusting your search criteria.
            </p>
            <Button variant="outline" onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setClassroomFilter("all");
            }}>
              Clear all filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ================= SUMMARY CARD ================= */}

      {sortedAssignments && sortedAssignments.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Assignment Summary</p>
                  <p className="text-xs text-muted-foreground">
                    You have {pendingCount} pending, {evaluatedCount} evaluated, and {missedCount} missed assignments
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  {completedCount} Completed
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Trophy className="h-3 w-3 text-blue-600" />
                  {evaluatedCount} Evaluated
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}