// routes/course.routes.js
import express from "express";
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  enrollStudents,
  updateEnrollmentStatus,
  getCourseEnrollments,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCourseStats
} from "../controllers/course.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

// ========== COURSE STATS ==========
router.get(
  "/stats",
  authMiddleware,
  roleMiddleware("ADMIN", "FACULTY_ADMIN"),
  getCourseStats
);

// ========== COURSE CATEGORIES ==========
router.get(
  "/categories",
  authMiddleware,
  roleMiddleware("ADMIN", "FACULTY_ADMIN", "TEACHER"),
  getCategories
);

router.post(
  "/categories",
  authMiddleware,
  roleMiddleware("ADMIN", "FACULTY_ADMIN"),
  createCategory
);

router.put(
  "/categories/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "FACULTY_ADMIN"),
  updateCategory
);

router.delete(
  "/categories/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "FACULTY_ADMIN"),
  deleteCategory
);

// ========== COURSE ENROLLMENTS ==========
router.get(
  "/:courseId/enrollments",
  authMiddleware,
  roleMiddleware("ADMIN", "FACULTY_ADMIN", "TEACHER"),
  getCourseEnrollments
);

router.post(
  "/:courseId/enroll",
  authMiddleware,
  roleMiddleware("ADMIN", "FACULTY_ADMIN"),
  enrollStudents
);

router.put(
  "/enrollments/:enrollmentId",
  authMiddleware,
  roleMiddleware("ADMIN", "FACULTY_ADMIN", "TEACHER"),
  updateEnrollmentStatus
);

// ========== COURSE CRUD ==========
router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN", "FACULTY_ADMIN"),
  createCourse
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN", "FACULTY_ADMIN", "TEACHER"),
  getCourses
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "FACULTY_ADMIN", "TEACHER"),
  getCourseById
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "FACULTY_ADMIN"),
  updateCourse
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "FACULTY_ADMIN"),
  deleteCourse
);

export default router;