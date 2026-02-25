import api from "./axios";

/* ===================================================
   DASHBOARD
=================================================== */

// Match the actual backend response structure
export interface TeacherDashboardStats {
  classrooms: number;
  assignments: number;
  pendingEvaluations: number;
  totalStudents: number;
  trend?: Array<{
    date: string;
    submissions: number;
  }>;
}

export const getTeacherDashboardApi = async (): Promise<TeacherDashboardStats> => {
  const res = await api.get("/teacher/dashboard");
  return res.data;
};

/* ===================================================
   ANALYTICS
=================================================== */

export interface TeacherAnalytics {
  totalAssignments: number;
  totalSubmissions: number;
  averageScore: number;
}

export const getTeacherAnalyticsApi = async (): Promise<TeacherAnalytics> => {
  const res = await api.get("/teacher/analytics");
  return res.data;
};

/* ===================================================
   CLASSROOMS
=================================================== */

export interface TeacherClassroom {
  _id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  studentCount: number;
  assignmentCount: number;
  inviteCode: string;
}

export const getMyClassroomsApi = async (): Promise<TeacherClassroom[]> => {
  const res = await api.get("/teacher/classrooms");
  return res.data;
};

export const getClassroomDetailsApi = async (id: string) => {
  const res = await api.get(`/teacher/classrooms/${id}`);
  return res.data;
};

export const getClassroomStudentsApi = async (id: string) => {
  const res = await api.get(`/teacher/classrooms/${id}/students`);
  return res.data;
};

export const getClassroomAnalyticsApi = async (id: string) => {
  const res = await api.get(`/teacher/classrooms/${id}/analytics`);
  return res.data;
};

/* ===================================================
   ASSIGNMENTS
=================================================== */

export interface Assignment {
  _id: string;
  title: string;
  description?: string;
  totalMarks: number;
  deadline: string;
  startTime?: string;
  isPublished: boolean;
  classroomId: {
    _id: string;
    name: string;
    status: "ACTIVE" | "INACTIVE";
  };
}

export const getMyAssignmentsApi = async (): Promise<Assignment[]> => {
  const res = await api.get("/teacher/assignments");
  return res.data;
};

export const getAssignmentDetailsApi = async (id: string) => {
  const res = await api.get(`/teacher/assignments/${id}`);
  return res.data;
};

export interface AssignmentQuestionInput {
  type: "MCQ" | "TEXT" | "CODE";
  questionText: string;
  marks: number;
  options?: string[];
  correctAnswerIndex?: number;
}

export interface CreateAssignmentPayload {
  classroomId: string;
  title: string;
  totalMarks: number;
  deadline: string;
  questions: AssignmentQuestionInput[];
}

export const createAssignmentApi = async (
  payload: CreateAssignmentPayload
) => {
  const res = await api.post("/teacher/assignments", payload);
  return res.data;
};

export interface AssignmentQuestionFromApi {
  _id: string;
  type: "MCQ" | "TEXT" | "CODE";
  questionText: string;
  marks: number;
  options?: string[];
  correctAnswer?: number;
}

export interface UpdateAssignmentPayload {
  title: string;
  totalMarks: number;
  deadline: string;
  questions: AssignmentQuestionInput[];
}

export const updateAssignmentApi = async (
  id: string,
  payload: UpdateAssignmentPayload
) => {
  const res = await api.put(`/teacher/assignments/${id}`, payload);
  return res.data;
};

export const publishAssignmentApi = async (id: string) => {
  const res = await api.patch(`/teacher/assignments/${id}/publish`);
  return res.data;
};

export const deleteAssignmentApi = async (id: string) => {
  const res = await api.delete(`/teacher/assignments/${id}`);
  return res.data;
};

export const getAssignmentSubmissionsApi = async (id: string) => {
  const res = await api.get(`/teacher/assignments/${id}/submissions`);
  return res.data;
};

/* ===================================================
   SUBMISSIONS
=================================================== */

export interface SubmissionStudent {
  _id: string;
  name: string;
  email: string;
}

export interface SubmissionAssignment {
  _id: string;
  title: string;
  totalMarks: number;
}

export interface Submission {
  _id: string;
  assignmentId: SubmissionAssignment;
  studentId: SubmissionStudent;
  totalScore?: number;
  status: "PENDING" | "EVALUATED";
  createdAt: string;
}

export interface SubmissionDetails {
  _id: string;
  assignmentId: {
    _id: string;
    title: string;
    totalMarks: number;
  };
  studentId: {
    _id: string;
    name: string;
    email: string;
  };
  answers: Array<{
    questionId: {
      _id: string;
      questionText: string;
      type: "MCQ" | "TEXT" | "CODE";
      marks: number;
      options?: { text: string }[];
      correctAnswerIndex?: number;
    };
    answer: string;
    awardedMarks: number;
    teacherComment: string;
    isCorrect?: boolean | null;
  }>;
  totalScore: number;
  feedback: string;
  status: "SUBMITTED" | "EVALUATED";
  submittedAt: string;
  createdAt: string;
  updatedAt?: string;
}

export const getAllSubmissionsApi = async (): Promise<Submission[]> => {
  const res = await api.get("/teacher/submissions");
  return res.data;
};

export const getSubmissionDetailsApi = async (
  id: string
): Promise<SubmissionDetails> => {
  const res = await api.get(`/teacher/submissions/${id}`);
  return res.data;
};

export const evaluateSubmissionApi = (
  id: string,
  data: {
    answers: {
      questionId: string;
      awardedMarks: number;
      teacherComment: string;
      isCorrect?: boolean | null;
    }[];
    feedback: string;
  }
) => {
  return api.patch(`/teacher/submissions/${id}/evaluate`, data);
};

/* ===================================================
   ATTENDANCE
=================================================== */

export interface AttendanceRecord {
  studentId: string;
  status: "PRESENT" | "ABSENT";
}

export interface MarkAttendancePayload {
  attendanceData: AttendanceRecord[];
}

export interface AttendanceStats {
  date: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  attendanceRate: number;
  records: Array<{
    studentId: string;
    name: string;
    email: string;
    avatar?: string;
    status: "PRESENT" | "ABSENT";
  }>;
}

export interface AttendanceHistory {
  date: string;
  presentCount: number;
  absentCount: number;
  totalStudents: number;
  attendanceRate: number;
}

export const markAttendanceApi = async (
  classroomId: string,
  payload: MarkAttendancePayload
) => {
  const res = await api.post(`/teacher/classrooms/${classroomId}/attendance`, payload);
  return res.data;
};

export const getTodayAttendanceApi = async (
  classroomId: string
): Promise<AttendanceStats | null> => {
  const today = new Date().toISOString().split('T')[0];
  const res = await api.get(`/teacher/classrooms/${classroomId}/attendance?date=${today}`);
  return res.data;
};

export const getAttendanceHistoryApi = async (
  classroomId: string
): Promise<AttendanceHistory[]> => {
  const res = await api.get(`/teacher/classrooms/${classroomId}/attendance/history`);
  return res.data;
};

export const getStudentAttendanceApi = async (
  classroomId: string,
  studentId: string
): Promise<{
  student: { name: string; email: string };
  attendance: Array<{ date: string; status: "PRESENT" | "ABSENT" }>;
  stats: { present: number; absent: number; attendanceRate: number };
}> => {
  const res = await api.get(`/teacher/classrooms/${classroomId}/students/${studentId}/attendance`);
  return res.data;
};