export interface QuestionEvaluation {
  index: number;
  questionId: string;
  type: "MCQ" | "TEXT" | "CODE";
  questionText: string;
  maxMarks: number;
  studentAnswer: string;
  options?: { text: string }[];
  awardedMarks: number;
  teacherComment: string;
  isCorrect: boolean | null; // true, false, or null for unevaluated
  isOverMax: boolean;
  isEvaluated: boolean;
}

export interface EvaluationStats {
  totalMarks: number;
  awardedMarks: number;
  percentage: number;
  questionsEvaluated: number;
  totalQuestions: number;
  remainingMarks: number;
  correctCount: number;
  incorrectCount: number;
  pendingCount: number;
}

export interface EvaluationFormData {
  answers: {
    questionId: string;
    awardedMarks: number;
    teacherComment: string;
  }[];
  feedback: string;
}

export interface Answer {
  questionId: {
    _id: string;
    questionText: string;
    type: "MCQ" | "TEXT" | "CODE";
    marks: number;
    options?: { text: string }[];
    correctAnswerIndex?: number;
  };
  answer: string;
  awardedMarks: number;
  teacherComment: string;
  isCorrect?: boolean | null; // Add this line
}

export interface SubmissionDetails {
  _id: string;
  assignmentId: {
    _id: string;
    title: string;
    totalMarks: number;
  };
  studentId: {
    _id: string;
    name: string;
    email: string;
  };
  answers: Array<{
    questionId: {
      _id: string;
      questionText: string;
      type: "MCQ" | "TEXT" | "CODE";
      marks: number;
      options?: { text: string }[];
      correctAnswerIndex?: number;
    };
    answer: string;
    awardedMarks: number;
    teacherComment: string;
    isCorrect?: boolean | null;
  }>;
  totalScore: number;
  feedback: string;
  status: "SUBMITTED" | "EVALUATED";
  submittedAt: string;
  createdAt: string;
  updatedAt?: string;
}