import express from "express"
import {
  getPublicFaculty,
  getTopStudents,
  getAllCourses,
  getCourseById,
  getCoursesByDepartment,
  getPopularCourses,
  getCoursePackages,
  searchCourses,
  getCertificateVerification
} from "../controllers/public.controller.js"

const router = express.Router()

// Faculty and Students
router.get("/faculty", getPublicFaculty)
router.get("/top-students", getTopStudents)

// Courses
router.get("/courses", getAllCourses)
router.get("/courses/popular", getPopularCourses)
router.get("/courses/packages", getCoursePackages)
router.get("/courses/search", searchCourses)
router.get("/courses/:id", getCourseById)
router.get("/courses/department/:department", getCoursesByDepartment)
router.get("/verify/:uniqueId", getCertificateVerification);

export default router