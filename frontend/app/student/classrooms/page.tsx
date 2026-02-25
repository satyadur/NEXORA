"use client";

import { useQuery } from "@tanstack/react-query";
import { getJoinedClassroomsApi } from "@/lib/api/student.api";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Loader2,
  Users,
  School,
  BookOpen,
  RefreshCcw,
  Search,
  Filter,
  Calendar,
  UserCircle,
  GraduationCap,
  ChevronRight,
  LayoutGrid,
  List,
} from "lucide-react";

import Link from "next/link";
import { useState } from "react";

/* ================= TYPES ================= */

interface Teacher {
  name: string;
  email: string;
}

interface Classroom {
  _id: string;
  name: string;
  description?: string;
  teacher: Teacher;
  students: string[];
  status: "ACTIVE" | "INACTIVE";
  createdAt?: string;
}

/* ================= LOADING SKELETON ================= */

function ClassroomSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}

/* ================= PAGE ================= */

export default function StudentClassroomsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data, isLoading, refetch, isFetching } = useQuery<Classroom[]>({
    queryKey: ["student-joined-classrooms"],
    queryFn: getJoinedClassroomsApi,
    refetchOnMount: "always",
  });

  /* ================= FILTER CLASSROOMS ================= */

  const filteredClassrooms = data?.filter((classroom) => {
    // Search filter
    const matchesSearch = 
      classroom.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classroom.teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classroom.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = 
      statusFilter === "all" || 
      classroom.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  /* ================= STATS ================= */

  const totalClassrooms = data?.length || 0;
  const activeClassrooms = data?.filter(c => c.status === "ACTIVE").length || 0;
  const totalStudents = data?.reduce((acc, c) => acc + c.students.length, 0) || 0;

  /* ================= LOADING ================= */

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Controls Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <Skeleton className="h-10 w-full sm:w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ClassroomSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  /* ================= EMPTY ================= */

  if (!data || data.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center text-center pt-12 pb-12">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <School className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight mb-2">
              No Classrooms Joined Yet
            </h2>
            <p className="text-muted-foreground mb-6 max-w-sm">
              You haven&apos;t joined any classrooms yet. Use the join classroom page to enter an invite code.
            </p>
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/student/join-classrooms">
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Join a Classroom
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

  /* ================= MAIN RENDER ================= */

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* ================= HEADER ================= */}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            My Classrooms
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <GraduationCap size={16} />
            Manage and access your joined classrooms
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
            <Link href="/student/join-classrooms">
              <GraduationCap className="mr-2 h-4 w-4" />
              Join Classroom
            </Link>
          </Button>
        </div>
      </div>

      {/* ================= STATS CARDS ================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Classrooms
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <School size={18} className="text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalClassrooms}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {activeClassrooms} active {activeClassrooms === 1 ? 'classroom' : 'classrooms'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Classrooms
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <BookOpen size={18} className="text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeClassrooms}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((activeClassrooms / totalClassrooms) * 100).toFixed(0)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Peers
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Users size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all your classrooms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ================= FILTERS & CONTROLS ================= */}

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search classrooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ================= RESULTS INFO ================= */}

      {filteredClassrooms && filteredClassrooms.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{filteredClassrooms.length}</span> of{' '}
            <span className="font-medium">{data.length}</span> classrooms
          </p>
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
            >
              Clear search
            </Button>
          )}
        </div>
      )}

      {/* ================= CLASSROOM GRID/LIST ================= */}

      {filteredClassrooms && filteredClassrooms.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredClassrooms.map((classroom) => (
              <Card
                key={classroom._id}
                className="group hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="line-clamp-1">
                        {classroom.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <UserCircle size={14} />
                        {classroom.teacher?.name}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={classroom.status === "ACTIVE" ? "default" : "secondary"}
                      className={
                        classroom.status === "ACTIVE"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : ""
                      }
                    >
                      {classroom.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {classroom.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {classroom.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users size={16} />
                      <span>{classroom.students.length} Students</span>
                    </div>
                    {classroom.createdAt && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar size={16} />
                        <span>{new Date(classroom.createdAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  <Button asChild className="w-full gap-2 group-hover:translate-x-1 transition-transform">
                    <Link href={`/student/classrooms/${classroom._id}`}>
                      <BookOpen className="h-4 w-4" />
                      View Classroom
                      <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredClassrooms.map((classroom) => (
                  <div
                    key={classroom._id}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <School size={18} className="text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{classroom.name}</h3>
                        <Badge
                          variant="outline"
                          className={
                            classroom.status === "ACTIVE"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              : ""
                          }
                        >
                          {classroom.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <UserCircle size={14} />
                          {classroom.teacher.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {classroom.students.length} students
                        </span>
                      </div>
                    </div>

                    <Button asChild variant="ghost" size="sm" className="gap-2">
                      <Link href={`/student/classrooms/${classroom._id}`}>
                        View
                        <ChevronRight size={16} />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
              No classrooms match your search criteria. Try adjusting your filters.
            </p>
            <Button variant="outline" onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
            }}>
              Clear filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ================= FOOTER ================= */}

      {filteredClassrooms && filteredClassrooms.length > 0 && (
        <div className="border-t pt-6">
          <p className="text-center text-sm text-muted-foreground">
            Showing {filteredClassrooms.length} of {data.length} classrooms
          </p>
        </div>
      )}
    </div>
  );
}