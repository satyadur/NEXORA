"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { AxiosError } from "axios";

import { registerApi } from "@/lib/api/auth.api";
import { useCourses } from "@/hooks/useCourses"; // Use the hook instead of direct API call
import { RegisterFormValues, registerSchema } from "./schemas/register.schema";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  Loader2,
  User,
  GraduationCap,
  CheckCircle2,
  Sparkles,
  Package,
  Crown,
  BookMarked,
} from "lucide-react";

import BasicInfoStep from "./steps/BasicInfoStep";
import StudentStep from "./steps/StudentStep";
import PackageStep from "./steps/PackageStep";
import CoursesStep from "./steps/CoursesStep";
import AdditionalStep from "./steps/AdditionalStep";

const STEPS = [
  { id: 1, title: "Basic Info", icon: User },
  { id: 2, title: "Academic Details", icon: GraduationCap },
  { id: 3, title: "Choose Package", icon: Package },
  { id: 4, title: "Select Courses", icon: BookMarked },
  { id: 5, title: "Additional Info", icon: CheckCircle2 },
];

export default function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedCourses, setSelectedCourses] = useState<any[]>([]);

  // Use the TanStack Query hook to fetch courses
  const { data: coursesData, isLoading: coursesLoading, error: coursesError } = useCourses({ 
    status: "published", 
    limit: 100 
  });

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      dateOfBirth: "",
      gender: undefined,
      role: "STUDENT",
      enrollmentNumber: "",
      batch: "",
      currentSemester: "",
      cgpa: "",
      skills: [],
      selectedPackage: "basic",
      enrolledCourses: [],
      jobPreferences: {
        preferredRoles: "",
        preferredLocations: "",
        expectedSalary: "",
        immediateJoiner: false,
      },
      socialLinks: {
        linkedin: "",
        github: "",
        portfolio: "",
        twitter: "",
      },
      address: {
        street: "",
        city: "",
        state: "",
        country: "India",
        pincode: "",
      },
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: registerApi,
    onSuccess: () => {
      toast.success("Registration successful! Please login.");
      router.push("/auth/login");
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error.response?.data?.message || "Registration failed";
      toast.error(message);
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      if (key === "skills" && Array.isArray(value)) {
        formData.append("skills", JSON.stringify(value));
      } else if (key === "enrolledCourses" && Array.isArray(value)) {
        formData.append("enrolledCourses", JSON.stringify(value));
      } else if (
        key === "jobPreferences" ||
        key === "socialLinks" ||
        key === "address"
      ) {
        formData.append(key, JSON.stringify(value));
      } else if (value) {
        formData.append(key, value as string);
      }
    });

    // Add selected package
    formData.append("selectedPackage", values.selectedPackage || "basic");

    const avatarInput = document.querySelector<HTMLInputElement>(
      'input[name="avatar"]',
    );
    if (avatarInput?.files?.[0]) {
      formData.append("avatar", avatarInput.files[0]);
    }

    const resumeInput = document.querySelector<HTMLInputElement>(
      'input[name="resume"]',
    );
    if (resumeInput?.files?.[0]) {
      formData.append("resume", resumeInput.files[0]);
    }

    mutate(formData);
  };

  const nextStep = async () => {
    if (step === 1) {
      const fieldsToValidate: (keyof RegisterFormValues)[] = [
        "name",
        "email",
        "password",
        "dateOfBirth",
      ];
      const isValid = await form.trigger(fieldsToValidate);
      if (isValid) setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      // Save selected courses to form
      form.setValue("enrolledCourses", selectedCourses);
      setStep(5);
    }
  };

  const prevStep = () => setStep(step - 1);

  // Calculate progress percentage
  const progressPercentage = (step / STEPS.length) * 100;

  // Handle courses error
  if (coursesError) {
    console.error("Failed to load courses:", coursesError);
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-primary/5 via-background to-secondary/5 py-12 px-4">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Student Registration
          </h1>
          <p className="text-muted-foreground mt-2">
            Join our learning community and start your educational journey
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-in-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Main Card */}
        <Card className="shadow-2xl border-0 overflow-hidden">
          <div className="grid lg:grid-cols-5">
            {/* Left Sidebar - Steps */}
            <div className="lg:col-span-1 bg-linear-to-b from-primary/10 to-secondary/10 p-6 hidden lg:block">
              <div className="space-y-8">
                {STEPS.map((s, index) => {
                  const Icon = s.icon;
                  const isActive = step === s.id;
                  const isCompleted = step > s.id;

                  return (
                    <div key={s.id} className="relative">
                      {index < STEPS.length - 1 && (
                        <div
                          className={`absolute left-5 top-10 w-0.5 h-12 ${
                            isCompleted ? "bg-primary" : "bg-muted"
                          }`}
                        />
                      )}
                      <div className="flex items-center gap-3">
                        <div
                          className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            isActive
                              ? "bg-primary text-primary-foreground scale-110 shadow-lg ring-4 ring-primary/20"
                              : isCompleted
                                ? "bg-primary/20 text-primary"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Step {s.id}
                          </p>
                          <p
                            className={`font-medium ${
                              isActive ? "text-primary" : "text-foreground"
                            }`}
                          >
                            {s.title}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="lg:col-span-4 p-8">
              {/* Mobile Steps Indicator */}
              <div className="lg:hidden mb-6">
                <div className="flex items-center justify-between">
                  {STEPS.map((s) => (
                    <div key={s.id} className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          step >= s.id
                            ? "bg-primary text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {s.id}
                      </div>
                      {s.id < STEPS.length && (
                        <div
                          className={`w-8 h-1 mx-1 ${
                            step > s.id ? "bg-primary" : "bg-muted"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Step {step} of {STEPS.length}: {STEPS[step - 1].title}
                </p>
              </div>

              {/* Welcome Message - Show only on step 1 */}
              {step === 1 && (
                <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Join as a student to access courses, track your progress, and earn certificates
                    </p>
                  </div>
                </div>
              )}

              {/* Package Highlight - Show on step 3 */}
              {step === 3 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-3">
                    <Crown className="h-5 w-5 text-amber-600" />
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      Choose the perfect learning package that suits your goals. Upgrade anytime!
                    </p>
                  </div>
                </div>
              )}

              {/* Courses Highlight - Show on step 4 */}
              {step === 4 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <BookMarked className="h-5 w-5 text-blue-600" />
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      Select the courses you want to enroll in. You can add more later.
                    </p>
                  </div>
                </div>
              )}

              {/* Form */}
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Step Content */}
                  <div className="min-h-[400px]">
                    {step === 1 && <BasicInfoStep form={form} />}
                    {step === 2 && <StudentStep form={form} />}
                    {step === 3 && <PackageStep form={form} />}
                    {step === 4 && (
                      <CoursesStep 
                        form={form}
                        courses={coursesData?.courses || []}
                        coursesLoading={coursesLoading}
                        selectedCourses={selectedCourses}
                        setSelectedCourses={setSelectedCourses}
                      />
                    )}
                    {step === 5 && <AdditionalStep form={form} />}
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between pt-4 border-t">
                    {/* Previous */}
                    {step > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                        className="gap-2"
                      >
                        ← Previous
                      </Button>
                    )}

                    {/* Next Button */}
                    {step < STEPS.length && (
                      <Button
                        type="button"
                        onClick={nextStep}
                        className="ml-auto gap-2"
                        disabled={step === 4 && selectedCourses.length === 0}
                      >
                        Next →
                      </Button>
                    )}

                    {/* Submit Button */}
                    {step === STEPS.length && (
                      <Button
                        type="submit"
                        disabled={isPending}
                        className="ml-auto gap-2 bg-green-600 hover:bg-green-700"
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Create Account
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </form>
              </Form>

              {/* Login Link */}
              <p className="text-center text-sm text-muted-foreground mt-6">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="text-primary font-medium hover:underline hover:text-primary/80 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}