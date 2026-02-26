"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookMarked,
  Search,
  X,
  CheckCircle2,
  Loader2,
  GraduationCap,
  Clock,
  BookOpen,
} from "lucide-react";
import { RegisterFormValues } from "../schemas/register.schema";

interface Props {
  form: UseFormReturn<RegisterFormValues>;
  courses: any[];
  coursesLoading: boolean;
  selectedCourses: any[];
  setSelectedCourses: (courses: any[]) => void;
}

export default function CoursesStep({ 
  form, 
  courses, 
  coursesLoading, 
  selectedCourses, 
  setSelectedCourses 
}: Props) {
  const [searchCourse, setSearchCourse] = useState("");

  // Filter courses by search
  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchCourse.toLowerCase()) ||
    course.code.toLowerCase().includes(searchCourse.toLowerCase()) ||
    course.department.toLowerCase().includes(searchCourse.toLowerCase())
  );

  // Add course to selection
  const addCourse = (course: any) => {
    if (!selectedCourses.find(c => c.courseId === course._id)) {
      const courseEnrollment = {
        courseId: course._id,
        courseCode: course.code,
        courseName: course.title,
        status: "enrolled" as const,
      };
      const updated = [...selectedCourses, courseEnrollment];
      setSelectedCourses(updated);
      form.setValue("enrolledCourses", updated);
    }
  };

  // Remove course from selection
  const removeCourse = (index: number) => {
    const updated = selectedCourses.filter((_, i) => i !== index);
    setSelectedCourses(updated);
    form.setValue("enrolledCourses", updated);
  };

  // Get department badge color
  const getDepartmentColor = (department: string) => {
    const colors: Record<string, string> = {
      "Computer Science": "bg-blue-500/10 text-blue-700 border-blue-200",
      "Information Technology": "bg-purple-500/10 text-purple-700 border-purple-200",
      "Electronics": "bg-green-500/10 text-green-700 border-green-200",
      "Electrical": "bg-yellow-500/10 text-yellow-700 border-yellow-200",
      "Mechanical": "bg-orange-500/10 text-orange-700 border-orange-200",
      "Civil": "bg-red-500/10 text-red-700 border-red-200",
      "Mathematics": "bg-indigo-500/10 text-indigo-700 border-indigo-200",
      "Physics": "bg-cyan-500/10 text-cyan-700 border-cyan-200",
      "Chemistry": "bg-emerald-500/10 text-emerald-700 border-emerald-200",
    };
    return colors[department] || "bg-gray-500/10 text-gray-700 border-gray-200";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Select Your Courses</h3>
        <p className="text-sm text-muted-foreground">
          Choose the courses you want to enroll in for your first semester
        </p>
      </div>

      {/* Selected Courses Summary */}
      {selectedCourses.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Selected Courses ({selectedCourses.length})
              </h4>
              <Badge variant="outline" className="bg-primary/10">
                {selectedCourses.reduce((acc, c) => acc + (c.credits || 3), 0)} Credits
              </Badge>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
              {selectedCourses.map((course, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-background rounded-lg border">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{course.courseName}</p>
                    <p className="text-xs text-muted-foreground">{course.courseCode}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => removeCourse(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Course Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses by name, code, or department..."
          value={searchCourse}
          onChange={(e) => setSearchCourse(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Available Courses */}
      <div>
        <h4 className="text-sm font-medium mb-3">Available Courses</h4>
        
        {coursesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ScrollArea className="h-[350px] pr-4">
            <div className="space-y-3">
              {filteredCourses.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/20">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No courses found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try adjusting your search
                  </p>
                </div>
              ) : (
                filteredCourses.map((course) => {
                  const isSelected = selectedCourses.some(c => c.courseId === course._id);
                  return (
                    <div
                      key={course._id}
                      className={`flex items-start gap-4 p-4 border rounded-lg transition-all hover:shadow-md ${
                        isSelected ? 'bg-primary/5 border-primary/30' : 'hover:border-primary/30'
                      }`}
                    >
                      {/* Course Icon/Thumbnail */}
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <BookMarked className="h-6 w-6 text-primary" />
                      </div>

                      {/* Course Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h5 className="font-semibold">{course.title}</h5>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs font-mono">
                                {course.code}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getDepartmentColor(course.department)}`}
                              >
                                {course.department}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {course.credits} Credits
                              </Badge>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant={isSelected ? "outline" : "default"}
                            size="sm"
                            onClick={() => isSelected ? null : addCourse(course)}
                            disabled={isSelected}
                            className="shrink-0"
                          >
                            {isSelected ? 'Added' : 'Add'}
                          </Button>
                        </div>

                        {/* Course Description */}
                        {course.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {course.description}
                          </p>
                        )}

                        {/* Course Meta Info */}
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          {course.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {course.duration.value} {course.duration.unit}
                            </span>
                          )}
                          {course.level && (
                            <span className="flex items-center gap-1">
                              <GraduationCap className="h-3 w-3" />
                              {course.level}
                            </span>
                          )}
                          {course.instructors?.length > 0 && (
                            <span>
                              Instructor: {course.instructors[0].name}
                              {course.instructors.length > 1 && ` +${course.instructors.length - 1}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Selection Info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          You can select multiple courses. Selected: {selectedCourses.length}
        </p>
      </div>
    </div>
  );
}