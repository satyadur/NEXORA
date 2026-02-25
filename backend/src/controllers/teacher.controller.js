import Classroom from "../models/Classroom.model.js";
import Assignment from "../models/Assignment.model.js";
import Submission from "../models/Submission.model.js";
import mongoose from "mongoose";
import Question from "../models/Question.model.js";

/**
 * Get comprehensive teacher dashboard data
 * Real data only - no dummy values
 */
export const getTeacherDashboard = async (req, res) => {
  try {
    const teacherId = new mongoose.Types.ObjectId(req.user.id);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    /* ================= BASIC STATS ================= */
    
    // 1. Classroom stats
    const classrooms = await Classroom.find({ teacher: teacherId }).select("_id name students");
    const classroomIds = classrooms.map(c => c._id);
    
    // 2. Assignment stats
    const assignments = await Assignment.find({ 
      createdBy: teacherId,
      classroomId: { $in: classroomIds }
    }).select("_id title totalMarks createdAt");
    
    const assignmentIds = assignments.map(a => a._id);
    
    // 3. Question stats
    const questions = await Question.countDocuments({
      assignmentId: { $in: assignmentIds }
    });
    
    // 4. Student stats
    const totalStudents = classrooms.reduce((sum, c) => sum + (c.students?.length || 0), 0);
    
    // 5. Unique students count (across all classrooms, no duplicates)
    const uniqueStudents = await Classroom.aggregate([
      { $match: { teacher: teacherId } },
      { $unwind: "$students" },
      { $group: { _id: "$students" } },
      { $count: "total" }
    ]);
    const uniqueStudentCount = uniqueStudents[0]?.total || 0;

    /* ================= SUBMISSION STATS ================= */
    
    // 6. Submission stats
    const submissions = await Submission.find({
      assignmentId: { $in: assignmentIds }
    });
    
    const totalSubmissions = submissions.length;
    const pendingEvaluations = submissions.filter(s => s.status === "SUBMITTED").length;
    const evaluatedCount = submissions.filter(s => s.status === "EVALUATED").length;
    
    // 7. Average score
    const evaluatedSubmissions = submissions.filter(s => s.status === "EVALUATED");
    const averageScore = evaluatedSubmissions.length > 0
      ? evaluatedSubmissions.reduce((sum, s) => sum + (s.totalScore || 0), 0) / evaluatedSubmissions.length
      : 0;

    /* ================= PERFORMANCE METRICS ================= */
    
    // 8. Completion rate
    const expectedSubmissions = assignments.length * uniqueStudentCount;
    const completionRate = expectedSubmissions > 0
      ? (totalSubmissions / expectedSubmissions) * 100
      : 0;

    // 9. Score distribution
    const distribution = {
      excellent: evaluatedSubmissions.filter(s => s.totalScore >= 80).length,  // 80-100%
      good: evaluatedSubmissions.filter(s => s.totalScore >= 60 && s.totalScore < 80).length,  // 60-79%
      average: evaluatedSubmissions.filter(s => s.totalScore >= 40 && s.totalScore < 60).length,  // 40-59%
      poor: evaluatedSubmissions.filter(s => s.totalScore < 40).length  // 0-39%
    };

    /* ================= TREND DATA (LAST 30 DAYS) ================= */
    
    // 10. Daily submissions trend
    const dailyTrend = await Submission.aggregate([
      {
        $match: {
          assignmentId: { $in: assignmentIds },
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          submissions: { $sum: 1 },
          evaluated: {
            $sum: { $cond: [{ $eq: ["$status", "EVALUATED"] }, 1, 0] }
          }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    // 11. Assignments created over time
    const assignmentTrend = await Assignment.aggregate([
      {
        $match: {
          createdBy: teacherId,
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    // Format trend data for the last 30 days
    const trendData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dateStr = date.toISOString().split('T')[0];
      const dayData = dailyTrend.find(d => 
        d._id.year === date.getFullYear() &&
        d._id.month === date.getMonth() + 1 &&
        d._id.day === date.getDate()
      );
      
      const assignmentDayData = assignmentTrend.find(d =>
        d._id.year === date.getFullYear() &&
        d._id.month === date.getMonth() + 1 &&
        d._id.day === date.getDate()
      );

      trendData.push({
        date: dateStr,
        submissions: dayData?.submissions || 0,
        evaluated: dayData?.evaluated || 0,
        assignments: assignmentDayData?.count || 0,
        pending: (dayData?.submissions || 0) - (dayData?.evaluated || 0)
      });
    }

    /* ================= TOP PERFORMING ================= */
    
    // 12. Top performing assignments
    const topAssignments = await Submission.aggregate([
      {
        $match: {
          assignmentId: { $in: assignmentIds },
          status: "EVALUATED"
        }
      },
      {
        $group: {
          _id: "$assignmentId",
          avgScore: { $avg: "$totalScore" },
          submissions: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "assignments",
          localField: "_id",
          foreignField: "_id",
          as: "assignment"
        }
      },
      { $unwind: "$assignment" },
      {
        $project: {
          title: "$assignment.title",
          avgScore: 1,
          submissions: 1,
          maxMarks: "$assignment.totalMarks"
        }
      },
      { $sort: { avgScore: -1 } },
      { $limit: 5 }
    ]);

    // 13. Top performing students
    const topStudents = await Submission.aggregate([
      {
        $match: {
          assignmentId: { $in: assignmentIds },
          status: "EVALUATED"
        }
      },
      {
        $group: {
          _id: "$studentId",
          avgScore: { $avg: "$totalScore" },
          submissions: { $sum: 1 },
          totalScore: { $sum: "$totalScore" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "student"
        }
      },
      { $unwind: "$student" },
      {
        $project: {
          name: "$student.name",
          email: "$student.email",
          avgScore: 1,
          submissions: 1,
          totalScore: 1
        }
      },
      { $sort: { avgScore: -1 } },
      { $limit: 5 }
    ]);

    /* ================= WEEKLY COMPARISON ================= */
    
    // 14. This week vs last week
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);
    
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

    const thisWeekSubmissions = await Submission.countDocuments({
      assignmentId: { $in: assignmentIds },
      createdAt: { $gte: thisWeekStart }
    });

    const lastWeekSubmissions = await Submission.countDocuments({
      assignmentId: { $in: assignmentIds },
      createdAt: { $gte: lastWeekStart, $lt: thisWeekStart }
    });

    const submissionTrend = lastWeekSubmissions > 0
      ? ((thisWeekSubmissions - lastWeekSubmissions) / lastWeekSubmissions) * 100
      : thisWeekSubmissions > 0 ? 100 : 0;

    /* ================= FINAL RESPONSE ================= */

    res.json({
      success: true,
      data: {
        // Basic stats
        stats: {
          classrooms: classrooms.length,
          assignments: assignments.length,
          questions,
          totalStudents: uniqueStudentCount,
          pendingEvaluations,
          evaluatedCount,
          totalSubmissions,
          averageScore: Number(averageScore.toFixed(2)),
          completionRate: Number(completionRate.toFixed(2))
        },

        // Performance metrics
        performance: {
          distribution,
          topAssignments,
          topStudents
        },

        // Trends
        trends: {
          daily: trendData,
          weekly: {
            thisWeek: thisWeekSubmissions,
            lastWeek: lastWeekSubmissions,
            change: Number(submissionTrend.toFixed(2))
          }
        },

        // Summary
        summary: {
          expectedSubmissions,
          completionRate: Number(completionRate.toFixed(2)),
          averageScore: Number(averageScore.toFixed(2)),
          totalMarksAwarded: evaluatedSubmissions.reduce((sum, s) => sum + (s.totalScore || 0), 0)
        }
      }
    });

  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Failed to load dashboard data" 
    });
  }
};


export const getMyClassrooms = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const classrooms = await Classroom.aggregate([
      {
        $match: { teacher: new mongoose.Types.ObjectId(teacherId) },
      },
      {
        $lookup: {
          from: "assignments",
          localField: "_id",
          foreignField: "classroomId",
          as: "assignments",
        },
      },
      {
        $project: {
          name: 1,
          status: 1,
          studentCount: { $size: "$students" },
          assignmentCount: { $size: "$assignments" },
          inviteCode:1,
        },
      },
    ]);

    res.json(classrooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getClassroomDetails = async (req, res) => {
  try {
    const classroom = await Classroom.findOne({
      _id: req.params.id,
      teacher: req.user.id,
    })
      .populate("students", "id name email")
      .populate("assignments");

    if (!classroom)
      return res.status(404).json({ message: "Classroom not found" });

    res.json(classroom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getClassroomAnalytics = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const classroom = await Classroom.findOne({
      _id: req.params.id,
      teacher: teacherId,
    }).populate("students", "_id name email avatar");

    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    /* ================= ASSIGNMENTS ================= */
    const assignments = await Assignment.find({
      classroomId: classroom._id,
    });

    /* ================= SUBMISSIONS ================= */
    const submissions = await Submission.find({
      assignmentId: { $in: assignments.map((a) => a._id) },
    }).populate("studentId", "_id name");

    /* ================= OVERVIEW ================= */

    const totalStudents = classroom.students.length;
    const totalAssignments = assignments.length;
    const totalSubmissions = submissions.length;

    const averageScore =
      totalSubmissions > 0
        ? submissions.reduce((sum, s) => sum + s.totalScore, 0) /
          totalSubmissions
        : 0;

    const possibleSubmissions =
      totalAssignments * totalStudents;

    const submissionRate =
      possibleSubmissions > 0
        ? (
            (totalSubmissions / possibleSubmissions) *
            100
          ).toFixed(2)
        : "0.00";

    /* ================= ASSIGNMENT ANALYTICS ================= */

    const assignmentAnalytics = assignments.map(
      (assignment) => {
        const subs = submissions.filter(
          (s) =>
            s.assignmentId.toString() ===
            assignment._id.toString()
        );

        const avg =
          subs.length > 0
            ? subs.reduce(
                (sum, s) => sum + s.totalScore,
                0
              ) / subs.length
            : 0;

        return {
          assignment: assignment.title,
          averageScore: Number(avg.toFixed(2)),
        };
      }
    );

    /* ================= SCORE DISTRIBUTION ================= */

    const distribution = {
      excellent: 0,
      good: 0,
      average: 0,
      poor: 0,
    };

    submissions.forEach((s) => {
      if (s.totalScore >= 80)
        distribution.excellent++;
      else if (s.totalScore >= 60)
        distribution.good++;
      else if (s.totalScore >= 40)
        distribution.average++;
      else distribution.poor++;
    });

    /* ================= STUDENT PERFORMANCE ================= */

    const studentPerformance =
      classroom.students.map((student) => {
        const studentSubs = submissions.filter(
          (s) =>
            s.studentId._id.toString() ===
            student._id.toString()
        );

        const submitted = studentSubs.length;
        const unsubmitted =
          totalAssignments - submitted;

        const avg =
          submitted > 0
            ? studentSubs.reduce(
                (sum, s) => sum + s.totalScore,
                0
              ) / submitted
            : 0;

        return {
          studentId: student._id.toString(),
          name: student.name,
          submittedAssignments: submitted,
          unsubmittedAssignments: unsubmitted,
          averageScore: Number(avg.toFixed(2)),
          submissionRate:
            totalAssignments > 0
              ? (
                  (submitted / totalAssignments) *
                  100
                ).toFixed(2)
              : "0.00",
        };
      });

    /* ================= FINAL RESPONSE ================= */

    res.json({
      classroom: {
        id: classroom._id,
        name: classroom.name,
        status: classroom.status,
      },

      overview: {
        totalStudents,
        totalAssignments,
        averageScore: Number(
          averageScore.toFixed(2)
        ),
        submissionRate,
      },

      assignmentAnalytics,
      distribution,
      studentPerformance,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: error.message });
  }
};

export const getClassroomStudents = async (req, res) => {
  try {
    const classroom = await Classroom.findOne({
      _id: req.params.id,
      teacher: req.user.id,
    }).populate("students", "_id name email avatar");

    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    res.json(classroom.students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const createAssignment = async (req, res) => {
  try {
    const { title, description, classroomId, totalMarks, deadline } = req.body;

    const classroom = await Classroom.findOne({
      id: classroomId,
      teacher: req.user.id,
      status: "ACTIVE",
    });

    if (!classroom) return res.status(403).json({ message: "Not authorized" });

    const assignment = await Assignment.create({
      title,
      description,
      classroomId,
      createdBy: req.user.id,
      totalMarks,
      deadline,
    });

    classroom.assignments.push(assignment.id);
    await classroom.save();

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getMyAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({
      createdBy: req.user.id,
    }).populate("classroomId", "name");

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getAssignmentDetails = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      id: req.params.id,
      createdBy: req.user.id,
    }).populate("classroomId", "name");

    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOneAndUpdate(
      {
        id: req.params.id,
        createdBy: req.user.id,
      },
      req.body,
      { new: true },
    );

    if (!assignment) return res.status(404).json({ message: "Not found" });

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const publishAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOneAndUpdate(
      {
        id: req.params.id,
        createdBy: req.user.id,
      },
      { isPublished: true },
      { new: true },
    );

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      id: req.params.id,
      createdBy: req.user.id,
    });

    if (!assignment) return res.status(404).json({ message: "Not found" });

    const submissions = await Submission.countDocuments({
      assignmentId: assignment.id,
    });

    if (submissions > 0)
      return res.status(400).json({
        message: "Cannot delete. Submissions exist.",
      });

    await assignment.deleteOne();

    res.json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getAssignmentSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({
      assignmentId: req.params.id,
    }).populate("studentId", "name email");

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const evaluateSubmission = async (req, res) => {
  try {
    const { score } = req.body;

    const submission = await Submission.findById(req.params.id).populate(
      "assignmentId",
    );

    if (!submission) return res.status(404).json({ message: "Not found" });

    if (
      submission.assignmentId.createdBy.toString() !== req.user.id.toString()
    )
      return res.status(403).json({ message: "Unauthorized" });

    submission.totalScore = score;
    submission.status = "EVALUATED";
    await submission.save();

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTeacherAnalytics = async (req, res) => {
  try {
    const teacherId = new mongoose.Types.ObjectId(req.user.id);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    /* ================= BASIC STATS ================= */
    
    // 1. Get all classrooms for this teacher
    const classrooms = await Classroom.find({ teacher: teacherId })
      .select("_id name students");
    const classroomIds = classrooms.map(c => c._id);
    
    // 2. Get all assignments created by this teacher
    const assignments = await Assignment.find({ 
      createdBy: teacherId,
      classroomId: { $in: classroomIds }
    }).select("_id title totalMarks createdAt classroomId");
    
    const assignmentIds = assignments.map(a => a._id);
    
    // 3. Count total questions across all assignments
    const totalQuestions = await Question.countDocuments({
      assignmentId: { $in: assignmentIds }
    });
    
    // 4. Count unique students across all classrooms
    const uniqueStudentsResult = await Classroom.aggregate([
      { $match: { teacher: teacherId } },
      { $unwind: "$students" },
      { $group: { _id: "$students" } },
      { $count: "total" }
    ]);
    const uniqueStudentCount = uniqueStudentsResult[0]?.total || 0;

    /* ================= SUBMISSION STATS ================= */
    
    // 5. Get all submissions for teacher's assignments
    const submissions = await Submission.find({
      assignmentId: { $in: assignmentIds }
    }).populate("studentId", "name email");
    
    const totalSubmissions = submissions.length;
    const pendingEvaluations = submissions.filter(s => s.status === "SUBMITTED").length;
    const evaluatedCount = submissions.filter(s => s.status === "EVALUATED").length;
    
    // 6. Calculate average score (only from evaluated submissions)
    const evaluatedSubmissions = submissions.filter(s => s.status === "EVALUATED");
    const averageScore = evaluatedSubmissions.length > 0
      ? evaluatedSubmissions.reduce((sum, s) => sum + (s.totalScore || 0), 0) / evaluatedSubmissions.length
      : 0;

    /* ================= PERFORMANCE METRICS ================= */
    
    // 7. Completion rate
    const expectedSubmissions = assignments.length * uniqueStudentCount;
    const completionRate = expectedSubmissions > 0
      ? (totalSubmissions / expectedSubmissions) * 100
      : 0;

    // 8. Score distribution
    const distribution = {
      excellent: evaluatedSubmissions.filter(s => s.totalScore >= 80).length,
      good: evaluatedSubmissions.filter(s => s.totalScore >= 60 && s.totalScore < 80).length,
      average: evaluatedSubmissions.filter(s => s.totalScore >= 40 && s.totalScore < 60).length,
      poor: evaluatedSubmissions.filter(s => s.totalScore < 40).length
    };

    /* ================= TREND DATA (LAST 30 DAYS) ================= */
    
    // 9. Daily submissions trend
    const dailyTrend = await Submission.aggregate([
      {
        $match: {
          assignmentId: { $in: assignmentIds },
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          submissions: { $sum: 1 },
          evaluated: {
            $sum: { $cond: [{ $eq: ["$status", "EVALUATED"] }, 1, 0] }
          }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    // 10. Daily assignments created trend
    const assignmentTrend = await Assignment.aggregate([
      {
        $match: {
          createdBy: teacherId,
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    // Format trend data for the last 30 days
    const trendData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dateStr = date.toISOString().split('T')[0];
      const dayData = dailyTrend.find(d => 
        d._id.year === date.getFullYear() &&
        d._id.month === date.getMonth() + 1 &&
        d._id.day === date.getDate()
      );
      
      const assignmentDayData = assignmentTrend.find(d =>
        d._id.year === date.getFullYear() &&
        d._id.month === date.getMonth() + 1 &&
        d._id.day === date.getDate()
      );

      trendData.push({
        date: dateStr,
        submissions: dayData?.submissions || 0,
        evaluated: dayData?.evaluated || 0,
        assignments: assignmentDayData?.count || 0,
        pending: (dayData?.submissions || 0) - (dayData?.evaluated || 0)
      });
    }

    /* ================= TOP PERFORMERS ================= */
    
    // 11. Top performing assignments
    const topAssignments = await Submission.aggregate([
      {
        $match: {
          assignmentId: { $in: assignmentIds },
          status: "EVALUATED"
        }
      },
      {
        $group: {
          _id: "$assignmentId",
          avgScore: { $avg: "$totalScore" },
          submissions: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "assignments",
          localField: "_id",
          foreignField: "_id",
          as: "assignment"
        }
      },
      { $unwind: "$assignment" },
      {
        $project: {
          title: "$assignment.title",
          avgScore: 1,
          submissions: 1,
          maxMarks: "$assignment.totalMarks"
        }
      },
      { $sort: { avgScore: -1 } },
      { $limit: 5 }
    ]);

    // 12. Top performing students
    const topStudents = await Submission.aggregate([
      {
        $match: {
          assignmentId: { $in: assignmentIds },
          status: "EVALUATED"
        }
      },
      {
        $group: {
          _id: "$studentId",
          avgScore: { $avg: "$totalScore" },
          submissions: { $sum: 1 },
          totalScore: { $sum: "$totalScore" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "student"
        }
      },
      { $unwind: "$student" },
      {
        $project: {
          name: "$student.name",
          email: "$student.email",
          avgScore: 1,
          submissions: 1,
          totalScore: 1
        }
      },
      { $sort: { avgScore: -1 } },
      { $limit: 5 }
    ]);

    /* ================= WEEKLY COMPARISON ================= */
    
    // 13. This week vs last week
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);
    
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const thisWeekSubmissions = await Submission.countDocuments({
      assignmentId: { $in: assignmentIds },
      createdAt: { $gte: thisWeekStart }
    });

    const lastWeekSubmissions = await Submission.countDocuments({
      assignmentId: { $in: assignmentIds },
      createdAt: { $gte: lastWeekStart, $lt: thisWeekStart }
    });

    const submissionTrend = lastWeekSubmissions > 0
      ? ((thisWeekSubmissions - lastWeekSubmissions) / lastWeekSubmissions) * 100
      : thisWeekSubmissions > 0 ? 100 : 0;

    /* ================= ENHANCED: STUDENT-LEVEL PERFORMANCE ================= */
    
    const studentPerformance = await Submission.aggregate([
      {
        $match: {
          assignmentId: { $in: assignmentIds },
          status: "EVALUATED"
        }
      },
      {
        $group: {
          _id: "$studentId",
          avgScore: { $avg: "$totalScore" },
          submissions: { $sum: 1 },
          totalScore: { $sum: "$totalScore" },
          lastSubmissionDate: { $max: "$createdAt" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "student"
        }
      },
      { $unwind: "$student" },
      {
        $addFields: {
          daysSinceLastSubmission: {
            $divide: [
              { $subtract: [new Date(), "$lastSubmissionDate"] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $addFields: {
          riskScore: {
            $add: [
              { $multiply: [{ $subtract: [100, "$avgScore"] }, 0.7] },
              { $multiply: ["$daysSinceLastSubmission", 0.3] }
            ]
          }
        }
      },
      {
        $project: {
          studentId: "$_id",
          name: "$student.name",
          email: "$student.email",
          avgScore: 1,
          submissions: 1,
          totalScore: 1,
          lastSubmissionDate: 1,
          daysSinceLastSubmission: 1,
          riskScore: 1
        }
      },
      { $sort: { riskScore: -1 } }
    ]);

    /* ================= ENHANCED: AT-RISK STUDENTS ================= */
    
    const atRiskThreshold = new Date();
    atRiskThreshold.setDate(atRiskThreshold.getDate() - 7);

    const atRiskStudents = await Submission.aggregate([
      {
        $match: {
          assignmentId: { $in: assignmentIds }
        }
      },
      {
        $group: {
          _id: "$studentId",
          avgScore: { $avg: "$totalScore" },
          lastSubmission: { $max: "$createdAt" },
          submissionCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "student"
        }
      },
      { $unwind: "$student" },
      {
        $match: {
          $or: [
            { avgScore: { $lt: 40 } },
            { lastSubmission: { $lt: atRiskThreshold } },
            { submissionCount: { $lt: 2 } }
          ]
        }
      },
      {
        $project: {
          studentId: "$_id",
          name: "$student.name",
          email: "$student.email",
          avgScore: 1,
          submissionCount: 1,
          lastSubmission: 1,
          riskReason: {
            $cond: {
              if: { $lt: ["$avgScore", 40] },
              then: "Low performance",
              else: {
                $cond: {
                  if: { $lt: ["$lastSubmission", atRiskThreshold] },
                  then: "Inactive (7+ days)",
                  else: "Low engagement"
                }
              }
            }
          }
        }
      }
    ]);

    /* ================= ENHANCED: ENGAGEMENT METRICS ================= */
    
    const totalPossibleSubmissions = assignments.length * uniqueStudentCount;
    const engagementRate = totalPossibleSubmissions > 0 
      ? (totalSubmissions / totalPossibleSubmissions) * 100 
      : 0;

    const inactiveStudents = uniqueStudentCount - (
      await Submission.distinct("studentId", {
        assignmentId: { $in: assignmentIds }
      })
    ).length;

    /* ================= ENHANCED: CATEGORY PERFORMANCE TRENDS ================= */
    
    const categoryPerformance = await Submission.aggregate([
      {
        $match: {
          assignmentId: { $in: assignmentIds },
          status: "EVALUATED"
        }
      },
      {
        $group: {
          _id: {
            studentId: "$studentId",
            month: { $month: "$createdAt" }
          },
          avgScore: { $avg: "$totalScore" }
        }
      },
      {
        $bucket: {
          groupBy: "$avgScore",
          boundaries: [0, 40, 60, 80, 100],
          default: "Unknown",
          output: {
            count: { $sum: 1 },
            students: { $addToSet: "$_id.studentId" }
          }
        }
      }
    ]);

    /* ================= ENHANCED: RECOMMENDATION ENGINE ================= */
    
    const recommendations = [];

    // If many students are struggling
    if (distribution.poor > uniqueStudentCount * 0.2) {
      recommendations.push({
        type: "remedial",
        title: "Schedule Remedial Classes",
        description: `${distribution.poor} students are scoring below 40%. Consider extra help sessions.`,
        priority: "high",
        action: "Create remedial session",
        icon: "graduation-cap"
      });
    }

    // If submissions are dropping
    if (trendData.length >= 14) {
      const last7Days = trendData.slice(-7).reduce((sum, day) => sum + day.submissions, 0);
      const previous7Days = trendData.slice(-14, -7).reduce((sum, day) => sum + day.submissions, 0);
      
      if (previous7Days > 0 && last7Days < previous7Days * 0.7) {
        recommendations.push({
          type: "engagement",
          title: "Engagement Drop Detected",
          description: "Submissions have dropped by 30% this week. Send motivation boosters.",
          priority: "medium",
          action: "Send reminders",
          icon: "trending-down"
        });
      }
    }

    // If pending evaluations are high
    if (pendingEvaluations > 10) {
      recommendations.push({
        type: "feedback",
        title: "Pending Evaluations",
        description: `${pendingEvaluations} submissions waiting for feedback. Quick feedback improves performance.`,
        priority: "high",
        action: "Review now",
        icon: "clock"
      });
    }

    // If completion rate is low
    if (completionRate < 50) {
      recommendations.push({
        type: "motivation",
        title: "Boost Completion Rate",
        description: `Only ${completionRate.toFixed(1)}% of expected submissions received. Consider sending reminders.`,
        priority: "medium",
        action: "Send bulk email",
        icon: "target"
      });
    }

    // If there are inactive students
    if (inactiveStudents > 0) {
      recommendations.push({
        type: "re-engagement",
        title: "Re-engage Inactive Students",
        description: `${inactiveStudents} students haven't submitted anything. Reach out to them.`,
        priority: "high",
        action: "Contact students",
        icon: "user-minus"
      });
    }

    // If top performers exist, suggest peer learning
    if (topStudents.length > 0 && distribution.poor > 0) {
      recommendations.push({
        type: "peer-learning",
        title: "Peer Learning Opportunity",
        description: `Pair ${topStudents[0].name} with struggling students for peer tutoring.`,
        priority: "medium",
        action: "Set up peer program",
        icon: "users"
      });
    }

    /* ================= ENHANCED: CLASSROOM BREAKDOWN ================= */
    
    const classroomBreakdown = await Promise.all(
      classrooms.map(async (cls) => {
        // Filter assignments that belong to this classroom
        const clsAssignments = assignments.filter(a => {
          // Safely compare classroomId
          if (!a.classroomId) return false;
          return a.classroomId.toString() === cls._id.toString();
        });
        
        const clsAssignmentIds = clsAssignments.map(a => a._id);
        
        const clsSubmissions = await Submission.countDocuments({
          assignmentId: { $in: clsAssignmentIds }
        });
        
        const clsExpected = clsAssignments.length * cls.students.length;
        
        return {
          classroomId: cls._id,
          name: cls.name,
          studentCount: cls.students.length,
          assignmentCount: clsAssignments.length,
          submissionCount: clsSubmissions,
          completionRate: clsExpected > 0 ? Number(((clsSubmissions / clsExpected) * 100).toFixed(2)) : 0
        };
      })
    );

    /* ================= FINAL RESPONSE ================= */

    res.json({
      success: true,
      data: {
        stats: {
          classrooms: classrooms.length,
          assignments: assignments.length,
          questions: totalQuestions,
          totalStudents: uniqueStudentCount,
          pendingEvaluations,
          evaluatedCount,
          totalSubmissions,
          averageScore: Number(averageScore.toFixed(2)),
          completionRate: Number(completionRate.toFixed(2)),
          engagementRate: Number(engagementRate.toFixed(2)),
          inactiveStudents
        },
        performance: {
          distribution,
          topAssignments,
          topStudents,
          studentPerformance: studentPerformance || [],
          atRiskStudents: atRiskStudents || []
        },
        trends: {
          daily: trendData,
          weekly: {
            thisWeek: thisWeekSubmissions,
            lastWeek: lastWeekSubmissions,
            change: Number(submissionTrend.toFixed(2))
          },
          categoryTrends: categoryPerformance || []
        },
        summary: {
          expectedSubmissions,
          completionRate: Number(completionRate.toFixed(2)),
          averageScore: Number(averageScore.toFixed(2)),
          totalMarksAwarded: evaluatedSubmissions.reduce((sum, s) => sum + (s.totalScore || 0), 0)
        },
        recommendations: recommendations,
        classroomBreakdown: classroomBreakdown,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Teacher Analytics Error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Failed to load analytics data" 
    });
  }
};
