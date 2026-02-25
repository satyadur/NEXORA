export type QuestionType = "MCQ" | "TEXT" | "CODE";

export interface OptionInput {
  text: string;
}

export interface QuestionInput {
  type: QuestionType;
  questionText: string;
  marks: number;
  options: OptionInput[];
  correctAnswerIndex?: number;
}

export interface AssignmentFormValues {
  classroomId: string;
  title: string;
  totalMarks: number;
  deadline: string;
  questions: QuestionInput[];
}
