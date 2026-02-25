"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { AxiosError } from "axios";

import { registerApi } from "@/lib/api/auth.api";
import { RegisterFormValues, registerSchema } from "./schemas/register.schema";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form } from "@/components/ui/form";
import {
  Loader2,
  User,
  GraduationCap,
  Briefcase,
  CheckCircle2,
} from "lucide-react";

import BasicInfoStep from "./steps/BasicInfoStep";
import StudentStep from "./steps/StudentStep";
import TeacherStep from "./steps/TeacherStep";
import AdditionalStep from "./steps/AdditionalStep";

const STEPS = [
  { id: 1, title: "Basic Info", icon: User },
  { id: 2, title: "Details", icon: GraduationCap },
  { id: 3, title: "Additional", icon: CheckCircle2 },
];

export default function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  // const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT");

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
      department: "",
      designation: "",
      employeeId: "",
      joiningDate: "",
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

  const role = form.watch("role");
  const onSubmit = (values: RegisterFormValues) => {
    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      if (key === "skills" && Array.isArray(value)) {
        formData.append("skills", JSON.stringify(value));
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
    const fieldsToValidate: (keyof RegisterFormValues)[] = [
      "name",
      "email",
      "password",
      "dateOfBirth",
    ];

    if (step === 1) {
      const isValid = await form.trigger(fieldsToValidate);
      if (isValid) setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const prevStep = () => setStep(step - 1);

  return (
    <div className="min-h-screen bg-linear-to-br from-primary/5 via-background to-secondary/5 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
            {role === "STUDENT" ? (
              <GraduationCap className="h-8 w-8 text-primary" />
            ) : (
              <Briefcase className="h-8 w-8 text-primary" />
            )}
          </div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Create Your Account
          </h1>
          <p className="text-muted-foreground mt-2">
            Join our learning community and start your journey
          </p>
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
                              ? "bg-primary text-primary-foreground scale-110 shadow-lg"
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
                      {s.id < 3 && (
                        <div
                          className={`w-12 h-1 mx-2 ${
                            step > s.id ? "bg-primary" : "bg-muted"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Step {step} of 3: {STEPS[step - 1].title}
                </p>
              </div>

              {/* Role Tabs */}
              <Tabs
                value={role}
                onValueChange={(v) =>
                  form.setValue("role", v as "STUDENT" | "TEACHER")
                }
              >
                <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-muted/50">
                  <TabsTrigger
                    value="STUDENT"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Student
                  </TabsTrigger>
                  <TabsTrigger
                    value="TEACHER"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    Teacher
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Form */}
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Step Content */}
                  <div className="min-h-100">
                    {step === 1 && <BasicInfoStep form={form} />}
                    {step === 2 && role === "STUDENT" && (
                      <StudentStep form={form} />
                    )}
                    {step === 2 && role === "TEACHER" && (
                      <TeacherStep form={form} />
                    )}
                    {step === 3 && <AdditionalStep form={form} />}
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between pt-4">
                    {/* Previous */}
                    {step > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                      >
                        Previous
                      </Button>
                    )}

                    {/* Next Button */}
                    {step !== 3 && (
                      <Button
                        type="button"
                        onClick={nextStep}
                        className="ml-auto"
                      >
                        Next
                      </Button>
                    )}

                    {/* Submit Button */}
                    {step === 3 && (
                      <Button
                        type="submit"
                        disabled={isPending}
                        className="ml-auto"
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Account"
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
                  className="text-primary font-medium hover:underline"
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
