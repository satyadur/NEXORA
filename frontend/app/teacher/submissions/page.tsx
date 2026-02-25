"use client";

import { useQuery } from "@tanstack/react-query";
import { getAllSubmissionsApi, Submission } from "@/lib/api/teacher.api";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/submission-utils";

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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Search,
  Filter,
  RefreshCcw,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  GraduationCap,
  Mail,
  User,
  Calendar,
  Trophy,
  MoreVertical,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function AllSubmissionsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assignmentFilter, setAssignmentFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("submittedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const { data, isLoading, refetch, isFetching } = useQuery<Submission[]>({
    queryKey: ["teacher-submissions"],
    queryFn: getAllSubmissionsApi,
    refetchOnMount: "always",
  });

  // Get unique assignments for filter
  const uniqueAssignments = useMemo(() => {
    if (!data) return [];
    const assignments = new Map();
    data.forEach(sub => {
      if (!assignments.has(sub.assignmentId._id)) {
        assignments.set(sub.assignmentId._id, {
          id: sub.assignmentId._id,
          title: sub.assignmentId.title
        });
      }
    });
    return Array.from(assignments.values());
  }, [data]);

  // Filter and search submissions
  const filteredSubmissions = useMemo(() => {
    if (!data) return [];

    return data.filter(sub => {
      // Search filter
      const matchesSearch = 
        sub.assignmentId.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.studentId.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.studentId.email.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === "all" || sub.status === statusFilter;

      // Assignment filter
      const matchesAssignment = assignmentFilter === "all" || sub.assignmentId._id === assignmentFilter;

      return matchesSearch && matchesStatus && matchesAssignment;
    });
  }, [data, searchQuery, statusFilter, assignmentFilter]);

  // Sort submissions
  const sortedSubmissions = useMemo(() => {
    return [...filteredSubmissions].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "studentName":
          aValue = a.studentId.name;
          bValue = b.studentId.name;
          break;
        case "assignmentTitle":
          aValue = a.assignmentId.title;
          bValue = b.assignmentId.title;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "score":
          aValue = a.totalScore || 0;
          bValue = b.totalScore || 0;
          break;
        case "submittedAt":
        default:
          aValue = new Date(a.submittedAt).getTime();
          bValue = new Date(b.submittedAt).getTime();
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [filteredSubmissions, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedSubmissions.length / itemsPerPage);
  const paginatedSubmissions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedSubmissions.slice(start, end);
  }, [sortedSubmissions, currentPage, itemsPerPage]);

  // Statistics
  const stats = useMemo(() => {
    if (!data) return { total: 0, evaluated: 0, pending: 0, averageScore: 0 };
    
    const total = data.length;
    const evaluated = data.filter(s => s.status === "EVALUATED").length;
    const pending = total - evaluated;
    const averageScore = evaluated > 0 
      ? data.filter(s => s.status === "EVALUATED").reduce((acc, s) => acc + (s.totalScore || 0), 0) / evaluated
      : 0;

    return { total, evaluated, pending, averageScore };
  }, [data]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === "asc" 
      ? <ArrowUp className="h-4 w-4" /> 
      : <ArrowDown className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "EVALUATED":
        return {
          label: "Evaluated",
          variant: "default" as const,
          icon: CheckCircle2,
          color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200",
        };
      case "SUBMITTED":
      default:
        return {
          label: "Pending",
          variant: "secondary" as const,
          icon: Clock,
          color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200",
        };
    }
  };

  const exportToCSV = () => {
    if (!data) return;

    const headers = ["Assignment", "Student", "Email", "Status", "Score", "Submitted At"];
    const rows = data.map(sub => [
      sub.assignmentId.title,
      sub.studentId.name,
      sub.studentId.email,
      sub.status,
      sub.status === "EVALUATED" ? `${sub.totalScore}/${sub.assignmentId.totalMarks}` : "-",
      new Date(sub.submittedAt).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `submissions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Submissions exported successfully");
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Submissions
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <FileText className="h-4 w-4" />
            Review and evaluate student submissions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCcw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Submissions
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {uniqueAssignments.length} assignments
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Evaluated
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.evaluated}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((stats.evaluated / stats.total) * 100).toFixed(0)}% complete
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Review
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Score
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Trophy className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.averageScore.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across evaluated submissions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by assignment, student, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="SUBMITTED">Pending</SelectItem>
                  <SelectItem value="EVALUATED">Evaluated</SelectItem>
                </SelectContent>
              </Select>

              <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
                <SelectTrigger className="w-[180px]">
                  <FileText className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Assignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignments</SelectItem>
                  {uniqueAssignments.map(ass => (
                    <SelectItem key={ass.id} value={ass.id}>
                      {ass.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-r-none gap-2"
                  onClick={() => setViewMode("table")}
                >
                  Table
                </Button>
                <Button
                  variant={viewMode === "cards" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-l-none gap-2"
                  onClick={() => setViewMode("cards")}
                >
                  Cards
                </Button>
              </div>
            </div>
          </div>

          {/* Results info */}
          <div className="flex items-center justify-between mt-4 text-sm">
            <p className="text-muted-foreground">
              Showing <span className="font-medium">{paginatedSubmissions.length}</span> of{' '}
              <span className="font-medium">{sortedSubmissions.length}</span> submissions
            </p>
            {(searchQuery || statusFilter !== "all" || assignmentFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setAssignmentFilter("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table View */}
      {viewMode === "table" && (
        <Card>
          <CardContent className="p-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 font-medium"
                        onClick={() => handleSort("assignmentTitle")}
                      >
                        Assignment
                        {getSortIcon("assignmentTitle")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 font-medium"
                        onClick={() => handleSort("studentName")}
                      >
                        Student
                        {getSortIcon("studentName")}
                      </Button>
                    </TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 font-medium"
                        onClick={() => handleSort("status")}
                      >
                        Status
                        {getSortIcon("status")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 font-medium"
                        onClick={() => handleSort("score")}
                      >
                        Score
                        {getSortIcon("score")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 font-medium"
                        onClick={() => handleSort("submittedAt")}
                      >
                        Submitted
                        {getSortIcon("submittedAt")}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSubmissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <FileText className="h-8 w-8 mb-2" />
                          <p>No submissions found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedSubmissions.map((sub, index) => {
                      const StatusIcon = getStatusBadge(sub.status).icon;
                      const start = (currentPage - 1) * itemsPerPage;
                      return (
                        <TableRow key={sub._id} className="group">
                          <TableCell className="font-medium">{start + index + 1}</TableCell>
                          <TableCell className="font-medium">
                            {sub.assignmentId.title}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {sub.studentId.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              {sub.studentId.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={getStatusBadge(sub.status).variant}
                              className={`gap-1 ${getStatusBadge(sub.status).color}`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {getStatusBadge(sub.status).label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {sub.status === "EVALUATED" ? (
                              <span className="font-medium">
                                {sub.totalScore}/{sub.assignmentId.totalMarks}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {formatDate(sub.submittedAt)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => router.push(`/teacher/submissions/${sub._id}/evaluate`)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  {sub.status === "EVALUATED" ? "View Evaluation" : "Evaluate"}
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <GraduationCap className="h-4 w-4 mr-2" />
                                  View Student
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Rows per page
                </p>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages || 1}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards View */}
      {viewMode === "cards" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedSubmissions.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No submissions found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters or search query
                </p>
              </CardContent>
            </Card>
          ) : (
            paginatedSubmissions.map((sub) => {
              const StatusIcon = getStatusBadge(sub.status).icon;
              return (
                <Card key={sub._id} className="group hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg line-clamp-1">
                          {sub.assignmentId.title}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <User className="h-3 w-3" />
                          {sub.studentId.name}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={getStatusBadge(sub.status).variant}
                        className={`gap-1 ${getStatusBadge(sub.status).color}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {getStatusBadge(sub.status).label}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{sub.studentId.email}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Submitted {formatDate(sub.submittedAt)}</span>
                    </div>

                    {sub.status === "EVALUATED" && (
                      <div className="mt-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Score</span>
                          <span className="font-medium">
                            {sub.totalScore}/{sub.assignmentId.totalMarks}
                          </span>
                        </div>
                        <Progress 
                          value={(sub.totalScore / sub.assignmentId.totalMarks) * 100} 
                          className="h-1.5 mt-2"
                        />
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="pt-3">
                    <Button
                      className="w-full gap-2 group-hover:translate-x-1 transition-transform"
                      variant={sub.status === "EVALUATED" ? "outline" : "default"}
                      onClick={() => router.push(`/teacher/submissions/${sub._id}/evaluate`)}
                    >
                      <Eye className="h-4 w-4" />
                      {sub.status === "EVALUATED" ? "View Evaluation" : "Evaluate"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}