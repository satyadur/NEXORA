// types/certificate.types.ts

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

export interface Education {
  degree: string;
  specialization: string;
  university: string;
  yearOfPassing: number;
  percentage?: number;
  isCompleted: boolean;
}

export interface Skill {
  name: string;
  level?: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  certificates?: Array<{
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
    url?: string;
  }>;
}

export interface SocialLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
  twitter?: string;
}

export interface Answer {
  questionId: string;
  awardedMarks: number;
  teacherComment?: string;
  isCorrect?: boolean;
}

export interface Submission {
  _id: string;
  assignmentId: string;
  assignmentTitle: string;
  classroomName: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  status: "SUBMITTED" | "EVALUATED";
  submittedAt: string;
  feedback?: string;
  answers?: Answer[];
}

export interface AssignmentStats {
  totalAssignments: number;
  submittedCount: number;
  evaluatedCount: number;
  averageScore: number;
  totalObtainedMarks: number;
  totalPossibleMarks: number;
}

export interface CourseEnrollment {
  _id: string;
  courseId: string;
  courseTitle: string;
  courseCode: string;
  credits: number;
  level: string;
  department: string;
  thumbnail?: string;
  enrollmentDate: string;
  status: "enrolled" | "in_progress" | "completed" | "dropped" | "failed";
  progress: number;
  grade?: string;
  percentage?: number;
  completionDate?: string;
  certificateIssued: boolean;
  certificateUrl?: string;
}

export interface EnrolledCourse {
  courseId: string;
  title: string;
  code: string;
  credits: number;
  level: string;
  department: string;
  thumbnail?: string;
  status: string;
}

export interface CourseStats {
  totalEnrolled: number;
  completed: number;
  inProgress: number;
  dropped: number;
}

export interface Certificate {
  _id: string;
  type: "ASSIGNMENT" | "COURSE_COMPLETION" | "ACHIEVEMENT" | "INTERNSHIP" | "PLACEMENT";
  title: string;
  description?: string;
  issueDate: string;
  expiryDate?: string;
  url?: string;
  qrCode?: string;
  metadata?: {
    assignmentId?: string;
    courseId?: string;
    courseCode?: string;
    score?: number;
    maxScore?: number;
    percentage?: number;
    grade?: string;
    credits?: number;
    issuedBy?: string;
  };
}

export interface StudentStats extends AssignmentStats, CourseStats {
  cgpa?: number;
  backlogs: number;
  totalCertificates: number;
}

export interface Student {
  _id: string;
  name: string;
  email: string;
  uniqueId: string;
  enrollmentNumber?: string;
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: Address;
  batch?: string;
  currentSemester?: string;
  cgpa?: number;
  backlogs: number;
  placementStatus: string;
  isPlacementEligible: boolean;
  resume?: string;
  socialLinks?: SocialLinks;
  education: Education[];
  skills: Skill[];
  stats: StudentStats;
}

export interface Verification {
  verifiedAt: string;
  method: string;
  uniqueId: string;
  isAuthentic: boolean;
}

export interface CertificateData {
  success: boolean;
  student: Student;
  assignments: Submission[];
  courses: {
    enrolled: EnrolledCourse[];
    detailed: CourseEnrollment[];
  };
  certificates: Certificate[];
  verification: Verification;
}