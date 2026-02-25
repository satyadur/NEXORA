"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  Clock, 
  Trophy, 
  Award,
  BookOpen,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { getStatusConfig, getScoreColor, getScoreBadge, formatDate } from "@/lib/submission-utils";

interface SubmissionHeaderProps {
  title: string;
  deadline: string;
  status: string;
  totalScore: number | null;
  totalMarks: number;
  submittedAt: string;
  stats: {
    totalQuestions: number;
    answeredQuestions: number;
    percentageScore: number;
    correctCount: number;
    incorrectCount: number;
    pendingCount: number;
  };
}

export function SubmissionHeader({
  title,
  deadline,
  status,
  totalScore,
  totalMarks,
  submittedAt,
  stats,
}: SubmissionHeaderProps) {
  const statusConfig = getStatusConfig(status);
  const scoreColor = getScoreColor(stats.percentageScore);
  const scoreBadge = stats.percentageScore > 0 ? getScoreBadge(stats.percentageScore) : null;

  return (
    <div className="space-y-4">
      {/* Main Header Card */}
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
        <div className="h-2 bg-gradient-to-r from-primary via-primary/60 to-primary/20" />
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            {/* Left Section - Title and Meta */}
            <div className="space-y-4 flex-1">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 text-sm bg-muted/50 px-3 py-1.5 rounded-full">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Due:</span>
                    <span className="font-medium">{formatDate(deadline)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm bg-muted/50 px-3 py-1.5 rounded-full">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Submitted:</span>
                    <span className="font-medium">{formatDate(submittedAt)}</span>
                  </div>
                  <Badge variant={statusConfig.variant} className={`px-3 py-1.5 text-sm ${statusConfig.color}`}>
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>

              {/* Quick Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-primary">{stats.totalQuestions}</div>
                  <p className="text-xs text-muted-foreground">Total Qs</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.correctCount}</div>
                  <p className="text-xs text-muted-foreground">Correct</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.incorrectCount}</div>
                  <p className="text-xs text-muted-foreground">Incorrect</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </div>

            {/* Right Section - Score Card */}
            {status === "EVALUATED" && totalScore !== null ? (
              <div className="lg:w-72 bg-gradient-to-br from-primary/10 to-transparent rounded-xl p-5 border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">Final Score</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-bold ${scoreColor}`}>{totalScore}</span>
                  <span className="text-xl text-muted-foreground">/ {totalMarks}</span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Percentage</span>
                    <span className={`font-medium ${scoreColor}`}>{stats.percentageScore.toFixed(1)}%</span>
                  </div>
                  <Progress value={stats.percentageScore} className="h-2" />
                  {scoreBadge && (
                    <Badge className={`mt-2 w-full justify-center ${scoreBadge.color}`}>
                      {scoreBadge.label}
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <div className="lg:w-72 bg-muted/30 rounded-xl p-5 border border-dashed">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">Awaiting Evaluation</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your submission is pending review by the teacher.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary Card - Only for evaluated */}
      {status === "EVALUATED" && (
        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-500/5 to-transparent">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold">Performance Breakdown</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/10">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.correctCount}</p>
                  <p className="text-xs text-muted-foreground">Correct Answers</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/10">
                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.incorrectCount}</p>
                  <p className="text-xs text-muted-foreground">Incorrect Answers</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <HelpCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats.pendingCount}</p>
                  <p className="text-xs text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}