"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Send, AlertCircle, Clock, Sparkles } from "lucide-react";
import { EvaluationStats } from "@/types/evaluation";
import { getScoreBadge } from "@/lib/evaluation-utils";

interface OverallFeedbackProps {
  feedback: string;
  stats: EvaluationStats;
  isEvaluated: boolean;
  isSubmitting: boolean;
  onFeedbackChange: (value: string) => void;
  onSubmit: () => void;
  canSubmit?: boolean;
  pendingCount?: number;
}

export function OverallFeedback({
  feedback,
  stats,
  isEvaluated,
  isSubmitting,
  onFeedbackChange,
  onSubmit,
  canSubmit = true,
  pendingCount = 0,
}: OverallFeedbackProps) {
  const scoreBadge = getScoreBadge(stats.percentage);

  return (
    <Card className="overflow-hidden border shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <MessageSquare className="h-6 w-6 text-primary" />
              Overall Feedback
            </CardTitle>
            <CardDescription className="text-base">
              Provide comprehensive feedback for this submission
            </CardDescription>
          </div>
          
          {/* Score Badge */}
          <div className={`px-4 py-2 rounded-full text-sm font-medium border ${scoreBadge.color}`}>
            {stats.percentage.toFixed(1)}% - {scoreBadge.label}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Feedback Textarea */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Feedback Message</label>
            {!isEvaluated && (
              <span className="text-xs text-muted-foreground">
                {feedback.length} characters
              </span>
            )}
          </div>
          <Textarea
            value={feedback}
            disabled={isEvaluated}
            onChange={(e) => onFeedbackChange(e.target.value)}
            placeholder="Write your overall feedback here... (Be specific and constructive)"
            className="min-h-[150px] text-base resize-y"
          />
        </div>

        <Separator />

        {/* Evaluation Efficiency Stats - Added here */}
        {!isEvaluated && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-transparent border border-green-200">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Auto-marked</span>
              </div>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {stats.correctCount + stats.incorrectCount}
              </p>
              <p className="text-xs text-muted-foreground">questions</p>
            </div>
            
            <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-200">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Time saved</span>
              </div>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                ~{(stats.correctCount + stats.incorrectCount) * 30}s
              </p>
              <p className="text-xs text-muted-foreground">estimated</p>
            </div>
          </div>
        )}

        {/* Not Evaluated State */}
        {!isEvaluated && (
          <div className="space-y-4">
            {/* Pending Questions Warning */}
            {pendingCount > 0 && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800">
                <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-semibold mb-1">Pending Evaluation</p>
                  <p className="text-sm">
                    You have <span className="font-bold">{pendingCount}</span> question(s) that need evaluation. 
                    Please mark them as correct or incorrect before submitting.
                  </p>
                </div>
              </div>
            )}

            {/* Submission Guidelines */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-semibold mb-2">Before submitting:</p>
                <ul className="list-disc list-inside space-y-1.5">
                  <li>✓ Review each question&apos;s evaluation for accuracy</li>
                  <li>✓ Ensure awarded marks don&apos;t exceed maximum marks</li>
                  <li>✓ Add meaningful comments for each question</li>
                  <li>✓ Mark text/code answers as correct or incorrect</li>
                  <li>✓ Provide constructive overall feedback</li>
                </ul>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              size="lg"
              className="w-full gap-2 h-14 text-base font-semibold"
              onClick={onSubmit}
              disabled={isSubmitting || !canSubmit || pendingCount > 0}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Submitting Evaluation...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  {pendingCount > 0 
                    ? `Complete ${pendingCount} Pending Question${pendingCount > 1 ? 's' : ''} First` 
                    : canSubmit 
                      ? "Submit Evaluation"
                      : "Complete All Questions First"}
                </>
              )}
            </Button>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="p-2 rounded-lg bg-muted/50">
                <div className="font-semibold text-green-600">{stats.correctCount}</div>
                <div className="text-xs text-muted-foreground">Correct</div>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <div className="font-semibold text-red-600">{stats.incorrectCount}</div>
                <div className="text-xs text-muted-foreground">Incorrect</div>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <div className="font-semibold text-yellow-600">{pendingCount}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
            </div>
          </div>
        )}

        {/* Evaluated State */}
        {isEvaluated && (
          <div className="space-y-4">
            <div className="p-6 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <Send className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-400">
                    Submission Evaluated
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-500">
                    This submission has been evaluated and cannot be modified
                  </p>
                </div>
              </div>
            </div>

            {/* Display Final Feedback */}
            {feedback && (
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">Feedback Provided:</p>
                <p className="text-sm whitespace-pre-wrap">{feedback}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}