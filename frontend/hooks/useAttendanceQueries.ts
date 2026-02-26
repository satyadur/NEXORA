import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import {
  getTeacherAttendanceApi,
  getAttendanceSummaryApi,
  getEmployeesForAttendanceApi,
  getAttendanceCalendar,
  getPendingRegularizations,
  getAttendanceStats,
  markAttendanceByAdmin,
  updateAttendanceByAdmin,
  deleteAttendanceByAdmin,
  bulkMarkAttendance,
  approveRegularization,
  TeacherAttendanceRecord,
  AttendanceSummary,
  Employee,
  checkExistingAttendances,
} from "@/lib/api/admin.attendance.api";
import { toast } from "sonner";

// Query Keys
// Add to your existing attendanceKeys
export const attendanceKeys = {
  all: ["attendance"] as const,
  lists: () => [...attendanceKeys.all, "list"] as const,
  list: (filters: any) => [...attendanceKeys.lists(), filters] as const,
  summaries: () => [...attendanceKeys.all, "summary"] as const,
  summary: (filters: any) => [...attendanceKeys.summaries(), filters] as const,
  employees: () => [...attendanceKeys.all, "employees"] as const,
  calendar: (params: any) => [...attendanceKeys.all, "calendar", params] as const,
  regularizations: (params: any) => [...attendanceKeys.all, "regularizations", params] as const,
  stats: (params: any) => [...attendanceKeys.all, "stats", params] as const,
  detail: (id: string) => [...attendanceKeys.all, "detail", id] as const,
  // Add new keys for bulk operations
  availableEmployees: (date: string) => [...attendanceKeys.all, "available", date] as const,
};

// ========== BULK ATTENDANCE HOOKS ==========

// Hook to check existing attendances and get available employees
export const useAvailableEmployees = (date: string, employeeIds: string[], enabled: boolean = true) => {
  return useQuery({
    queryKey: attendanceKeys.availableEmployees(date),
    queryFn: () => checkExistingAttendances(date, employeeIds),
    enabled: enabled && !!date && employeeIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for bulk marking attendance
export const useBulkMarkAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: bulkMarkAttendance,
    onSuccess: (data, variables) => {
      const successCount = data.results.successful.length;
      const skippedCount = data.results.skipped.length;
      const failedCount = data.results.failed.length;
      
      if (successCount > 0) {
        toast.success(
          `Bulk marked: ${successCount} successful, ${skippedCount} skipped, ${failedCount} failed`,
          {
            description: successCount > 0 ? `Marked ${successCount} employees as ${variables.markAs}` : undefined,
          }
        );
      } else if (failedCount > 0) {
        toast.error("Bulk marking failed", {
          description: data.results.failed[0]?.reason || "Please try again",
        });
      }
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: attendanceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.summaries() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.calendar({ month: new Date().getMonth() + 1, year: new Date().getFullYear() }) });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.stats({}) });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.availableEmployees(variables.date) });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to bulk mark attendance");
    },
  });
};

// ========== HOOKS ==========

// Get employees for attendance
export const useEmployees = () => {
  return useQuery({
    queryKey: attendanceKeys.employees(),
    queryFn: getEmployeesForAttendanceApi,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get attendance records with filters
export const useAttendanceRecords = (
  startDate: string,
  endDate: string,
  employeeId?: string,
  status?: string
) => {
  return useQuery({
    queryKey: attendanceKeys.list({ startDate, endDate, employeeId, status }),
    queryFn: () => getTeacherAttendanceApi(startDate, endDate, employeeId, status),
    enabled: !!startDate && !!endDate,
  });
};

// Get attendance summary
export const useAttendanceSummary = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: attendanceKeys.summary({ startDate, endDate }),
    queryFn: () => getAttendanceSummaryApi(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
};

// Get calendar data
export const useAttendanceCalendar = (month: number, year: number, employeeId?: string) => {
  return useQuery({
    queryKey: attendanceKeys.calendar({ month, year, employeeId }),
    queryFn: () => getAttendanceCalendar({ month, year, employeeId }),
    enabled: !!month && !!year,
  });
};

// Get pending regularizations
export const usePendingRegularizations = (params?: {
  page?: number;
  limit?: number;
  employeeId?: string;
  fromDate?: string;
  toDate?: string;
}) => {
  return useQuery({
    queryKey: attendanceKeys.regularizations(params || {}),
    queryFn: () => getPendingRegularizations(params),
  });
};

// Get attendance stats
export const useAttendanceStats = (params?: {
  fromDate?: string;
  toDate?: string;
  department?: string;
  employeeId?: string;
}) => {
  return useQuery({
    queryKey: attendanceKeys.stats(params || {}),
    queryFn: () => getAttendanceStats(params),
  });
};

// ========== MUTATIONS ==========

// Mark attendance
export const useMarkAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: markAttendanceByAdmin,
    onSuccess: (data) => {
      toast.success("Attendance marked successfully");
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: attendanceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.summaries() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.calendar({ month: new Date().getMonth() + 1, year: new Date().getFullYear() }) });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.stats({}) });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to mark attendance");
    },
  });
};

// Update attendance
export const useUpdateAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateAttendanceByAdmin(id, data),
    onSuccess: (data) => {
      toast.success("Attendance updated successfully");
      queryClient.invalidateQueries({ queryKey: attendanceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.summaries() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.detail(data._id) });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.calendar({ month: new Date().getMonth() + 1, year: new Date().getFullYear() }) });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update attendance");
    },
  });
};

// Delete attendance
export const useDeleteAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteAttendanceByAdmin,
    onSuccess: () => {
      toast.success("Attendance record deleted");
      queryClient.invalidateQueries({ queryKey: attendanceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.summaries() });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete attendance");
    },
  });
};

// // Bulk mark attendance
// export const useBulkMarkAttendance = () => {
//   const queryClient = useQueryClient();
  
//   return useMutation({
//     mutationFn: bulkMarkAttendance,
//     onSuccess: (data) => {
//       const successCount = data.successful.length;
//       const skippedCount = data.skipped.length;
//       const failedCount = data.failed.length;
      
//       toast.success(
//         `Bulk marked: ${successCount} successful, ${skippedCount} skipped, ${failedCount} failed`
//       );
      
//       queryClient.invalidateQueries({ queryKey: attendanceKeys.lists() });
//       queryClient.invalidateQueries({ queryKey: attendanceKeys.summaries() });
//     },
//     onError: (error: any) => {
//       toast.error(error.message || "Failed to bulk mark attendance");
//     },
//   });
// };

// Approve regularization
export const useApproveRegularization = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: "APPROVED" | "REJECTED"; reason?: string }) =>
      approveRegularization(id, { action, reason }),
    onSuccess: (data, variables) => {
      toast.success(`Request ${variables.action.toLowerCase()} successfully`);
      queryClient.invalidateQueries({ queryKey: attendanceKeys.regularizations({}) });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.lists() });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to process request");
    },
  });
};