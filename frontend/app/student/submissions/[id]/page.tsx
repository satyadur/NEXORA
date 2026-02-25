"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getSubmissionDetailsApi } from "@/lib/api/student.api";
import { useState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, ArrowLeft, Download, MessageSquare, Printer, FileText } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { SubmissionHeader } from "@/components/submission/SubmissionHeader";
import { AnswerCard } from "@/components/submission/AnswerCard";
import { FeedbackSection } from "@/components/submission/FeedbackSection";
import { calculateSubmissionStats, formatDate } from "@/lib/submission-utils";
import { ApiResponse, Submission, Answer } from "@/types/submission";

export default function SubmissionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState("answers");

  const { data, isLoading, error } = useQuery<ApiResponse>({
    queryKey: ["student-submission-details", id],
    queryFn: () => getSubmissionDetailsApi(id),
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!data?.submission) return;
    
    const content = generateSubmissionText(data.submission);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submission-${data.submission.assignmentId.title.replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Submission downloaded successfully");
  };

  const generateSubmissionText = (submission: Submission): string => {
    let text = `SUBMISSION DETAILS\n`;
    text += `==================\n\n`;
    text += `Assignment: ${submission.assignmentId.title}\n`;
    text += `Status: ${submission.status}\n`;
    text += `Submitted: ${formatDate(submission.createdAt)}\n`;
    if (submission.status === "EVALUATED") {
      text += `Score: ${submission.totalScore}/${submission.assignmentId.totalMarks}\n`;
    }
    text += `\nANSWERS\n`;
    text += `=======\n\n`;
    
    submission.answers.forEach((ans: Answer, index: number) => {
      text += `Question ${index + 1}: ${ans.questionId.questionText}\n`;
      text += `Answer: ${ans.answer}\n`;
      if (submission.status === "EVALUATED") {
        if (ans.questionId.type === "MCQ") {
          const isCorrect = ans.questionId.correctAnswerIndex !== undefined &&
            ans.questionId.options?.[ans.questionId.correctAnswerIndex]?.text === ans.answer;
          text += `Result: ${isCorrect ? 'Correct' : 'Incorrect'}\n`;
        } else {
          text += `Result: ${ans.isCorrect === true ? 'Correct' : ans.isCorrect === false ? 'Incorrect' : 'Pending'}\n`;
        }
      }
      text += `\n`;
    });
    
    if (submission.feedback) {
      text += `FEEDBACK\n`;
      text += `========\n`;
      text += submission.feedback;
    }
    
    return text;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground animate-pulse">
            Loading submission details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data?.submission) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="size-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Submission Not Found</h2>
            <p className="text-muted-foreground">
              The submission you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
            </p>
            <Button onClick={() => router.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const submission = data.submission;
  const assignment = submission.assignmentId;
  const stats = calculateSubmissionStats(submission);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 print:p-0 w-full mx-auto">
      {/* Header with navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/student/submissions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Submission Details
            </h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <FileText className="h-4 w-4" />
              Review your submitted answers and feedback
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      {/* Print-friendly title */}
      <div className="hidden print:block text-center mb-8">
        <h1 className="text-2xl font-bold">Submission Report</h1>
        <p className="text-muted-foreground">Generated on {new Date().toLocaleDateString()}</p>
      </div>

      {/* Submission Header */}
      <SubmissionHeader
        title={assignment.title}
        deadline={assignment.deadline}
        status={submission.status}
        totalScore={submission.totalScore}
        totalMarks={assignment.totalMarks}
        submittedAt={submission.createdAt}
        stats={{
          totalQuestions: stats.totalQuestions,
          answeredQuestions: stats.answeredQuestions,
          percentageScore: stats.percentageScore,
          correctCount: stats.correctCount,
          incorrectCount: stats.incorrectCount,
          pendingCount: stats.pendingCount,
        }}
      />

      {/* Tabs for better organization */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 print:hidden">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="answers" className="gap-2">
            <FileText className="h-4 w-4" />
            Your Answers
          </TabsTrigger>
          <TabsTrigger value="feedback" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Feedback
          </TabsTrigger>
        </TabsList>

        <TabsContent value="answers" className="space-y-4">
          <div className="grid gap-4">
            {submission.answers.map((ans: Answer, index: number) => (
              <AnswerCard
                key={ans._id || index}
                index={index}
                question={ans.questionId}
                answer={ans.answer}
                isEvaluated={submission.status === "EVALUATED"}
                isCorrect={ans.isCorrect}
                teacherComment={ans.teacherComment}
              />
            ))}
          </div>

          {/* Summary Stats Card */}
          <Card className="bg-gradient-to-r from-primary/5 to-transparent border-0 shadow-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Submission Summary
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-background/50">
                  <div className="text-2xl font-bold text-primary">{stats.totalQuestions}</div>
                  <p className="text-xs text-muted-foreground">Total Questions</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/50">
                  <div className="text-2xl font-bold text-green-600">{stats.correctCount}</div>
                  <p className="text-xs text-muted-foreground">Correct</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/50">
                  <div className="text-2xl font-bold text-red-600">{stats.incorrectCount}</div>
                  <p className="text-xs text-muted-foreground">Incorrect</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/50">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>

              {submission.status === "EVALUATED" && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Final Score:</span>
                    <span className="text-2xl font-bold text-primary">
                      {submission.totalScore}/{assignment.totalMarks}
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        ({stats.percentageScore.toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback">
          {submission.feedback ? (
            <FeedbackSection
              feedback={submission.feedback}
              teacherName="Teacher" // You can replace with actual teacher name if available
              totalScore={submission.totalScore}
              totalMarks={assignment.totalMarks}
              evaluatedAt={submission.updatedAt}
            />
          ) : (
            <Card className="border-0 shadow-md">
              <CardContent className="py-16 text-center">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Feedback Yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {submission.status === "EVALUATED" 
                    ? "Your submission has been evaluated but no feedback was provided."
                    : "Your submission is pending evaluation. Feedback will appear here once reviewed."}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Print-friendly version */}
      <div className="hidden print:block space-y-6">
        <div className="grid gap-4">
          {submission.answers.map((ans: Answer, index: number) => (
            <div key={index} className="border-b pb-4">
              <h3 className="font-bold">Question {index + 1}</h3>
              <p className="mt-1">{ans.questionId.questionText}</p>
              <p className="mt-2"><span className="font-medium">Your Answer:</span> {ans.answer}</p>
              {submission.status === "EVALUATED" && (
                <p className="mt-1 text-sm">
                  {ans.questionId.type === "MCQ" 
                    ? (ans.questionId.correctAnswerIndex !== undefined &&
                       ans.questionId.options?.[ans.questionId.correctAnswerIndex]?.text === ans.answer
                      ? "✓ Correct"
                      : "✗ Incorrect")
                    : (ans.isCorrect === true ? "✓ Correct" : ans.isCorrect === false ? "✗ Incorrect" : "⏳ Pending")
                  }
                </p>
              )}
            </div>
          ))}
        </div>

        {submission.feedback && (
          <div className="mt-6">
            <h3 className="font-bold mb-2">Teacher&apos;s Feedback</h3>
            <p>{submission.feedback}</p>
          </div>
        )}
      </div>

      {/* Mobile back button */}
      <div className="flex justify-center mt-8 print:hidden lg:hidden">
        <Button variant="outline" asChild>
          <Link href="/student/submissions">
            Back to Submissions
          </Link>
        </Button>
      </div>
    </div>
  );
}