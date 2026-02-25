"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useMemo, useCallback } from "react";

import {
  getSubmissionDetailsApi,
  evaluateSubmissionApi,
  type SubmissionDetails,
} from "@/lib/api/teacher.api";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, ArrowLeft, Save, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { EvaluationSummary } from "@/components/evaluation/EvaluationSummary";
import { QuestionEvaluationCard } from "@/components/evaluation/QuestionEvaluationCard";
import { OverallFeedback } from "@/components/evaluation/OverallFeedback";
import { QuickActionBar } from "@/components/evaluation/QuickActionBar";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { calculateStats, formatDate } from "@/lib/evaluation-utils";
import type { QuestionEvaluation, EvaluationStats } from "@/types/evaluation";
import { Progress } from "@/components/ui/progress";

export default function EvaluateSubmissionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // State management
  const [answers, setAnswers] = useState<SubmissionDetails["answers"]>([]);
  const [feedback, setFeedback] = useState("");
  const [activeTab, setActiveTab] = useState("summary");
  const [showPreview, setShowPreview] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Fetch submission details
  const { data, isLoading, error, refetch } = useQuery<SubmissionDetails>({
    queryKey: ["teacher-submission", id],
    queryFn: () => getSubmissionDetailsApi(id),
  });

 // Initialize state from data
useEffect(() => {
  if (!data) return;
  
  // Fix any inconsistencies - ensure correct answers have full marks
  const fixedAnswers = data.answers.map(ans => {
    if (ans.isCorrect === true && ans.awardedMarks === 0) {
      // This is inconsistent - correct answer should have marks
      return {
        ...ans,
        awardedMarks: ans.questionId.marks // Assign full marks
      };
    }
    return ans;
  });
  
  setAnswers(fixedAnswers);
  setFeedback(data.feedback ?? "");
}, [data]);

  // Determine if evaluated
  const isEvaluated = data?.status === "EVALUATED";

  // Calculate statistics
  const stats: EvaluationStats = useMemo(() => 
    calculateStats(
      answers,
      data?.assignmentId?.totalMarks || 0,
      answers.length
    ),
    [answers, data?.assignmentId?.totalMarks]
  );

  // Prepare question evaluations
  const questionEvaluations: QuestionEvaluation[] = useMemo(() => 
    answers.map((ans, index) => ({
      index,
      questionId: ans.questionId._id,
      type: ans.questionId.type,
      questionText: ans.questionId.questionText,
      maxMarks: ans.questionId.marks,
      studentAnswer: ans.answer,
      options: ans.questionId.options,
      awardedMarks: Number(ans.awardedMarks) || 0,
      teacherComment: ans.teacherComment || "",
      isCorrect: ans.isCorrect ?? null,
      isOverMax: (Number(ans.awardedMarks) || 0) > ans.questionId.marks,
      isEvaluated: isEvaluated,
    })),
    [answers, isEvaluated]
  );

  // Check if all questions are properly evaluated
  const canSubmit = useMemo(() => {
    return questionEvaluations.every(q => {
      if (q.type === "MCQ") {
        return !q.isOverMax;
      } else {
        return q.isCorrect !== null && !q.isOverMax;
      }
    });
  }, [questionEvaluations]);

  // Get pending questions count
  const pendingCount = useMemo(() => {
    return questionEvaluations.filter(q => 
      q.type !== "MCQ" && q.isCorrect === null
    ).length;
  }, [questionEvaluations]);

  // Evaluation mutation - Define this BEFORE any handlers that use it
  const mutation = useMutation({
    mutationFn: () =>
      evaluateSubmissionApi(id, {
        answers: answers.map((a) => ({
          questionId: a.questionId._id,
          awardedMarks: Number(a.awardedMarks) || 0,
          teacherComment: a.teacherComment || "",
          isCorrect: a.isCorrect ?? null,
        })),
        feedback,
      }),
    onSuccess: () => {
      toast.success("Submission evaluated successfully", {
        description: "The student will be notified of their results.",
      });
      router.push("/teacher/submissions");
    },
    onError: (error) => {
      toast.error("Failed to evaluate submission", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
  });

  // Handlers - Define these after mutation
  const handleMarkChange = useCallback((index: number, value: number) => {
    setAnswers(prev => {
      const updated = [...prev];
      updated[index].awardedMarks = value;
      return updated;
    });
  }, []);

  const handleCommentChange = useCallback((index: number, value: string) => {
    setAnswers(prev => {
      const updated = [...prev];
      updated[index].teacherComment = value;
      return updated;
    });
  }, []);

  const handleCorrectChange = useCallback((index: number, value: boolean | null) => {
  setAnswers(prev => {
    const updated = [...prev];
    updated[index].isCorrect = value;
    
    // Auto-assign marks based on correctness
    if (value === true) {
      // If marked correct, assign full marks
      updated[index].awardedMarks = updated[index].questionId.marks;
    } else if (value === false) {
      // If marked incorrect, assign zero marks
      updated[index].awardedMarks = 0;
    }
    // If value is null, keep existing marks (for pending state)
    
    return updated;
  });
}, []);

  const handleSaveDraft = useCallback(() => {
    localStorage.setItem(`evaluation_draft_${id}`, JSON.stringify({
      answers,
      feedback,
      timestamp: new Date().toISOString(),
    }));
    toast.success("Draft saved", {
      description: "Your progress has been saved locally.",
    });
  }, [answers, feedback, id]);

  const handleLoadDraft = useCallback(() => {
    const draft = localStorage.getItem(`evaluation_draft_${id}`);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setAnswers(parsed.answers);
        setFeedback(parsed.feedback);
        toast.success("Draft loaded", {
          description: `Last saved: ${formatDate(parsed.timestamp)}`,
        });
      } catch (e) {
        toast.error("Failed to load draft");
      }
    } else {
      toast.info("No draft found");
    }
  }, [id]);

  const handleSubmit = useCallback(() => {
    // Validate all marks are within range
    const hasErrors = questionEvaluations.some(q => q.isOverMax);
    if (hasErrors) {
      toast.error("Invalid marks", {
        description: "Some questions have marks exceeding the maximum allowed.",
      });
      return;
    }

    // Check for pending text/code questions
    if (pendingCount > 0) {
      toast.error("Pending evaluation", {
        description: `Please evaluate ${pendingCount} text/code question(s) using the Correct/Incorrect toggle.`,
      });
      return;
    }

    // Confirm submission
    if (confirm("Are you sure you want to submit this evaluation? This action cannot be undone.")) {
      mutation.mutate();
    }
  }, [questionEvaluations, pendingCount, mutation]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onCorrect: () => {
      if (activeTab === "summary" && questionEvaluations[currentQuestionIndex]?.type !== "MCQ") {
        handleCorrectChange(currentQuestionIndex, true);
        handleMarkChange(currentQuestionIndex, questionEvaluations[currentQuestionIndex].maxMarks);
        toast.success("Marked as correct with full marks");
      }
    },
    onIncorrect: () => {
      if (activeTab === "summary" && questionEvaluations[currentQuestionIndex]?.type !== "MCQ") {
        handleCorrectChange(currentQuestionIndex, false);
        handleMarkChange(currentQuestionIndex, 0);
        toast.success("Marked as incorrect with zero marks");
      }
    },
    onNext: () => {
      if (activeTab === "summary" && currentQuestionIndex < questionEvaluations.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    },
    onPrevious: () => {
      if (activeTab === "summary" && currentQuestionIndex > 0) {
        setCurrentQuestionIndex(prev => prev - 1);
      }
    },
    onSave: handleSaveDraft,
    enabled: !isEvaluated && activeTab === "summary",
  });

  // Loading state
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

  // Error state
  if (error || !data) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="size-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Failed to Load Submission</h2>
            <p className="text-muted-foreground">
              There was an error loading this submission. Please try again.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => router.back()} variant="outline">
                Go Back
              </Button>
              <Button onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header with navigation and actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/teacher/submissions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Evaluate Submission
            </h1>
            <p className="text-muted-foreground">
              {data.assignmentId.title} • {data.studentId.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEvaluated && (
            <>
              <Button variant="outline" size="sm" onClick={handleLoadDraft} className="gap-2">
                <Eye className="h-4 w-4" />
                Load Draft
              </Button>
              <Button variant="outline" size="sm" onClick={handleSaveDraft} className="gap-2">
                <Save className="h-4 w-4" />
                Save Draft
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowPreview(!showPreview)}
                className="gap-2"
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPreview ? "Hide Preview" : "Show Preview"}
              </Button>
            </>
          )}
          
          {isEvaluated && (
            <div className="px-4 py-2 rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 font-medium flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse" />
              Already Evaluated
            </div>
          )}
        </div>
      </div>

      {/* Preview Banner */}
      {showPreview && !isEvaluated && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
              <Eye className="h-4 w-4" />
              <span className="text-sm font-medium">Preview Mode - Students will see this feedback</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Section */}
      <EvaluationSummary
        stats={stats}
        studentName={data.studentId.name}
        studentEmail={data.studentId.email}
        assignmentTitle={data.assignmentId.title}
        submittedAt={formatDate(data.submittedAt || data.createdAt)}
      />

      {/* Progress Indicator */}
      {!isEvaluated && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Evaluation Progress</span>
                <span className="text-muted-foreground">
                  {stats.questionsEvaluated}/{stats.totalQuestions} Questions • {pendingCount} Pending Review
                </span>
              </div>
              <Progress 
                value={(stats.questionsEvaluated / stats.totalQuestions) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="summary" className="gap-2">
            Questions Review
            {pendingCount > 0 && (
              <span className="ml-1 h-5 w-5 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="feedback" className="gap-2">
            Feedback & Submit
            {!canSubmit && activeTab !== "summary" && (
              <span className="ml-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          {questionEvaluations.map((question) => (
            <QuestionEvaluationCard
              key={question.questionId}
              question={question}
              isEvaluated={isEvaluated}
              onMarkChange={(value) => handleMarkChange(question.index, value)}
              onCommentChange={(value) => handleCommentChange(question.index, value)}
              onCorrectChange={(value) => handleCorrectChange(question.index, value)}
            />
          ))}

          {/* Quick navigation to feedback */}
          <div className="flex justify-between items-center pt-4">
            <div className="text-sm text-muted-foreground">
              {pendingCount > 0 ? (
                <span className="text-yellow-600">⚠️ {pendingCount} question(s) pending evaluation</span>
              ) : (
                <span className="text-green-600">✓ All questions evaluated</span>
              )}
            </div>
            <Button 
              onClick={() => setActiveTab("feedback")}
              disabled={pendingCount > 0}
            >
              Continue to Feedback
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="feedback">
          <OverallFeedback
            feedback={feedback}
            stats={stats}
            isEvaluated={isEvaluated}
            isSubmitting={mutation.isPending}
            onFeedbackChange={setFeedback}
            onSubmit={handleSubmit}
            canSubmit={canSubmit}
            pendingCount={pendingCount}
          />
        </TabsContent>
      </Tabs>

      {/* Quick Action Bar */}
      {!isEvaluated && activeTab === "summary" && (
        <QuickActionBar
          currentQuestion={currentQuestionIndex}
          totalQuestions={questionEvaluations.length}
          pendingCount={pendingCount}
          onPrevious={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          onNext={() => setCurrentQuestionIndex(prev => Math.min(questionEvaluations.length - 1, prev + 1))}
          onMarkCorrect={() => {
            if (questionEvaluations[currentQuestionIndex]?.type !== "MCQ") {
              handleCorrectChange(currentQuestionIndex, true);
              handleMarkChange(currentQuestionIndex, questionEvaluations[currentQuestionIndex].maxMarks);
              toast.success("Marked as correct with full marks");
            }
          }}
          onMarkIncorrect={() => {
            if (questionEvaluations[currentQuestionIndex]?.type !== "MCQ") {
              handleCorrectChange(currentQuestionIndex, false);
              handleMarkChange(currentQuestionIndex, 0);
              toast.success("Marked as incorrect with zero marks");
            }
          }}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmit}
          canSubmit={canSubmit}
        />
      )}

      {/* Student Preview Section */}
      {showPreview && !isEvaluated && (
        <Card className="border-2 border-dashed border-primary/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Student Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm font-medium mb-2">Total Score: {stats.awardedMarks}/{stats.totalMarks}</p>
              <Progress value={stats.percentage} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Feedback:</p>
              <div className="p-3 rounded-lg border bg-card">
                {feedback || <span className="text-muted-foreground italic">No feedback provided yet</span>}
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              This is how students will see their evaluated submission.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}