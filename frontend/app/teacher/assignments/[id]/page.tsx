"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getAssignmentDetailsApi } from "@/lib/api/teacher.api";
import { format } from "date-fns";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

import {
  ArrowLeft,
  RefreshCw,
  Pencil,
  Calendar,
  Clock,
  Users,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Download,
  Printer,
  Copy,
  BookOpen,
} from "lucide-react";

import Link from "next/link";

export default function ViewAssignmentPage() {
  const { id } = useParams();
  const router = useRouter();

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["assignment", id],
    queryFn: () => getAssignmentDetailsApi(id as string),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const { assignment, questions, totalSubmissions } = data;
  const isPublished = assignment.isPublished;
  const isOverdue = new Date(assignment.deadline) < new Date();

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{assignment.title}</h1>
              <Badge 
                variant={isPublished ? "default" : "outline"}
                className={isPublished ? "bg-green-500/10 text-green-600 border-green-200" : ""}
              >
                {isPublished ? "Published" : "Draft"}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Assignment details and question structure
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Printer className="h-4 w-4" />
          </Button>
          {!isPublished && (
            <Link href={`/teacher/assignments/${id}/edit`}>
              <Button>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Marks</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignment.totalMarks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{questions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submissions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubmissions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deadline</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {format(new Date(assignment.deadline), "MMM d, yyyy")}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(assignment.deadline), "h:mm a")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isPublished ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className="text-sm">Publication Status</span>
                </div>
                <Badge variant={isPublished ? "default" : "outline"}>
                  {isPublished ? "Published" : "Draft"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isOverdue ? (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <Clock className="h-4 w-4 text-green-600" />
                  )}
                  <span className="text-sm">Deadline Status</span>
                </div>
                <Badge variant={isOverdue ? "destructive" : "default"}>
                  {isOverdue ? "Overdue" : "Active"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submission Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completion Rate</span>
                <span className="font-medium">
                  {((totalSubmissions / 30) * 100).toFixed(1)}%
                </span>
              </div>
              <Progress value={(totalSubmissions / 30) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {totalSubmissions} out of 30 students have submitted
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Questions List */}
      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
          <CardDescription>
            {questions.length} question{questions.length !== 1 ? 's' : ''} in this assignment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.map((q: any, index: number) => (
            <div key={q._id} className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">Q{index + 1}</Badge>
                  <div>
                    <p className="font-medium">{q.questionText}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {q.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {q.marks} marks
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {q.type === "MCQ" && q.options && (
                <div className="ml-12 grid gap-2">
                  {q.options.map((opt: any, i: number) => (
                    <div
                      key={i}
                      className={`p-2 rounded border ${
                        i === q.correctAnswerIndex
                          ? "bg-green-500/10 border-green-500"
                          : "bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {i === q.correctAnswerIndex && (
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        )}
                        <span className="text-sm">{opt.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {index < questions.length - 1 && <Separator className="my-4" />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}