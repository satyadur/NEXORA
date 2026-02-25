"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface SubmittedStageProps {
  answersCount: number;
  questionsCount: number;
  assignmentTitle: string;
  onBackToAssignments: () => void;
  onGoToDashboard: () => void;
}

export function SubmittedStage({
  answersCount,
  questionsCount,
  assignmentTitle,
  onBackToAssignments,
  onGoToDashboard,
}: SubmittedStageProps) {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-12 pb-12 space-y-6">
          <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Assignment Submitted!</h2>
            <p className="text-muted-foreground">
              Your responses have been recorded successfully.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm font-medium">Summary</p>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-muted-foreground">Questions Answered:</span>
                <span className="font-medium">{answersCount}/{questionsCount}</span>
              </div>
              <div className="flex justify-between mt-1 text-sm">
                <span className="text-muted-foreground">Assignment:</span>
                <span className="font-medium">{assignmentTitle}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              You will be notified once your assignment is evaluated.
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={onBackToAssignments}
            >
              Back to Assignments
            </Button>
            <Button 
              className="flex-1"
              onClick={onGoToDashboard}
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}