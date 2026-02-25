"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import {
  getSubmissionsAdminApi,
  AdminSubmission,
} from "@/lib/api/admin.api";

import { DataTable } from "../students/_components/data-table";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

import {
  RefreshCw,
  Search,
  Filter,
  Calendar,
  BookOpen,
  Users,
  Award,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  Printer,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  Loader2,
  Eye,
  FileText,
  AlertCircle,
  CheckCheck,
} from "lucide-react";

export default function SubmissionsPageAdminSide() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState<string>("all");
  const [studentFilter, setStudentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"assignment" | "student" | "score" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const { data = [], isLoading, isRefetching, refetch } = useQuery<AdminSubmission[]>({
    queryKey: ["admin-submissions"],
    queryFn: getSubmissionsAdminApi,
  });

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = data.length;
    const evaluated = data.filter(s => s.status === "EVALUATED").length;
    const pending = total - evaluated;
    const totalScore = data.reduce((acc, s) => acc + (s.totalScore || 0), 0);
    const averageScore = total > 0 ? (totalScore / total).toFixed(2) : "0";
    
    // Unique assignments and students
    const uniqueAssignments = new Set(data.map(s => s.assignment)).size;
    const uniqueStudents = new Set(data.map(s => s.student)).size;
    
    // Score distribution
    const highScores = data.filter(s => s.totalScore >= 80).length;
    const mediumScores = data.filter(s => s.totalScore >= 50 && s.totalScore < 80).length;
    const lowScores = data.filter(s => s.totalScore > 0 && s.totalScore < 50).length;
    const zeroScores = data.filter(s => s.totalScore === 0).length;

    return {
      total,
      evaluated,
      pending,
      evaluationRate: total > 0 ? ((evaluated / total) * 100).toFixed(1) : "0",
      totalScore,
      averageScore,
      uniqueAssignments,
      uniqueStudents,
      highScores,
      mediumScores,
      lowScores,
      zeroScores,
    };
  }, [data]);

  // Get unique values for filters
  const uniqueAssignments = useMemo(() => {
    const assignments = new Set(data.map(s => s.assignment));
    return Array.from(assignments).filter(Boolean);
  }, [data]);

  const uniqueStudents = useMemo(() => {
    const students = new Set(data.map(s => s.student));
    return Array.from(students).filter(Boolean);
  }, [data]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (submission) =>
          submission.assignment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          submission.student?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply assignment filter
    if (assignmentFilter !== "all") {
      filtered = filtered.filter((s) => s.assignment === assignmentFilter);
    }

    // Apply student filter
    if (studentFilter !== "all") {
      filtered = filtered.filter((s) => s.student === studentFilter);
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
        case "assignment":
          comparison = (a.assignment || "").localeCompare(b.assignment || "");
          break;
        case "student":
          comparison = (a.student || "").localeCompare(b.student || "");
          break;
        case "score":
          comparison = (a.totalScore || 0) - (b.totalScore || 0);
          break;
        case "date":
          comparison = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [data, searchTerm, assignmentFilter, studentFilter, statusFilter, sortBy, sortOrder]);

  const columns: ColumnDef<AdminSubmission>[] = [
    {
      accessorKey: "assignment",
      header: "Assignment",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium">{row.original.assignment}</p>
            <p className="text-xs text-muted-foreground">
              ID: {row.original._id.slice(-6)}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "student",
      header: "Student",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {row.original.student?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{row.original.student}</span>
        </div>
      ),
    },
    {
      accessorKey: "totalScore",
      header: "Score",
      cell: ({ row }) => {
        const score = row.original.totalScore || 0;
        const percentage = score; // Assuming score is out of 100
        return (
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`font-mono ${
                percentage >= 80 ? "bg-green-500/10 text-green-600 border-green-200" :
                percentage >= 50 ? "bg-yellow-500/10 text-yellow-600 border-yellow-200" :
                percentage > 0 ? "bg-red-500/10 text-red-600 border-red-200" :
                "bg-gray-500/10 text-gray-600 border-gray-200"
              }`}
            >
              {score}
            </Badge>
            {percentage >= 80 && <CheckCheck className="h-3 w-3 text-green-600" />}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return status === "EVALUATED" ? (
          <Badge className="bg-green-500/10 text-green-600 border-green-200 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Evaluated
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200 gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      },
    },
    {
      accessorKey: "submittedAt",
      header: "Submitted",
      cell: ({ row }) => {
        const date = new Date(row.original.submittedAt);
        const isToday = new Date().toDateString() === date.toDateString();
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">
              {isToday ? (
                <span className="text-green-600">
                  Today {format(date, "h:mm a")}
                </span>
              ) : (
                format(date, "MMM d, yyyy")
              )}
            </span>
          </div>
        );
      },
    },
  ];

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading submissions...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Submission Monitoring</h1>
          <p className="text-muted-foreground">
            Track all student submissions and evaluation status
          </p>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    refetch();
                    queryClient.invalidateQueries({ queryKey: ["admin-submissions"] });
                  }}
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
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Evaluation Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.evaluationRate}%</div>
            <Progress value={parseFloat(statistics.evaluationRate)} className="mt-2 h-1.5" />
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
              Total: {statistics.totalScore} points
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.uniqueAssignments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {statistics.uniqueStudents} active students
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Score Distribution */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-green-500/5 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">High Scores (80+)</p>
                <p className="text-2xl font-bold text-green-600">{statistics.highScores}</p>
              </div>
              <Award className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-500/5 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Medium (50-79)</p>
                <p className="text-2xl font-bold text-yellow-600">{statistics.mediumScores}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-500/5 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Low Scores (1-49)</p>
                <p className="text-2xl font-bold text-red-600">{statistics.lowScores}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-500/5 border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Zero Scores</p>
                <p className="text-2xl font-bold text-gray-600">{statistics.zeroScores}</p>
              </div>
              <XCircle className="h-8 w-8 text-gray-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by assignment or student..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Assignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignments</SelectItem>
                  {uniqueAssignments.map((assignment) => (
                    <SelectItem key={assignment} value={assignment}>
                      {assignment.length > 20 ? assignment.substring(0, 20) + "..." : assignment}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={studentFilter} onValueChange={setStudentFilter}>
                <SelectTrigger className="w-[140px]">
                  <Users className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {uniqueStudents.map((student) => (
                    <SelectItem key={student} value={student}>
                      {student}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="evaluated">Evaluated</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={sortBy} 
                onValueChange={(value: "assignment" | "student" | "score" | "date") => setSortBy(value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SortAsc className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="score">Score</SelectItem>
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
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-r-none px-3"
                  onClick={() => setViewMode("table")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-l-none px-3"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchTerm || assignmentFilter !== "all" || studentFilter !== "all" || statusFilter !== "all") && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs text-muted-foreground">Active filters:</span>
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchTerm}
                  <button className="ml-1 hover:text-foreground" onClick={() => setSearchTerm("")}>×</button>
                </Badge>
              )}
              {assignmentFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Assignment: {assignmentFilter.length > 20 ? assignmentFilter.substring(0, 20) + "..." : assignmentFilter}
                  <button className="ml-1 hover:text-foreground" onClick={() => setAssignmentFilter("all")}>×</button>
                </Badge>
              )}
              {studentFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Student: {studentFilter}
                  <button className="ml-1 hover:text-foreground" onClick={() => setStudentFilter("all")}>×</button>
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
          <Eye className="h-3 w-3" />
          {filteredData.filter(s => s.status === "EVALUATED").length} Evaluated
        </Badge>
      </div>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable columns={columns} data={filteredData} />
        </CardContent>
      </Card>

      {/* Footer Stats */}
      <div className="grid gap-4 md:grid-cols-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-muted-foreground">Evaluated: </span>
          <span className="font-medium">{statistics.evaluated}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-yellow-500" />
          <span className="text-muted-foreground">Pending: </span>
          <span className="font-medium">{statistics.pending}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">Assignments: </span>
          <span className="font-medium">{statistics.uniqueAssignments}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-purple-500" />
          <span className="text-muted-foreground">Students: </span>
          <span className="font-medium">{statistics.uniqueStudents}</span>
        </div>
      </div>
    </div>
  );
}