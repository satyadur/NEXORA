"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createAssignmentApi,
  CreateAssignmentPayload,
  getMyClassroomsApi,
} from "@/lib/api/teacher.api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  PlusCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  Copy,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  HelpCircle,
} from "lucide-react";

import { AssignmentFormValues, QuestionInput } from "@/types/assignment-form.types";

export default function CreateAssignmentPage() {
  const router = useRouter();

  const { data: classrooms, isLoading: classroomsLoading } = useQuery({
    queryKey: ["teacher-classrooms"],
    queryFn: getMyClassroomsApi,
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AssignmentFormValues>({
    defaultValues: {
      title: "",
      totalMarks: 0,
      deadline: "",
      questions: [],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "questions",
  });

  const mutation = useMutation({
    mutationFn: createAssignmentApi,
    onSuccess: () => {
      toast.success("Assignment Created", {
        description: "Your assignment has been created successfully.",
      });
      router.push("/teacher/assignments");
    },
  });

  const questions = watch("questions");
  const calculatedTotal = questions?.reduce((sum, q) => sum + (q.marks || 0), 0) || 0;
  const totalMarks = watch("totalMarks");

  const onSubmit = (data: AssignmentFormValues) => {
    if (calculatedTotal !== data.totalMarks) {
      toast.error("Validation Error", {
        description: "Total marks must equal sum of question marks.",
      });
      return;
    }

    if (data.questions.length === 0) {
      toast.error("Validation Error", {
        description: "At least one question is required.",
      });
      return;
    }

    const formattedQuestions = data.questions.map((q) => ({
      type: q.type,
      questionText: q.questionText,
      marks: q.marks,
      options: q.type === "MCQ" ? q.options?.map((opt) => opt.text).filter(Boolean) : undefined,
      correctAnswerIndex: q.type === "MCQ" ? q.correctAnswerIndex : undefined,
    }));

    const payload: CreateAssignmentPayload = {
      classroomId: data.classroomId,
      title: data.title,
      totalMarks: data.totalMarks,
      deadline: data.deadline,
      questions: formattedQuestions,
    };

    mutation.mutate(payload);
  };

  const addQuestion = () => {
    append({
      type: "MCQ",
      questionText: "",
      marks: 0,
      options: [
        { text: "" },
        { text: "" },
        { text: "" },
        { text: "" },
      ],
      correctAnswerIndex: 0,
    });
  };

  const duplicateQuestion = (index: number) => {
    const question = questions[index];
    append({ ...question });
  };

  if (classroomsLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeClassrooms = classrooms?.filter(c => c.status === "ACTIVE") || [];

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Assignment</h1>
          <p className="text-muted-foreground">
            Design a new assignment with questions and grading structure
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Set up the assignment details and classroom
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Classroom Selection */}
            <div className="space-y-2">
              <Label htmlFor="classroom">Classroom *</Label>
              <Select onValueChange={(v) => setValue("classroomId", v)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a classroom" />
                </SelectTrigger>
                <SelectContent>
                  {activeClassrooms.length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      No active classrooms available
                    </div>
                  ) : (
                    activeClassrooms.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name} ({c.studentCount} students)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Assignment Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Mathematics Mid-Term Exam"
                {...register("title", { required: true })}
              />
            </div>

            {/* Deadline and Total Marks */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline *</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                  {...register("deadline", { required: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalMarks">Total Marks *</Label>
                <Input
                  id="totalMarks"
                  type="number"
                  min="0"
                  placeholder="100"
                  {...register("totalMarks", { 
                    required: true,
                    valueAsNumber: true,
                    min: 1
                  })}
                />
              </div>
            </div>

            {/* Validation Status */}
            {calculatedTotal > 0 && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                calculatedTotal === totalMarks 
                  ? "bg-green-500/10 text-green-600" 
                  : "bg-red-500/10 text-red-600"
              }`}>
                {calculatedTotal === totalMarks ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm">
                  Question marks sum: {calculatedTotal} / Total marks: {totalMarks || 0}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Questions Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Questions</CardTitle>
              <CardDescription>
                Add and configure questions for this assignment
              </CardDescription>
            </div>
            <Button type="button" onClick={addQuestion}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {fields.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No questions added yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Click the button above to add your first question
                </p>
                <Button type="button" variant="outline" onClick={addQuestion}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add First Question
                </Button>
              </div>
            ) : (
              fields.map((field, index) => (
                <QuestionEditor
                  key={field.id}
                  index={index}
                  register={register}
                  watch={watch}
                  setValue={setValue}
                  onRemove={() => remove(index)}
                  onDuplicate={() => duplicateQuestion(index)}
                  onMoveUp={() => move(index, index - 1)}
                  onMoveDown={() => move(index, index + 1)}
                  isFirst={index === 0}
                  isLast={index === fields.length - 1}
                />
              ))
            )}
          </CardContent>
          <CardFooter className="border-t pt-6">
            <div className="flex items-center justify-between w-full">
              <div className="space-y-1">
                <p className="text-sm font-medium">Summary</p>
                <p className="text-sm text-muted-foreground">
                  {fields.length} question{fields.length !== 1 ? 's' : ''} • {calculatedTotal} total marks
                </p>
              </div>
              <Button 
                type="submit" 
                size="lg"
                disabled={mutation.isPending || fields.length === 0}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Assignment'
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

/* ===================== QUESTION EDITOR ===================== */
function QuestionEditor({ index, register, watch, setValue, onRemove, onDuplicate, onMoveUp, onMoveDown, isFirst, isLast }: any) {
  const type = watch(`questions.${index}.type`);

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Q{index + 1}</Badge>
            <Select 
              defaultValue="MCQ" 
              onValueChange={(v) => setValue(`questions.${index}.type`, v)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MCQ">Multiple Choice</SelectItem>
                <SelectItem value="TEXT">Text Answer</SelectItem>
                <SelectItem value="CODE">Code Answer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="icon" onClick={onMoveUp} disabled={isFirst}>
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={onMoveDown} disabled={isLast}>
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={onDuplicate}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={onRemove} className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Question Text */}
        <div className="space-y-2">
          <Label>Question Text</Label>
          <Textarea
            placeholder="Enter your question here..."
            {...register(`questions.${index}.questionText`, { required: true })}
          />
        </div>

        {/* Marks */}
        <div className="space-y-2">
          <Label>Marks</Label>
          <Input
            type="number"
            min="0"
            placeholder="10"
            {...register(`questions.${index}.marks`, { 
              required: true,
              valueAsNumber: true,
              min: 1
            })}
          />
        </div>

        {/* MCQ Options */}
        {type === "MCQ" && (
          <div className="space-y-3">
            <Label>Options</Label>
            {[0, 1, 2, 3].map((optIndex) => (
              <div key={optIndex} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`question-${index}-correct`}
                  value={optIndex}
                  defaultChecked={optIndex === 0}
                  onChange={(e) => setValue(`questions.${index}.correctAnswerIndex`, parseInt(e.target.value))}
                  className="h-4 w-4"
                />
                <Input
                  placeholder={`Option ${optIndex + 1}`}
                  {...register(`questions.${index}.options.${optIndex}.text`, { required: true })}
                  className="flex-1"
                />
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Select the radio button next to the correct answer
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}