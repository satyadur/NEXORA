"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import { getAssignmentsAdminApi, AdminAssignment } from "@/lib/api/admin.api";

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
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
} from "lucide-react";

export default function AssignmentsAdminSide() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [classroomFilter, setClassroomFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "title" | "classroom" | "submissions" | "score"
  >("submissions");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const {
    data = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<AdminAssignment[]>({
    queryKey: ["admin-assignments"],
    queryFn: getAssignmentsAdminApi,
  });

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = data.length;
    const published = data.filter((a) => a.isPublished).length;
    const drafts = total - published;
    const totalSubmissions = data.reduce(
      (acc, a) => acc + a.totalSubmissions,
      0,
    );
    const avgScore =
      data.reduce((acc, a) => acc + a.averageScore, 0) / total || 0;
    const uniqueClassrooms = new Set(data.map((a) => a.classroom)).size;
    const uniqueTeachers = new Set(data.map((a) => a.teacher)).size;

    // Assignments with submissions
    const withSubmissions = data.filter((a) => a.totalSubmissions > 0).length;
    const withoutSubmissions = total - withSubmissions;

    return {
      total,
      published,
      drafts,
      totalSubmissions,
      avgScore: avgScore.toFixed(2),
      uniqueClassrooms,
      uniqueTeachers,
      withSubmissions,
      withoutSubmissions,
      submissionRate:
        total > 0 ? ((withSubmissions / total) * 100).toFixed(1) : "0",
    };
  }, [data]);

  // Get unique classrooms for filter
  const uniqueClassrooms = useMemo(() => {
    const classrooms = new Set(data.map((a) => a.classroom));
    return Array.from(classrooms).filter(Boolean);
  }, [data]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (assignment) =>
          assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assignment.classroom
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          assignment.teacher?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Apply classroom filter
    if (classroomFilter !== "all") {
      filtered = filtered.filter((a) => a.classroom === classroomFilter);
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((a) =>
        statusFilter === "published" ? a.isPublished : !a.isPublished,
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "classroom":
          comparison = (a.classroom || "").localeCompare(b.classroom || "");
          break;
        case "submissions":
          comparison = a.totalSubmissions - b.totalSubmissions;
          break;
        case "score":
          comparison = a.averageScore - b.averageScore;
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [data, searchTerm, classroomFilter, statusFilter, sortBy, sortOrder]);

  // Helper function to get progress color based on percentage
  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const columns: ColumnDef<AdminAssignment>[] = [
    {
      accessorKey: "title",
      header: "Assignment",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium">{row.original.title}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.classroom}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "teacher",
      header: "Teacher",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {row.original.teacher?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{row.original.teacher}</span>
        </div>
      ),
    },
    {
      accessorKey: "totalMarks",
      header: "Marks",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono">
          {row.original.totalMarks}
        </Badge>
      ),
    },
    {
      accessorKey: "deadline",
      header: "Deadline",
      cell: ({ row }) => {
        const deadline = new Date(row.original.deadline);
        const isOverdue = deadline < new Date();
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className={`text-sm ${isOverdue ? "text-red-600" : ""}`}>
              {format(deadline, "MMM d, yyyy")}
            </span>
            {isOverdue && (
              <Badge variant="destructive" className="text-[10px] h-5">
                Overdue
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "isPublished",
      header: "Status",
      cell: ({ row }) =>
        row.original.isPublished ? (
          <Badge className="bg-green-500/10 text-green-600 border-green-200 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Published
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1">
            <XCircle className="h-3 w-3" />
            Draft
          </Badge>
        ),
    },
    {
      accessorKey: "totalSubmissions",
      header: "Submissions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Users className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium">{row.original.totalSubmissions}</span>
        </div>
      ),
    },
    {
      accessorKey: "averageScore",
      header: "Avg Score",
      cell: ({ row }) => {
        const score = row.original.averageScore;
        const totalMarks = row.original.totalMarks;
        const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
        const progressColor = getProgressColor(percentage);

        return (
          <div className="space-y-1 min-w-[100px]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{score.toFixed(2)}</span>
              <span className="text-muted-foreground">/ {totalMarks}</span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full ${progressColor} transition-all`}
                style={{ width: `${percentage}%` }}
              />
            </div>
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
        <p className="text-muted-foreground">Loading assignments...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Assignments Monitoring
          </h1>
          <p className="text-muted-foreground">
            Track all assignments, submissions, and performance metrics
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
                    queryClient.invalidateQueries({
                      queryKey: ["admin-assignments"],
                    });
                  }}
                  disabled={isRefetching}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
                  />
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
            <CardTitle className="text-sm font-medium">
              Total Assignments
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="default"
                className="bg-green-500/10 text-green-600"
              >
                {statistics.published} Published
              </Badge>
              <Badge variant="outline">{statistics.drafts} Drafts</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Submissions
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.totalSubmissions}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {statistics.withSubmissions} assignments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.avgScore}</div>
            <div className="mt-2 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full ${getProgressColor(parseFloat(statistics.avgScore))} transition-all`}
                style={{ width: `${parseFloat(statistics.avgScore)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Submission Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.submissionRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {statistics.withSubmissions} active •{" "}
              {statistics.withoutSubmissions} inactive
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Classrooms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {statistics.uniqueClassrooms}
              </span>
              <Badge variant="outline">Active classrooms</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {statistics.uniqueTeachers}
              </span>
              <Badge variant="outline">Active teachers</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {(
                  (statistics.totalSubmissions / (statistics.total * 30)) *
                  100
                ).toFixed(1)}
                %
              </span>
              <Badge variant="outline">Overall</Badge>
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
                placeholder="Search assignments, classrooms, teachers..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Select
                value={classroomFilter}
                onValueChange={setClassroomFilter}
              >
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Classroom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classrooms</SelectItem>
                  {uniqueClassrooms.map((classroom) => (
                    <SelectItem key={classroom} value={classroom}>
                      {classroom}
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
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sortBy}
                onValueChange={(
                  value: "title" | "classroom" | "submissions" | "score",
                ) => setSortBy(value)}
              >
                <SelectTrigger className="w-35">
                  <SortAsc className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="classroom">Classroom</SelectItem>
                  <SelectItem value="submissions">Submissions</SelectItem>
                  <SelectItem value="score">Avg Score</SelectItem>
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
          {(searchTerm ||
            classroomFilter !== "all" ||
            statusFilter !== "all") && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs text-muted-foreground">
                Active filters:
              </span>
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchTerm}
                  <button
                    className="ml-1 hover:text-foreground"
                    onClick={() => setSearchTerm("")}
                  >
                    ×
                  </button>
                </Badge>
              )}
              {classroomFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Classroom: {classroomFilter}
                  <button
                    className="ml-1 hover:text-foreground"
                    onClick={() => setClassroomFilter("all")}
                  >
                    ×
                  </button>
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="gap-1 capitalize">
                  Status: {statusFilter}
                  <button
                    className="ml-1 hover:text-foreground"
                    onClick={() => setStatusFilter("all")}
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredData.length} of {data.length} assignments
        </p>
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
          <span className="text-muted-foreground">
            High Performance (&gt;75%):{" "}
          </span>
          <span className="font-medium">
            {
              data.filter((a) => (a.averageScore / a.totalMarks) * 100 >= 75)
                .length
            }
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-yellow-500" />
          <span className="text-muted-foreground">Average (50-75%): </span>
          <span className="font-medium">
            {
              data.filter((a) => {
                const p = (a.averageScore / a.totalMarks) * 100;
                return p >= 50 && p < 75;
              }).length
            }
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <span className="text-muted-foreground">
            Needs Improvement (&lt;50%):{" "}
          </span>
          <span className="font-medium">
            {
              data.filter((a) => {
                const p = (a.averageScore / a.totalMarks) * 100;
                return p < 50 && p > 0;
              }).length
            }
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-gray-500" />
          <span className="text-muted-foreground">No Submissions: </span>
          <span className="font-medium">
            {data.filter((a) => a.totalSubmissions === 0).length}
          </span>
        </div>
      </div>
    </div>
  );
}
