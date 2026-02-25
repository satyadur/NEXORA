"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface InstructionsStageProps {
  questionsCount: number;
  mcqCount: number;
  textCount: number;
  duration?: number;
  onBack: () => void;
  onBegin: () => void;
}

export function InstructionsStage({
  questionsCount,
  mcqCount,
  textCount,
  duration,
  onBack,
  onBegin,
}: InstructionsStageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Assignment Instructions</CardTitle>
          <CardDescription>
            Please read carefully before proceeding
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            {[
              {
                num: 1,
                title: "Read Carefully",
                desc: "Read each question carefully before answering. You can navigate between questions."
              },
              {
                num: 2,
                title: "Auto-save Feature",
                desc: "Your answers are automatically saved every 2 seconds. You can safely close the browser if needed."
              },
              {
                num: 3,
                title: "Timer",
                desc: duration 
                  ? `You have ${duration} minutes to complete this assignment.`
                  : "Take your time, but submit before the deadline."
              },
              {
                num: 4,
                title: "Submission",
                desc: "Once submitted, you cannot make any changes. Make sure all questions are answered."
              }
            ].map((item) => (
              <div key={item.num} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">{item.num}</span>
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">Question Summary:</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg bg-muted/30 text-center">
                <p className="text-lg font-bold text-primary">{questionsCount}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/30 text-center">
                <p className="text-lg font-bold text-green-600">{mcqCount}</p>
                <p className="text-xs text-muted-foreground">MCQ</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/30 text-center">
                <p className="text-lg font-bold text-blue-600">{textCount}</p>
                <p className="text-xs text-muted-foreground">Text</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button className="flex-1" onClick={onBegin}>
              I Understand, Begin
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}