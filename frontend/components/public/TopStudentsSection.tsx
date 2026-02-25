"use client";

import { useQuery } from "@tanstack/react-query";
import { getTopStudents } from "@/lib/api/public.api";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Award, Star } from "lucide-react";
import { Marquee } from "../ui/marquee";
import { AnimatedSection } from "@/components/ui/animated-section";

export default function TopStudentsSection() {
  const { data: students = [] } = useQuery({
    queryKey: ["top-students"],
    queryFn: getTopStudents,
  });

  // Sample data if none exists
  const studentData = students.length ? students : [
    {
      _id: "1",
      name: "Rahul Sharma",
      avatar: "",
      totalSubmissions: 45,
      averageScore: 92,
      highestScore: 98,
      rank: 1,
      streak: 12,
    },
    {
      _id: "2",
      name: "Priya Patel",
      avatar: "",
      totalSubmissions: 42,
      averageScore: 89,
      highestScore: 95,
      rank: 2,
      streak: 8,
    },
    {
      _id: "3",
      name: "Arjun Singh",
      avatar: "",
      totalSubmissions: 40,
      averageScore: 87,
      highestScore: 94,
      rank: 3,
      streak: 6,
    },
    {
      _id: "4",
      name: "Neha Gupta",
      avatar: "",
      totalSubmissions: 38,
      averageScore: 86,
      highestScore: 92,
      rank: 4,
      streak: 5,
    },
  ];

  if (!studentData.length) return null;

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent" />
      
      <div className="container mx-auto px-6 relative z-10">
        <AnimatedSection animation="fadeIn">
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800 mb-4">
              <Trophy className="h-4 w-4" />
              <span className="text-sm font-medium">Hall of Fame</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold">
              Top{" "}
              <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                Performing Students
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Recognizing academic excellence and consistent performance
            </p>
          </div>
        </AnimatedSection>

        <Marquee pauseOnHover className="[--duration:35s]" reverse>
          {studentData.map((student, index) => (
            <AnimatedSection key={student._id} animation="slideUp" delay={index * 0.1}>
              <Card className="group w-80 p-6 mx-4 transition-all duration-500 hover:scale-105 hover:shadow-2xl relative overflow-hidden">
                {/* Rank badge */}
                <div className="absolute top-4 right-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg ${
                    student.rank === 1
                      ? "bg-yellow-400 text-yellow-900"
                      : student.rank === 2
                      ? "bg-gray-300 text-gray-800"
                      : student.rank === 3
                      ? "bg-amber-600 text-amber-100"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    #{student.rank}
                  </div>
                </div>

                <div className="relative z-10">
                  {/* Avatar with glow effect */}
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 animate-pulse blur-sm opacity-50" />
                    <Avatar className="absolute inset-0 w-20 h-20 border-4 border-background">
                      <AvatarImage src={student.avatar || ""} />
                      <AvatarFallback className="text-xl bg-gradient-to-br from-yellow-400 to-yellow-500 text-white">
                        {student.name[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Name and Streak */}
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold mb-1">{student.name}</h3>
                    {student.streak && (
                      <Badge variant="secondary" className="gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {student.streak} week streak
                      </Badge>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <div className="text-lg font-bold text-primary">
                        {student.totalSubmissions}
                      </div>
                      <div className="text-xs text-muted-foreground">Submissions</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <div className="text-lg font-bold text-green-600">
                        {student.averageScore}%
                      </div>
                      <div className="text-xs text-muted-foreground">Average</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <div className="text-lg font-bold text-yellow-600">
                        {student.highestScore}%
                      </div>
                      <div className="text-xs text-muted-foreground">Highest</div>
                    </div>
                  </div>

                  {/* Achievement Badge */}
                  {student.rank <= 3 && (
                    <div className="flex items-center justify-center gap-1 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                      <Award className="h-4 w-4 text-yellow-600" />
                      <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                        Top {student.rank === 1 ? "Performer" : student.rank === 2 ? "Runner Up" : "Second Runner Up"}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </AnimatedSection>
          ))}
        </Marquee>
      </div>
    </section>
  );
}