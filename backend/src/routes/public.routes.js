import express from "express"
import {
  getPublicFaculty,
  getTopStudents,
} from "../controllers/public.controller.js"

const router = express.Router()

router.get("/faculty", getPublicFaculty)
router.get("/top-students", getTopStudents)

export default router
