// lib/api/admin.api.ts
import api from "./axios"

/* =====================================================
   EXISTING TYPES (Keep all your existing types)
===================================================== */

export interface Teacher {
  _id: string
  name: string
  email: string
}

export interface TeacherClassroom {
  _id: string
  name: string
  status: "ACTIVE" | "INACTIVE"
  studentCount: number
  assignmentCount: number
}

export interface TeacherDetailsResponse {
  teacher: Teacher
  classrooms: TeacherClassroom[]
  totalClassrooms: number
}

export interface Student {
  _id: string
  name: string
  email: string
  avatar?: string | null
  uniqueId: string
}

export interface StudentClassroom {
  _id: string
  name: string
  status: "ACTIVE" | "INACTIVE"
}

export interface StudentAssignment {
  _id: string
  title: string
  totalMarks: number
  deadline: string
  submitted: boolean
  status: "SUBMITTED" | "EVALUATED" | "NOT_SUBMITTED"
  score: number | null
}

export interface StudentPerformance {
  totalAssignments: number
  submittedCount: number
  averageScore: number
}

export interface AttendanceSummary {
  totalDays: number
  present: number
  absent: number
  attendancePercentage: number
}

export interface StudentDetailsResponse {
  student: Student
  classrooms: StudentClassroom[]
  assignments: StudentAssignment[]
  performance: StudentPerformance
  attendanceSummary: AttendanceSummary
}

export interface AdminAssignment {
  _id: string
  title: string
  classroom: string
  teacher: string
  totalMarks: number
  deadline: string
  isPublished: boolean
  totalSubmissions: number
  averageScore: number
}

export interface AdminSubmission {
  _id: string
  assignment: string
  student: string
  totalScore: number
  status: "SUBMITTED" | "EVALUATED"
  submittedAt: string
}

export interface StudentAnalytics {
  overview: {
    totalStudents: number;
    studentsWithSubmissions: number;
    studentsWithoutSubmissions: number;
    submissionRate: number;
    overallAverageScore: number;
  };
  performers: {
    top3: Array<{
      name: string;
      email: string;
      averageScore: number;
      totalSubmissions: number;
      totalScore: number;
    }>;
    bottom3: Array<{
      name: string;
      email: string;
      averageScore: number;
      totalSubmissions: number;
    }>;
  };
  pendingWork: {
    studentsWithPending: Array<{
      _id: string;
      name: string;
      email: string;
      pendingAssignments: Array<{
        title: string;
        classroom: string;
      }>;
      count: number;
    }>;
    totalPendingAssignments: number;
  };
  classroomDistribution: {
    totalStudents: number;
    classrooms: Array<{
      name: string;
      count: number;
    }>;
    avgStudentsPerClass: number;
  };
  attendance: {
    topAttendance: Array<{
      name: string;
      email: string;
      attendanceRate: number;
      presentCount: number;
      totalDays: number;
    }>;
    avgAttendanceRate: number;
  };
  performance: {
    topScorer: {
      name: string;
      averageScore: number;
    } | null;
    needsAttention: {
      name: string;
      averageScore: number;
    } | null;
    mostPending: {
      name: string;
      count: number;
    } | null;
  };
}

/* =====================================================
   NEW TYPES FOR FACULTY ADMIN & EMPLOYEE MANAGEMENT
===================================================== */

// Faculty Admin Types
export interface FacultyAdmin {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  employeeRecord?: {
    employeeId: string;
    department: string;
    designation: string;
  };
}

export interface FacultyAdminDetails extends FacultyAdmin {
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
  aadharNumber?: string;
  panNumber?: string;
  uniqueId?: string;
  employeeRecord: {
    employeeId: string;
    designation: string;
    department: string;
    joiningDate: string;
    contractType: string;
    salary: {
      basic: number;
      hra: number;
      da: number;
      ta: number;
      pf: number;
      tax: number;
      netSalary: number;
    };
  };
}

export interface FacultyAdminStats {
  totalDocuments: number;
  totalPayslips: number;
  recentActivity: Array<{
    _id: string;
    employeeId: { name: string };
    documentType: string;
    title: string;
    createdAt: string;
  }>;
}

export interface FacultyAdminDetailsResponse {
  facultyAdmin: FacultyAdminDetails;
  stats: FacultyAdminStats;
  documents: EmployeeDocument[];
  payslips: Payslip[];
}

// Employee Types
export interface Employee {
  _id: string;
  name: string;
  email: string;
  role: "TEACHER" | "FACULTY_ADMIN";
  phone?: string;
  employeeRecord?: {
    employeeId: string;
    department?: string;
    designation?: string;
  };
}

export interface EmployeeAttendance {
  _id: string;
  name: string;
  attendanceRate: number;
  present: number;
  total: number;
}

// Payroll Types
export interface Payslip {
  _id: string;
  employeeId: {
    _id: string;
    name: string;
    email: string;
    employeeRecord?: { employeeId: string };
  };
  month: string;
  year: number;
  earnings: {
    basic: number;
    hra: number;
    da: number;
    ta: number;
    specialAllowance?: number;
    bonus?: number;
    totalEarnings: number;
  };
  deductions: {
    pf: number;
    tax: number;
    professionalTax?: number;
    loan?: number;
    totalDeductions: number;
  };
  netSalary: number;
  bankDetails?: {
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
  };
  paymentStatus: "PENDING" | "PROCESSED" | "PAID" | "FAILED";
  paymentDate?: string;
  pdfUrl?: string;
  createdAt: string;
}

// lib/api/admin.api.ts - Update the GeneratePayslipPayload interface

export interface GeneratePayslipPayload {
  employeeId: string;
  month: string;
  year: number;
  earnings: {
    basic: number;
    hra: number;
    da?: number;
    ta?: number;
    specialAllowance?: number;
    bonus?: number;
  };
  deductions: {
    pf: number;
    tax: number;
    professionalTax?: number;
    loan?: number;
  };
  notes?: string;
}

export interface PayrollSummary {
  year: number;
  month: string;
  totalPayroll: number;
  avgSalary: number;
  count: number;
  minSalary: number;
  maxSalary: number;
}

// Employee Document Types
export interface EmployeeDocument {
  _id: string;
  employeeId: string;
  documentType: "OFFER_LETTER" | "APPOINTMENT_LETTER" | "EXPERIENCE_LETTER" | 
                "RELIEVING_LETTER" | "PAYSLIP" | "PAN_CARD" | "AADHAR_CARD" | 
                "QUALIFICATION_CERTIFICATE" | "TRAINING_CERTIFICATE" | "ACHIEVEMENT_CERTIFICATE" | "CONTRACT";
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  issueDate?: string;
  metadata?: any;
  isVerified: boolean;
  verifiedBy?: { name: string };
  uploadedBy: { name: string };
  createdAt: string;
}

export interface UploadDocumentPayload {
  employeeId: string;
  documentType: string;
  title: string;
  description?: string;
  issueDate?: string;
  file: File;
}

// Teacher Salary & Leave Types
export interface TeacherSalary {
  basic: number;
  hra: number;
  da: number;
  ta: number;
  pf: number;
  tax: number;
  netSalary: number;
}

export interface TeacherLeave {
  total: number;
  taken: number;
  remaining: number;
  records: Array<{
    _id: string;
    type: "CASUAL" | "SICK" | "EARNED" | "OTHER";
    fromDate: string;
    toDate: string;
    days: number;
    reason: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    approvedBy?: string;
  }>;
}

// Faculty Analytics Types
export interface FacultyAnalytics {
  totalFaculty: number;
  avgDocuments: number;
  avgPayslips: number;
  totalPayroll: number;
  facultyDetails: Array<{
    name: string;
    email: string;
    department: string;
    joiningDate: string;
    documentCount: number;
    payslipCount: number;
    totalSalary: number;
  }>;
}

/* =====================================================
   EXISTING API FUNCTIONS (Keep all your existing functions)
===================================================== */

// Teacher APIs
export const getTeachersApi = async (): Promise<Teacher[]> => {
  const res = await api.get("/admin/teachers")
  return res.data
}

export interface CreateTeacherPayload {
  name: string
  email: string
  password: string
  phone?: string
  department?: string
  designation?: string
  joiningDate?: string
}

export const createTeacherApi = async (
  data: CreateTeacherPayload
): Promise<Teacher> => {
  const res = await api.post("/admin/teachers", data)
  return res.data
}

export interface UpdateTeacherPayload {
  id: string
  name?: string
  email?: string
  phone?: string
  department?: string
  designation?: string
}

export const updateTeacherApi = async (
  data: UpdateTeacherPayload
): Promise<Teacher> => {
  const { id, ...payload } = data
  const res = await api.put(`/admin/teachers/${id}`, payload)
  return res.data
}

export const deleteTeacherApi = async (
  id: string
): Promise<{ message: string }> => {
  const res = await api.delete(`/admin/teachers/${id}`)
  return res.data
}

export const getTeacherDetailsApi = async (
  id: string
): Promise<TeacherDetailsResponse> => {
  const res = await api.get(`/admin/teachers/${id}/details`)
  return res.data
}

// Student APIs
export const getStudentsApi = async (): Promise<Student[]> => {
  const res = await api.get("/admin/students")
  return res.data
}

export interface CreateStudentPayload {
  name: string
  email: string
  password: string
  phone?: string
  enrollmentNumber?: string
  batch?: string
}

export const createStudentApi = async (
  data: CreateStudentPayload
): Promise<Student> => {
  const res = await api.post("/admin/students", data)
  return res.data
}

export interface UpdateStudentPayload {
  id: string
  name?: string
  email?: string
  phone?: string
  batch?: string
  cgpa?: number
}

export const updateStudentApi = async (
  data: UpdateStudentPayload
): Promise<Student> => {
  const { id, ...payload } = data
  const res = await api.put(`/admin/students/${id}`, payload)
  return res.data
}

export const deleteStudentApi = async (
  id: string
): Promise<{ message: string }> => {
  const res = await api.delete(`/admin/students/${id}`)
  return res.data
}

export const getStudentDetailsApi = async (
  id: string
): Promise<StudentDetailsResponse> => {
  const res = await api.get(`/admin/students/${id}/details`)
  return res.data
}

// Assignment & Submission APIs
export const getAssignmentsAdminApi = async (): Promise<AdminAssignment[]> => {
  const res = await api.get("/admin/assignments")
  return res.data
}

export const getSubmissionsAdminApi = async (): Promise<AdminSubmission[]> => {
  const res = await api.get("/admin/submissions")
  return res.data
}

// Analytics APIs
export const getStudentAnalyticsApi = async (): Promise<StudentAnalytics> => {
  const res = await api.get("/admin/students/analytics");
  return res.data;
}

/* =====================================================
   NEW API FUNCTIONS
===================================================== */

// ========== FACULTY ADMIN APIs ==========

export const getFacultyAdminsApi = async (): Promise<FacultyAdmin[]> => {
  const res = await api.get("/admin/faculty-admins")
  return res.data
}

export interface CreateFacultyAdminPayload {
  name: string
  email: string
  password: string
  phone?: string
  dateOfBirth?: string
  gender?: string
  bloodGroup?: string
  address?: {
    street?: string
    city?: string
    state?: string
    country?: string
    pincode?: string
  }
  aadharNumber?: string
  panNumber?: string
  department?: string
  designation?: string
  joiningDate?: string
  salary?: {
    basic?: number
    hra?: number
    da?: number
    ta?: number
    pf?: number
    tax?: number
  }
}

export const createFacultyAdminApi = async (
  data: CreateFacultyAdminPayload
): Promise<FacultyAdmin> => {
  const res = await api.post("/admin/faculty-admins", data)
  return res.data
}

export interface UpdateFacultyAdminPayload {
  id: string
  name?: string
  email?: string
  phone?: string
  department?: string
  designation?: string
  salary?: {
    basic?: number
    hra?: number
    da?: number
    ta?: number
    pf?: number
    tax?: number
  }
}

export const updateFacultyAdminApi = async (
  data: UpdateFacultyAdminPayload
): Promise<FacultyAdmin> => {
  const { id, ...payload } = data
  const res = await api.put(`/admin/faculty-admins/${id}`, payload)
  return res.data
}

export const deleteFacultyAdminApi = async (
  id: string
): Promise<{ message: string }> => {
  const res = await api.delete(`/admin/faculty-admins/${id}`)
  return res.data
}

export const getFacultyAdminDetailsApi = async (
  id: string
): Promise<FacultyAdminDetailsResponse> => {
  const res = await api.get(`/admin/faculty-admins/${id}/details`)
  return res.data
}

// ========== EMPLOYEE MANAGEMENT APIs ==========

export const getAllEmployeesApi = async (): Promise<Employee[]> => {
  const res = await api.get("/admin/employees")
  return res.data
}

export const getEmployeeAttendanceApi = async (
  month?: number,
  year?: number
): Promise<EmployeeAttendance[]> => {
  const params = new URLSearchParams()
  if (month) params.append("month", month.toString())
  if (year) params.append("year", year.toString())
  
  const res = await api.get("/admin/employees/attendance", { params })
  return res.data
}

// ========== PAYROLL APIs ==========

// export const generatePayslipApi = async (
//   data: GeneratePayslipPayload
// ): Promise<Payslip> => {
//   const res = await api.post("/admin/payslips/generate", data)
//   return res.data
// }

// export const getPayslipsApi = async (
//   employeeId?: string,
//   year?: number
// ): Promise<Payslip[]> => {
//   const params = new URLSearchParams()
//   if (year) params.append("year", year.toString())
  
//   const url = employeeId 
//     ? `/admin/payslips/${employeeId}?${params.toString()}`
//     : `/admin/payslips?${params.toString()}`
  
//   const res = await api.get(url)
//   return res.data
// }

// ========== EMPLOYEE DOCUMENT APIs ==========

export const uploadEmployeeDocumentApi = async (
  data: UploadDocumentPayload
): Promise<EmployeeDocument> => {
  const formData = new FormData()
  formData.append("employeeId", data.employeeId)
  formData.append("documentType", data.documentType)
  formData.append("title", data.title)
  if (data.description) formData.append("description", data.description)
  if (data.issueDate) formData.append("issueDate", data.issueDate)
  formData.append("document", data.file)

  const res = await api.post("/admin/documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })
  return res.data
}

export const getEmployeeDocumentsApi = async (
  employeeId: string,
  documentType?: string
): Promise<EmployeeDocument[]> => {
  const params = new URLSearchParams()
  if (documentType) params.append("documentType", documentType)
  
  const res = await api.get(`/admin/documents/${employeeId}?${params.toString()}`)
  return res.data
}

// ========== TEACHER SALARY & LEAVE APIs ==========

export const getTeacherSalaryApi = async (
  teacherId: string
): Promise<TeacherSalary> => {
  const res = await api.get(`/admin/teachers/${teacherId}/salary`)
  return res.data
}

export interface UpdateTeacherSalaryPayload {
  teacherId: string
  basic?: number
  hra?: number
  da?: number
  ta?: number
  pf?: number
  tax?: number
}

export const updateTeacherSalaryApi = async (
  data: UpdateTeacherSalaryPayload
): Promise<TeacherSalary> => {
  const { teacherId, ...payload } = data
  const res = await api.put(`/admin/teachers/${teacherId}/salary`, payload)
  return res.data
}

export const getTeacherLeavesApi = async (
  teacherId: string
): Promise<TeacherLeave> => {
  const res = await api.get(`/admin/teachers/${teacherId}/leaves`)
  return res.data
}

export interface ApproveLeavePayload {
  teacherId: string
  leaveId: string
  status: "APPROVED" | "REJECTED"
}

export const approveLeaveApi = async (
  data: ApproveLeavePayload
): Promise<{ message: string }> => {
  const { teacherId, leaveId, status } = data
  const res = await api.post(`/admin/teachers/${teacherId}/leaves/${leaveId}/approve`, { status })
  return res.data
}

// ========== FACULTY ANALYTICS APIs ==========

export const getFacultyAnalyticsApi = async (): Promise<FacultyAnalytics> => {
  const res = await api.get("/admin/faculty/analytics")
  return res.data
}

// ========== ADMIN DASHBOARD STATS ==========

export interface AdminStats {
  overview: {
    totalUsers: number;
    totalStudents: number;
    totalTeachers: number;
    totalFacultyAdmins: number;
    totalClassrooms: number;
    totalAssignments: number;
    activeClassrooms: number;
    pendingClassrooms: number;
    publishedAssignments: number;
    draftAssignments: number;
  };
  growth: {
    newUsersThisMonth: number;
    newSubmissionsThisMonth: number;
    newAssignmentsThisMonth: number;
    activeUsersLast7Days: number;
  };
  performance: {
    totalSubmissions: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
  };
  scoreDistribution: Array<{
    _id: string;
    count: number;
  }>;
  utilization: {
    totalClassrooms: number;
    totalEnrolledStudents: number;
    avgClassSize: number;
  };
  teacherAnalytics: {
    avgClassroomsPerTeacher: number;
    avgAssignmentsPerTeacher: number;
    totalActiveTeachers: number;
  };
  facultyAnalytics: {
    totalFacultyAdmins: number;
    avgDocumentsManaged: number;
    avgPayslipsGenerated: number;
  };
  payrollSummary: {
    totalPayroll: number;
    avgSalary: number;
    totalPayslips: number;
  };
  studentEngagement: {
    avgSubmissionsPerStudent: number;
    studentsWithNoSubmissions: number;
    avgAttendanceRate: number;
  };
}

export const getAdminStatsApi = async (): Promise<AdminStats> => {
  const res = await api.get("/admin/stats")
  return res.data
}

export const getMonthlyGrowthApi = async (): Promise<any> => {
  const res = await api.get("/admin/monthly-growth")
  return res.data
}

// lib/api/admin.api.ts - Add these Payslip specific functions

// ========== PAYSLIP SPECIFIC API FUNCTIONS ==========

/**
 * Generate a single payslip for an employee
 */
export const generatePayslipApi = async (
  data: GeneratePayslipPayload
): Promise<Payslip> => {
  const res = await api.post("/admin/payslips/generate", data);
  return res.data;
};

/**
 * Generate payslips for all employees for a specific month/year
 */
export const generateMonthlyPayslipsApi = async (
  month: string,
  year: number
): Promise<{
  message: string;
  results: Array<{
    employee: string;
    status: "success" | "skipped" | "error";
    payslipId?: string;
    message?: string;
    error?: string;
  }>;
}> => {
  const res = await api.post("/admin/payslips/generate-monthly", { month, year });
  return res.data;
};

/**
 * Get all payslips with optional filters
 */
export const getPayslipsApi = async (
  employeeId?: string,
  year?: number,
  month?: string
): Promise<Payslip[]> => {
  const params = new URLSearchParams();
  if (year) params.append("year", year.toString());
  if (month) params.append("month", month);
  
  const url = employeeId 
    ? `/admin/payslips/employee/${employeeId}?${params.toString()}`
    : `/admin/payslips?${params.toString()}`;
  
  const res = await api.get(url);
  return res.data;
};

/**
 * Get a single payslip by ID
 */
export const getPayslipByIdApi = async (id: string): Promise<Payslip> => {
  const res = await api.get(`/admin/payslips/${id}`);
  return res.data;
};

/**
 * Download payslip PDF
 */
export const downloadPayslipApi = async (id: string): Promise<Blob> => {
  const res = await api.get(`/admin/payslips/${id}/download`, {
    responseType: 'blob'
  });
  return res.data;
};

/**
 * Update payslip status
 */
export const updatePayslipStatusApi = async (
  id: string,
  status: "PENDING" | "PROCESSED" | "PAID" | "FAILED"
): Promise<Payslip> => {
  const res = await api.put(`/admin/payslips/${id}/status`, { status });
  return res.data;
};

/**
 * Delete a payslip
 */
export const deletePayslipApi = async (id: string): Promise<{ message: string }> => {
  const res = await api.delete(`/admin/payslips/${id}`);
  return res.data;
};

/**
 * Get payroll summary with optional filters
 */
export const getPayrollSummaryApi = async (
  year?: number,
  month?: string
): Promise<{
  monthly: Array<{
    year: number;
    month: string;
    totalPayroll: number;
    avgSalary: number;
    count: number;
    minSalary: number;
    maxSalary: number;
    uniqueEmployees: number;
  }>;
  comparison: {
    previousMonth: string;
    previousYear: number;
    previousTotal: number;
    currentTotal: number;
    growth: number;
  };
}> => {
  const params = new URLSearchParams();
  if (year) params.append("year", year.toString());
  if (month) params.append("month", month);
  
  const res = await api.get("/admin/payroll/summary", { params });
  return res.data;
};

