"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface QuestionSidebarProps {
  questions: Array<{ _id: string }>;
  answers: Array<{ questionId: string }>;
  currentQuestion: number;
  showSidebar: boolean;
  onToggleSidebar: () => void;
  onQuestionSelect: (index: number) => void;
}

export function QuestionSidebar({
  questions,
  answers,
  currentQuestion,
  showSidebar,
  onToggleSidebar,
  onQuestionSelect,
}: QuestionSidebarProps) {
  const progress = (answers.length / questions.length) * 100;

  return (
    <div className={`
      fixed lg:static inset-y-0 left-0 z-40 w-80 bg-background border-r transform transition-transform duration-300 ease-in-out
      ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16'}
    `}>
      <div className="h-full flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold ${!showSidebar && 'lg:hidden'}`}>Questions</h3>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onToggleSidebar}
              className="hidden lg:flex"
            >
              {showSidebar ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className={`grid ${showSidebar ? 'grid-cols-4' : 'lg:grid-cols-1'} gap-2`}>
            {questions.map((q, index) => {
              const isAnswered = answers.some(a => a.questionId === q._id);
              const isCurrent = currentQuestion === index;
              
              return (
                <Button
                  key={q._id}
                  variant={isCurrent ? "default" : isAnswered ? "secondary" : "outline"}
                  className={`
                    ${!showSidebar && 'lg:w-full lg:p-2'}
                    ${isCurrent && 'ring-2 ring-primary ring-offset-2'}
                  `}
                  onClick={() => onQuestionSelect(index)}
                >
                  <span className={!showSidebar ? 'lg:hidden' : ''}>{index + 1}</span>
                  {!showSidebar && (
                    <span className="hidden lg:inline">
                      {isAnswered ? '✓' : index + 1}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t">
          <div className={`space-y-2 ${!showSidebar && 'lg:hidden'}`}>
            <div className="flex items-center justify-between text-sm">
              <span>Answered</span>
              <Badge>{answers.length}/{questions.length}</Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>
    </div>
  );
}