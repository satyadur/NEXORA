"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getAssignmentDetailsApi,
  submitAssignmentApi,
} from "@/lib/api/student.api";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

import { OverviewStage } from "@/components/assignment/OverviewStage";
import { InstructionsStage } from "@/components/assignment/InstructionsStage";
import { QuizHeader } from "@/components/assignment/QuizHeader";
import { QuestionSidebar } from "@/components/assignment/QuestionSidebar";
import { QuestionCard } from "@/components/assignment/QuestionCard";
import { SubmittedStage } from "@/components/assignment/SubmittedStage";

import type {
  AssignmentData,
  Answer,
  Stage,
  AutoSaveStatus,
} from "@/types/assignment";
import { useAssignmentProtection } from "@/components/contexts/assignment-protection";

export default function StartAssignmentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { enableAssignmentMode, disableAssignmentMode } =
    useAssignmentProtection();

  // State management
  const [stage, setStage] = useState<Stage>("OVERVIEW");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("saved");
  const [isOnline, setIsOnline] = useState(true);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
const [violations, setViolations] = useState(0);
const MAX_VIOLATIONS = 3;
  // Enable assignment mode when component mounts
  useEffect(() => {
    enableAssignmentMode();
    return () => disableAssignmentMode();
  }, [enableAssignmentMode, disableAssignmentMode]);

  // Queries and mutations
  const { data, isLoading, error } = useQuery<AssignmentData>({
    queryKey: ["assignment-start", id],
    queryFn: () => getAssignmentDetailsApi(id),
    refetchOnWindowFocus: false,
  });

  const submitMutation = useMutation({
    mutationFn: () => submitAssignmentApi(id, { answers }),
    onSuccess: () => {
      setStage("SUBMITTED");
    },
  });

  // Network status monitoring
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (stage !== "QUIZ" || answers.length === 0) return;

    const saveTimer = setTimeout(() => {
      setAutoSaveStatus("saving");

      // Simulate auto-save (replace with actual API call)
      setTimeout(() => {
        setAutoSaveStatus("saved");
        localStorage.setItem(`assignment_${id}`, JSON.stringify(answers));
      }, 500);
    }, 2000);

    return () => clearTimeout(saveTimer);
  }, [answers, stage, id]);

  // Load saved answers from localStorage
  useEffect(() => {
    if (stage === "QUIZ") {
      const saved = localStorage.getItem(`assignment_${id}`);
      if (saved) {
        try {
          setAnswers(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to load saved answers");
        }
      }
    }
  }, [stage, id]);

  // Timer functionality
  useEffect(() => {
    if (!data?.assignment?.duration || stage !== "QUIZ") return;

    if (timeRemaining === null) {
      setTimeRemaining(data.assignment.duration * 60);
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev && prev > 0) {
          return prev - 1;
        } else {
          clearInterval(timer);
          if (answers.length === data.questions.length) {
            submitMutation.mutate();
          }
          return 0;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    data?.assignment?.duration,
    stage,
    data?.questions?.length,
    answers.length,
    submitMutation,
    timeRemaining,
  ]);
/* ================= SAFE STRICT EXAM MODE ================= */

useEffect(() => {
  if (stage !== "QUIZ") return;

  let isMounted = true;
  let cooldown = false;

  const SAFE_WINDOW = 2000; // ignore first 2 seconds
  const COOLDOWN_TIME = 3000; // prevent spam triggers

  const safeTimer = setTimeout(() => {
    // After 2 seconds protection becomes active
  }, SAFE_WINDOW);

  const triggerViolation = () => {
    if (!isMounted) return;
    if (cooldown) return;

    cooldown = true;

    setViolations((prev) => {
      const newCount = prev + 1;

      if (newCount >= MAX_VIOLATIONS) {
        submitMutation.mutate();
      }

      return newCount;
    });

    setTimeout(() => {
      cooldown = false;
    }, COOLDOWN_TIME);
  };

  /* ===== FORCE FULLSCREEN (SAFE) ===== */
  const enterFullScreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      // Do not trigger violation immediately
    }
  };

  enterFullScreen();

  const handleFullScreenChange = () => {
    if (!document.fullscreenElement) {
      triggerViolation();
    }
  };

  /* ===== TAB SWITCH ===== */
  const handleVisibilityChange = () => {
    if (document.hidden) {
      triggerViolation();
    }
  };

  /* ===== WINDOW BLUR ===== */
  const handleBlur = () => {
    triggerViolation();
  };

  /* ===== BLOCK DEVTOOLS SHORTCUTS ===== */
  const blockKeys = (e: KeyboardEvent) => {
    if (
      e.key === "F12" ||
      (e.ctrlKey && e.shiftKey && e.key === "I") ||
      (e.ctrlKey && e.shiftKey && e.key === "J") ||
      (e.ctrlKey && e.key === "U")
    ) {
      e.preventDefault();
      triggerViolation();
    }
  };

  /* ===== DISABLE RIGHT CLICK ===== */
  const disableRightClick = (e: MouseEvent) => {
    e.preventDefault();
  };

  /* ===== DISABLE COPY/PASTE ===== */
  const preventClipboard = (e: ClipboardEvent) => {
    e.preventDefault();
  };

  /* ===== PREVENT BACK BUTTON ===== */
  const preventBack = () => {
    window.history.pushState(null, "", window.location.href);
  };

  window.history.pushState(null, "", window.location.href);

  document.addEventListener("fullscreenchange", handleFullScreenChange);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("blur", handleBlur);
  document.addEventListener("keydown", blockKeys);
  document.addEventListener("contextmenu", disableRightClick);
  document.addEventListener("copy", preventClipboard);
  document.addEventListener("paste", preventClipboard);
  document.addEventListener("cut", preventClipboard);
  window.addEventListener("popstate", preventBack);

  return () => {
    isMounted = false;
    clearTimeout(safeTimer);

    document.removeEventListener("fullscreenchange", handleFullScreenChange);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("blur", handleBlur);
    document.removeEventListener("keydown", blockKeys);
    document.removeEventListener("contextmenu", disableRightClick);
    document.removeEventListener("copy", preventClipboard);
    document.removeEventListener("paste", preventClipboard);
    document.removeEventListener("cut", preventClipboard);
    window.removeEventListener("popstate", preventBack);
  };
}, [stage]);
  // Full-screen handlers
  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  }, []);

  // Prevent accidental navigation
  useEffect(() => {
    if (stage === "QUIZ") {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = "";
      };

      window.addEventListener("beforeunload", handleBeforeUnload);
      return () =>
        window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, [stage]);

  // Handle exit
  const handleExit = useCallback(() => {
    if (stage === "QUIZ" && answers.length > 0) {
      setShowExitDialog(true);
    } else {
      router.push("/student/assignments");
    }
  }, [stage, answers.length, router]);

  // Memoized values
  const progress = useMemo(
    () => (data ? (answers.length / data.questions.length) * 100 : 0),
    [data, answers.length],
  );

  const questionTypes = useMemo(
    () => (data ? Array.from(new Set(data.questions.map((q) => q.type))) : []),
    [data],
  );

  const mcqCount = useMemo(
    () => data?.questions.filter((q) => q.type === "MCQ").length || 0,
    [data],
  );

  const textCount = useMemo(
    () => data?.questions.filter((q) => q.type === "TEXT").length || 0,
    [data],
  );

  // Callbacks
  const handleAnswer = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => {
      const filtered = prev.filter((a) => a.questionId !== questionId);
      return [...filtered, { questionId, answer: value, savedAt: new Date() }];
    });
  }, []);

  const getAnswerForQuestion = useCallback(
    (questionId: string) => {
      return answers.find((a) => a.questionId === questionId)?.answer || "";
    },
    [answers],
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground animate-pulse">
            Loading your assignment...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="size-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Failed to Load Assignment</h2>
            <p className="text-muted-foreground">
              There was an error loading your assignment. Please try again.
            </p>
            <Button onClick={() => router.push("/student/assignments")}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { assignment, questions } = data;

  // Render based on stage
  return (
    <>
      {/* Global Dialogs */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exit Assignment?</DialogTitle>
            <DialogDescription>
              Your progress has been saved. You can continue later, but the
              timer will keep running.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowExitDialog(false)}>
              Continue Assignment
            </Button>
            <Button
              variant="destructive"
              onClick={() => router.push("/student/assignments")}
            >
              Exit Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Assignment?</DialogTitle>
            <DialogDescription>
              {answers.length === questions.length
                ? "You have answered all questions. Once submitted, you cannot make changes."
                : `You have answered ${answers.length} out of ${questions.length} questions. Unanswered questions will be marked as incomplete.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSubmitDialog(false)}
            >
              Review Answers
            </Button>
            <Button
              onClick={() => {
                  submitMutation.mutate();
                  setShowSubmitDialog(false);
              }}
            >
              Submit Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stage-based rendering */}
      {stage === "OVERVIEW" && (
        <OverviewStage
          title={assignment.title}
          totalMarks={assignment.totalMarks}
          description={assignment.description}
          deadline={assignment.deadline}
          questionsCount={questions.length}
          questionTypes={questionTypes}
          onStart={() => setStage("INSTRUCTIONS")}
        />
      )}

      {stage === "INSTRUCTIONS" && (
        <InstructionsStage
          questionsCount={questions.length}
          mcqCount={mcqCount}
          textCount={textCount}
          duration={assignment.duration}
          onBack={() => setStage("OVERVIEW")}
          onBegin={() => setStage("QUIZ")}
        />
      )}

      {stage === "QUIZ" && (
        <div className="min-h-screen bg-background">
          <QuizHeader
            title={assignment.title}
            progress={progress}
            autoSaveStatus={autoSaveStatus}
            isOnline={isOnline}
            timeRemaining={timeRemaining}
            isFullScreen={isFullScreen}
            onToggleSidebar={() => setShowSidebar(!showSidebar)}
            onToggleFullScreen={toggleFullScreen}
            onExit={handleExit}
            violations={violations}
          />

          <div className="flex h-screen pt-16">
            <QuestionSidebar
              questions={questions}
              answers={answers}
              currentQuestion={currentQuestion}
              showSidebar={showSidebar}
              onToggleSidebar={() => setShowSidebar(!showSidebar)}
              onQuestionSelect={setCurrentQuestion}
            />

            <div className="flex-1 overflow-y-auto bg-muted/10">
              <div className="max-w-4xl mx-auto p-6">
                <QuestionCard
                  question={questions[currentQuestion]}
                  currentAnswer={getAnswerForQuestion(
                    questions[currentQuestion]._id,
                  )}
                  currentIndex={currentQuestion}
                  totalQuestions={questions.length}
                  isLast={currentQuestion === questions.length - 1}
                  isSubmitting={submitMutation.isPending}
                  onAnswer={handleAnswer}
                  onPrevious={() =>
                    setCurrentQuestion(Math.max(0, currentQuestion - 1))
                  }
                  onNext={() =>
                    setCurrentQuestion(
                      Math.min(questions.length - 1, currentQuestion + 1),
                    )
                  }
                  onSubmit={() => setShowSubmitDialog(true)}
                />

                {/* Mobile Navigation */}
                <div className="mt-4 flex justify-between lg:hidden">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentQuestion(Math.max(0, currentQuestion - 1))
                    }
                    disabled={currentQuestion === 0}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentQuestion + 1} / {questions.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentQuestion(
                        Math.min(questions.length - 1, currentQuestion + 1),
                      )
                    }
                    disabled={currentQuestion === questions.length - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {stage === "SUBMITTED" && (
        <SubmittedStage
          answersCount={answers.length}
          questionsCount={questions.length}
          assignmentTitle={assignment.title}
          onBackToAssignments={() => router.push("/student/assignments")}
          onGoToDashboard={() => router.push("/student")}
        />
      )}
    </>
  );
}
