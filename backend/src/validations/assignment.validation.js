import { z } from "zod";

export const createAssignmentSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  totalMarks: z.number(),
  deadline: z.string(),
});
