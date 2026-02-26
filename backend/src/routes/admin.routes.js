// routes/admin.routes.js
import express from "express";
import {
  getAdminStats,
  getMonthlyGrowth,
  getAssignmentPerformance,
  getAllTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeacherDetails,
  getStudentDetails,
  deleteStudent,
  updateStudent,
  createStudent,
  getAllStudents,
  getAllAssignmentsAdmin,
  getAllSubmissionsAdmin,
  getStudentAnalytics,
  // New faculty admin controllers
  getAllFacultyAdmins,
  createFacultyAdmin,
  updateFacultyAdmin,
  deleteFacultyAdmin,
  getFacultyAdminDetails,
  getAllEmployees,
  getPayslips,
  uploadEmployeeDocument,
  getEmployeeDocuments,
  // New teacher management
  getTeacherSalary,
  updateTeacherSalary,
  getTeacherLeaves,
  approveLeave,
  // New analytics
  getFacultyAnalytics,
  getEmployeeAttendance,
  getSalaryStructure,
} from "../controllers/admin.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import upload from "../middlewares/upload.middleware.js";
import {
  deletePayslip,
  downloadPayslip,
  generateMonthlyPayslipsBatch,
  generatePayslip,
  getPayrollSummary,
  getPayslipById,
  updatePayslipStatus,
} from "../controllers/payslip.controller.js";
import {
  getAttendanceSummary,
  getTeacherAttendance,
  getTodayAttendanceStatus,
  getEmployeeAttendance2,
} from "../controllers/admin.attendance.controller.js";
import { markHoliday } from "../controllers/holiday.controller.js";
/* ========== ADMIN ATTENDANCE MANAGEMENT (CRUD) ========== */
import {
  markAttendanceByAdmin,
  updateAttendanceByAdmin,
  deleteAttendanceByAdmin,
  getAttendanceById,
  getPendingRegularizations,
  approveRegularizationRequest,
  getAttendanceCalendar,
  bulkMarkAttendance,
  getAttendanceStats,
  checkExistingAttendances,
} from "../controllers/admin.manage.attendance.controller.js";

const router = express.Router();

/* ========== DASHBOARD & ANALYTICS ========== */
router.get("/stats", authMiddleware, roleMiddleware("ADMIN"), getAdminStats);
router.get(
  "/monthly-growth",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getMonthlyGrowth,
);
router.get(
  "/assignment-performance",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getAssignmentPerformance,
);
router.get(
  "/students/analytics",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getStudentAnalytics,
);
router.get(
  "/faculty/analytics",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getFacultyAnalytics,
);

/* ========== TEACHER MANAGEMENT ========== */
router.get(
  "/teachers",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getAllTeachers,
);
router.post(
  "/teachers",
  authMiddleware,
  roleMiddleware("ADMIN"),
  createTeacher,
);
router.put(
  "/teachers/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  updateTeacher,
);
router.delete(
  "/teachers/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  deleteTeacher,
);
router.get(
  "/teachers/:id/details",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getTeacherDetails,
);
router.get(
  "/teachers/:id/salary",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getTeacherSalary,
);
router.put(
  "/teachers/:id/salary",
  authMiddleware,
  roleMiddleware("ADMIN"),
  updateTeacherSalary,
);
router.get(
  "/teachers/:id/leaves",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getTeacherLeaves,
);
router.post(
  "/teachers/:id/leaves/:leaveId/approve",
  authMiddleware,
  roleMiddleware("ADMIN"),
  approveLeave,
);

/* ========== FACULTY ADMIN MANAGEMENT ========== */
router.get(
  "/faculty-admins",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getAllFacultyAdmins,
);
router.post(
  "/faculty-admins",
  authMiddleware,
  roleMiddleware("ADMIN"),
  createFacultyAdmin,
);
router.put(
  "/faculty-admins/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  updateFacultyAdmin,
);
router.delete(
  "/faculty-admins/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  deleteFacultyAdmin,
);
router.get(
  "/faculty-admins/:id/details",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getFacultyAdminDetails,
);

/* ========== EMPLOYEE MANAGEMENT (Teachers + Faculty Admins) ========== */
router.get(
  "/employees",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getAllEmployees,
);
router.get(
  "/employees/attendance",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getEmployeeAttendance,
);

/* ========== SALARY STRUCTURE ========== */
router.get(
  "/salary-structure",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getSalaryStructure,
);

/* ========== PAYROLL MANAGEMENT ========== */
// ⚠️ IMPORTANT: SPECIFIC ROUTES MUST COME BEFORE DYNAMIC ROUTES
router.get(
  "/payroll/summary",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getPayrollSummary,
);
router.post(
  "/payslips/generate",
  authMiddleware,
  roleMiddleware("ADMIN"),
  generatePayslip,
);
router.post(
  "/payslips/generate-monthly",
  authMiddleware,
  roleMiddleware("ADMIN"),
  generateMonthlyPayslipsBatch,
);
router.get("/payslips", authMiddleware, roleMiddleware("ADMIN"), getPayslips);
router.get(
  "/payslips/employee/:employeeId",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getPayslips,
);
router.get(
  "/payslips/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getPayslipById,
);
router.get(
  "/payslips/:id/download",
  authMiddleware,
  roleMiddleware("ADMIN"),
  downloadPayslip,
);
router.put(
  "/payslips/:id/status",
  authMiddleware,
  roleMiddleware("ADMIN"),
  updatePayslipStatus,
);
router.delete(
  "/payslips/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  deletePayslip,
);

/* ========== EMPLOYEE DOCUMENTS ========== */
router.post(
  "/documents/upload",
  authMiddleware,
  roleMiddleware("ADMIN"),
  upload.single("document"),
  uploadEmployeeDocument,
);
router.get(
  "/documents/:employeeId",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getEmployeeDocuments,
);

/* ========== STUDENT MANAGEMENT ========== */
router.get(
  "/students",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getAllStudents,
);
router.post(
  "/students",
  authMiddleware,
  roleMiddleware("ADMIN"),
  createStudent,
);
router.put(
  "/students/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  updateStudent,
);
router.delete(
  "/students/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  deleteStudent,
);
router.get(
  "/students/:id/details",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getStudentDetails,
);

/* ========== ASSIGNMENTS & SUBMISSIONS ========== */
router.get(
  "/assignments",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getAllAssignmentsAdmin,
);
router.get(
  "/submissions",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getAllSubmissionsAdmin,
);

/* ========== TEACHER ATTENDANCE MANAGEMENT ========== */
router.get(
  "/teacher-attendance",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getTeacherAttendance,
);
router.get(
  "/attendance/summary",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getAttendanceSummary,
);
router.get(
  "/attendance/today",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getTodayAttendanceStatus,
);
router.get(
  "/attendance/employee/:employeeId",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getEmployeeAttendance2,
);

router.post(
  "/attendance/holiday",
  authMiddleware,
  roleMiddleware("ADMIN"),
  markHoliday,
);

// CRUD Operations for Attendance
router.post(
  "/attendance/manage",
  authMiddleware,
  roleMiddleware("ADMIN"),
  markAttendanceByAdmin,
);
router.put(
  "/attendance/manage/:attendanceId",
  authMiddleware,
  roleMiddleware("ADMIN"),
  updateAttendanceByAdmin,
);
router.delete(
  "/attendance/manage/:attendanceId",
  authMiddleware,
  roleMiddleware("ADMIN"),
  deleteAttendanceByAdmin,
);
router.get(
  "/attendance/manage/:attendanceId",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getAttendanceById,
);

// Bulk Operations
router.post(
  "/attendance/manage/bulk",
  authMiddleware,
  roleMiddleware("ADMIN"),
  bulkMarkAttendance,
);

// Regularization Requests
router.get(
  "/attendance/regularizations",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getPendingRegularizations,
);
router.put(
  "/attendance/regularizations/:regularizationId",
  authMiddleware,
  roleMiddleware("ADMIN"),
  approveRegularizationRequest,
);

// Calendar View
router.get(
  "/attendance/calendar",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getAttendanceCalendar,
);

// Statistics
router.get(
  "/attendance/stats",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getAttendanceStats,
);

// Check existing attendances for bulk operation
router.get("/attendance/check", authMiddleware, roleMiddleware("ADMIN"), checkExistingAttendances);

export default router;
