// lib/api/course.api.ts
import api from "./axios";

// ==================== TYPES ====================

export interface Course {
  _id: string;
  title: string;
  code: string;
  shortCode?: string;
  description: string;
  longDescription?: string;
  department: string;
  level: "undergraduate" | "postgraduate" | "doctorate" | "diploma" | "certificate";
  credits: number;
  duration: {
    value: number;
    unit: "weeks" | "months" | "semesters" | "years";
  };
  instructors: Array<{
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  }>;
  headInstructor?: {
    _id: string;
    name: string;
    email: string;
  };
  fee?: {
    amount: number;
    currency: string;
    type: "one_time" | "per_semester" | "per_month" | "per_year";
    installments?: Array<{
      dueDate: string;
      amount: number;
      description: string;
    }>;
  };
  status: "draft" | "published" | "archived" | "upcoming" | "ongoing" | "completed";
  tags: string[];
  category?: string;
  skillsGained: string[];
  learningOutcomes: string[];
  syllabus?: {
    title: string;
    description: string;
    topics: Array<{
      week: number;
      title: string;
      description?: string;
      duration?: number;
    }>;
  };
  enrollmentStats: {
    totalEnrolled: number;
    currentEnrolled: number;
    completedCount: number;
    averageRating: number;
  };
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseEnrollment {
  _id: string;
  courseId: Course | string;
  studentId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    enrollmentNumber: string;
    batch: string;
  };
  enrollmentDate: string;
  status: "enrolled" | "in_progress" | "completed" | "dropped" | "failed";
  progress?: {
    modulesCompleted: Array<{
      moduleId: string;
      completedAt: string;
      score?: number;
    }>;
    overallProgress: number;
    lastAccessed?: string;
  };
  grades?: Array<{
    assessmentId: string;
    type: "quiz" | "assignment" | "exam";
    score: number;
    maxScore: number;
    percentage: number;
    grade: string;
  }>;
  finalGrade?: string;
  finalPercentage?: number;
  completionDate?: string;
  certificateIssued?: boolean;
  certificateUrl?: string;
}

export interface CourseCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentCategory?: CourseCategory | string;
  level: number;
  path?: string;
  totalCourses: number;
  popularCourses: Course[];
  isActive: boolean;
  order: number;
}

export interface CourseStats {
  overview: {
    totalCourses: number;
    publishedCourses: number;
    draftCourses: number;
    totalEnrollments: number;
    activeEnrollments: number;
    completedEnrollments: number;
  };
  popularCourses: Array<{
    _id: string;
    title: string;
    code: string;
    enrollmentStats: {
      totalEnrolled: number;
    };
  }>;
  departmentStats: Array<{
    _id: string;
    count: number;
    totalEnrollments: number;
  }>;
}

export interface CoursesResponse {
  courses: Course[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// ==================== COURSE CRUD ====================

export const createCourseApi = async (data: Partial<Course>): Promise<Course> => {
  const res = await api.post("/courses", data);
  return res.data.course;
};

export const getCoursesApi = async (
  params?: {
    department?: string;
    level?: string;
    status?: string;
    instructor?: string;
    search?: string;
    page?: number;
    limit?: number;
  }
): Promise<CoursesResponse> => {
  const res = await api.get("/courses", { params });
  return res.data;
};

export const getCourseByIdApi = async (id: string): Promise<{
  course: Course;
  stats: any;
  enrollments: CourseEnrollment[];
}> => {
  const res = await api.get(`/courses/${id}`);
  return res.data;
};

export const updateCourseApi = async (
  id: string,
  data: Partial<Course>
): Promise<Course> => {
  const res = await api.put(`/courses/${id}`, data);
  return res.data.course;
};

export const deleteCourseApi = async (id: string): Promise<{ message: string }> => {
  const res = await api.delete(`/courses/${id}`);
  return res.data;
};

// ==================== COURSE ENROLLMENTS ====================

export const getCourseEnrollmentsApi = async (
  courseId: string,
  status?: string
): Promise<CourseEnrollment[]> => {
  const params = status ? { status } : {};
  const res = await api.get(`/courses/${courseId}/enrollments`, { params });
  return res.data;
};

export const enrollStudentsApi = async (
  courseId: string,
  studentIds: string[]
): Promise<{
  message: string;
  enrollments: CourseEnrollment[];
  errors: Array<{ studentId: string; message: string }>;
}> => {
  const res = await api.post(`/courses/${courseId}/enroll`, { studentIds });
  return res.data;
};

export const updateEnrollmentStatusApi = async (
  enrollmentId: string,
  data: {
    status: string;
    grade?: string;
    percentage?: number;
  }
): Promise<CourseEnrollment> => {
  const res = await api.put(`/courses/enrollments/${enrollmentId}`, data);
  return res.data.enrollment;
};

// ==================== COURSE CATEGORIES ====================

export const getCategoriesApi = async (): Promise<CourseCategory[]> => {
  const res = await api.get("/courses/categories");
  return res.data;
};

export const createCategoryApi = async (
  data: Partial<CourseCategory>
): Promise<CourseCategory> => {
  const res = await api.post("/courses/categories", data);
  return res.data.category;
};

export const updateCategoryApi = async (
  id: string,
  data: Partial<CourseCategory>
): Promise<CourseCategory> => {
  const res = await api.put(`/courses/categories/${id}`, data);
  return res.data.category;
};

export const deleteCategoryApi = async (id: string): Promise<{ message: string }> => {
  const res = await api.delete(`/courses/categories/${id}`);
  return res.data;
};

// ==================== COURSE STATS ====================

export const getCourseStatsApi = async (): Promise<CourseStats> => {
  const res = await api.get("/courses/stats");
  return res.data;
};