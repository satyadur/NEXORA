"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getAssignmentDetailsApi,
  updateAssignmentApi,
  UpdateAssignmentPayload,
} from "@/lib/api/teacher.api";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

import AssignmentForm from "../../_components/AssignmentForm";
import { AssignmentFormValues } from "@/types/assignment-form.types";

export default function EditAssignmentPage() {
  const { id } = useParams();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["assignment", id],
    queryFn: () => getAssignmentDetailsApi(id as string),
  });

  const mutation = useMutation({
    mutationFn: (payload: UpdateAssignmentPayload) => updateAssignmentApi(id as string, payload),
    onSuccess: () => {
      toast.success("Assignment Updated", {
        description: "Changes have been saved successfully.",
      });
      router.push(`/teacher/assignments/${id}`);
    },
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-[60vh]">Loading...</div>;
  }

  if (!data) return null;

  // Prevent editing if published
  if (data.assignment.isPublished) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-yellow-600" />
        <h2 className="text-2xl font-bold">Cannot Edit Published Assignment</h2>
        <p className="text-muted-foreground">
          This assignment has been published and can no longer be edited.
        </p>
        <Button onClick={() => router.push(`/teacher/assignments/${id}`)}>
          View Assignment
        </Button>
      </div>
    );
  }

  const defaultValues: AssignmentFormValues = {
    classroomId: data.assignment.classroomId,
    title: data.assignment.title,
    totalMarks: data.assignment.totalMarks,
    deadline: data.assignment.deadline.slice(0, 16),
    questions: data.questions.map((q: any) => ({
      type: q.type,
      questionText: q.questionText,
      marks: q.marks,
      options: q.type === "MCQ" 
        ? q.options.map((opt: any) => ({ text: opt.text }))
        : [],
      correctAnswerIndex: q.type === "MCQ" ? q.correctAnswerIndex : undefined,
    })),
  };

  const handleSubmit = (values: AssignmentFormValues) => {
    const payload: UpdateAssignmentPayload = {
      title: values.title,
      totalMarks: values.totalMarks,
      deadline: values.deadline,
      questions: values.questions.map((q) => ({
        type: q.type,
        questionText: q.questionText,
        marks: q.marks,
        options: q.type === "MCQ" ? q.options?.map(opt => opt.text) : undefined,
        correctAnswerIndex: q.type === "MCQ" ? q.correctAnswerIndex : undefined,
      })),
    };
    mutation.mutate(payload);
  };

  return (
    <div className="space-y-6 p-6 md:p-8 pt-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          ← Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Edit Assignment</h1>
      </div>

      <AssignmentForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        isLoading={mutation.isPending}
        submitLabel="Save Changes"
      />
    </div>
  );
}