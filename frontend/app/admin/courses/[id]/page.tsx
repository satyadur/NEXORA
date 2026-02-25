// app/admin/courses/[id]/page.tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Edit,
  Users,
  BookOpen,
  GraduationCap,
  Clock,
  Calendar,
  IndianRupee,
  Award,
  Star,
  FileText,
  UserPlus,
  Download,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { getCourseByIdApi } from "@/lib/api/course.api";

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => getCourseByIdApi(courseId),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading course details...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <BookOpen className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Failed to load course details</p>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  const { course, stats, enrollments } = data;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      published: { color: "bg-green-500", label: "Published" },
      draft: { color: "bg-yellow-500", label: "Draft" },
      archived: { color: "bg-gray-500", label: "Archived" },
      upcoming: { color: "bg-blue-500", label: "Upcoming" },
      ongoing: { color: "bg-purple-500", label: "Ongoing" },
      completed: { color: "bg-slate-500", label: "Completed" },
    };
    const variant = variants[course.status] || variants.draft;
    return (
      <Badge className={`${variant.color} text-white`}>{variant.label}</Badge>
    );
  };

  const getLevelBadge = (level: string) => {
    const variants: Record<string, string> = {
      undergraduate: "bg-blue-100 text-blue-700",
      postgraduate: "bg-purple-100 text-purple-700",
      doctorate: "bg-orange-100 text-orange-700",
      diploma: "bg-green-100 text-green-700",
      certificate: "bg-gray-100 text-gray-700",
    };
    return (
      <Badge variant="outline" className={variants[level]}>
        {level}
      </Badge>
    );
  };

  const getEnrollmentStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      enrolled: { color: "bg-blue-500", label: "Enrolled" },
      in_progress: { color: "bg-purple-500", label: "In Progress" },
      completed: { color: "bg-green-500", label: "Completed" },
      dropped: { color: "bg-red-500", label: "Dropped" },
      failed: { color: "bg-gray-500", label: "Failed" },
    };
    const variant = variants[status] || variants.enrolled;
    return (
      <Badge className={`${variant.color} text-white`}>{variant.label}</Badge>
    );
  };

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Courses</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground font-medium">{course.title}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-1">Course Details</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/admin/courses/${courseId}/enroll`)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Enroll Students
          </Button>
          <Button onClick={() => router.push(`/admin/courses/${courseId}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Course
          </Button>
        </div>
      </div>

      {/* Course Header Card */}
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5" />
        <CardContent className="pt-0 px-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-6 -mt-12">
            <div className="h-24 w-24 rounded-xl bg-primary/10 flex items-center justify-center border-4 border-background">
              <BookOpen className="h-12 w-12 text-primary" />
            </div>
            <div className="flex-1 pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold">{course.title}</h2>
                    {getStatusBadge(course.status)}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <Badge variant="outline" className="px-3 py-1">
                      <code>{course.code}</code>
                    </Badge>
                    {course.shortCode && (
                      <Badge variant="outline" className="px-3 py-1">
                        {course.shortCode}
                      </Badge>
                    )}
                    {getLevelBadge(course.level)}
                    <Badge variant="outline" className="px-3 py-1">
                      <GraduationCap className="h-3 w-3 mr-1" />
                      {course.credits} Credits
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        {/* Quick Stats */}
        <div className="border-t bg-muted/50">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
            <div className="p-4 text-center">
              <p className="text-2xl font-bold">{stats?.totalEnrollments || 0}</p>
              <p className="text-xs text-muted-foreground">Total Enrollments</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold">{stats?.activeEnrollments || 0}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold">{stats?.completedEnrollments || 0}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold">{course.instructors?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Instructors</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="instructors">Instructors</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="mt-1">{course.description}</p>
                </div>
                {course.longDescription && (
                  <div>
                    <p className="text-sm text-muted-foreground">Detailed Description</p>
                    <p className="mt-1 text-sm">{course.longDescription}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{course.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">
                      {course.duration.value} {course.duration.unit}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Skills Gained</CardTitle>
              </CardHeader>
              <CardContent>
                {course.skillsGained && course.skillsGained.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {course.skillsGained.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1">
                        <Award className="h-3 w-3 mr-1" />
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No skills listed</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Fee Structure */}
          {course.fee && course.fee.amount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fee Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <IndianRupee className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">₹{course.fee.amount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground capitalize">{course.fee.type.replace('_', ' ')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Instructors Tab */}
        <TabsContent value="instructors">
          <Card>
            <CardHeader>
              <CardTitle>Course Instructors</CardTitle>
              <CardDescription>
                Teachers and faculty assigned to this course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {course.instructors?.map((instructor) => (
                  <Card key={instructor._id}>
                    <CardContent className="p-4 flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>{instructor.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{instructor.name}</p>
                        <p className="text-sm text-muted-foreground">{instructor.email}</p>
                        {course.headInstructor?._id === instructor._id && (
                          <Badge className="mt-2 bg-primary">Head Instructor</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enrollments Tab */}
        <TabsContent value="enrollments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Enrolled Students</CardTitle>
                <CardDescription>
                  {stats?.totalEnrollments || 0} total enrollments
                </CardDescription>
              </div>
              <Button onClick={() => router.push(`/admin/courses/${courseId}/enroll`)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Enroll Students
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Enrollment No.</TableHead>
                    <TableHead>Enrolled On</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments && enrollments.length > 0 ? (
                    enrollments.map((enrollment) => (
                      <TableRow key={enrollment._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {enrollment.studentId.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{enrollment.studentId.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {enrollment.studentId.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{enrollment.studentId.enrollmentNumber}</TableCell>
                        <TableCell>
                          {format(new Date(enrollment.enrollmentDate), "PP")}
                        </TableCell>
                        <TableCell>
                          {getEnrollmentStatusBadge(enrollment.status)}
                        </TableCell>
                        <TableCell>
                          <div className="w-24">
                            <Progress value={enrollment.progress?.overallProgress || 0} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell>{enrollment.finalGrade || "-"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">No enrollments yet</p>
                        <Button
                          onClick={() => router.push(`/admin/courses/${courseId}/enroll`)}
                          className="mt-4"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Enroll Students
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Syllabus Tab */}
        <TabsContent value="syllabus">
          <Card>
            <CardHeader>
              <CardTitle>Course Syllabus</CardTitle>
              <CardDescription>
                {course.syllabus?.title || "Course Syllabus"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {course.syllabus ? (
                <>
                  <div>
                    <h3 className="font-medium mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground">
                      {course.syllabus.description}
                    </p>
                  </div>

                  {course.syllabus.objectives && course.syllabus.objectives.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Learning Objectives</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {course.syllabus.objectives.map((obj, index) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            {obj}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {course.syllabus.topics && course.syllabus.topics.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-4">Course Topics</h3>
                      <div className="space-y-4">
                        {course.syllabus.topics.map((topic, index) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">Week {topic.week}: {topic.title}</p>
                                  {topic.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {topic.description}
                                    </p>
                                  )}
                                </div>
                                {topic.duration && (
                                  <Badge variant="outline">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {topic.duration}h
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  No syllabus added for this course
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {format(new Date(course.createdAt), "PPP")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium">
                    {format(new Date(course.updatedAt), "PPP")}
                  </p>
                </div>
              </div>

              {course.tags && course.tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {course.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Learning Outcomes</p>
                    <ul className="list-disc list-inside space-y-1">
                      {course.learningOutcomes.map((outcome, index) => (
                        <li key={index} className="text-sm">{outcome}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {course.careerOpportunities && course.careerOpportunities.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Career Opportunities</p>
                    <ul className="list-disc list-inside space-y-1">
                      {course.careerOpportunities.map((career, index) => (
                        <li key={index} className="text-sm">{career}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}