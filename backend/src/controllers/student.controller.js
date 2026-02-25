import Assignment from "../models/Assignment.model.js";
import Question from "../models/Question.model.js";
import Submission from "../models/Submission.model.js";
import Classroom from "../models/Classroom.model.js";
/* ================= STUDENT DASHBOARD ================= */

export const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user.id;

    /* ================= GET STUDENT CLASSROOMS ================= */

    const classrooms = await Classroom.find({
      students: studentId,
      status: "ACTIVE",
    }).select("_id");

    const classroomIds = classrooms.map((c) => c._id);

    /* ================= GET ASSIGNMENTS FOR STUDENT ================= */

    const assignments = await Assignment.find({
      classroomId: { $in: classroomIds },
      isPublished: true,
    }).select("_id title totalMarks createdAt");

    const assignmentIds = assignments.map((a) => a._id);

    /* ================= GET STUDENT SUBMISSIONS ================= */

    const submissions = await Submission.find({
      assignmentId: { $in: assignmentIds },
      studentId,
    })
      .populate("assignmentId", "title totalMarks")
      .sort({ createdAt: 1 });

    /* ================= CALCULATIONS ================= */

    const totalAssignments = assignments.length;
    const completedAssignments = submissions.length;

    const evaluatedSubmissions = submissions.filter(
      (s) => s.status === "EVALUATED"
    );

    const averageScore =
      evaluatedSubmissions.length > 0
        ? evaluatedSubmissions.reduce(
            (sum, s) => sum + (s.totalScore || 0),
            0
          ) / evaluatedSubmissions.length
        : 0;

    const assignmentPerformance =
      evaluatedSubmissions.map((s) => ({
        title: s.assignmentId.title,
        score: s.totalScore,
        totalMarks: s.assignmentId.totalMarks,
        date: s.createdAt,
      }));

    res.json({
      totalAssignments,
      completedAssignments,
      averageScore,
      assignmentPerformance,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Server error",
    });
  }
};

/* ================= GET ASSIGNMENT DETAILS ================= */

export const getAssignmentDetailsForStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id);

    if (!assignment || !assignment.isPublished)
      return res.status(404).json({ message: "Assignment not available" });

    const questions = await Question.find({
      assignmentId: id,
    });

    res.json({ assignment, questions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= SUBMIT ASSIGNMENT ================= */

export const submitAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    const studentId = req.user.id;

    const existing = await Submission.findOne({
      assignmentId: id,
      studentId,
    });

    if (existing) {
      return res.status(400).json({
        message: "You have already submitted this assignment",
      });
    }

    const questions = await Question.find({
      assignmentId: id,
    });

    let totalScore = 0;

    // 🔥 AUTO GRADE MCQs
    answers.forEach((ans) => {
      const question = questions.find(
        (q) => q._id.toString() === ans.questionId
      );

      if (!question) return;

      if (question.type === "MCQ") {
        if (
          Number(ans.answer) === question.correctAnswerIndex
        ) {
          totalScore += question.marks;
        }
      }
    });

    const submission = await Submission.create({
      assignmentId: id,
      studentId,
      answers,
      totalScore,
      status: "SUBMITTED",
    });

    res.status(201).json({
      message: "Assignment submitted successfully",
      submission,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Server error",
    });
  }
};




/* ================= MY SUBMISSIONS ================= */

export const getMySubmissions = async (req, res) => {
  try {
    const studentId = req.user.id;

    const submissions = await Submission.find({
      studentId,
    })
      .populate({
        path: "assignmentId",
        select: "title totalMarks deadline",
        populate: {
          path: "classroomId",
          select: "name",
        },
      })
      .sort({ createdAt: -1 });

    const formatted = submissions.map((s) => ({
      _id: s._id,
      assignmentTitle: s.assignmentId.title,
      classroomName: s.assignmentId.classroomId?.name,
      totalMarks: s.assignmentId.totalMarks,
      score: s.totalScore,
      status: s.status,
      deadline: s.assignmentId.deadline,
      submittedAt: s.createdAt,
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({
      message: error.message || "Server error",
    });
  }
};

/* ================= VIEW SUBMISSION ================= */

export const getSubmissionDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    const submission = await Submission.findOne({
      _id: id,
      studentId,
    })
      .populate("assignmentId")
      .populate("answers.questionId");

    if (!submission) {
      return res.status(404).json({
        message: "Submission not found",
      });
    }

    res.json({
      submission,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Server error",
    });
  }
};


/* ================= GET AVAILABLE CLASSROOMS ================= */

export const getAvailableClassrooms = async (req, res) => {
  try {
    const studentId = req.user.id;

    const classrooms = await Classroom.find({
      status: "ACTIVE",
      students: { $ne: studentId },
    }).populate("teacher", "name");

    res.json(classrooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= JOIN CLASSROOM ================= */

export const joinClassroom = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const studentId = req.user.id;

    const classroom = await Classroom.findOne({
      inviteCode: inviteCode.toUpperCase(),
      status: "ACTIVE",
    });

    if (!classroom)
      return res.status(404).json({
        message: "Invalid classroom code",
      });

    if (classroom.students.includes(studentId))
      return res.status(400).json({
        message: "Already joined this classroom",
      });

    classroom.students.push(studentId);
    await classroom.save();

    res.json({
      message: "Successfully joined classroom",
      classroom,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyJoinedClassrooms = async (req, res) => {
  try {
    const studentId = req.user.id;

    const classrooms = await Classroom.find({
      students: studentId, // ✅ only joined
      status: "ACTIVE",
    }).populate("teacher", "name email");

    res.json(classrooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= GET SINGLE JOINED CLASSROOM ================= */

export const getStudentClassroomDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    /* ================= FIND CLASSROOM ================= */

    const classroom = await Classroom.findOne({
      _id: id,
      students: studentId, // 🔐 security check
      status: "ACTIVE",
    }).populate("teacher", "name email");

    if (!classroom) {
      return res.status(404).json({
        message: "Classroom not found or not joined",
      });
    }

    /* ================= GET ASSIGNMENTS ================= */

    const assignments = await Assignment.find({
      classroomId: id,
      isPublished: true,
    })
      .select("title totalMarks deadline createdAt")
      .sort({ createdAt: -1 });

    /* ================= GET STUDENT SUBMISSIONS ================= */

    const submissions = await Submission.find({
      assignmentId: { $in: assignments.map((a) => a._id) },
      studentId,
    }).select("assignmentId status totalScore");

    /* ================= MERGE DATA ================= */

    const formattedAssignments = assignments.map((assignment) => {
      const submission = submissions.find(
        (s) =>
          s.assignmentId.toString() ===
          assignment._id.toString()
      );

      return {
        _id: assignment._id,
        title: assignment.title,
        totalMarks: assignment.totalMarks,
        deadline: assignment.deadline,
        createdAt: assignment.createdAt,
        submissionStatus: submission
          ? submission.status
          : "NOT_SUBMITTED",
        score: submission?.totalScore ?? null,
      };
    });

    res.json({
      classroom: {
        _id: classroom._id,
        name: classroom.name,
        description: classroom.description,
        inviteCode: classroom.inviteCode,
        teacher: classroom.teacher,
        studentsCount: classroom.students.length,
      },
      assignments: formattedAssignments,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Server error",
    });
  }
};

/* ================= GET MY ASSIGNMENTS (ENHANCED) ================= */

export const getMyAssignments = async (req, res) => {
  try {
    const studentId = req.user.id;

    /* ================= GET JOINED CLASSROOMS ================= */

    const classrooms = await Classroom.find({
      students: studentId,
      status: "ACTIVE",
    }).select("_id name");

    const classroomIds = classrooms.map((c) => c._id);

    /* ================= GET ASSIGNMENTS ================= */

    const assignments = await Assignment.find({
      classroomId: { $in: classroomIds },
      isPublished: true,
    })
      .populate("classroomId", "name")
      .sort({ deadline: 1 });

    /* ================= GET STUDENT SUBMISSIONS ================= */

    const submissions = await Submission.find({
      assignmentId: { $in: assignments.map((a) => a._id) },
      studentId,
    }).select("assignmentId status totalScore");

    /* ================= FORMAT RESPONSE ================= */

    const formatted = assignments.map((assignment) => {
      const submission = submissions.find(
        (s) =>
          s.assignmentId.toString() ===
          assignment._id.toString()
      );

      const deadlinePassed =
        new Date(assignment.deadline) < new Date();

      return {
        _id: assignment._id,
        title: assignment.title,
        totalMarks: assignment.totalMarks,
        deadline: assignment.deadline,
        classroom: assignment.classroomId,
        submissionStatus: submission
          ? submission.status
          : deadlinePassed
          ? "MISSED"
          : "NOT_SUBMITTED",
        score: submission?.totalScore ?? null,
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({
      message: error.message || "Server error",
    });
  }
};


