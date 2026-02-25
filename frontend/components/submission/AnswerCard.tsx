"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  XCircle, 
  Code2, 
  Type, 
  ListChecks,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Award,
  MessageSquare,
} from "lucide-react";
import { Question } from "@/types/submission";

interface AnswerCardProps {
  index: number;
  question: Question;
  answer: string;
  isEvaluated: boolean;
  isCorrect?: boolean | null;
  teacherComment?: string;
}

export function AnswerCard({ 
  index, 
  question, 
  answer, 
  isEvaluated,
  isCorrect,
  teacherComment,
}: AnswerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getQuestionTypeIcon = () => {
    switch (question.type) {
      case "MCQ":
        return <ListChecks className="h-4 w-4" />;
      case "TEXT":
        return <Type className="h-4 w-4" />;
      case "CODE":
        return <Code2 className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getQuestionTypeColor = () => {
    switch (question.type) {
      case "MCQ": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "TEXT": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "CODE": return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      default: return "";
    }
  };

  const isMatchingCorrect = question.type === "MCQ" && 
    question.correctAnswerIndex !== undefined &&
    question.options &&
    question.options[question.correctAnswerIndex]?.text === answer;

  const showCorrect = isEvaluated && (
    question.type === "MCQ" ? isMatchingCorrect : isCorrect === true
  );
  
  const showIncorrect = isEvaluated && (
    question.type === "MCQ" ? !isMatchingCorrect : isCorrect === false
  );

  const isCode = question.type === "CODE";
  const awardedMarks = isCorrect === true ? question.marks : isCorrect === false ? 0 : undefined;

  // Determine card border color based on status
  const getBorderColor = () => {
    if (!isEvaluated) return "border-l-4 border-l-yellow-400";
    if (showCorrect) return "border-l-4 border-l-green-500";
    if (showIncorrect) return "border-l-4 border-l-red-500";
    return "";
  };

  return (
    <Card className={`overflow-hidden transition-all duration-200 hover:shadow-lg ${getBorderColor()}`}>
      {/* Header */}
      <div 
        className="p-4 cursor-pointer bg-gradient-to-r from-muted/30 to-transparent"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`gap-1 ${getQuestionTypeColor()}`}>
                {getQuestionTypeIcon()}
                {question.type}
              </Badge>
              
              <Badge variant="secondary" className="gap-1">
                <Award className="h-3 w-3" />
                {question.marks} marks
              </Badge>

              {/* Status Badge */}
              {isEvaluated && (
                showCorrect ? (
                  <Badge className="gap-1 bg-green-500 hover:bg-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    Correct
                  </Badge>
                ) : showIncorrect ? (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Incorrect
                  </Badge>
                ) : question.type !== "MCQ" && isCorrect === null && (
                  <Badge variant="outline" className="gap-1 bg-yellow-100 text-yellow-800 border-yellow-200">
                    <HelpCircle className="h-3 w-3" />
                    Pending Review
                  </Badge>
                )
              )}
            </div>

            <h3 className="font-semibold text-lg">
              Question {index + 1}: {question.questionText}
            </h3>
          </div>

          <Button variant="ghost" size="icon" className="shrink-0">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <CardContent className="space-y-6 pt-4">
          {/* Options for MCQ */}
          {question.type === "MCQ" && question.options && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Options:</h4>
              <div className="grid gap-2">
                {question.options.map((opt, idx) => {
                  const isCorrectOption = question.correctAnswerIndex === idx;
                  const isSelectedOption = opt.text === answer;
                  
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border transition-all ${
                        isSelectedOption
                          ? isCorrectOption
                            ? 'bg-green-50 border-green-300 dark:bg-green-900/20 shadow-sm'
                            : 'bg-red-50 border-red-300 dark:bg-red-900/20 shadow-sm'
                          : isCorrectOption && isEvaluated
                          ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/20'
                          : 'bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={isSelectedOption ? 'font-medium' : ''}>{opt.text}</span>
                        <div className="flex items-center gap-2">
                          {isSelectedOption && (
                            <Badge variant="outline" className="text-xs bg-background">
                              Your Answer
                            </Badge>
                          )}
                          {isCorrectOption && isEvaluated && !isSelectedOption && (
                            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                              Correct Answer
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Student Answer */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground">Your Answer:</h4>
              {isEvaluated && question.type !== "MCQ" && isCorrect !== undefined && (
                <Badge variant="outline" className={
                  isCorrect === true 
                    ? 'bg-green-100 text-green-800 border-green-300' 
                    : 'bg-red-100 text-red-800 border-red-300'
                }>
                  {isCorrect === true ? '+' : '-'}{question.marks} marks
                </Badge>
              )}
            </div>
            
            <div className={`p-4 rounded-lg border ${
              isCode 
                ? 'bg-slate-900 text-slate-50 font-mono text-sm' 
                : 'bg-muted'
            } ${
              isEvaluated && showCorrect 
                ? 'border-green-300 ring-1 ring-green-300' 
                : isEvaluated && showIncorrect 
                ? 'border-red-300 ring-1 ring-red-300' 
                : ''
            }`}>
              <pre className="whitespace-pre-wrap font-sans">
                {answer || <span className="text-muted-foreground italic">No answer provided</span>}
              </pre>
            </div>
          </div>

          {/* Teacher's Comment */}
          {teacherComment && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium text-muted-foreground">Teacher&apos;s Comment:</h4>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                <p className="text-sm">{teacherComment}</p>
              </div>
            </div>
          )}

          {/* Correct Answer for Incorrect Responses */}
          {isEvaluated && (
            <>
              {question.type === "MCQ" && !isMatchingCorrect && question.correctAnswerIndex !== undefined && question.options && (
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <h4 className="text-sm font-medium text-green-800 dark:text-green-400">
                      Correct Answer:
                    </h4>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 pl-6">
                    {question.options[question.correctAnswerIndex]?.text}
                  </p>
                </div>
              )}

              {question.type !== "MCQ" && isCorrect === false && (
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 mb-2">
                    <HelpCircle className="h-4 w-4 text-amber-600" />
                    <h4 className="text-sm font-medium text-amber-800 dark:text-amber-400">
                      Feedback:
                    </h4>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-300 pl-6">
                    Your answer was marked as incorrect. Review the teacher&apos;s comment above for more details.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}