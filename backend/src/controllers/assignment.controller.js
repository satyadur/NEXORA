import Assignment from "../models/Assignment.model.js";
import Classroom from "../models/Classroom.model.js";

/* ===============================
   CREATE ASSIGNMENT
=============================== */
export const createAssignment = async (req, res) => {
  try {
    const {
      title,
      description,
      classroomId,
      totalMarks,
      deadline,
    } = req.body;

    const classroom = await Classroom.findById(classroomId);

    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    /* 🔐 If teacher → must own classroom */
    if (req.user.role === "TEACHER") {
      if (classroom.teacher.toString() !== req.user.id) {
        return res.status(403).json({
          message: "You are not assigned to this classroom",
        });
      }
    }

    const assignment = await Assignment.create({
      title,
      description,
      classroomId,
      createdBy: req.user.id,
      totalMarks,
      deadline,
    });

    classroom.assignments.push(assignment._id);
    await classroom.save();

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   GET ASSIGNMENTS (Role Based)
=============================== */
export const getAllAssignments = async (req, res) => {
  try {
    /* ADMIN → All */
    if (req.user.role === "ADMIN") {
      const assignments = await Assignment.find();
      return res.json(assignments);
    }

    /* TEACHER → Only own classrooms */
    if (req.user.role === "TEACHER") {
      const classrooms = await Classroom.find({
        teacher: req.user.id,
      });

      const classroomIds = classrooms.map((c) => c._id);

      const assignments = await Assignment.find({
        classroomId: { $in: classroomIds },
      });

      return res.json(assignments);
    }

    /* STUDENT → Only enrolled + published + not expired */
    if (req.user.role === "STUDENT") {
      const classrooms = await Classroom.find({
        students: req.user.id,
      });

      const classroomIds = classrooms.map((c) => c._id);

      const assignments = await Assignment.find({
        classroomId: { $in: classroomIds },
        isPublished: true,
        deadline: { $gte: new Date() },
      });

      return res.json(assignments);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   GET SINGLE ASSIGNMENT
=============================== */
export const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
