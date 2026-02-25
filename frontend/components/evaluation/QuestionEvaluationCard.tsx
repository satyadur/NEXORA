"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  AlertCircle, 
  Code2, 
  Type, 
  ListChecks,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Award,
  HelpCircle,
  XCircle,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { QuestionEvaluation } from "@/types/evaluation";
import { validateMarks } from "@/lib/evaluation-utils";
import { CorrectToggle } from "./CorrectToggle";

interface QuestionEvaluationCardProps {
  question: QuestionEvaluation;
  isEvaluated: boolean;
  onMarkChange: (value: number) => void;
  onCommentChange: (value: string) => void;
  onCorrectChange: (value: boolean | null) => void;
}

export function QuestionEvaluationCard({
  question,
  isEvaluated,
  onMarkChange,
  onCommentChange,
  onCorrectChange,
}: QuestionEvaluationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [markError, setMarkError] = useState<string | null>(null);
  const [showAutoMarkHint, setShowAutoMarkHint] = useState(false);

  // Auto-mark when correct/incorrect is toggled
const handleAutoMark = (isCorrect: boolean) => {
  if (isCorrect) {
    onMarkChange(question.maxMarks);
    setShowAutoMarkHint(true);
    setTimeout(() => setShowAutoMarkHint(false), 3000);
  } else {
    onMarkChange(0);
  }
};

  // Suggest auto-mark if marks don't match correctness
  useEffect(() => {
    if (question.type !== "MCQ" && question.isCorrect !== null) {
      const shouldBeFullMarks = question.isCorrect && question.awardedMarks !== question.maxMarks;
      const shouldBeZeroMarks = !question.isCorrect && question.awardedMarks > 0;
      
      if (shouldBeFullMarks || shouldBeZeroMarks) {
        setShowAutoMarkHint(true);
      } else {
        setShowAutoMarkHint(false);
      }
    }
  }, [question.isCorrect, question.awardedMarks, question.maxMarks, question.type]);

  const handleMarkInput = (value: string) => {
    const numValue = Number(value);
    if (validateMarks(numValue, question.maxMarks)) {
      setMarkError(null);
      onMarkChange(numValue);
    } else {
      setMarkError(`Marks must be between 0 and ${question.maxMarks}`);
    }
  };

  const getQuestionTypeIcon = () => {
    switch (question.type) {
      case "MCQ":
        return <ListChecks className="h-4 w-4" />;
      case "TEXT":
        return <Type className="h-4 w-4" />;
      case "CODE":
        return <Code2 className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getQuestionTypeColor = () => {
    switch (question.type) {
      case "MCQ": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200";
      case "TEXT": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200";
      case "CODE": return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200";
      default: return "";
    }
  };

  const isOverMax = question.awardedMarks > question.maxMarks;

  // Determine if marks are appropriate for correctness
  const getMarkSuggestion = () => {
    if (question.type === "MCQ" || question.isCorrect === null) return null;
    
    if (question.isCorrect && question.awardedMarks < question.maxMarks) {
      return {
        message: `Should be ${question.maxMarks} marks for correct answer`,
        action: () => onMarkChange(question.maxMarks),
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-900/10",
        borderColor: "border-green-200",
      };
    }
    
    if (!question.isCorrect && question.awardedMarks > 0) {
      return {
        message: "Should be 0 marks for incorrect answer",
        action: () => onMarkChange(0),
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-900/10",
        borderColor: "border-red-200",
      };
    }
    
    return null;
  };

  const markSuggestion = getMarkSuggestion();

  return (
    <Card className={`overflow-hidden transition-all duration-200 border-l-4 ${
      isOverMax 
        ? 'border-l-red-500 shadow-red-100' 
        : markSuggestion 
        ? 'border-l-yellow-500 shadow-yellow-100'
        : question.isCorrect === true
        ? 'border-l-green-500'
        : question.isCorrect === false
        ? 'border-l-red-500'
        : 'border-l-gray-300'
    }`}>
      <CardHeader 
        className="pb-3 cursor-pointer bg-gradient-to-r from-muted/30 to-transparent"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`gap-1 ${getQuestionTypeColor()}`}>
                {getQuestionTypeIcon()}
                {question.type}
              </Badge>
              
              <Badge variant="secondary" className="gap-1">
                <Award className="h-3 w-3" />
                {question.maxMarks} marks
              </Badge>
              
              {/* Status indicators */}
              {question.isEvaluated && (
                <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800">
                  <CheckCircle2 className="h-3 w-3" />
                  Evaluated
                </Badge>
              )}
              
              {question.type !== "MCQ" && question.isCorrect !== null && (
                <Badge 
                  variant="outline" 
                  className={`gap-1 ${
                    question.isCorrect 
                      ? 'bg-green-100 text-green-800 border-green-200' 
                      : 'bg-red-100 text-red-800 border-red-200'
                  }`}
                >
                  {question.isCorrect ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" />
                      Correct
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3" />
                      Incorrect
                    </>
                  )}
                </Badge>
              )}

              {question.type !== "MCQ" && question.isCorrect === null && !isEvaluated && (
                <Badge variant="outline" className="gap-1 bg-yellow-100 text-yellow-800 border-yellow-200">
                  <HelpCircle className="h-3 w-3" />
                  Pending Review
                </Badge>
              )}

              {/* Auto-mark hint */}
              {showAutoMarkHint && (
                <Badge variant="outline" className="gap-1 bg-blue-100 text-blue-800 border-blue-200 animate-pulse">
                  <Sparkles className="h-3 w-3" />
                  Auto-marked!
                </Badge>
              )}
            </div>
            
            <CardTitle className="text-base font-medium line-clamp-2">
              Question {question.index + 1}: {question.questionText}
            </CardTitle>
            
            <CardDescription>
              Max Marks: {question.maxMarks} | Type: {question.type}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium">Awarded</div>
              <div className={`text-lg font-bold ${isOverMax ? 'text-red-600' : ''}`}>
                {question.awardedMarks}/{question.maxMarks}
              </div>
            </div>
            <Button variant="ghost" size="icon">
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 pt-4">
          {/* Options for MCQ */}
          {question.type === "MCQ" && question.options && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Options:</p>
              <div className="grid gap-2">
                {question.options.map((opt, idx) => {
                  const isSelectedOption = opt.text === question.studentAnswer;
                  
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border transition-all ${
                        isSelectedOption
                          ? question.isCorrect
                            ? 'bg-green-50 border-green-300 dark:bg-green-900/20'
                            : 'bg-red-50 border-red-300 dark:bg-red-900/20'
                          : 'bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={isSelectedOption ? 'font-medium' : ''}>{opt.text}</span>
                        {isSelectedOption && (
                          <Badge variant="outline" className="text-xs bg-background">
                            Student&apos;s answer
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Student Answer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-muted-foreground">Student Answer:</p>
                {question.type === "CODE" && <Code2 className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>
            
            <div className={`p-4 rounded-lg border ${
              question.type === "CODE" 
                ? 'bg-slate-900 text-slate-50 font-mono text-sm' 
                : 'bg-muted'
            }`}>
              <pre className="whitespace-pre-wrap font-sans">
                {question.studentAnswer || <span className="text-muted-foreground italic">No answer provided</span>}
              </pre>
            </div>
          </div>

          {/* Correct/Incorrect Toggle with Auto-mark */}
          {question.type !== "MCQ" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-muted-foreground">Evaluation:</p>
              </div>
              <CorrectToggle
                value={question.isCorrect}
                onChange={onCorrectChange}
                onAutoMark={handleAutoMark}
                disabled={isEvaluated}
                type={question.type}
                maxMarks={question.maxMarks}
                currentMarks={question.awardedMarks}
              />
            </div>
          )}

          {/* Mark Input with Suggestion */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">Awarded Marks</p>
            </div>
            
            {markError && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{markError}</AlertDescription>
              </Alert>
            )}

            {/* Mark Suggestion Banner */}
            {markSuggestion && !isEvaluated && (
              <div className={`flex items-center justify-between p-3 rounded-lg border ${markSuggestion.bgColor} ${markSuggestion.borderColor}`}>
                <div className="flex items-center gap-2">
                  <Sparkles className={`h-4 w-4 ${markSuggestion.color}`} />
                  <span className={`text-sm ${markSuggestion.color}`}>{markSuggestion.message}</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={markSuggestion.action}
                  className="h-7 text-xs gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Apply
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Input
                type="number"
                min={0}
                max={question.maxMarks}
                step={question.type === "MCQ" ? 1 : 0.5}
                value={question.awardedMarks}
                disabled={isEvaluated}
                onChange={(e) => handleMarkInput(e.target.value)}
                className={isOverMax ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              
              {/* Quick mark buttons */}
              {!isEvaluated && question.type !== "MCQ" && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-10 w-10"
                    onClick={() => onMarkChange(question.maxMarks)}
                    disabled={question.awardedMarks === question.maxMarks}
                    title={`Set to full marks (${question.maxMarks})`}
                  >
                    Max
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-10 w-10"
                    onClick={() => onMarkChange(0)}
                    disabled={question.awardedMarks === 0}
                    title="Set to zero"
                  >
                    0
                  </Button>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Enter marks between 0 and {question.maxMarks}
            </p>
          </div>

          {/* Teacher Comment */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">Teacher Comment</p>
            </div>
            <Textarea
              value={question.teacherComment}
              disabled={isEvaluated}
              onChange={(e) => onCommentChange(e.target.value)}
              placeholder="Add feedback for this question..."
              className="min-h-[80px]"
            />
          </div>

          {/* Quick Actions */}
          {!isEvaluated && (
            <div className="flex justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  onMarkChange(question.maxMarks);
                  onCorrectChange(true);
                }}
                className="text-green-600"
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Mark Correct & Full
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  onMarkChange(0);
                  onCorrectChange(false);
                }}
                className="text-red-600"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Mark Incorrect & Zero
              </Button>
            </div>
          )}
        </CardContent>
      )}

      {isOverMax && (
        <CardFooter className="bg-red-50 dark:bg-red-900/10 py-2">
          <p className="text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Awarded marks exceed maximum allowed ({question.maxMarks})
          </p>
        </CardFooter>
      )}
    </Card>
  );
}