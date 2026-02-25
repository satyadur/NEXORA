export type UserRole = "ADMIN" | "TEACHER" | "STUDENT";

export interface Education {
  degree: string;
  specialization: string;
  university?: string;
  yearOfPassing?: number;
  percentage?: number;
  isCompleted?: boolean;
}

export interface Experience {
  company: string;
  position: string;
  duration: string;
  description?: string;
  isCurrent?: boolean;
}

export interface Skill {
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

export interface SocialLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
  twitter?: string;
}

export interface JobPreferences {
  preferredRoles?: string[];
  preferredLocations?: string[];
  expectedSalary?: string;
  jobType?: Array<
    "Full Time" | "Part Time" | "Internship" | "Work from Home" | "Contract"
  >;
  immediateJoiner?: boolean;
  noticePeriod?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: "Male" | "Female" | "Other" | "Prefer not to say";

  // Teacher
  department?: string;
  designation?: string;
  employeeId?: string;
  joiningDate?: string;

  // Student
  enrollmentNumber?: string;
  batch?: string;
  currentSemester?: number;
  cgpa?: number;
  backlogs?: number;
  skills?: Skill[];

  education?: Education[];
  experience?: Experience[];

  jobPreferences?: JobPreferences;
  socialLinks?: SocialLinks;
  address?: Address;
  resume?: string;

  isProfileComplete?: boolean;
  isPlacementEligible?: boolean;
  placementStatus?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
