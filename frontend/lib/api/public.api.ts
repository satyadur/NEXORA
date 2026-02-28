import api from "./axios";

/* ================= PUBLIC FACULTY ================= */

export interface PublicFaculty {
  _id: string;
  name: string;
  avatar?: string;
}

export const getPublicFaculty = async (): Promise<PublicFaculty[]> => {
  const res = await api.get("/public/faculty");
  return res.data;
};

/* ================= TOP STUDENTS ================= */

export interface TopStudent {
  _id: string;
  name: string;
  avatar?: string;
  averageScore: number;
}

export const getTopStudents = async (): Promise<TopStudent[]> => {
  const res = await api.get("/public/top-students");
  return res.data;
};

export interface Package {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  limits: {
    courses: string;
    certificates: boolean;
    mentoring: boolean | string;
  };
  popular?: boolean;
}

export interface PackagesResponse {
  success: boolean;
  packages: Package[];
}

// Fetch all available packages
export const getPackagesApi = async (): Promise<PackagesResponse> => {
  const res = await api.get("/public/courses/packages");
  return res.data;
};

// Fetch popular courses
export const getPopularCoursesApi = async (limit?: number) => {
  const params = limit ? `?limit=${limit}` : "";
  const res = await api.get(`/public/courses/popular${params}`);
  return res.data;
};

// Fetch all courses with filters - FIXED URL
export const getCoursesApi = async (params?: {
  department?: string;
  level?: string;
  page?: number;
  limit?: number;
  status?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.department) queryParams.append("department", params.department);
  if (params?.level) queryParams.append("level", params.level);
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.status) queryParams.append("status", params.status);

  // FIX: Use /public/courses instead of /courses
  const res = await api.get(`/public/courses?${queryParams.toString()}`);
  return res.data;
};

// Fetch course by ID - FIXED URL
export const getCourseByIdApi = async (id: string) => {
  const res = await api.get(`/public/courses/${id}`);
  return res.data;
};

// Fetch courses by department - FIXED URL
export const getCoursesByDepartmentApi = async (
  department: string,
  level?: string,
) => {
  const params = level ? `?level=${level}` : "";
  const res = await api.get(
    `/public/courses/department/${department}${params}`,
  );
  return res.data;
};

// Search courses - FIXED URL
export const searchCoursesApi = async (params: {
  q?: string;
  department?: string;
  level?: string;
  minPrice?: number;
  maxPrice?: number;
}) => {
  const queryParams = new URLSearchParams();
  if (params.q) queryParams.append("q", params.q);
  if (params.department) queryParams.append("department", params.department);
  if (params.level) queryParams.append("level", params.level);
  if (params.minPrice)
    queryParams.append("minPrice", params.minPrice.toString());
  if (params.maxPrice)
    queryParams.append("maxPrice", params.maxPrice.toString());

  const res = await api.get(`/public/courses/search?${queryParams.toString()}`);
  return res.data;
};

// Fetch public faculty
export const getPublicFacultyApi = async () => {
  const res = await api.get("/public/faculty");
  return res.data;
};

// Fetch top students
export const getTopStudentsApi = async () => {
  const res = await api.get("/public/top-students");
  return res.data;
};

// lib/api/public.api.ts

export interface VerifyCertificateResponse {
  success: boolean;
  student: any; // Use the types from above
  assignments: any[];
  courses: {
    enrolled: any[];
    detailed: any[];
  };
  certificates: any[];
  verification: {
    verifiedAt: string;
    method: string;
    uniqueId: string;
    isAuthentic: boolean;
  };
}

export const verifyCertificateApi = async (
  uniqueId: string,
): Promise<VerifyCertificateResponse> => {
  const res = await api.get(`/public/verify/${uniqueId}`);
  return res.data;
};

// Quick verification
export const quickVerifyCertificateApi = async (uniqueId: string) => {
  const res = await api.get(`/public/verify/${uniqueId}/quick`);
  return res.data;
};

export const verifyCertificateByIdApi = async (certificateId: string) => {
  const res = await api.get(`/public/verify/cert/${certificateId}`);

  return res.data;
};
