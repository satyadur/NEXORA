"use client";

import { useQuery } from "@tanstack/react-query";
import { getPublicFaculty } from "@/lib/api/public.api";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Award, Star } from "lucide-react";
import { Marquee } from "../ui/marquee";
import { AnimatedSection } from "@/components/ui/animated-section";
import { Button } from "../ui/button";

export default function FacultySection() {
  const { data: faculty = [] } = useQuery({
    queryKey: ["public-faculty"],
    queryFn: getPublicFaculty,
  });

  // Sample faculty data with more details
  const facultyData = faculty.length ? faculty : [
    {
      _id: "1",
      name: "Dr. Sarah Johnson",
      expertise: "Mathematics",
      experience: "12+ years",
      students: "5000+",
      rating: 4.9,
      avatar: "",
    },
    {
      _id: "2",
      name: "Prof. Michael Chen",
      expertise: "Physics",
      experience: "15+ years",
      students: "8000+",
      rating: 4.8,
      avatar: "",
    },
    {
      _id: "3",
      name: "Ms. Emily Rodriguez",
      expertise: "Chemistry",
      experience: "8+ years",
      students: "3500+",
      rating: 4.7,
      avatar: "",
    },
    {
      _id: "4",
      name: "Dr. James Wilson",
      expertise: "Computer Science",
      experience: "10+ years",
      students: "6000+",
      rating: 4.9,
      avatar: "",
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <AnimatedSection animation="fadeIn">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">
              Learn from{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Expert Faculty
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Seasoned educators with years of experience in their respective fields
            </p>
          </div>
        </AnimatedSection>

        <Marquee pauseOnHover className="[--duration:40s] py-8">
          {facultyData.map((teacher, index) => (
            <AnimatedSection key={teacher._id} animation="scale" delay={index * 0.1}>
              <Card className="group w-80 p-6 mx-4 transition-all duration-500 hover:scale-105 hover:shadow-2xl relative overflow-hidden">
                {/* Background gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10">
                  {/* Avatar with ring animation */}
                  <div className="relative w-24 h-24 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-secondary animate-spin-slow" />
                    <Avatar className="absolute inset-1 w-[88px] h-[88px] border-2 border-background">
                      <AvatarImage src={teacher.avatar || ""} />
                      <AvatarFallback className="text-2xl bg-primary/10">
                        {teacher.name[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Name and Title */}
                  <h3 className="text-xl font-bold text-center mb-1 group-hover:text-primary transition-colors">
                    {teacher.name}
                  </h3>
                  <p className="text-primary text-center mb-4">{teacher.expertise}</p>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <BookOpen className="h-4 w-4 mx-auto mb-1 text-primary" />
                      <div className="text-sm font-medium">{teacher.experience}</div>
                      <div className="text-xs text-muted-foreground">Experience</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <Award className="h-4 w-4 mx-auto mb-1 text-primary" />
                      <div className="text-sm font-medium">{teacher.students}</div>
                      <div className="text-xs text-muted-foreground">Students</div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center justify-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(teacher.rating || 5)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-muted"
                        }`}
                      />
                    ))}
                    <span className="text-sm font-medium ml-2">
                      {teacher.rating || 5}
                    </span>
                  </div>

                  {/* View Profile Button */}
                  <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-white transition-colors">
                    View Profile
                  </Button>
                </div>
              </Card>
            </AnimatedSection>
          ))}
        </Marquee>
      </div>
    </section>
  );
}