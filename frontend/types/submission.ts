export interface Question {
  _id: string;
  questionText: string;
  type: "MCQ" | "TEXT" | "CODE";
  options?: { text: string }[];
  correctAnswerIndex?: number;
  marks: number;
}

export interface Answer {
  questionId: Question;
  answer: string;
  awardedMarks?: number;
  teacherComment?: string;
  isCorrect?: boolean | null;
  _id?: string;
}

export interface Assignment {
  _id: string;
  title: string;
  totalMarks: number;
  deadline: string;
}

export interface Submission {
  _id: string;
  assignmentId: Assignment;
  studentId?: string;
  answers: Answer[];
  totalScore: number;
  feedback: string;
  status: "SUBMITTED" | "EVALUATED";
  createdAt: string;
  updatedAt?: string;
}

export interface SubmissionStats {
  totalQuestions: number;
  answeredQuestions: number;
  correctCount: number;
  incorrectCount: number;
  pendingCount: number;
  percentageScore: number;
  isPassed: boolean;
}

export interface ApiResponse {
  submission: Submission;
}