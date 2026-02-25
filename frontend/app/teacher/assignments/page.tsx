"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyAssignmentsApi,
  publishAssignmentApi,
  deleteAssignmentApi,
} from "@/lib/api/teacher.api";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import {
  Loader2,
  RefreshCw,
  Search,
  Filter,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  PlusCircle,
  Eye,
  Pencil,
  Trash2,
  Send,
  Clock,
  Calendar,
  BookOpen,
  Users,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  MoreVertical,
} from "lucide-react";

export default function AssignmentsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [classroomFilter, setClassroomFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"title" | "deadline" | "submissions">("deadline");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["teacher-assignments"],
    queryFn: getMyAssignmentsApi,
  });

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = data.length;
    const published = data.filter(a => a.isPublished).length;
    const drafts = total - published;
    const totalSubmissions = data.reduce((acc, a) => acc + (a as any).submissionCount || 0, 0);
    const activeAssignments = data.filter(a => new Date(a.deadline) > new Date()).length;
    const overdue = data.filter(a => new Date(a.deadline) < new Date() && a.isPublished).length;
    
    return {
      total,
      published,
      drafts,
      totalSubmissions,
      activeAssignments,
      overdue,
      completionRate: total > 0 ? ((published / total) * 100).toFixed(1) : "0",
    };
  }, [data]);

  // Get unique classrooms for filter
  const uniqueClassrooms = useMemo(() => {
    const classrooms = new Set(data.map(a => a.classroomId?.name).filter(Boolean));
    return Array.from(classrooms);
  }, [data]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = [...data];

    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.classroomId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(a => 
        statusFilter === "published" ? a.isPublished : !a.isPublished
      );
    }

    if (classroomFilter !== "all") {
      filtered = filtered.filter(a => a.classroomId?.name === classroomFilter);
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "deadline":
          comparison = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          break;
        case "submissions":
          comparison = ((a as any).submissionCount || 0) - ((b as any).submissionCount || 0);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [data, searchTerm, statusFilter, classroomFilter, sortBy, sortOrder]);

  const publishMutation = useMutation({
    mutationFn: publishAssignmentApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] });
      toast.success("Assignment Published", {
        description: "Students can now view and submit this assignment.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAssignmentApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] });
      toast.success("Assignment Deleted");
    },
  });

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
          <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
          <p className="text-muted-foreground">
            Create and manage assignments for your classrooms
          </p>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isRefetching}>
                  <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Link href="/teacher/assignments/create">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Assignment
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="default" className="bg-green-500/10 text-green-600">
                {statistics.published} Published
              </Badge>
              <Badge variant="outline">{statistics.drafts} Drafts</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.activeAssignments}</div>
            {statistics.overdue > 0 && (
              <p className="text-xs text-red-600 mt-1">{statistics.overdue} overdue</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalSubmissions}</div>
            <Progress value={65} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.completionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {statistics.published} of {statistics.total} published
            </p>
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
                placeholder="Search assignments by title or classroom..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>

              <Select value={classroomFilter} onValueChange={setClassroomFilter}>
                <SelectTrigger className="w-[140px]">
                  <BookOpen className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Classroom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classrooms</SelectItem>
                  {uniqueClassrooms.map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-[130px]">
                  <SortAsc className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="submissions">Submissions</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon" onClick={() => setSortOrder(o => o === "asc" ? "desc" : "asc")}>
                {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
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
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-l-none px-3"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredData.length} of {data.length} assignments
        </p>
      </div>

      {/* Empty State */}
      {filteredData.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No assignments found</p>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm || statusFilter !== "all" || classroomFilter !== "all"
                ? "Try adjusting your filters"
                : "Create your first assignment to get started"}
            </p>
            {!searchTerm && statusFilter === "all" && classroomFilter === "all" && (
              <Link href="/teacher/assignments/create">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Assignment
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredData.map((assignment) => (
            <AssignmentCard
              key={assignment._id}
              assignment={assignment}
              onPublish={(id) => publishMutation.mutate(id)}
              onDelete={(id) => deleteMutation.mutate(id)}
              isPublishing={publishMutation.isPending}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <AssignmentListView 
              assignments={filteredData}
              onPublish={(id) => publishMutation.mutate(id)}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ===================== ASSIGNMENT CARD ===================== */
function AssignmentCard({ assignment, onPublish, onDelete, isPublishing, isDeleting }: any) {
  const isPublished = assignment.isPublished;
  const isOverdue = new Date(assignment.deadline) < new Date();
  const submissionRate = ((assignment as any).submissionCount || 0) / 30 * 100; // Assuming 30 students

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{assignment.title}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <BookOpen className="h-3 w-3" />
                {assignment.classroomId?.name}
              </CardDescription>
            </div>
          </div>
          <Badge 
            variant={isPublished ? "default" : "outline"}
            className={isPublished ? "bg-green-500/10 text-green-600 border-green-200" : ""}
          >
            {isPublished ? "Published" : "Draft"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3 flex-1">
        <div className="space-y-4">
          {/* Deadline */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Deadline</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={isOverdue && isPublished ? "text-red-600 font-medium" : ""}>
                {format(new Date(assignment.deadline), "MMM d, yyyy")}
              </span>
              {isOverdue && isPublished && (
                <Badge variant="destructive" className="text-[10px] h-5">Overdue</Badge>
              )}
            </div>
          </div>

          {/* Marks */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Total Marks</span>
            </div>
            <Badge variant="outline" className="font-mono">
              {assignment.totalMarks}
            </Badge>
          </div>

          {/* Submissions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Submissions</span>
              </div>
              <span className="font-medium">{(assignment as any).submissionCount || 0}</span>
            </div>
            {isPublished && <Progress value={submissionRate} className="h-1.5" />}
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t pt-3">
        <div className="flex w-full gap-2">
          <Link href={`/teacher/assignments/${assignment._id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="h-3 w-3 mr-2" />
              View
            </Button>
          </Link>

          {!isPublished ? (
            <>
              <Link href={`/teacher/assignments/${assignment._id}/edit`} className="flex-1">
                <Button size="sm" className="w-full">
                  <Pencil className="h-3 w-3 mr-2" />
                  Edit
                </Button>
              </Link>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="flex-1 cursor-pointer">
                    <Send className="h-3 w-3 mr-2" />
                    Publish
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Publish Assignment?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Once published, this assignment cannot be edited. Students will be able to view and submit.
                      Are you sure you want to continue?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onPublish(assignment._id)}>
                      {isPublishing ? "Publishing..." : "Yes, Publish"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive" className="w-8 p-0">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. All questions and submissions will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(assignment._id)} className="bg-destructive">
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <Button variant="outline" size="sm" className="flex-1" disabled>
              <CheckCircle2 className="h-3 w-3 mr-2" />
              Published
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

/* ===================== ASSIGNMENT LIST VIEW ===================== */
function AssignmentListView({ assignments, onPublish, onDelete }: any) {
  return (
    <div className="rounded-md border">
      <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 text-sm font-medium">
        <div className="col-span-3">Assignment</div>
        <div className="col-span-2">Classroom</div>
        <div className="col-span-2">Deadline</div>
        <div className="col-span-1">Marks</div>
        <div className="col-span-1">Submissions</div>
        <div className="col-span-1">Status</div>
        <div className="col-span-2">Actions</div>
      </div>
      {assignments.map((assignment: any) => (
        <div key={assignment._id} className="grid grid-cols-12 gap-4 p-4 border-b last:border-0 hover:bg-muted/50 transition-colors items-center">
          <div className="col-span-3 font-medium flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
              <FileText className="h-3 w-3 text-primary" />
            </div>
            {assignment.title}
          </div>
          <div className="col-span-2 text-sm text-muted-foreground">
            {assignment.classroomId?.name}
          </div>
          <div className="col-span-2 text-sm">
            {format(new Date(assignment.deadline), "MMM d, yyyy")}
          </div>
          <div className="col-span-1">
            <Badge variant="outline">{assignment.totalMarks}</Badge>
          </div>
          <div className="col-span-1">{(assignment as any).submissionCount || 0}</div>
          <div className="col-span-1">
            <Badge 
              variant={assignment.isPublished ? "default" : "outline"}
              className={assignment.isPublished ? "bg-green-500/10 text-green-600 border-green-200" : ""}
            >
              {assignment.isPublished ? "Published" : "Draft"}
            </Badge>
          </div>
          <div className="col-span-2 flex gap-2">
            <Link href={`/teacher/assignments/${assignment._id}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            {!assignment.isPublished && (
              <>
                <Link href={`/teacher/assignments/${assignment._id}/edit`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onPublish(assignment._id)}>
                  <Send className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(assignment._id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}