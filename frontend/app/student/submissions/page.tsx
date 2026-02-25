"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMySubmissionsApi } from "@/lib/api/student.api";
import { format } from "date-fns";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

import {
  Loader2,
  FileCheck2,
  Eye,
  Trophy,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  BookOpen,
  CheckCircle2,
  Clock,
  TrendingUp,
  Award,
  Download,
  Printer,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  ChevronRight,
} from "lucide-react";

import Link from "next/link";

/* ================= TYPES ================= */

interface Submission {
  _id: string;
  assignmentTitle: string;
  classroomName: string;
  totalMarks: number;
  score: number;
  status: "SUBMITTED" | "EVALUATED";
  deadline: string;
  submittedAt: string;
}

/* ================= PAGE ================= */

export default function SubmissionsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "title" | "score" | "classroom">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const { data, isLoading, isRefetching, refetch } = useQuery<Submission[]>({
    queryKey: ["student-submissions"],
    queryFn: getMySubmissionsApi,
  });

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!data) return null;

    const total = data.length;
    const evaluated = data.filter(s => s.status === "EVALUATED").length;
    const pending = total - evaluated;
    const averageScore = evaluated > 0 
      ? (data.filter(s => s.status === "EVALUATED").reduce((acc, s) => acc + s.score, 0) / evaluated).toFixed(2)
      : "0";
    const totalScore = data.filter(s => s.status === "EVALUATED").reduce((acc, s) => acc + s.score, 0);
    const totalPossible = data.filter(s => s.status === "EVALUATED").reduce((acc, s) => acc + s.totalMarks, 0);
    const overallPercentage = totalPossible > 0 ? ((totalScore / totalPossible) * 100).toFixed(1) : "0";

    // Grade distribution
    const excellent = data.filter(s => s.status === "EVALUATED" && (s.score / s.totalMarks) * 100 >= 85).length;
    const good = data.filter(s => s.status === "EVALUATED" && (s.score / s.totalMarks) * 100 >= 70 && (s.score / s.totalMarks) * 100 < 85).length;
    const average = data.filter(s => s.status === "EVALUATED" && (s.score / s.totalMarks) * 100 >= 50 && (s.score / s.totalMarks) * 100 < 70).length;
    const poor = data.filter(s => s.status === "EVALUATED" && (s.score / s.totalMarks) * 100 < 50).length;

    return {
      total,
      evaluated,
      pending,
      evaluationRate: total > 0 ? ((evaluated / total) * 100).toFixed(1) : "0",
      averageScore,
      overallPercentage,
      excellent,
      good,
      average,
      poor,
    };
  }, [data]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    if (!data) return [];

    let filtered = [...data];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (submission) =>
          submission.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          submission.classroomName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => 
        statusFilter === "evaluated" ? s.status === "EVALUATED" : s.status === "SUBMITTED"
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "date":
          comparison = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
          break;
        case "title":
          comparison = a.assignmentTitle.localeCompare(b.assignmentTitle);
          break;
        case "score":
          const aPercentage = a.status === "EVALUATED" ? (a.score / a.totalMarks) * 100 : 0;
          const bPercentage = b.status === "EVALUATED" ? (b.score / b.totalMarks) * 100 : 0;
          comparison = aPercentage - bPercentage;
          break;
        case "classroom":
          comparison = a.classroomName.localeCompare(b.classroomName);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [data, searchTerm, statusFilter, sortBy, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["student-submissions"] });
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 85) return "text-green-600";
    if (percentage >= 70) return "text-blue-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 85) return "bg-green-500/10 text-green-600 border-green-200";
    if (percentage >= 70) return "bg-blue-500/10 text-blue-600 border-blue-200";
    if (percentage >= 50) return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
    return "bg-red-500/10 text-red-600 border-red-200";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse"></div>
          <div className="relative bg-card rounded-full p-8 shadow-2xl border border-border">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </div>
        <p className="text-muted-foreground">Loading your submissions...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-3xl"></div>
          <div className="relative bg-card rounded-full p-8 shadow-xl border border-border">
            <FileCheck2 className="size-16 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">No Submissions Yet</h2>
          <p className="text-muted-foreground max-w-md">
            You haven&apos;t submitted any assignments yet. Complete your assignments to track your progress here.
          </p>
        </div>
        <Button asChild size="lg" className="gap-2">
          <Link href="/student/assignments">
            <BookOpen className="h-5 w-5" />
            View Assignments
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Submissions</h1>
          <p className="text-muted-foreground">
            Track your assignment history and evaluation status
          </p>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefetching}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh data</TooltipContent>
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

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <FileCheck2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="default" className="bg-green-500/10 text-green-600">
                  {statistics.evaluated} Evaluated
                </Badge>
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">
                  {statistics.pending} Pending
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.averageScore}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Out of {statistics.evaluated} evaluated assignments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.overallPercentage}%</div>
              <Progress value={parseFloat(statistics.overallPercentage)} className="mt-2 h-1.5" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Evaluation Rate</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.evaluationRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {statistics.evaluated} of {statistics.total} graded
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grade Distribution */}
      {statistics && statistics.evaluated > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 bg-green-500/10 rounded-lg">
                <div className="text-lg font-bold text-green-600">{statistics.excellent}</div>
                <div className="text-xs text-muted-foreground">Excellent</div>
                <div className="text-[10px] text-green-600">85%+</div>
              </div>
              <div className="text-center p-2 bg-blue-500/10 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{statistics.good}</div>
                <div className="text-xs text-muted-foreground">Good</div>
                <div className="text-[10px] text-blue-600">70-84%</div>
              </div>
              <div className="text-center p-2 bg-yellow-500/10 rounded-lg">
                <div className="text-lg font-bold text-yellow-600">{statistics.average}</div>
                <div className="text-xs text-muted-foreground">Average</div>
                <div className="text-[10px] text-yellow-600">50-69%</div>
              </div>
              <div className="text-center p-2 bg-red-500/10 rounded-lg">
                <div className="text-lg font-bold text-red-600">{statistics.poor}</div>
                <div className="text-xs text-muted-foreground">Needs Work</div>
                <div className="text-[10px] text-red-600">&lt;50%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by assignment or classroom..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="evaluated">Evaluated</SelectItem>
                  <SelectItem value="submitted">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-[140px]">
                  <SortAsc className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="score">Score</SelectItem>
                  <SelectItem value="classroom">Classroom</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={toggleSortOrder}
                className="w-10"
              >
                {sortOrder === "asc" ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
              </Button>

              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-r-none px-3"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-l-none px-3"
                  onClick={() => setViewMode("table")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchTerm || statusFilter !== "all") && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs text-muted-foreground">Active filters:</span>
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchTerm}
                  <button className="ml-1 hover:text-foreground" onClick={() => setSearchTerm("")}>×</button>
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="gap-1 capitalize">
                  Status: {statusFilter}
                  <button className="ml-1 hover:text-foreground" onClick={() => setStatusFilter("all")}>×</button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredData.length} of {data.length} submissions
        </p>
        <Badge variant="outline" className="gap-1">
          <Calendar className="h-3 w-3" />
          Last updated {format(new Date(), "MMM d, h:mm a")}
        </Badge>
      </div>

      {/* Submissions Grid/Table View */}
      {viewMode === "grid" ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredData.map((submission) => {
            const percentage = submission.status === "EVALUATED" 
              ? ((submission.score / submission.totalMarks) * 100).toFixed(1)
              : null;
            const isOverdue = new Date(submission.deadline) < new Date() && submission.status !== "EVALUATED";

            return (
              <Card key={submission._id} className="group hover:shadow-lg transition-all duration-300 hover:border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg line-clamp-1">
                        {submission.assignmentTitle}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {submission.classroomName}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={submission.status === "EVALUATED" ? "default" : "secondary"}
                      className={submission.status === "EVALUATED" 
                        ? "bg-green-500/10 text-green-600 border-green-200" 
                        : "bg-yellow-500/10 text-yellow-600 border-yellow-200"
                      }
                    >
                      {submission.status === "EVALUATED" ? "Evaluated" : "Pending"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pb-3 space-y-4">
                  {/* Score Section */}
                  {submission.status === "EVALUATED" ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Trophy className={`h-4 w-4 ${getScoreColor(submission.score, submission.totalMarks)}`} />
                          <span className="text-sm font-medium">Score</span>
                        </div>
                        <Badge variant="outline" className={getScoreBadge(submission.score, submission.totalMarks)}>
                          {submission.score} / {submission.totalMarks}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Percentage</span>
                          <span className={`font-medium ${getScoreColor(submission.score, submission.totalMarks)}`}>
                            {percentage}%
                          </span>
                        </div>
                        <Progress 
                          value={parseFloat(percentage || "0")} 
                          className="h-1.5"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Awaiting Evaluation</p>
                        <p className="text-xs text-muted-foreground">
                          Your submission is being reviewed
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Submitted</p>
                      <p className="font-medium">
                        {format(new Date(submission.submittedAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Deadline</p>
                      <p className={`font-medium ${isOverdue ? "text-red-600" : ""}`}>
                        {format(new Date(submission.deadline), "MMM d, yyyy")}
                        {isOverdue && <span className="ml-1 text-[10px]">(Overdue)</span>}
                      </p>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="border-t pt-3">
                  <Link href={`/student/submissions/${submission._id}`} className="w-full">
                    <Button size="sm" className="w-full gap-2 group-hover:bg-primary transition-colors">
                      <Eye className="h-4 w-4" />
                      View Details
                      <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Classroom</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((submission) => {
                  const percentage = submission.status === "EVALUATED" 
                    ? ((submission.score / submission.totalMarks) * 100).toFixed(1)
                    : null;
                  const isOverdue = new Date(submission.deadline) < new Date() && submission.status !== "EVALUATED";

                  return (
                    <TableRow key={submission._id} className="group">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileCheck2 className="h-4 w-4 text-primary" />
                          </div>
                          <span className="line-clamp-1">{submission.assignmentTitle}</span>
                        </div>
                      </TableCell>
                      <TableCell>{submission.classroomName}</TableCell>
                      <TableCell>
                        <Badge
                          variant={submission.status === "EVALUATED" ? "default" : "secondary"}
                          className={submission.status === "EVALUATED" 
                            ? "bg-green-500/10 text-green-600 border-green-200" 
                            : "bg-yellow-500/10 text-yellow-600 border-yellow-200"
                          }
                        >
                          {submission.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {submission.status === "EVALUATED" ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getScoreBadge(submission.score, submission.totalMarks)}>
                              {submission.score}/{submission.totalMarks}
                            </Badge>
                            <span className={`text-xs ${getScoreColor(submission.score, submission.totalMarks)}`}>
                              ({percentage}%)
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(submission.submittedAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <span className={isOverdue ? "text-red-600" : ""}>
                          {format(new Date(submission.deadline), "MMM d, yyyy")}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/student/submissions/${submission._id}`}>
                          <Button variant="ghost" size="sm" className="gap-2">
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Footer Stats */}
      {statistics && statistics.evaluated > 0 && (
        <div className="grid gap-4 md:grid-cols-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Excellent (85%+): </span>
            <span className="font-medium">{statistics.excellent}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Good (70-84%): </span>
            <span className="font-medium">{statistics.good}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">Average (50-69%): </span>
            <span className="font-medium">{statistics.average}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-muted-foreground">Needs Work (&lt;50%): </span>
            <span className="font-medium">{statistics.poor}</span>
          </div>
        </div>
      )}
    </div>
  );
}