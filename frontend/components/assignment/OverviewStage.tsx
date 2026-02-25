"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileText, Clock, PlayCircle, HelpCircle, ListChecks, Type, Code2, AlertTriangle } from "lucide-react";

interface OverviewStageProps {
  title: string;
  totalMarks: number;
  description?: string;
  deadline: string;
  questionsCount: number;
  questionTypes: string[];
  onStart: () => void;
}

export function OverviewStage({
  title,
  totalMarks,
  description,
  deadline,
  questionsCount,
  questionTypes,
  onStart,
}: OverviewStageProps) {
  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case "MCQ":
        return <ListChecks size={12} />;
      case "TEXT":
        return <Type size={12} />;
      case "CODE":
        return <Code2 size={12} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center space-y-2">
          <Badge className="w-fit mx-auto" variant="outline">
            New Assignment
          </Badge>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {title}
          </CardTitle>
          <CardDescription className="text-base">
            Total Marks: {totalMarks}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <FileText className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{questionsCount}</p>
              <p className="text-xs text-muted-foreground">Total Questions</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">
                {new Date(deadline).toLocaleDateString()}
              </p>
              <p className="text-xs text-muted-foreground">Deadline</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HelpCircle size={16} />
              <span>Question types:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {questionTypes.map((type) => (
                <Badge key={type} variant="secondary" className="gap-1">
                  {getQuestionTypeIcon(type)}
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Once started, you cannot pause or restart. Make sure you have a stable internet connection.
            </AlertDescription>
          </Alert>

          <Button
            className="w-full h-12 text-lg"
            size="lg"
            onClick={onStart}
          >
            <PlayCircle className="mr-2 size-5" />
            Start Assignment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}