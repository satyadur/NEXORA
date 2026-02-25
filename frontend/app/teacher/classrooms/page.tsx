"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyClassroomsApi } from "@/lib/api/teacher.api";
import { format } from "date-fns";

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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  Loader2,
  RefreshCw,
  Search,
  Filter,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  Users,
  BookOpen,
  GraduationCap,
  Copy,
  Check,
  Calendar,
  TrendingUp,
  PlusCircle,
  Settings,
  Eye,
  School,
  Clock,
  AlertCircle,
} from "lucide-react";

import Link from "next/link";

interface Classroom {
  _id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  inviteCode: string;
  studentCount: number;
  assignmentCount: number;
}

export default function Page() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "students" | "assignments">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data = [], isLoading, isRefetching, refetch } = useQuery<Classroom[]>({
    queryKey: ["teacher-classrooms"],
    queryFn: getMyClassroomsApi,
  });

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = data.length;
    const active = data.filter(c => c.status === "ACTIVE").length;
    const inactive = total - active;
    const totalStudents = data.reduce((acc, c) => acc + c.studentCount, 0);
    const totalAssignments = data.reduce((acc, c) => acc + c.assignmentCount, 0);
    const avgStudents = total > 0 ? (totalStudents / total).toFixed(1) : "0";
    const avgAssignments = total > 0 ? (totalAssignments / total).toFixed(1) : "0";
    
    // Classrooms with high engagement (>5 students)
    const highEngagement = data.filter(c => c.studentCount > 5).length;
    
    return {
      total,
      active,
      inactive,
      totalStudents,
      totalAssignments,
      avgStudents,
      avgAssignments,
      highEngagement,
      engagementRate: total > 0 ? ((highEngagement / total) * 100).toFixed(1) : "0",
    };
  }, [data]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (classroom) =>
          classroom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          classroom.inviteCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => 
        statusFilter === "active" ? c.status === "ACTIVE" : c.status === "INACTIVE"
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "students":
          comparison = a.studentCount - b.studentCount;
          break;
        case "assignments":
          comparison = a.assignmentCount - b.assignmentCount;
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [data, searchTerm, statusFilter, sortBy, sortOrder]);

  const handleCopyCode = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your classrooms...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Classrooms</h1>
          <p className="text-muted-foreground">
            Manage and monitor all your teaching classrooms
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
                    queryClient.invalidateQueries({ queryKey: ["teacher-classrooms"] });
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
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classrooms</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="default" className="bg-green-500/10 text-green-600">
                {statistics.active} Active
              </Badge>
              {statistics.inactive > 0 && (
                <Badge variant="outline" className="bg-gray-500/10 text-gray-600">
                  {statistics.inactive} Inactive
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg {statistics.avgStudents} per class
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalAssignments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg {statistics.avgAssignments} per class
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.engagementRate}%</div>
            <Progress value={parseFloat(statistics.engagementRate)} className="mt-2 h-1.5" />
            <p className="text-xs text-muted-foreground mt-1">
              {statistics.highEngagement} classes with &gt;5 students
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary font-medium">Average Class Size</p>
                <p className="text-2xl font-bold text-primary">{statistics.avgStudents}</p>
              </div>
              <Users className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-500/5 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Assignments/Class</p>
                <p className="text-2xl font-bold text-green-600">{statistics.avgAssignments}</p>
              </div>
              <BookOpen className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/5 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Active Classes</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.active}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-blue-600 opacity-50" />
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
                placeholder="Search by classroom name or invite code..."
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={sortBy} 
                onValueChange={(value: "name" | "students" | "assignments") => setSortBy(value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SortAsc className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="students">Students</SelectItem>
                  <SelectItem value="assignments">Assignments</SelectItem>
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
          Showing {filteredData.length} of {data.length} classrooms
        </p>
        <Badge variant="outline" className="gap-1">
          <Calendar className="h-3 w-3" />
          Updated {format(new Date(), "MMM d, h:mm a")}
        </Badge>
      </div>

      {/* Classrooms Grid/List View */}
      {filteredData.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <School className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No classrooms found</p>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your filters" 
                : "You haven't created any classrooms yet"}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredData.map((cls) => (
            <ClassroomCard 
              key={cls._id} 
              classroom={cls} 
              onCopyCode={handleCopyCode}
              copiedCode={copiedCode}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="rounded-md border">
              <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 text-sm font-medium">
                <div className="col-span-3">Classroom</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Invite Code</div>
                <div className="col-span-2">Students</div>
                <div className="col-span-2">Assignments</div>
                <div className="col-span-1">Actions</div>
              </div>
              {filteredData.map((cls) => (
                <ClassroomListItem 
                  key={cls._id} 
                  classroom={cls} 
                  onCopyCode={handleCopyCode}
                  copiedCode={copiedCode}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ===================== CLASSROOM CARD COMPONENT ===================== */
interface ClassroomCardProps {
  classroom: Classroom;
  onCopyCode: (code: string, id: string) => void;
  copiedCode: string | null;
}

function ClassroomCard({ classroom, onCopyCode, copiedCode }: ClassroomCardProps) {
  const utilizationRate = (classroom.studentCount / 30) * 100; // Assuming max 30 students per class

  return (
    <Link href={`/teacher/classrooms/${classroom._id}`} className="block">
      <Card className="group hover:shadow-xl transition-all duration-300 h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <School className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-xl">{classroom.name}</CardTitle>
              </div>
              <CardDescription className="flex items-center gap-2 pl-10">
                <Badge 
                  variant={classroom.status === "ACTIVE" ? "default" : "secondary"}
                  className={classroom.status === "ACTIVE" ? "bg-green-500/10 text-green-600 border-green-200" : ""}
                >
                  {classroom.status}
                </Badge>
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          <div className="space-y-4">
            {/* Invite Code */}
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-background px-2 py-1 rounded">
                  {classroom.inviteCode}
                </span>
                <Badge variant="outline" className="text-[10px] h-5">
                  Invite Code
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.preventDefault();
                  onCopyCode(classroom.inviteCode, classroom._id);
                }}
              >
                {copiedCode === classroom._id ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-500/5 rounded-lg p-3 text-center">
                <Users className="h-4 w-4 mx-auto text-blue-600 mb-1" />
                <p className="text-lg font-bold text-blue-600">{classroom.studentCount}</p>
                <p className="text-xs text-muted-foreground">Students</p>
              </div>
              <div className="bg-green-500/5 rounded-lg p-3 text-center">
                <BookOpen className="h-4 w-4 mx-auto text-green-600 mb-1" />
                <p className="text-lg font-bold text-green-600">{classroom.assignmentCount}</p>
                <p className="text-xs text-muted-foreground">Assignments</p>
              </div>
            </div>

            {/* Capacity Utilization */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Capacity Utilization</span>
                <span className="font-medium">{Math.min(100, Math.round(utilizationRate))}%</span>
              </div>
              <Progress value={Math.min(100, utilizationRate)} className="h-1.5" />
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t pt-3">
          <div className="flex w-full gap-2">
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1 gap-1"
              asChild
            >
              <span>
                <Eye className="h-3 w-3" />
                View Details
              </span>
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

/* ===================== CLASSROOM LIST ITEM COMPONENT ===================== */
function ClassroomListItem({ classroom, onCopyCode, copiedCode }: ClassroomCardProps) {
  return (
    <Link href={`/teacher/classrooms/${classroom._id}`} className="block">
      <div className="grid grid-cols-12 gap-4 p-4 border-b last:border-0 hover:bg-muted/50 transition-colors">
        <div className="col-span-3 font-medium flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
            <School className="h-3 w-3 text-primary" />
          </div>
          {classroom.name}
        </div>
        <div className="col-span-2">
          <Badge 
            variant={classroom.status === "ACTIVE" ? "default" : "secondary"}
            className={classroom.status === "ACTIVE" ? "bg-green-500/10 text-green-600 border-green-200" : ""}
          >
            {classroom.status}
          </Badge>
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <code className="text-xs bg-muted px-2 py-1 rounded">
            {classroom.inviteCode}
          </code>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.preventDefault();
              onCopyCode(classroom.inviteCode, classroom._id);
            }}
          >
            {copiedCode === classroom._id ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
        <div className="col-span-2 flex items-center gap-1">
          <Users className="h-3 w-3 text-muted-foreground" />
          <span>{classroom.studentCount}</span>
        </div>
        <div className="col-span-2 flex items-center gap-1">
          <BookOpen className="h-3 w-3 text-muted-foreground" />
          <span>{classroom.assignmentCount}</span>
        </div>
        <div className="col-span-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Link>
  );
}