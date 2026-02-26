import { z } from "zod";

// Phone validation
const phoneRegex = /^[0-9]{10}$/;

// Skill schema
export const skillSchema = z.object({
  name: z.string().min(1, "Skill name is required"),
  level: z.enum(["Beginner", "Intermediate", "Advanced", "Expert"]),
});

// Course enrollment schema
export const courseEnrollmentSchema = z.object({
  courseId: z.string(),
  courseCode: z.string(),
  courseName: z.string(),
  status: z.enum(["enrolled", "in_progress", "completed", "dropped"]).default("enrolled"),
});

export const registerSchema = z.object({
  // Step 1: Basic Info
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().regex(phoneRegex, "Phone number must be 10 digits").optional().nullable(),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    })
    .refine((val) => {
      const today = new Date();
      const dob = new Date(val);
      const age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();

      return (
        age > 18 ||
        (age === 18 && monthDiff >= 0)
      );
    }, {
      message: "You must be at least 18 years old",
    }),
  gender: z.enum(["Male", "Female", "Other"]).optional().nullable(),
  
  // Role is always STUDENT
  role: z.literal("STUDENT").default("STUDENT"),
  
  // Package selection
  selectedPackage: z.string().min(1, "Please select a package"),
  
  // Student fields
  enrollmentNumber: z.string().optional().nullable(),
  batch: z.string().optional().nullable(),
  currentSemester: z.string().optional().nullable(),
  cgpa: z.string().optional().nullable(),
  skills: z.array(skillSchema).default([]),
  
  // Enrolled Courses - NEW
  enrolledCourses: z.array(courseEnrollmentSchema).default([]),
  
  // Step 5: Additional Info
  jobPreferences: z.object({
    preferredRoles: z.string().optional().default(""),
    preferredLocations: z.string().optional().default(""),
    expectedSalary: z.string().optional().default(""),
    immediateJoiner: z.boolean().default(false),
  }).default({
    preferredRoles: "",
    preferredLocations: "",
    expectedSalary: "",
    immediateJoiner: false,
  }),
  
  socialLinks: z.object({
    linkedin: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")).default(""),
    github: z.string().url("Invalid GitHub URL").optional().or(z.literal("")).default(""),
    portfolio: z.string().url("Invalid portfolio URL").optional().or(z.literal("")).default(""),
    twitter: z.string().url("Invalid Twitter URL").optional().or(z.literal("")).default(""),
  }).default({
    linkedin: "",
    github: "",
    portfolio: "",
    twitter: "",
  }),
  
  address: z.object({
    street: z.string().optional().default(""),
    city: z.string().optional().default(""),
    state: z.string().optional().default(""),
    country: z.string().default("India"),
    pincode: z.string().optional().default(""),
  }).default({
    street: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
  }),
});

export type RegisterFormValues = z.input<typeof registerSchema>;