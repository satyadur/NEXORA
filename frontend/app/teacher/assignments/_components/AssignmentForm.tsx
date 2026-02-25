"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  PlusCircle,
  Trash2,
  ChevronUp,
  ChevronDown,
  Copy,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import { AssignmentFormValues } from "@/types/assignment-form.types";

interface AssignmentFormProps {
  defaultValues?: AssignmentFormValues;
  onSubmit: (values: AssignmentFormValues) => void;
  isLoading?: boolean;
  submitLabel: string;
}

export default function AssignmentForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel,
}: AssignmentFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AssignmentFormValues>({
    defaultValues: defaultValues ?? {
      classroomId: "",
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

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues, reset]);

  const questions = watch("questions");
  const calculatedTotal = questions?.reduce((sum, q) => sum + (q.marks || 0), 0) ?? 0;
  const totalMarks = watch("totalMarks");
  const isTotalValid = calculatedTotal === totalMarks;

  const internalSubmit = (values: AssignmentFormValues) => {
    if (calculatedTotal !== values.totalMarks) {
      toast.error("Validation Error", {
        description: "Total marks must equal sum of question marks.",
      });
      return;
    }

    if (values.questions.length === 0) {
      toast.error("Validation Error", {
        description: "At least one question is required.",
      });
      return;
    }

    onSubmit(values);
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

  return (
    <form onSubmit={handleSubmit(internalSubmit)} className="space-y-6">
      {/* Basic Info Card */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Assignment Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Mathematics Mid-Term Exam"
              {...register("title", { required: true })}
            />
          </div>

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
          {questions.length > 0 && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              isTotalValid 
                ? "bg-green-500/10 text-green-600" 
                : "bg-red-500/10 text-red-600"
            }`}>
              {isTotalValid ? (
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
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Questions</h2>
            <Button type="button" onClick={addQuestion} size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </div>

          {fields.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">No questions added yet</p>
              <Button type="button" variant="link" onClick={addQuestion}>
                Add your first question
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => {
                const type = watch(`questions.${index}.type`);

                return (
                  <Card key={field.id} className="relative border-l-4 border-l-primary">
                    <CardContent className="p-4 space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Q{index + 1}</Badge>
                          <Select
                            defaultValue={type}
                            onValueChange={(v: any) => setValue(`questions.${index}.type`, v)}
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
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => move(index, index - 1)}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => move(index, index + 1)}
                            disabled={index === fields.length - 1}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => duplicateQuestion(index)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

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
                                onChange={(e) => 
                                  setValue(`questions.${index}.correctAnswerIndex`, parseInt(e.target.value))
                                }
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
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button 
          type="submit" 
          size="lg"
          disabled={isLoading || fields.length === 0}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}