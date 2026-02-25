// lib/api/admin.attendance.api.ts
import api from "./axios";

export interface TeacherAttendanceRecord {
  _id: string;
  employeeId: {
    _id: string;
    name: string;
    email: string;
  };
  employeeName: string;
  employeeEmail: string;
  employeeRole: "TEACHER" | "FACULTY_ADMIN";
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "ON_LEAVE";
  actualCheckIn?: {
    startTime: string;
    location?: {
      coordinates: [number, number];
    };
    address?: {
      formattedAddress?: string;
      city?: string;
    };
    checkInMethod?: string;
  };
  actualCheckOut?: {
    startTime: string;
  };
  totalWorkHours: number;
  formattedWorkHours: string;
}

export interface AttendanceSummary {
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalOnLeave: number;
  totalRecords: number;
  attendanceRate: number;
}

// Get all attendance records with filters
export const getTeacherAttendanceApi = async (
  startDate?: string,
  endDate?: string,
  employeeId?: string,
  status?: string
): Promise<TeacherAttendanceRecord[]> => {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  if (employeeId) params.append("employeeId", employeeId);
  if (status) params.append("status", status);
  
  const res = await api.get(`/admin/teacher-attendance?${params.toString()}`);
  return res.data;
};

// Get attendance summary
export const getAttendanceSummaryApi = async (
  startDate?: string,
  endDate?: string
): Promise<AttendanceSummary> => {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  
  const res = await api.get(`/admin/attendance/summary?${params.toString()}`);
  return res.data;
};

// Get all employees (teachers and faculty admins)
export const getEmployeesForAttendanceApi = async (): Promise<{ _id: string; name: string; role: string }[]> => {
  const res = await api.get("/admin/employees");
  return res.data;
};