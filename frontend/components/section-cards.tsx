"use client";

import { AdminStats } from "@/types/admin";
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface SectionCardsProps {
  stats: AdminStats;
}

export function SectionCards({ stats }: SectionCardsProps) {
  return (
    <div className="space-y-6">
      {/* Primary Metrics Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Users Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-20 w-20 translate-x-6 translate-y-4 rounded-full bg-primary/10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalUsers}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                {stats.overview.totalStudents} Students
              </span>
              <span>•</span>
              <span>{stats.overview.totalTeachers} Teachers</span>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/50 px-6 py-2">
            <div className="flex items-center gap-2 text-xs">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600 font-medium">+{stats.growth.newUsersThisMonth}</span>
              <span className="text-muted-foreground">this month</span>
            </div>
          </CardFooter>
        </Card>

        {/* Classrooms Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classrooms</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalClassrooms}</div>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="h-5 px-1">
                {stats.overview.activeClassrooms} Active
              </Badge>
              <Badge variant="secondary" className="h-5 px-1">
                {stats.overview.pendingClassrooms} Pending
              </Badge>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/50 px-6 py-2">
            <div className="flex w-full items-center justify-between text-xs">
              <span className="text-muted-foreground">Utilization</span>
              <span className="font-medium">{stats.utilization.classroomUtilizationRate}%</span>
            </div>
          </CardFooter>
        </Card>

        {/* Assignments Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalAssignments}</div>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="border-green-600 text-green-600">
                {stats.overview.publishedAssignments} Published
              </Badge>
              <span className="text-muted-foreground">
                {stats.overview.draftAssignments} Drafts
              </span>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/50 px-6 py-2">
            <div className="flex w-full items-center justify-between text-xs">
              <span className="text-muted-foreground">Avg per class</span>
              <span className="font-medium">{stats.utilization.avgAssignmentsPerClassroom}</span>
            </div>
          </CardFooter>
        </Card>

        {/* Performance Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Health</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.platformHealth.engagementScore}%</div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary text-primary">
                Grade {stats.platformHealth.performanceGrade}
              </Badge>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/50 px-6 py-2">
            <Progress value={stats.platformHealth.engagementScore} className="h-1" />
          </CardFooter>
        </Card>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Submission Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Submission Rate</span>
              <span className="font-bold">{stats.performance.submissionRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">On-Time Rate</span>
              <span className="font-bold text-green-600">{stats.performance.onTimeRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Late Submissions</span>
              <span className="font-bold text-yellow-600">{stats.performance.lateSubmissions}</span>
            </div>
          </CardContent>
        </Card>

        {/* Teacher Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Teacher Effectiveness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Teachers</span>
              <span className="font-bold">{stats.teacherAnalytics.totalActiveTeachers}/{stats.overview.totalTeachers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg Classes/Teacher</span>
              <span className="font-bold">{stats.teacherAnalytics.avgClassroomsPerTeacher}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Effectiveness Rate</span>
              <span className="font-bold text-blue-600">{stats.teacherAnalytics.teacherEffectiveness}%</span>
            </div>
          </CardContent>
        </Card>

        {/* At-Risk Students */}
        <Card className={stats.studentAnalytics.atRiskStudents > 0 ? "border-yellow-200 bg-yellow-50/50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Student Engagement</CardTitle>
            {stats.studentAnalytics.atRiskStudents > 0 && (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Attendance Rate</span>
              <span className="font-bold">{stats.studentAnalytics.avgAttendanceRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg Submissions</span>
              <span className="font-bold">{stats.studentAnalytics.avgSubmissionsPerStudent}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">At-Risk Students</span>
              <span className="font-bold text-yellow-600">{stats.studentAnalytics.atRiskStudents}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {stats.platformHealth.recommendations.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Actionable Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {stats.platformHealth.recommendations.map((rec, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}