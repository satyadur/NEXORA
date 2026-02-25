import express from "express";
import {
  createClassroom,
  getAllClassrooms,
  addStudentToClassroom,
  updateClassroom,
  deleteClassroom
} from "../controllers/classroom.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware("ADMIN"), createClassroom);
router.get("/", authMiddleware, roleMiddleware("ADMIN"), getAllClassrooms);
router.put("/:id/add-student", authMiddleware, roleMiddleware("ADMIN"), addStudentToClassroom);
router.put("/:id", authMiddleware, roleMiddleware("ADMIN"), updateClassroom);
router.delete("/:id", authMiddleware, roleMiddleware("ADMIN"), deleteClassroom);


export default router;
