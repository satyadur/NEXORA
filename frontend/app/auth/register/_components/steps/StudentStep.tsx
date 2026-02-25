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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, Plus, School, Award, Code } from "lucide-react";
import { RegisterFormValues } from "../schemas/register.schema";
import { skillSchema } from "../schemas/register.schema";
import { z } from "zod";

interface Props {
  form: UseFormReturn<RegisterFormValues>;
}

type SkillLevel = z.infer<typeof skillSchema>["level"];

const SKILL_LEVELS: SkillLevel[] = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
];

const SEMESTERS = [
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({
    label: `Semester ${s}`,
    value: s.toString(),
  })),
  { label: "Graduated", value: "Graduated" },
];

export default function StudentStep({ form }: Props) {
  const [skillInput, setSkillInput] = useState("");
  const skills = form.watch("skills") ?? [];

  const addSkill = () => {
    if (skillInput.trim() && !skills.find((s) => s.name === skillInput)) {
      form.setValue("skills", [
        ...skills,
        { name: skillInput, level: "Intermediate" },
      ]);
      setSkillInput("");
    }
  };

  const removeSkill = (skillName: string) => {
    form.setValue(
      "skills",
      skills.filter((s) => s.name !== skillName),
    );
  };

  const updateSkillLevel = (skillName: string, level: SkillLevel) => {
    form.setValue(
      "skills",
      skills.map((s) => (s.name === skillName ? { ...s, level } : s)),
    );
  };

  return (
    <div className="space-y-6">
      {/* Academic Info Card */}
      <div className="bg-linear-to-br from-primary/5 to-secondary/5 rounded-xl p-6 border border-primary/10">
        <div className="flex items-center gap-2 mb-4">
          <School className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Academic Information</h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="enrollmentNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Enrollment Number
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="2022CS101"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="batch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Batch</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="2022-2025"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="currentSemester"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Current Semester
                  </FormLabel>
                  <Select
                    value={field.value ?? undefined}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SEMESTERS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cgpa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">CGPA</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Award className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        className="pl-9"
                        {...field}
                        value={field.value ?? ""}
                        placeholder="8.5"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>

      {/* Skills Card */}
      <div className="bg-linear-to-br from-primary/5 to-secondary/5 rounded-xl p-6 border border-primary/10">
        <div className="flex items-center gap-2 mb-4">
          <Code className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Skills</h3>
        </div>

        <div className="space-y-4">
          {/* Selected Skills */}
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <div
                key={skill.name}
                className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-1.5 border border-primary/20"
              >
                <span className="text-sm font-medium">{skill.name}</span>
                <Select
                  value={skill.level}
                  onValueChange={(v) =>
                    updateSkillLevel(skill.name, v as SkillLevel)
                  }
                >
                  <SelectTrigger className="h-7 w-24 border-0 bg-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SKILL_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => removeSkill(skill.name)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add Skill Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Add a skill (e.g., JavaScript, Python)"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), addSkill())
              }
            />
            <Button
              type="button"
              onClick={addSkill}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
