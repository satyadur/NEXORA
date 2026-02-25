import { Submission, SubmissionStats } from "@/types/submission";

export const calculateSubmissionStats = (submission: Submission): SubmissionStats => {
  const totalQuestions = submission.answers.length;
  const answeredQuestions = submission.answers.filter((a: Answer) => a.answer && a.answer.trim() !== '').length;
  
  const correctCount = submission.answers.filter((a: Answer) => a.isCorrect === true).length;
  const incorrectCount = submission.answers.filter((a: Answer) => a.isCorrect === false).length;
  const pendingCount = submission.answers.filter((a: Answer) => a.isCorrect === null).length;

  const percentageScore = submission.totalScore && submission.assignmentId.totalMarks
    ? (submission.totalScore / submission.assignmentId.totalMarks) * 100
    : 0;

  return {
    totalQuestions,
    answeredQuestions,
    correctCount,
    incorrectCount,
    pendingCount,
    percentageScore,
    isPassed: percentageScore >= 40,
  };
};

export const getStatusConfig = (status: string) => {
  switch (status) {
    case "EVALUATED":
      return {
        label: "Evaluated",
        variant: "default" as const,
        color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800",
      };
    case "SUBMITTED":
      return {
        label: "Pending Review",
        variant: "secondary" as const,
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
      };
    default:
      return {
        label: status,
        variant: "outline" as const,
        color: "",
      };
  }
};

export const getScoreColor = (percentage: number): string => {
  if (percentage >= 80) return "text-green-600";
  if (percentage >= 60) return "text-blue-600";
  if (percentage >= 40) return "text-yellow-600";
  return "text-red-600";
};

export const getScoreBadge = (percentage: number): { label: string; color: string } => {
  if (percentage >= 80) return { 
    label: "Excellent", 
    color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800" 
  };
  if (percentage >= 60) return { 
    label: "Good", 
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800" 
  };
  if (percentage >= 40) return { 
    label: "Average", 
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800" 
  };
  return { 
    label: "Needs Improvement", 
    color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800" 
  };
};

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

import { Answer } from "@/types/submission";