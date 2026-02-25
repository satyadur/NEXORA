"use client";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2, Code2 } from "lucide-react";

interface QuestionCardProps {
  question: {
    _id: string;
    type: "MCQ" | "TEXT" | "CODE";
    questionText: string;
    options?: { text: string }[];
    marks: number;
  };
  currentAnswer: string;
  currentIndex: number;
  totalQuestions: number;
  isLast: boolean;
  isSubmitting: boolean;
  onAnswer: (questionId: string, value: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function QuestionCard({
  question,
  currentAnswer,
  currentIndex,
  totalQuestions,
  isLast,
  isSubmitting,
  onAnswer,
  onPrevious,
  onNext,
  onSubmit,
}: QuestionCardProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="outline" className="mb-2">
              Question {currentIndex + 1} of {totalQuestions}
            </Badge>
            <CardTitle className="text-xl">
              {question.questionText}
            </CardTitle>
          </div>
          <Badge className="text-lg px-3 py-1">
            {question.marks} marks
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* MCQ */}
        {question.type === "MCQ" && (
          <RadioGroup
            value={currentAnswer}
            onValueChange={(value) => onAnswer(question._id, value)}
            className="space-y-3"
          >
            {question.options?.map((opt, idx) => (
              <div
                key={idx}
                className="flex items-center space-x-2 rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onAnswer(question._id, opt.text)}
              >
                <RadioGroupItem value={opt.text} id={`opt-${idx}`} />
                <Label htmlFor={`opt-${idx}`} className="flex-1 cursor-pointer">
                  {opt.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {/* TEXT */}
        {question.type === "TEXT" && (
          <div className="space-y-2">
            <Label>Your Answer</Label>
            <Textarea
              placeholder="Type your answer here..."
              value={currentAnswer}
              onChange={(e) => onAnswer(question._id, e.target.value)}
              className="min-h-[200px]"
            />
          </div>
        )}

        {/* CODE */}
        {question.type === "CODE" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-muted-foreground" />
              <Label>Code Solution</Label>
            </div>
            <Textarea
              placeholder="Write your code here..."
              value={currentAnswer}
              onChange={(e) => onAnswer(question._id, e.target.value)}
              className="font-mono min-h-[300px]"
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t flex justify-between py-4">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={currentIndex === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        <div className="flex gap-2">
          {isLast ? (
            <Button
              onClick={onSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Assignment
                  <CheckCircle2 className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <Button onClick={onNext}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}