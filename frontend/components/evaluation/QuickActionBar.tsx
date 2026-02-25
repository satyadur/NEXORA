"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  ArrowRight, 
  Save,
  Send,
  Sparkles,
} from "lucide-react";

interface QuickActionBarProps {
  currentQuestion: number;
  totalQuestions: number;
  pendingCount: number;
  onPrevious: () => void;
  onNext: () => void;
  onMarkCorrect: () => void;
  onMarkIncorrect: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
}

export function QuickActionBar({
  currentQuestion,
  totalQuestions,
  pendingCount,
  onPrevious,
  onNext,
  onMarkCorrect,
  onMarkIncorrect,
  onSaveDraft,
  onSubmit,
  canSubmit,
}: QuickActionBarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-4xl px-4">
      <div className="bg-background border shadow-lg rounded-lg p-2 flex items-center justify-between gap-2 backdrop-blur-sm bg-background/95">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevious}
            disabled={currentQuestion === 0}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Prev
          </Button>
          
          <Badge variant="outline" className="px-3">
            {currentQuestion + 1}/{totalQuestions}
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={currentQuestion === totalQuestions - 1}
            className="gap-1"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onMarkCorrect}
            className="text-green-600 border-green-200 hover:bg-green-50 gap-1"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span className="hidden sm:inline">Correct</span>
            <kbd className="text-xs bg-muted px-1 rounded">C</kbd>
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={onMarkIncorrect}
            className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
          >
            <XCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Incorrect</span>
            <kbd className="text-xs bg-muted px-1 rounded">I</kbd>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onSaveDraft}
            className="gap-1"
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Save</span>
            <kbd className="text-xs bg-muted px-1 rounded">Ctrl+S</kbd>
          </Button>

          {pendingCount > 0 ? (
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
              <Sparkles className="h-3 w-3 mr-1" />
              {pendingCount} pending
            </Badge>
          ) : (
            <Button
              size="sm"
              onClick={onSubmit}
              disabled={!canSubmit}
              className="gap-1 bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4" />
              Submit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}