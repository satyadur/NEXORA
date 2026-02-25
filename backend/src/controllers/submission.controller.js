import Submission from "../models/Submission.model.js";
import Assignment from "../models/Assignment.model.js";
import Classroom from "../models/Classroom.model.js";

/* ===============================
   SUBMIT ASSIGNMENT
=============================== */
export const submitAssignment = async (req, res) => {
  try {
    const { assignmentId, answers } = req.body;

    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    /* 🔒 Student must belong to classroom */
    const classroom = await Classroom.findById(
      assignment.classroomId
    );

    const isStudentInClass = classroom.students.some(
      (studentId) => studentId.toString() === req.user.id
    );

    if (!isStudentInClass) {
      return res.status(403).json({
        message: "You are not part of this classroom",
      });
    }

    /* 🔒 Prevent duplicate submission */
    const existingSubmission = await Submission.findOne({
      assignmentId,
      studentId: req.user.id,
    });

    if (existingSubmission) {
      return res.status(400).json({
        message: "You have already submitted this assignment",
      });
    }

    const submission = await Submission.create({
      assignmentId,
      studentId: req.user.id,
      answers,
    });

    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   GET MY SUBMISSIONS
=============================== */
export const getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({
      studentId: req.user.id,
    }).populate("assignmentId", "title");

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
