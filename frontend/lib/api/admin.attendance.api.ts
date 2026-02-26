import api from "./axios";

// ========== TYPES ==========

export interface Employee {
  _id: string;
  name: string;
  email: string;
  role: "TEACHER" | "FACULTY_ADMIN";
  employeeRecord?: {
    employeeId: string;
    department: string;
    designation: string;
  };
}

export interface Location {
  type: "Point";
  coordinates: [number, number];
  accuracy?: number;
}

export interface Address {
  formattedAddress?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface AttendanceSession {
  startTime: string;
  endTime?: string;
  location?: Location;
  address?: Address;
  checkInMethod?: "qr_scan" | "gps" | "manual" | "face_recognition" | "biometric";
  notes?: string;
}

export interface TeacherAttendanceRecord {
  _id: string;
  employeeId: Employee | string;
  employeeName: string;
  employeeEmail: string;
  employeeRole: "TEACHER" | "FACULTY_ADMIN";
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "ON_LEAVE" | "WORK_FROM_HOME" | "ON_DUTY" | "HOLIDAY";
  actualCheckIn?: AttendanceSession;
  actualCheckOut?: AttendanceSession;
  totalWorkHours: number;
  formattedWorkHours: string;
  lateMinutes?: number;
  earlyDepartureMinutes?: number;
  notes?: string;
  markedBy?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSummary {
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalOnLeave: number;
  totalHoliday: number;
  totalWFH: number;
  totalRecords: number;
  attendanceRate: number;
}

export interface RegularizationRequest {
  _id: string;
  employeeId: Employee;
  date: string;
  requestedStatus: string;
  reason: string;
  supportingDocs?: string[];
  requestedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedBy?: Employee;
  approvedAt?: string;
  adminRemarks?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  allDay: boolean;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    employeeId: string;
    employeeName: string;
    status: string;
    checkIn?: string;
    checkOut?: string;
    workHours?: number;
    notes?: string;
  };
}

export interface BulkAttendanceResult {
  successful: Array<{ employeeId: string; name: string; attendanceId: string }>;
  failed: Array<{ employeeId: string; reason: string }>;
  skipped: Array<{ employeeId: string; name: string; reason: string }>;
}

// ========== ATTENDANCE MANAGEMENT APIS ==========

// In lib/api/admin.attendance.api.ts
export const markAttendanceByAdmin = async (data: {
  employeeId: string;
  date: string;
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
  isLeave?: boolean;
  leaveType?: string;
  leaveReason?: string;
  workHours?: number;
  lateMinutes?: number;
  earlyDepartureMinutes?: number;
  location?: Location;
  address?: Address;
}): Promise<TeacherAttendanceRecord> => {
  
  // Create a copy of the data
  const apiData: any = { ...data };
  
  // If checkInTime is provided and it's just a time string (HH:MM), combine with date
  if (data.checkInTime && data.checkInTime.length <= 5 && !data.checkInTime.includes('T')) {
    apiData.checkInTime = `${data.date}T${data.checkInTime}:00.000Z`;
  }
  
  // If checkOutTime is provided and it's just a time string (HH:MM), combine with date
  if (data.checkOutTime && data.checkOutTime.length <= 5 && !data.checkOutTime.includes('T')) {
    apiData.checkOutTime = `${data.date}T${data.checkOutTime}:00.000Z`;
  }
  
  const res = await api.post("/admin/attendance/manage", apiData);
  return res.data.attendance;
};

// UPDATE: Update attendance by admin
export const updateAttendanceByAdmin = async (
  attendanceId: string,
  data: {
    status?: string;
    checkInTime?: string;
    checkOutTime?: string;
    notes?: string;
    totalWorkHours?: number;
    lateMinutes?: number;
    earlyDepartureMinutes?: number;
    location?: Location;
    address?: Address;
    reason?: string;
  }
): Promise<TeacherAttendanceRecord> => {
  const res = await api.put(`/admin/attendance/manage/${attendanceId}`, data);
  return res.data.attendance;
};

// DELETE: Delete attendance by admin
export const deleteAttendanceByAdmin = async (attendanceId: string): Promise<{ message: string }> => {
  const res = await api.delete(`/admin/attendance/manage/${attendanceId}`);
  return res.data;
};

// GET: Get attendance by ID
export const getAttendanceById = async (attendanceId: string): Promise<TeacherAttendanceRecord> => {
  const res = await api.get(`/admin/attendance/manage/${attendanceId}`);
  return res.data.attendance;
};

// REGULARIZATIONS: Get pending regularization requests
export const getPendingRegularizations = async (params?: {
  page?: number;
  limit?: number;
  employeeId?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<{
  regularizations: RegularizationRequest[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.employeeId) queryParams.append("employeeId", params.employeeId);
  if (params?.fromDate) queryParams.append("fromDate", params.fromDate);
  if (params?.toDate) queryParams.append("toDate", params.toDate);
  
  const res = await api.get(`/admin/attendance/regularizations?${queryParams.toString()}`);
  return res.data;
};

// APPROVE: Approve/reject regularization request
export const approveRegularization = async (
  regularizationId: string,
  data: {
    action: "APPROVED" | "REJECTED";
    reason?: string;
  }
): Promise<TeacherAttendanceRecord> => {
  const res = await api.put(`/admin/attendance/regularizations/${regularizationId}`, data);
  return res.data.attendance;
};

// CALENDAR: Get attendance calendar data
export const getAttendanceCalendar = async (params: {
  month: number;
  year: number;
  employeeId?: string;
}): Promise<{
  calendarData: CalendarEvent[];
  summary: Record<string, number>;
  month: number;
  year: number;
}> => {
  const queryParams = new URLSearchParams();
  queryParams.append("month", params.month.toString());
  queryParams.append("year", params.year.toString());
  if (params.employeeId) queryParams.append("employeeId", params.employeeId);
  
  const res = await api.get(`/admin/attendance/calendar?${queryParams.toString()}`);
  return res.data;
};

// STATS: Get attendance statistics
export const getAttendanceStats = async (params?: {
  fromDate?: string;
  toDate?: string;
  department?: string;
  employeeId?: string;
}): Promise<{
  summary: Array<{ _id: string; count: number; employees: string[]; totalWorkHours: number; avgLateMinutes: number }>;
  byDepartment: Array<{
    department: string;
    totalEmployees: number;
    present: number;
    absent: number;
    late: number;
    leave: number;
    attendanceRate: number;
  }>;
}> => {
  const queryParams = new URLSearchParams();
  if (params?.fromDate) queryParams.append("fromDate", params.fromDate);
  if (params?.toDate) queryParams.append("toDate", params.toDate);
  if (params?.department) queryParams.append("department", params.department);
  if (params?.employeeId) queryParams.append("employeeId", params.employeeId);
  
  const res = await api.get(`/admin/attendance/stats?${queryParams.toString()}`);
  return res.data;
};

// ========== EXISTING APIS ==========

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
export const getEmployeesForAttendanceApi = async (): Promise<Employee[]> => {
  const res = await api.get("/admin/employees");
  return res.data;
};

// ========== BULK ATTENDANCE TYPES ==========

export interface BulkAttendancePayload {
  employeeIds: string[];
  date: string;
  markAs: string;
  reason?: string;
}

export interface CheckExistingAttendancesResponse {
  success: boolean;
  existingEmployeeIds: string[];
}

export interface BulkAttendanceResult {
  successful: Array<{ employeeId: string; name: string; attendanceId: string }>;
  failed: Array<{ employeeId: string; reason: string }>;
  skipped: Array<{ employeeId: string; name: string; reason: string }>;
}

// ========== BULK ATTENDANCE APIS ==========

// Check existing attendances for a date
export const checkExistingAttendances = async (
  date: string,
  employeeIds: string[]
): Promise<CheckExistingAttendancesResponse> => {
  const params = new URLSearchParams();
  params.append("date", date);
  params.append("employeeIds", employeeIds.join(','));
  
  const res = await api.get(`/admin/attendance/check?${params.toString()}`);
  return res.data;
};

// Bulk mark attendance
export const bulkMarkAttendance = async (
  data: BulkAttendancePayload
): Promise<{ results: BulkAttendanceResult; message: string }> => {
  const res = await api.post("/admin/attendance/manage/bulk", data);
  return res.data;
};