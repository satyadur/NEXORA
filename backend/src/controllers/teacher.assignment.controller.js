import Assignment from "../models/Assignment.model.js";
import Classroom from "../models/Classroom.model.js";
import Question from "../models/Question.model.js";
import Submission from "../models/Submission.model.js";
import Attendance from "../models/Attendance.model.js";
/* ================= CREATE ASSIGNMENT ================= */

export const createAssignment = async (req, res) => {
  try {
    const {
      title,
      classroomId,
      totalMarks,
      deadline,
      questions,
    } = req.body;

    const teacherId = req.user.id;

    const classroom = await Classroom.findById(classroomId);

    if (!classroom)
      return res.status(404).json({ message: "Classroom not found" });

    if (classroom.teacher.toString() !== teacherId)
      return res.status(403).json({ message: "Not your classroom" });

    if (classroom.status !== "ACTIVE")
      return res.status(400).json({
        message: "Cannot create assignment in inactive classroom",
      });

    if (!questions || questions.length === 0)
      return res.status(400).json({
        message: "At least one question is required",
      });

    let calculatedTotal = 0;

    for (const q of questions) {
      if (!q.questionText || !q.marks) {
        return res.status(400).json({
          message: "Question text and marks required",
        });
      }

      q.marks = Number(q.marks);

      if (Number.isNaN(q.marks) || q.marks <= 0) {
        return res.status(400).json({
          message: "Invalid marks value",
        });
      }

      if (q.type === "MCQ") {
        if (!Array.isArray(q.options) || q.options.length < 2) {
          return res.status(400).json({
            message: "MCQ must have at least 2 options",
          });
        }

        const validOptions = q.options.filter(
          (opt) => typeof opt === "string" && opt.trim() !== ""
        );

        if (validOptions.length < 2) {
          return res.status(400).json({
            message: "MCQ must have at least 2 valid options",
          });
        }

        const correctIndex = Number(q.correctAnswerIndex);

        if (
          Number.isNaN(correctIndex) ||
          correctIndex < 0 ||
          correctIndex >= validOptions.length
        ) {
          return res.status(400).json({
            message: "MCQ must have valid correct answer selected",
          });
        }

        q.correctAnswerIndex = correctIndex;
        q.options = validOptions;
      }

      calculatedTotal += q.marks;
    }

    if (calculatedTotal !== Number(totalMarks))
      return res.status(400).json({
        message: "Total marks must equal sum of question marks",
      });

    const assignment = await Assignment.create({
      title,
      classroomId,
      createdBy: teacherId,
      totalMarks: Number(totalMarks),
      deadline,
    });

    const questionDocs = questions.map((q) => ({
      assignmentId: assignment._id,
      type: q.type,
      questionText: q.questionText.trim(),
      marks: q.marks,
      options:
        q.type === "MCQ"
          ? q.options.map((opt) => ({ text: opt.trim() }))
          : [],
      correctAnswerIndex:
        q.type === "MCQ" ? q.correctAnswerIndex : undefined,
    }));

    await Question.insertMany(questionDocs);

    res.status(201).json({
      message: "Assignment created successfully",
      assignment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ================= GET MY ASSIGNMENTS ================= */

export const getMyAssignments = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const assignments = await Assignment.find({ createdBy: teacherId })
      .populate("classroomId", "name status")
      .sort({ createdAt: -1 });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= GET ASSIGNMENT DETAILS ================= */

export const getAssignmentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const assignment = await Assignment.findById(id);

    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });

    if (assignment.createdBy.toString() !== teacherId)
      return res.status(403).json({ message: "Unauthorized" });

    const questions = await Question.find({ assignmentId: id });

    const totalSubmissions = await Submission.countDocuments({
      assignmentId: id,
    });

    res.json({
      assignment,
      questions,
      totalSubmissions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ================= UPDATE ASSIGNMENT ================= */

export const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;
    const { title, totalMarks, deadline, questions } = req.body;

    const assignment = await Assignment.findById(id);

    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });

    if (assignment.createdBy.toString() !== teacherId)
      return res.status(403).json({ message: "Unauthorized" });

    if (assignment.isPublished)
      return res.status(400).json({
        message: "Cannot edit published assignment",
      });

    if (!questions || questions.length === 0)
      return res.status(400).json({
        message: "At least one question required",
      });

    let calculatedTotal = 0;

    for (const q of questions) {
      q.marks = Number(q.marks);

      if (Number.isNaN(q.marks) || q.marks <= 0)
        return res.status(400).json({
          message: "Invalid marks value",
        });

      if (q.type === "MCQ") {
        if (!Array.isArray(q.options) || q.options.length < 2)
          return res.status(400).json({
            message: "MCQ must have at least 2 options",
          });

        const validOptions = q.options.filter(
          (opt) => typeof opt === "string" && opt.trim() !== ""
        );

        if (validOptions.length < 2)
          return res.status(400).json({
            message: "MCQ must have at least 2 valid options",
          });

        const correctIndex = Number(q.correctAnswerIndex);

        if (
          Number.isNaN(correctIndex) ||
          correctIndex < 0 ||
          correctIndex >= validOptions.length
        )
          return res.status(400).json({
            message: "MCQ must have valid correct answer selected",
          });

        q.correctAnswerIndex = correctIndex;
        q.options = validOptions;
      }

      calculatedTotal += q.marks;
    }

    if (calculatedTotal !== Number(totalMarks))
      return res.status(400).json({
        message: "Total marks must equal sum of question marks",
      });

    /* ================= UPDATE ASSIGNMENT ================= */

    assignment.title = title;
    assignment.totalMarks = Number(totalMarks);
    assignment.deadline = deadline;

    await assignment.save();

    /* ================= REPLACE QUESTIONS ================= */

    await Question.deleteMany({ assignmentId: id });

    const questionDocs = questions.map((q) => ({
      assignmentId: id,
      type: q.type,
      questionText: q.questionText.trim(),
      marks: q.marks,
      options:
        q.type === "MCQ"
          ? q.options.map((opt) => ({ text: opt.trim() }))
          : [],
      correctAnswerIndex:
        q.type === "MCQ" ? q.correctAnswerIndex : undefined,
    }));

    await Question.insertMany(questionDocs);

    res.json({ message: "Assignment updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ================= PUBLISH ASSIGNMENT ================= */

export const publishAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const assignment = await Assignment.findById(id);

    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });

    if (assignment.createdBy.toString() !== teacherId)
      return res.status(403).json({ message: "Unauthorized" });

    if (assignment.isPublished)
      return res.status(400).json({ message: "Already published" });

    assignment.isPublished = true;
    await assignment.save();

    res.json({ message: "Assignment published successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= DELETE ASSIGNMENT ================= */

export const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const assignment = await Assignment.findById(id);

    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });

    if (assignment.createdBy.toString() !== teacherId)
      return res.status(403).json({ message: "Unauthorized" });

    await Submission.deleteMany({ assignmentId: id });
    await Question.deleteMany({ assignmentId: id });
    await assignment.deleteOne();

    res.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= GET ASSIGNMENT SUBMISSIONS ================= */

export const getAssignmentSubmissions = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const assignment = await Assignment.findById(id);

    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });

    if (assignment.createdBy.toString() !== teacherId)
      return res.status(403).json({ message: "Unauthorized" });

    const submissions = await Submission.find({ assignmentId: id })
      .populate("studentId", "name email")
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= EVALUATE SUBMISSION ================= */

export const evaluateSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers = [], feedback = "" } = req.body;

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        message: "Answers must be an array",
      });
    }

    const teacherId = req.user.id;

    const submission = await Submission.findById(id)
      .populate("assignmentId")
      .populate("answers.questionId");

    if (!submission)
      return res.status(404).json({ message: "Submission not found" });

    if (submission.assignmentId.createdBy.toString() !== teacherId)
      return res.status(403).json({ message: "Unauthorized" });

    if (submission.status === "EVALUATED")
      return res.status(400).json({ message: "Already evaluated" });

    let totalScore = 0;
    const evaluationResults = [];

    submission.answers = submission.answers.map((existingAnswer) => {
      const updated = answers.find(
        (a) => a.questionId === existingAnswer.questionId._id.toString()
      );

      if (!updated) return existingAnswer;

      const question = existingAnswer.questionId;
      let awarded = Number(updated.awardedMarks) || 0;
      let isCorrect = updated.isCorrect;

      // Auto-grade MCQ if not manually set
      if (question.type === "MCQ") {
        if (isCorrect === undefined || isCorrect === null) {
          // Auto-grade based on correctAnswerIndex
          const correctOption = question.options[question.correctAnswerIndex]?.text;
          isCorrect = existingAnswer.answer === correctOption;
        }
        
        // For MCQ, marks should be either full or zero based on correctness
        if (isCorrect) {
          awarded = question.marks;
        } else {
          awarded = 0;
        }
      } else {
        // For TEXT and CODE, use teacher's manual evaluation
        // Validate marks
        if (awarded < 0 || awarded > question.marks) {
          throw new Error(`Invalid marks for question: ${question.questionText}`);
        }
      }

      totalScore += awarded;

      existingAnswer.awardedMarks = awarded;
      existingAnswer.teacherComment = updated.teacherComment || "";
      existingAnswer.isCorrect = isCorrect;

      evaluationResults.push({
        questionId: question._id,
        questionText: question.questionText,
        type: question.type,
        studentAnswer: existingAnswer.answer,
        awardedMarks: awarded,
        maxMarks: question.marks,
        isCorrect,
      });

      return existingAnswer;
    });

    if (totalScore > submission.assignmentId.totalMarks) {
      return res.status(400).json({
        message: "Total score exceeds assignment marks",
      });
    }

    submission.totalScore = totalScore;
    submission.feedback = feedback;
    submission.status = "EVALUATED";

    await submission.save();

    res.json({
      message: "Submission evaluated successfully",
      submission,
      evaluationSummary: {
        totalScore,
        maxScore: submission.assignmentId.totalMarks,
        percentage: (totalScore / submission.assignmentId.totalMarks) * 100,
        results: evaluationResults,
        correctCount: evaluationResults.filter(r => r.isCorrect === true).length,
        incorrectCount: evaluationResults.filter(r => r.isCorrect === false).length,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Server error",
    });
  }
};


export const getAllSubmissions = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const submissions = await Submission.find()
      .populate({
        path: "assignmentId",
        match: { createdBy: teacherId },
        select: "title totalMarks",
      })
      .populate("studentId", "name email")
      .sort({ createdAt: 1 }); // ✅ Ascending (oldest first)

    const filtered = submissions.filter(
      (s) => s.assignmentId !== null
    );

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getSubmissionDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const submission = await Submission.findById(id)
      .populate("studentId", "name email")
      .populate("assignmentId")
      .populate({
        path: "answers.questionId",
        model: "Question",
      });

    if (!submission)
      return res.status(404).json({ message: "Submission not found" });

    if (
      submission.assignmentId.createdBy.toString() !== teacherId
    )
      return res.status(403).json({ message: "Unauthorized" });

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const markAttendanceForClassroom = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { id } = req.params; // classroomId
    const { attendanceData } = req.body;
    // attendanceData = [{ studentId, status }]

    // 1️⃣ Check classroom belongs to teacher
    const classroom = await Classroom.findOne({
      _id: id,
      teacher: teacherId,
      status: "ACTIVE",
    });

    if (!classroom) {
      return res.status(403).json({
        message: "Unauthorized or classroom not found",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 2️⃣ Prevent duplicate attendance for same day
    const existing = await Attendance.findOne({
      classroomId: id,
      date: today,
    });

    if (existing) {
      return res.status(400).json({
        message: "Attendance already marked for today",
      });
    }

    // 3️⃣ Validate students belong to classroom
    const validStudentIds = classroom.students.map((s) =>
      s.toString()
    );

    const bulkInsert = attendanceData
      .filter((entry) =>
        validStudentIds.includes(entry.studentId)
      )
      .map((entry) => ({
        classroomId: id,
        studentId: entry.studentId,
        date: today,
        status: entry.status || "ABSENT",
      }));

    await Attendance.insertMany(bulkInsert);

    res.json({
      message: "Attendance marked successfully",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAttendanceByDate = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { id } = req.params;
    const { date } = req.query;

    const classroom = await Classroom.findOne({
      _id: id,
      teacher: teacherId,
    });

    if (!classroom)
      return res.status(403).json({ message: "Unauthorized" });

    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    const records = await Attendance.find({
      classroomId: id,
      date: selectedDate,
    }).populate("studentId", "name email avatar");

    if (records.length === 0)
      return res.json(null);

    const totalStudents = classroom.students.length;
    const presentCount = records.filter(
      (r) => r.status === "PRESENT"
    ).length;

    const absentCount = totalStudents - presentCount;

    res.json({
      date: selectedDate,
      totalStudents,
      presentCount,
      absentCount,
      attendanceRate:
        totalStudents > 0
          ? ((presentCount / totalStudents) * 100).toFixed(2)
          : 0,
      records: records.map((r) => ({
        studentId: r.studentId._id,
        name: r.studentId.name,
        email: r.studentId.email,
        avatar: r.studentId.avatar,
        status: r.status,
      })),
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAttendanceHistory = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { id } = req.params;

    const classroom = await Classroom.findOne({
      _id: id,
      teacher: teacherId,
    });

    if (!classroom)
      return res.status(403).json({ message: "Unauthorized" });

    const records = await Attendance.aggregate([
      {
        $match: { classroomId: classroom._id },
      },
      {
        $group: {
          _id: "$date",
          presentCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0],
            },
          },
          totalStudents: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    const formatted = records.map((r) => ({
      date: r._id,
      presentCount: r.presentCount,
      absentCount:
        classroom.students.length - r.presentCount,
      totalStudents: classroom.students.length,
      attendanceRate:
        classroom.students.length > 0
          ? (
              (r.presentCount /
                classroom.students.length) *
              100
            ).toFixed(2)
          : 0,
    }));

    res.json(formatted);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentAttendance = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { id, studentId } = req.params;

    const classroom = await Classroom.findOne({
      _id: id,
      teacher: teacherId,
    });

    if (!classroom)
      return res.status(403).json({ message: "Unauthorized" });

    const student = await User.findById(studentId)
      .select("name email");

    const attendance = await Attendance.find({
      classroomId: id,
      studentId,
    }).sort({ date: -1 });

    const present = attendance.filter(
      (a) => a.status === "PRESENT"
    ).length;

    const absent = attendance.length - present;

    res.json({
      student,
      attendance: attendance.map((a) => ({
        date: a.date,
        status: a.status,
      })),
      stats: {
        present,
        absent,
        attendanceRate:
          attendance.length > 0
            ? ((present / attendance.length) * 100).toFixed(2)
            : 0,
      },
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
