"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MessageSquare, 
  User, 
  ThumbsUp, 
  ThumbsDown,
  Star,
  Award,
  Calendar,
} from "lucide-react";

interface FeedbackSectionProps {
  feedback: string;
  teacherName?: string;
  teacherEmail?: string;
  totalScore?: number;
  totalMarks?: number;
  evaluatedAt?: string;
}

export function FeedbackSection({ 
  feedback, 
  teacherName = "Teacher", 
  teacherEmail,
  totalScore, 
  totalMarks,
  evaluatedAt,
}: FeedbackSectionProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const percentage = totalScore && totalMarks ? (totalScore / totalMarks) * 100 : 0;
  
  const getSentiment = () => {
    const lowerFeedback = feedback.toLowerCase();
    if (lowerFeedback.includes('good') || lowerFeedback.includes('great') || lowerFeedback.includes('excellent')) {
      return { icon: ThumbsUp, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/20', text: 'Positive Feedback' };
    }
    if (lowerFeedback.includes('improve') || lowerFeedback.includes('incorrect') || lowerFeedback.includes('wrong')) {
      return { icon: ThumbsDown, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/20', text: 'Constructive Feedback' };
    }
    return null;
  };

  const sentiment = getSentiment();
  const SentimentIcon = sentiment?.icon;

  const getScoreBadge = () => {
    if (percentage >= 80) return { label: "Excellent", color: "bg-green-100 text-green-800 border-green-200" };
    if (percentage >= 60) return { label: "Good", color: "bg-blue-100 text-blue-800 border-blue-200" };
    if (percentage >= 40) return { label: "Average", color: "bg-yellow-100 text-yellow-800 border-yellow-200" };
    return { label: "Needs Improvement", color: "bg-red-100 text-red-800 border-red-200" };
  };

  const scoreBadge = getScoreBadge();

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      {/* Header Gradient */}
      <div className="h-2 bg-gradient-to-r from-primary via-primary/60 to-primary/20" />
      
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-7 w-7 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Teacher&apos;s Feedback</CardTitle>
              {evaluatedAt && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  Evaluated on {new Date(evaluatedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              )}
            </div>
          </div>
          
          {totalScore !== undefined && totalMarks !== undefined && (
            <div className="text-right">
              <Badge className={`${scoreBadge.color} border px-3 py-1`}>
                {scoreBadge.label}
              </Badge>
              <p className="text-2xl font-bold mt-2">
                {totalScore}/{totalMarks}
              </p>
              <p className="text-xs text-muted-foreground">
                {percentage.toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Teacher Info Card */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-muted/50 to-transparent border">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {getInitials(teacherName)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{teacherName}</h3>
              <Badge variant="outline" className="bg-primary/5">Instructor</Badge>
            </div>
            {teacherEmail && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                {teacherEmail}
              </p>
            )}
            <div className="flex items-center gap-1 text-yellow-500">
              {[1,2,3,4,5].map((star) => (
                <Star key={star} className="h-3 w-3 fill-current" />
              ))}
            </div>
          </div>
        </div>

        {/* Sentiment Indicator */}
        {sentiment && SentimentIcon && (
          <div className={`flex items-center gap-3 p-3 rounded-lg ${sentiment.bgColor}`}>
            <SentimentIcon className={`h-5 w-5 ${sentiment.color}`} />
            <span className={`text-sm font-medium ${sentiment.color}`}>
              {sentiment.text}
            </span>
          </div>
        )}

        <Separator />

        {/* Feedback Content */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Feedback Message:</h4>
          <div className="p-6 rounded-lg bg-card border shadow-sm">
            <p className="text-base leading-relaxed whitespace-pre-wrap">
              {feedback}
            </p>
          </div>
        </div>

        {/* Achievement Message */}
        {totalScore !== undefined && totalMarks !== undefined && percentage >= 60 && (
          <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="font-semibold text-green-800 dark:text-green-400">
                  Outstanding Performance!
                </p>
                <p className="text-sm text-green-700 dark:text-green-500">
                  Keep up the excellent work. Your dedication is paying off!
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}