"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, HelpCircle, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CorrectToggleProps {
  value: boolean | null;
  onChange: (value: boolean | null) => void;
  onAutoMark?: (value: boolean) => void; // New prop for auto-marking
  disabled?: boolean;
  type?: "MCQ" | "TEXT" | "CODE";
  maxMarks?: number;
  currentMarks?: number;
}

export function CorrectToggle({ 
  value, 
  onChange, 
  onAutoMark,
  disabled, 
  type,
  maxMarks,
  currentMarks 
}: CorrectToggleProps) {
  // For MCQ, this is auto-calculated, so we don't need the toggle
  if (type === "MCQ") {
    return (
      <div className="flex items-center gap-2">
        {value === true && (
          <div className="flex items-center gap-1 text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full border border-green-200">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Auto-graded Correct</span>
          </div>
        )}
        {value === false && (
          <div className="flex items-center gap-1 text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full border border-red-200">
            <XCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Auto-graded Incorrect</span>
          </div>
        )}
      </div>
    );
  }

  // For TEXT and CODE, provide manual toggle with auto-mark
const handleCorrectClick = () => {
  onChange(true);
  // Auto-assign full marks when marked correct
  if (onAutoMark) {
    onAutoMark(true);
  }
};

const handleIncorrectClick = () => {
  onChange(false);
  // Auto-assign zero marks when marked incorrect
  if (onAutoMark) {
    onAutoMark(false);
  }
};
  return (
    <TooltipProvider>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={value === true ? "default" : "outline"}
                size="sm"
                className={`gap-2 transition-all ${
                  value === true 
                    ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
                    : 'hover:border-green-600 hover:text-green-600'
                }`}
                onClick={handleCorrectClick}
                disabled={disabled}
              >
                <CheckCircle2 className="h-4 w-4" />
                Correct
                {maxMarks && (
                  <span className="ml-1 text-xs opacity-90">
                    (Auto: {maxMarks} marks)
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Auto-assigns full marks ({maxMarks})</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={value === false ? "default" : "outline"}
                size="sm"
                className={`gap-2 transition-all ${
                  value === false 
                    ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' 
                    : 'hover:border-red-600 hover:text-red-600'
                }`}
                onClick={handleIncorrectClick}
                disabled={disabled}
              >
                <XCircle className="h-4 w-4" />
                Incorrect
                {maxMarks && (
                  <span className="ml-1 text-xs opacity-90">
                    (Auto: 0 marks)
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Auto-assigns zero marks</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {value === null && (
          <div className="flex items-center gap-1 text-muted-foreground bg-muted px-3 py-1 rounded-full text-sm">
            <HelpCircle className="h-4 w-4" />
            <span>Not evaluated</span>
          </div>
        )}

        {/* Smart suggestion based on current marks */}
        {currentMarks !== undefined && maxMarks && currentMarks > 0 && currentMarks < maxMarks && value === null && (
          <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
            <Sparkles className="h-3 w-3" />
            <span>Partial marks assigned ({currentMarks}/{maxMarks})</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}