"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Award, 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  BookOpen,
  User,
  Mail,
  Calendar,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { EvaluationStats } from "@/types/evaluation";

interface EvaluationSummaryProps {
  stats: EvaluationStats;
  studentName: string;
  studentEmail: string;
  assignmentTitle: string;
  submittedAt: string;
}

export function EvaluationSummary({
  stats,
  studentName,
  studentEmail,
  assignmentTitle,
  submittedAt,
}: EvaluationSummaryProps) {
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-blue-600";
    if (percentage >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (percentage: number) => {
    if (percentage >= 80) return { label: "Excellent", color: "bg-green-100 text-green-800 dark:bg-green-900/20 border-green-200 dark:border-green-800" };
    if (percentage >= 60) return { label: "Good", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" };
    if (percentage >= 40) return { label: "Average", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800" };
    return { label: "Needs Improvement", color: "bg-red-100 text-red-800 dark:bg-red-900/20 border-red-200 dark:border-red-800" };
  };

  const scoreBadge = getScoreBadge(stats.percentage);

  return (
    <Card className="overflow-hidden border shadow-lg">
      {/* Header with gradient background */}
      <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent pb-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {assignmentTitle}
              </CardTitle>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User size={14} />
                <span className="font-medium">{studentName}</span>
              </div>
              <span className="hidden sm:inline text-xs">•</span>
              <div className="flex items-center gap-1">
                <Mail size={14} />
                <span className="text-sm">{studentEmail}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Badge variant="outline" className="gap-1 px-3 py-1 text-sm">
              <Calendar size={14} />
              {submittedAt}
            </Badge>
            <Badge className={`px-3 py-1 text-sm ${scoreBadge.color}`}>
              {scoreBadge.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {/* Total Score Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Award size={16} className="text-primary" />
              <span className="font-medium">Total Score</span>
            </div>
            <div className="text-3xl font-bold">
              {stats.awardedMarks}/{stats.totalMarks}
            </div>
            <div className="mt-3 space-y-2">
              <Progress 
                value={stats.percentage} 
                className="h-2"
                indicatorClassName={getScoreColor(stats.percentage)}
              />
              <p className="text-xs text-muted-foreground">
                {stats.percentage.toFixed(1)}% of total marks
              </p>
            </div>
          </div>

          {/* Percentage Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/5 to-transparent border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <TrendingUp size={16} className="text-blue-600" />
              <span className="font-medium">Percentage</span>
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(stats.percentage)}`}>
              {stats.percentage.toFixed(1)}%
            </div>
            <div className="mt-3">
              <Badge className={`${scoreBadge.color}`}>
                {scoreBadge.label}
              </Badge>
            </div>
          </div>

          {/* Questions Evaluated Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/5 to-transparent border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <CheckCircle2 size={16} className="text-purple-600" />
              <span className="font-medium">Questions Evaluated</span>
            </div>
            <div className="text-3xl font-bold">
              {stats.questionsEvaluated}/{stats.totalQuestions}
            </div>
            <div className="mt-3">
              <Progress 
                value={(stats.questionsEvaluated / stats.totalQuestions) * 100} 
                className="h-2"
                indicatorClassName="bg-purple-600"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {((stats.questionsEvaluated / stats.totalQuestions) * 100).toFixed(0)}% complete
              </p>
            </div>
          </div>

          {/* Remaining Marks Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/5 to-transparent border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Target size={16} className="text-orange-600" />
              <span className="font-medium">Remaining Marks</span>
            </div>
            <div className="text-3xl font-bold text-orange-600">
              {stats.remainingMarks}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Available to award
            </p>
          </div>

          {/* Answer Analysis Card - New */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/5 to-transparent border md:col-span-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <HelpCircle size={16} className="text-emerald-600" />
              <span className="font-medium">Answer Analysis</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                <div className="text-xl font-bold text-green-600">{stats.correctCount}</div>
                <p className="text-xs text-muted-foreground">Correct</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                <div className="text-xl font-bold text-red-600">{stats.incorrectCount}</div>
                <p className="text-xs text-muted-foreground">Incorrect</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <div className="text-xl font-bold text-yellow-600">{stats.pendingCount}</div>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
            <span className="text-sm text-muted-foreground">Passing Status</span>
            <Badge variant={stats.percentage >= 40 ? "default" : "destructive"} className="text-xs">
              {stats.percentage >= 40 ? "PASS" : "FAIL"}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
            <span className="text-sm text-muted-foreground">Total Questions</span>
            <span className="font-medium">{stats.totalQuestions}</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
            <span className="text-sm text-muted-foreground">Max Possible</span>
            <span className="font-medium">{stats.totalMarks}</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
            <span className="text-sm text-muted-foreground">Awarded Marks</span>
            <span className="font-medium text-primary">{stats.awardedMarks}</span>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Quick Tips */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium mb-1">Quick Tips:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Review each question carefully before awarding marks</li>
              <li>Use the Correct/Incorrect toggle for text and code answers</li>
              <li>Add meaningful comments to help students understand their mistakes</li>
              <li>Ensure total marks don't exceed the maximum allowed</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}