// lib/api/teacher.attendance.api.ts
import api from "./axios";

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  address?: {
    formattedAddress?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

export interface CheckInPayload extends LocationData {
  deviceInfo?: {
    platform?: string;
    userAgent?: string;
  };
  method?: string;
}

export interface CheckOutPayload extends LocationData {}

export interface AttendanceSession {
  startTime: string;
  endTime?: string;
  location?: {
    coordinates: [number, number];
  };
  address?: {
    formattedAddress?: string;
    city?: string;
  };
  checkInMethod?: string;
  isWithinGeofence?: boolean;
  deviceInfo?: any;
}

export interface AttendanceRecord {
  _id: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "ON_LEAVE";
  actualCheckIn?: AttendanceSession;
  actualCheckOut?: AttendanceSession;
  sessions: AttendanceSession[];
  totalWorkHours: number;
  formattedWorkHours: string;
  employeeName: string;
  employeeEmail: string;
}

export interface GenerateQRPayload {
  classroomId: string;
  validHours: number;
  latitude?: number;
  longitude?: number;
}

export interface GenerateQRResponse {
  qrCode: string;
  qrCodeUrl: string;
  validUntil: string;
}

// Check In
export const checkInApi = async (data: CheckInPayload): Promise<AttendanceRecord> => {
  const res = await api.post("/teacher/attendance/checkin", data);
  return res.data;
};

// Check Out
export const checkOutApi = async (data: CheckOutPayload): Promise<{ message: string; attendance: AttendanceRecord; workHours: string }> => {
  const res = await api.post("/teacher/attendance/checkout", data);
  return res.data;
};

// Get today's attendance
export const getTodayAttendanceApi = async (): Promise<AttendanceRecord> => {
  try {
    const res = await api.get("/teacher/attendance/today");
    return res.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null as any; // No attendance for today
    }
    throw error;
  }
};

// Get attendance history
export const getAttendanceHistoryApi = async (
  startDate?: string,
  endDate?: string
): Promise<AttendanceRecord[]> => {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  
  const res = await api.get(`/teacher/attendance/history?${params.toString()}`);
  return res.data;
};

// Generate QR code
export const generateAttendanceQRApi = async (data: GenerateQRPayload): Promise<GenerateQRResponse> => {
  const res = await api.post("/teacher/attendance/generate-qr", data);
  return res.data;
};