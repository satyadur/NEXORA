import { QuestionEvaluation, EvaluationStats } from "@/types/evaluation";

export const calculateStats = (
  answers: { awardedMarks: number; isCorrect?: boolean | null }[],
  totalPossibleMarks: number,
  totalQuestions: number
): EvaluationStats => {
  const awardedMarks = answers.reduce((sum, a) => sum + (Number(a.awardedMarks) || 0), 0);
  const questionsEvaluated = answers.filter(a => (Number(a.awardedMarks) || 0) > 0).length;
  const remainingMarks = totalPossibleMarks - awardedMarks;
  
  const correctCount = answers.filter(a => a.isCorrect === true).length;
  const incorrectCount = answers.filter(a => a.isCorrect === false).length;
  const pendingCount = answers.filter(a => a.isCorrect === null).length;

  return {
    totalMarks: totalPossibleMarks,
    awardedMarks,
    percentage: totalPossibleMarks > 0 ? (awardedMarks / totalPossibleMarks) * 100 : 0,
    questionsEvaluated,
    totalQuestions,
    remainingMarks,
    correctCount,
    incorrectCount,
    pendingCount,
  };
};

export const validateMarks = (value: number, maxMarks: number): boolean => {
  return value >= 0 && value <= maxMarks;
};

export const getScoreColor = (percentage: number): string => {
  if (percentage >= 80) return "text-green-600";
  if (percentage >= 60) return "text-blue-600";
  if (percentage >= 40) return "text-yellow-600";
  return "text-red-600";
};

export const getScoreBadge = (percentage: number): { label: string; color: string } => {
  if (percentage >= 80) return { label: "Excellent", color: "bg-green-100 text-green-800 dark:bg-green-900/20" };
  if (percentage >= 60) return { label: "Good", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20" };
  if (percentage >= 40) return { label: "Average", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20" };
  return { label: "Needs Improvement", color: "bg-red-100 text-red-800 dark:bg-red-900/20" };
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