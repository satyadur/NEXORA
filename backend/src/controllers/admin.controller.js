import User from "../models/User.model.js";
import Assignment from "../models/Assignment.model.js";
import Submission from "../models/Submission.model.js";
import Classroom from "../models/Classroom.model.js";
import Attendance from "../models/Attendance.model.js";
import Payslip from "../models/Payslip.model.js";
import EmployeeDocument from "../models/EmployeeDocument.model.js";
import StudentCertificate from "../models/StudentCertificate.model.js";
import bcrypt from "bcryptjs";
import TeacherAttendanceModel from "../models/TeacherAttendance.model.js";
import crypto from "crypto";

const generateStudentUniqueId = (courseCode = "GEN") => {
  const prefix = "NX";
  const year = new Date().getFullYear().toString().slice(-2);
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  const coursePrefix = courseCode.slice(0, 3).toUpperCase();
  return `${prefix}${year}${coursePrefix}${random}`;
};

// Generate unique ID for employees (teachers, faculty admins)
const generateEmployeeUniqueId = (role, name) => {
  const prefix = role === "TEACHER" ? "TCH" : "FAC";
  const year = new Date().getFullYear().toString().slice(-2);
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  const nameInitials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return `${prefix}${year}${nameInitials}${random}`;
};

// Generate unique ID for admins
const generateAdminUniqueId = () => {
  const prefix = "ADM";
  const year = new Date().getFullYear().toString().slice(-2);
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}${year}${random}`;
};

// Generate employee ID (for employeeRecord)
const generateEmployeeId = (role, index) => {
  const prefix = role === "TEACHER" ? "TCH" : "FAC";
  const year = new Date().getFullYear().toString().slice(-2);
  const num = (index + 1).toString().padStart(4, '0');
  return `${prefix}${year}${num}`;
};

// Generate unique ID (backward compatibility)
const generateUniqueId = (role, name) => {
  if (role === "STUDENT") {
    return generateStudentUniqueId();
  } else if (role === "TEACHER" || role === "FACULTY_ADMIN") {
    return generateEmployeeUniqueId(role, name);
  } else {
    return generateAdminUniqueId();
  }
};

// Generate enrollment number for students
const generateEnrollmentNumber = (department = "GEN") => {
  const year = new Date().getFullYear();
  const deptCode = department.slice(0, 3).toUpperCase();
  const sequence = Math.floor(1000 + Math.random() * 9000);
  return `ENR-${year}-${deptCode}-${sequence}`;
};

export const getAdminStats = async (req, res) => {
  try {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startOfWeek = new Date(currentDate.setDate(currentDate.getDate() - 7));
    
    const [
      // Core Counts
      totalUsers,
      totalStudents,
      totalTeachers,
      totalClassrooms,
      totalAssignments,
      
      // Active Status
      activeClassrooms,
      pendingClassrooms,
      publishedAssignments,
      draftAssignments,
      
      // Recent Activity
      newUsersThisMonth,
      newSubmissionsThisMonth,
      newAssignmentsThisMonth,
      activeUsersLast7Days,
      
      // Performance Metrics
      submissionStats,
      scoreStats,
      classroomUtilization,
      teacherWorkload,
      studentEngagement
    ] = await Promise.all([
      // Basic counts
      User.countDocuments(),
      User.countDocuments({ role: "STUDENT" }),
      User.countDocuments({ role: "TEACHER" }),
      Classroom.countDocuments(),
      Assignment.countDocuments(),
      
      // Classroom status
      Classroom.countDocuments({ status: "ACTIVE" }),
      Classroom.countDocuments({ status: "PENDING" }),
      Assignment.countDocuments({ isPublished: true }),
      Assignment.countDocuments({ isPublished: false }),
      
      // Recent activity
      User.countDocuments({ 
        createdAt: { $gte: startOfMonth } 
      }),
      Submission.countDocuments({ 
        createdAt: { $gte: startOfMonth } 
      }),
      Assignment.countDocuments({ 
        createdAt: { $gte: startOfMonth } 
      }),
      User.countDocuments({
        lastActive: { $gte: startOfWeek }
      }),
      
      // Submission analytics
      Submission.aggregate([
        {
          $group: {
            _id: null,
            totalSubmissions: { $sum: 1 },
            avgScore: { $avg: "$totalScore" },
            maxScore: { $max: "$totalScore" },
            minScore: { $min: "$totalScore" },
            onTimeSubmissions: {
              $sum: { $cond: ["$submittedOnTime", 1, 0] }
            },
            lateSubmissions: {
              $sum: { $cond: ["$isLate", 1, 0] }
            }
          }
        }
      ]),
      
      // Score distribution
      Submission.aggregate([
        {
          $bucket: {
            groupBy: "$totalScore",
            boundaries: [0, 40, 60, 75, 90, 100],
            default: "90+",
            output: {
              count: { $sum: 1 }
            }
          }
        }
      ]),
      
      // Classroom utilization
      Classroom.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "students",
            foreignField: "_id",
            as: "enrolledStudents"
          }
        },
        {
          $lookup: {
            from: "assignments",
            localField: "_id",
            foreignField: "classroomId",
            as: "classroomAssignments"
          }
        },
        {
          $group: {
            _id: null,
            totalCapacity: { $sum: "$capacity" },
            totalEnrolled: { $sum: { $size: "$enrolledStudents" } },
            avgClassSize: { $avg: { $size: "$enrolledStudents" } },
            totalAssignmentsAcrossClassrooms: { $sum: { $size: "$classroomAssignments" } }
          }
        }
      ]),
      
      // Teacher workload
      User.aggregate([
        { $match: { role: "TEACHER" } },
        {
          $lookup: {
            from: "classrooms",
            localField: "_id",
            foreignField: "teacher",
            as: "teachingClassrooms"
          }
        },
        {
          $lookup: {
            from: "assignments",
            localField: "_id",
            foreignField: "createdBy",
            as: "createdAssignments"
          }
        },
        {
          $group: {
            _id: null,
            avgClassroomsPerTeacher: { $avg: { $size: "$teachingClassrooms" } },
            avgAssignmentsPerTeacher: { $avg: { $size: "$createdAssignments" } },
            totalActiveTeachers: {
              $sum: { $cond: [{ $gt: [{ $size: "$teachingClassrooms" }, 0] }, 1, 0] }
            }
          }
        }
      ]),
      
      // Student engagement
      User.aggregate([
        { $match: { role: "STUDENT" } },
        {
          $lookup: {
            from: "submissions",
            localField: "_id",
            foreignField: "studentId",
            as: "studentSubmissions"
          }
        },
        {
          $lookup: {
            from: "attendances",
            localField: "_id",
            foreignField: "studentId",
            as: "studentAttendance"
          }
        },
        {
          $group: {
            _id: null,
            avgSubmissionsPerStudent: { $avg: { $size: "$studentSubmissions" } },
            studentsWithNoSubmissions: {
              $sum: { $cond: [{ $eq: [{ $size: "$studentSubmissions" }, 0] }, 1, 0] }
            },
            avgAttendanceRate: {
              $avg: {
                $cond: [
                  { $gt: [{ $size: "$studentAttendance" }, 0] },
                  {
                    $multiply: [
                      {
                        $divide: [
                          {
                            $size: {
                              $filter: {
                                input: "$studentAttendance",
                                as: "attendance",
                                cond: { $eq: ["$$attendance.status", "PRESENT"] }
                              }
                            }
                          },
                          { $size: "$studentAttendance" }
                        ]
                      },
                      100
                    ]
                  },
                  0
                ]
              }
            }
          }
        }
      ])
    ]);

    // Process submission stats
    const submissionMetrics = submissionStats[0] || {
      totalSubmissions: 0,
      avgScore: 0,
      maxScore: 0,
      minScore: 0,
      onTimeSubmissions: 0,
      lateSubmissions: 0
    };

    // Calculate key performance indicators
    const submissionRate = totalAssignments > 0 
      ? ((submissionMetrics.totalSubmissions / totalAssignments) * 100).toFixed(2)
      : 0;
    
    const onTimeRate = submissionMetrics.totalSubmissions > 0
      ? ((submissionMetrics.onTimeSubmissions / submissionMetrics.totalSubmissions) * 100).toFixed(2)
      : 0;
    
    const classroomUtilizationRate = classroomUtilization[0]?.totalCapacity > 0
      ? ((classroomUtilization[0]?.totalEnrolled / classroomUtilization[0]?.totalCapacity) * 100).toFixed(2)
      : 0;

    const engagementScore = ((parseFloat(submissionRate) + parseFloat(onTimeRate) + 
      (studentEngagement[0]?.avgAttendanceRate || 0)) / 3).toFixed(2);

    res.json({
      // Core Metrics
      overview: {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalClassrooms,
        totalAssignments,
        activeClassrooms,
        pendingClassrooms,
        publishedAssignments,
        draftAssignments
      },
      
      // Growth Metrics
      growth: {
        newUsersThisMonth,
        newSubmissionsThisMonth,
        newAssignmentsThisMonth,
        activeUsersLast7Days
      },
      
      // Performance Metrics
      performance: {
        totalSubmissions: submissionMetrics.totalSubmissions,
        averageScore: submissionMetrics.avgScore?.toFixed(2) || 0,
        highestScore: submissionMetrics.maxScore || 0,
        lowestScore: submissionMetrics.minScore || 0,
        submissionRate: parseFloat(submissionRate),
        onTimeRate: parseFloat(onTimeRate),
        lateSubmissions: submissionMetrics.lateSubmissions
      },
      
      // Score Distribution
      scoreDistribution: scoreStats.map(bucket => ({
        range: bucket._id,
        count: bucket.count
      })),
      
      // Utilization Metrics
      utilization: {
        classroomUtilizationRate: parseFloat(classroomUtilizationRate),
        avgClassSize: classroomUtilization[0]?.avgClassSize?.toFixed(1) || 0,
        totalEnrolledStudents: classroomUtilization[0]?.totalEnrolled || 0,
        avgAssignmentsPerClassroom: classroomUtilization[0]?.totalAssignmentsAcrossClassrooms > 0
          ? (classroomUtilization[0]?.totalAssignmentsAcrossClassrooms / totalClassrooms).toFixed(1)
          : 0
      },
      
      // Teacher Analytics
      teacherAnalytics: {
        avgClassroomsPerTeacher: teacherWorkload[0]?.avgClassroomsPerTeacher?.toFixed(1) || 0,
        avgAssignmentsPerTeacher: teacherWorkload[0]?.avgAssignmentsPerTeacher?.toFixed(1) || 0,
        totalActiveTeachers: teacherWorkload[0]?.totalActiveTeachers || 0,
        teacherEffectiveness: teacherWorkload[0]?.totalActiveTeachers > 0
          ? ((teacherWorkload[0]?.totalActiveTeachers / totalTeachers) * 100).toFixed(1)
          : 0
      },
      
      // Student Analytics
      studentAnalytics: {
        avgSubmissionsPerStudent: studentEngagement[0]?.avgSubmissionsPerStudent?.toFixed(1) || 0,
        studentsWithNoSubmissions: studentEngagement[0]?.studentsWithNoSubmissions || 0,
        avgAttendanceRate: studentEngagement[0]?.avgAttendanceRate?.toFixed(1) || 0,
        atRiskStudents: studentEngagement[0]?.studentsWithNoSubmissions || 0
      },
      
      // Overall Health Score
      platformHealth: {
        engagementScore: parseFloat(engagementScore),
        performanceGrade: getPerformanceGrade(parseFloat(engagementScore)),
        recommendations: generateRecommendations({
          submissionRate,
          onTimeRate,
          classroomUtilizationRate,
          atRiskStudents: studentEngagement[0]?.studentsWithNoSubmissions || 0
        })
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to calculate performance grade
function getPerformanceGrade(score) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

// Helper function to generate recommendations
function generateRecommendations(metrics) {
  const recommendations = [];
  
  if (metrics.submissionRate < 70) {
    recommendations.push("Consider sending reminders for pending assignments");
  }
  
  if (metrics.onTimeRate < 60) {
    recommendations.push("Review assignment deadlines - students may need more time");
  }
  
  if (metrics.classroomUtilizationRate < 50) {
    recommendations.push("Optimize classroom capacity - many seats are unused");
  }
  
  if (metrics.atRiskStudents > 10) {
    recommendations.push(`${metrics.atRiskStudents} students haven't submitted any assignments`);
  }
  
  return recommendations;
}

export const getMonthlyGrowth = async (req, res) => {
  try {
    const year = new Date().getFullYear();

    const [
      userData,
      classroomData,
      assignmentData,
      submissionData,
    ] = await Promise.all([
      // USERS
      User.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(`${year}-01-01`),
              $lte: new Date(`${year}-12-31`),
            },
          },
        },
        {
          $group: {
            _id: {
              month: { $month: "$createdAt" },
              role: "$role",
            },
            count: { $sum: 1 },
          },
        },
      ]),

      // CLASSROOMS
      Classroom.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(`${year}-01-01`),
              $lte: new Date(`${year}-12-31`),
            },
          },
        },
        {
          $group: {
            _id: { month: { $month: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
      ]),

      // ASSIGNMENTS
      Assignment.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(`${year}-01-01`),
              $lte: new Date(`${year}-12-31`),
            },
          },
        },
        {
          $group: {
            _id: { month: { $month: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
      ]),

      // SUBMISSIONS
      Submission.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(`${year}-01-01`),
              $lte: new Date(`${year}-12-31`),
            },
          },
        },
        {
          $group: {
            _id: { month: { $month: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // 🧠 Transform into clean 12 month structure
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      students: 0,
      teachers: 0,
      classrooms: 0,
      assignments: 0,
      submissions: 0,
    }));

    // Fill users
    userData.forEach((item) => {
      const monthIndex = item._id.month - 1;

      if (item._id.role === "STUDENT") {
        months[monthIndex].students = item.count;
      }

      if (item._id.role === "TEACHER") {
        months[monthIndex].teachers = item.count;
      }
    });

    // Fill classrooms
    classroomData.forEach((item) => {
      months[item._id.month - 1].classrooms = item.count;
    });

    // Fill assignments
    assignmentData.forEach((item) => {
      months[item._id.month - 1].assignments = item.count;
    });

    // Fill submissions
    submissionData.forEach((item) => {
      months[item._id.month - 1].submissions = item.count;
    });

    res.json(months);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAssignmentPerformance = async (req, res) => {
  try {
    const result = await Submission.aggregate([
      {
        $group: {
          _id: "$assignmentId",
          averageScore: { $avg: "$totalScore" },
          totalSubmissions: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "assignments",
          localField: "_id",
          foreignField: "_id",
          as: "assignment",
        },
      },
      { $unwind: "$assignment" },
      {
        $lookup: {
          from: "classrooms",
          localField: "assignment.classroomId",
          foreignField: "_id",
          as: "classroom",
        },
      },
      { $unwind: "$classroom" },
      {
        $project: {
          title: "$assignment.title",
          classroom: "$classroom.name",
          averageScore: 1,
          totalSubmissions: 1,
        },
      },
    ]);

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: "TEACHER" })
      .select("_id name email")
      .sort({ createdAt: -1 });

    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* UPDATE TEACHER */
export const updateTeacher = async (req, res) => {
  try {
    const { name, email } = req.body;

    const teacher = await User.findById(req.params.id);

    if (!teacher || teacher.role !== "TEACHER") {
      return res.status(404).json({ message: "Teacher not found" });
    }

    if (name) teacher.name = name;
    if (email) teacher.email = email;

    await teacher.save();

    res.json(teacher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentDetails = async (req, res) => {
  try {
    const student = await User.findById(req.params.id)
      .select("-password") // Exclude password, include everything else
      .populate({
        path: 'enrolledCourses.courseId',
        model: 'Course',
        select: 'title code credits department level duration fee status'
      });

    if (!student || student.role !== "STUDENT") {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    /* ================= BASIC INFO ================= */
    const studentBasic = {
      _id: student._id,
      name: student.name,
      email: student.email,
      role: student.role,
      avatar: student.avatar,
      
      // Unique identifiers
      uniqueId: student.uniqueId,
      enrollmentNumber: student.enrollmentNumber,
      aadharNumber: student.aadharNumber,
      panNumber: student.panNumber,
      
      // Personal Details
      phone: student.phone,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      bloodGroup: student.bloodGroup,
      address: student.address,
      
      // Academic Details
      batch: student.batch,
      currentSemester: student.currentSemester,
      cgpa: student.cgpa,
      backlogs: student.backlogs,
      
      // Education History
      education: student.education || [],
      
      // Skills
      skills: student.skills || [],
      
      // Job Preferences
      jobPreferences: student.jobPreferences || {},
      
      // Social Links
      socialLinks: student.socialLinks || {},
      
      // Status
      isProfileComplete: student.isProfileComplete,
      isPlacementEligible: student.isPlacementEligible,
      placementStatus: student.placementStatus,
      isActive: student.isActive,
      
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    };

    /* ================= CLASSROOMS ================= */
    const classrooms = await Classroom.find({
      students: student._id,
    }).select("_id name status teacher")
      .populate("teacher", "name email");

    const classroomIds = classrooms.map((c) => c._id);

    /* ================= ASSIGNMENTS ================= */
    const assignments = await Assignment.find({
      classroomId: { $in: classroomIds },
      isPublished: true,
    }).populate("classroomId", "name");

    const submissions = await Submission.find({
      studentId: student._id,
    }).populate("assignmentId", "title totalMarks classroomId");

    const detailedAssignments = assignments.map((assignment) => {
      const submission = submissions.find(
        (s) => s.assignmentId?._id.toString() === assignment._id.toString()
      );

      let status = "PENDING";
      let score = 0;
      let percentage = 0;

      if (submission) {
        status = submission.status;
        score = submission.totalScore;

        percentage =
          assignment.totalMarks > 0
            ? ((score / assignment.totalMarks) * 100).toFixed(2)
            : 0;
      } else if (new Date() > assignment.deadline) {
        status = "MISSED";
      }

      return {
        _id: assignment._id,
        title: assignment.title,
        classroom: assignment.classroomId?.name,
        deadline: assignment.deadline,
        totalMarks: assignment.totalMarks,
        status,
        score,
        percentage,
        submissionId: submission?._id,
        submittedAt: submission?.createdAt,
      };
    });

    /* ================= ENROLLED COURSES ================= */
    const enrolledCourses = student.enrolledCourses?.map(enrollment => ({
      courseId: enrollment.courseId?._id,
      courseCode: enrollment.courseCode,
      courseName: enrollment.courseName,
      status: enrollment.status,
      enrollmentDate: enrollment.enrollmentDate,
      grade: enrollment.grade,
      percentage: enrollment.percentage,
      completionDate: enrollment.completionDate,
      certificateIssued: enrollment.certificateIssued,
      courseDetails: enrollment.courseId ? {
        title: enrollment.courseId.title,
        code: enrollment.courseId.code,
        credits: enrollment.courseId.credits,
        department: enrollment.courseId.department,
        level: enrollment.courseId.level,
        duration: enrollment.courseId.duration,
        fee: enrollment.courseId.fee
      } : null
    })) || [];

    /* ================= CERTIFICATES ================= */
    const certificates = await StudentCertificate.find({
      studentId: student._id,
    }).sort({ issueDate: -1 });

    /* ================= ATTENDANCE ================= */
    const attendanceRecords = await Attendance.find({
      studentId: student._id,
    }).populate("classroomId", "name");

    const present = attendanceRecords.filter(
      (a) => a.status === "PRESENT"
    ).length;

    const absent = attendanceRecords.filter(
      (a) => a.status === "ABSENT"
    ).length;

    const totalDays = present + absent;

    const attendancePercentage =
      totalDays > 0 ? ((present / totalDays) * 100).toFixed(2) : 0;

    /* ================= SUBMISSION STATISTICS ================= */
    const submissionStats = await Submission.aggregate([
      { $match: { studentId: student._id } },
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          totalScore: { $sum: "$totalScore" },
          averageScore: { $avg: "$totalScore" }
        }
      }
    ]);

    /* ================= PERFORMANCE ================= */
    const totalAssignments = detailedAssignments.length;
    const submittedCount = detailedAssignments.filter(
      (a) => a.status !== "PENDING" && a.status !== "MISSED"
    ).length;

    const averageScore =
      submittedCount > 0
        ? detailedAssignments
            .filter((a) => a.score > 0)
            .reduce((sum, a) => sum + a.score, 0) / submittedCount
        : 0;

    /* ================= RESPONSE ================= */
    res.json({
      success: true,
      student: studentBasic,
      statistics: {
        // Classroom stats
        classrooms: {
          total: classrooms.length,
          list: classrooms,
        },
        
        // Assignment stats
        assignments: {
          total: totalAssignments,
          submitted: submittedCount,
          pending: totalAssignments - submittedCount,
          averageScore: averageScore.toFixed(2),
          list: detailedAssignments,
        },
        
        // Course stats
        courses: {
          total: enrolledCourses.length,
          completed: enrolledCourses.filter(c => c.status === "completed").length,
          inProgress: enrolledCourses.filter(c => c.status === "in_progress").length,
          enrolled: enrolledCourses.filter(c => c.status === "enrolled").length,
          dropped: enrolledCourses.filter(c => c.status === "dropped").length,
          list: enrolledCourses,
        },
        
        // Attendance stats
        attendance: {
          totalDays,
          present,
          absent,
          attendancePercentage: parseFloat(attendancePercentage),
          records: attendanceRecords.slice(0, 20), // Last 20 records
        },
        
        // Certificate stats
        certificates: {
          total: certificates.length,
          list: certificates,
        },
        
        // Submission stats
        submissions: {
          total: submissionStats[0]?.totalSubmissions || 0,
          totalScore: submissionStats[0]?.totalScore || 0,
          averageScore: submissionStats[0]?.averageScore?.toFixed(2) || 0,
          list: submissions.slice(0, 10), // Last 10 submissions
        },
        
        // Education stats
        education: {
          total: student.education?.length || 0,
          highestDegree: student.education?.sort((a, b) => b.yearOfPassing - a.yearOfPassing)[0]?.degree,
          list: student.education || [],
        },
        
        // Skills
        skills: student.skills || [],
      },
    });

  } catch (error) {
    console.error("Error in getStudentDetails:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



/* ================= GET ALL STUDENTS ================= */
export const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "STUDENT" })
      .select("_id name email uniqueId")
      .sort({ createdAt: -1 });

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ================= UPDATE STUDENT ================= */
export const updateStudent = async (req, res) => {
  try {
    const { name, email } = req.body;

    const student = await User.findById(req.params.id);

    if (!student || student.role !== "STUDENT") {
      return res.status(404).json({ message: "Student not found" });
    }

    if (name) student.name = name;
    if (email) student.email = email;

    await student.save();

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// /* ================= DELETE STUDENT ================= */
// export const deleteStudent = async (req, res) => {
//   try {
//     const student = await User.findById(req.params.id);

//     if (!student || student.role !== "STUDENT") {
//       return res.status(404).json({ message: "Student not found" });
//     }

//     // Remove from classrooms
//     await Classroom.updateMany(
//       { students: student._id },
//       { $pull: { students: student._id } }
//     );

//     await student.deleteOne();

//     res.json({ message: "Student deleted successfully" });

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

export const getAllAssignmentsAdmin = async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate("classroomId", "name")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    const formatted = await Promise.all(
      assignments.map(async (assignment) => {
        const submissions = await Submission.find({
          assignmentId: assignment._id,
        });

        const totalSubmissions = submissions.length;

        const avg =
          submissions.length > 0
            ? submissions.reduce(
                (sum, s) => sum + (s.totalScore || 0),
                0
              ) / submissions.length
            : 0;

        return {
          _id: assignment._id,
          title: assignment.title,
          classroom: assignment.classroomId?.name,
          teacher: assignment.createdBy?.name,
          totalMarks: assignment.totalMarks,
          deadline: assignment.deadline,
          isPublished: assignment.isPublished,
          totalSubmissions,
          averageScore: avg,
        };
      })
    );

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllSubmissionsAdmin = async (req, res) => {
  try {
    const submissions = await Submission.find()
      .populate("assignmentId", "title classroomId")
      .populate("studentId", "name email")
      .sort({ createdAt: -1 });

    const formatted = submissions.map((s) => ({
      _id: s._id,
      assignment: s.assignmentId?.title,
      student: s.studentId?.name,
      totalScore: s.totalScore,
      status: s.status,
      submittedAt: s.createdAt,
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add this to your admin.controller.js

/* ================= STUDENT ANALYTICS ================= */
export const getStudentAnalytics = async (req, res) => {
  try {
    const [
      totalStudents,
      studentPerformance,
      topPerformers,
      bottomPerformers,
      pendingSubmissions,
      classroomDistribution,
      attendanceAnalytics
    ] = await Promise.all([
      // Total student count
      User.countDocuments({ role: "STUDENT" }),

      // Overall performance metrics
      Submission.aggregate([
        {
          $group: {
            _id: "$studentId",
            totalScore: { $sum: "$totalScore" },
            submissionCount: { $sum: 1 },
            averageScore: { $avg: "$totalScore" }
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
            totalScore: 1,
            submissionCount: 1,
            averageScore: { $round: ["$averageScore", 2] }
          }
        },
        { $sort: { averageScore: -1 } }
      ]),

      // Top 3 performers
      Submission.aggregate([
        {
          $group: {
            _id: "$studentId",
            averageScore: { $avg: "$totalScore" },
            totalSubmissions: { $sum: 1 },
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
            averageScore: { $round: ["$averageScore", 2] },
            totalSubmissions: 1,
            totalScore: 1
          }
        },
        { $sort: { averageScore: -1 } },
        { $limit: 3 }
      ]),

      // Bottom 3 performers (with submissions)
      Submission.aggregate([
        {
          $group: {
            _id: "$studentId",
            averageScore: { $avg: "$totalScore" },
            totalSubmissions: { $sum: 1 }
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
            averageScore: { $round: ["$averageScore", 2] },
            totalSubmissions: 1
          }
        },
        { $sort: { averageScore: 1 } },
        { $limit: 3 }
      ]),

      // Students with pending submissions
      Assignment.aggregate([
        { $match: { isPublished: true } },
        {
          $lookup: {
            from: "submissions",
            let: { assignmentId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$assignmentId", "$$assignmentId"] }
                }
              },
              { $project: { studentId: 1 } }
            ],
            as: "submissions"
          }
        },
        {
          $lookup: {
            from: "classrooms",
            localField: "classroomId",
            foreignField: "_id",
            as: "classroom"
          }
        },
        { $unwind: "$classroom" },
        {
          $project: {
            assignmentId: "$_id",
            title: 1,
            classroomName: "$classroom.name",
            submittedStudents: "$submissions.studentId",
            allStudents: "$classroom.students"
          }
        },
        {
          $project: {
            assignmentId: 1,
            title: 1,
            classroomName: 1,
            pendingStudents: {
              $setDifference: ["$allStudents", "$submittedStudents"]
            }
          }
        },
        { $unwind: "$pendingStudents" },
        {
          $lookup: {
            from: "users",
            localField: "pendingStudents",
            foreignField: "_id",
            as: "student"
          }
        },
        { $unwind: "$student" },
        {
          $group: {
            _id: "$student._id",
            name: { $first: "$student.name" },
            email: { $first: "$student.email" },
            pendingAssignments: {
              $push: {
                title: "$title",
                classroom: "$classroomName"
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),

      // Student distribution by classroom
      Classroom.aggregate([
        {
          $project: {
            name: 1,
            studentCount: { $size: "$students" }
          }
        },
        { $sort: { studentCount: -1 } },
        {
          $group: {
            _id: null,
            totalStudents: { $sum: "$studentCount" },
            classrooms: {
              $push: {
                name: "$name",
                count: "$studentCount"
              }
            },
            avgStudentsPerClass: { $avg: "$studentCount" }
          }
        }
      ]),

      // Attendance analytics
      Attendance.aggregate([
        {
          $group: {
            _id: "$studentId",
            presentCount: {
              $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] }
            },
            totalDays: { $sum: 1 }
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
            attendanceRate: {
              $round: [
                { $multiply: [{ $divide: ["$presentCount", "$totalDays"] }, 100] },
                2
              ]
            },
            presentCount: 1,
            totalDays: 1
          }
        },
        { $sort: { attendanceRate: -1 } },
        {
          $group: {
            _id: null,
            topAttendance: { $push: "$$ROOT" },
            avgAttendanceRate: { $avg: "$attendanceRate" }
          }
        },
        {
          $project: {
            topAttendance: { $slice: ["$topAttendance", 3] },
            avgAttendanceRate: { $round: ["$avgAttendanceRate", 2] }
          }
        }
      ])
    ]);

    // Calculate additional metrics
    const studentsWithSubmissions = studentPerformance.length;
    const studentsWithoutSubmissions = totalStudents - studentsWithSubmissions;
    const submissionRate = totalStudents > 0 
      ? ((studentsWithSubmissions / totalStudents) * 100).toFixed(1)
      : "0";

    // Overall averages
    const overallAverageScore = studentPerformance.length > 0
      ? (studentPerformance.reduce((acc, s) => acc + s.averageScore, 0) / studentPerformance.length).toFixed(2)
      : "0";

    res.json({
      overview: {
        totalStudents,
        studentsWithSubmissions,
        studentsWithoutSubmissions,
        submissionRate: parseFloat(submissionRate),
        overallAverageScore: parseFloat(overallAverageScore)
      },
      
      performers: {
        top3: topPerformers,
        bottom3: bottomPerformers
      },
      
      pendingWork: {
        studentsWithPending: pendingSubmissions,
        totalPendingAssignments: pendingSubmissions.reduce((acc, s) => acc + s.count, 0)
      },
      
      classroomDistribution: classroomDistribution[0] || {
        totalStudents: 0,
        classrooms: [],
        avgStudentsPerClass: 0
      },
      
      attendance: attendanceAnalytics[0] || {
        topAttendance: [],
        avgAttendanceRate: 0
      },
      
      performance: {
        topScorer: topPerformers[0] || null,
        needsAttention: bottomPerformers[0] || null,
        mostPending: pendingSubmissions[0] || null
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== FACULTY ADMIN MANAGEMENT ==========

// Get all faculty admins
export const getAllFacultyAdmins = async (req, res) => {
  try {
    const facultyAdmins = await User.find({ role: "FACULTY_ADMIN" })
      .select("_id name email phone employeeRecord.employeeId employeeRecord.department")
      .sort({ createdAt: -1 });

    res.json(facultyAdmins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create faculty admin
export const createFacultyAdmin = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password,
      phone,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      aadharNumber,
      panNumber,
      department,
      designation,
      joiningDate,
      salary
    } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = password;
    const employeeId = generateEmployeeId("FACULTY_ADMIN",Date.now());
    const uniqueId = generateUniqueId("FACULTY_ADMIN", name);

    const facultyAdmin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "FACULTY_ADMIN",
      phone,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      aadharNumber,
      panNumber,
      uniqueId,
      employeeRecord: {
        employeeId,
        designation: designation || "Faculty Admin",
        department: department || "Administration",
        joiningDate: joiningDate || new Date(),
        contractType: "PERMANENT",
        salary: salary || {
          basic: 50000,
          hra: 20000,
          da: 7500,
          ta: 3000,
          pf: 6000,
          tax: 8000,
          netSalary: 50000 + 20000 + 7500 + 3000 - 6000 - 8000
        }
      }
    });

    res.status(201).json({
      _id: facultyAdmin._id,
      name: facultyAdmin.name,
      email: facultyAdmin.email,
      employeeId: facultyAdmin.employeeRecord.employeeId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update faculty admin
export const updateFacultyAdmin = async (req, res) => {
  try {
    const { name, email, phone, department, designation, salary } = req.body;

    const facultyAdmin = await User.findById(req.params.id);

    if (!facultyAdmin || facultyAdmin.role !== "FACULTY_ADMIN") {
      return res.status(404).json({ message: "Faculty admin not found" });
    }

    if (name) facultyAdmin.name = name;
    if (email) facultyAdmin.email = email;
    if (phone) facultyAdmin.phone = phone;
    
    if (facultyAdmin.employeeRecord) {
      if (department) facultyAdmin.employeeRecord.department = department;
      if (designation) facultyAdmin.employeeRecord.designation = designation;
      if (salary) {
        facultyAdmin.employeeRecord.salary = {
          ...facultyAdmin.employeeRecord.salary,
          ...salary
        };
      }
    }

    await facultyAdmin.save();

    res.json(facultyAdmin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete faculty admin
export const deleteFacultyAdmin = async (req, res) => {
  try {
    const facultyAdmin = await User.findById(req.params.id);

    if (!facultyAdmin || facultyAdmin.role !== "FACULTY_ADMIN") {
      return res.status(404).json({ message: "Faculty admin not found" });
    }

    // Delete related records
    await EmployeeDocument.deleteMany({ employeeId: facultyAdmin._id });
    await Payslip.deleteMany({ employeeId: facultyAdmin._id });
    
    await facultyAdmin.deleteOne();

    res.json({ message: "Faculty admin deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get faculty admin details
export const getFacultyAdminDetails = async (req, res) => {
  try {
    const facultyAdmin = await User.findById(req.params.id)
      .select("-password");

    if (!facultyAdmin || facultyAdmin.role !== "FACULTY_ADMIN") {
      return res.status(404).json({ message: "Faculty admin not found" });
    }

    // Get documents managed
    const documents = await EmployeeDocument.find({ 
      employeeId: facultyAdmin._id 
    }).sort({ createdAt: -1 });

    // Get payslips
    const payslips = await Payslip.find({ 
      employeeId: facultyAdmin._id 
    }).sort({ year: -1, month: -1 });

    // Get recent activity (documents uploaded)
    const recentActivity = await EmployeeDocument.find({
      uploadedBy: facultyAdmin._id
    })
    .populate("employeeId", "name")
    .limit(10)
    .sort({ createdAt: -1 });

    res.json({
      facultyAdmin,
      stats: {
        totalDocuments: documents.length,
        totalPayslips: payslips.length,
        recentActivity
      },
      documents,
      payslips
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== EMPLOYEE MANAGEMENT ==========

// Get all employees (teachers + faculty admins)
export const getAllEmployees = async (req, res) => {
  try {
    const employees = await User.find({ 
      role: { $in: ["TEACHER", "FACULTY_ADMIN"] } 
    })
    .select("_id name email role employeeRecord phone")
    .sort({ createdAt: -1 });

    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get employee attendance
export const getEmployeeAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;
    const queryDate = month && year ? 
      { 
        $expr: { 
          $and: [
            { $eq: [{ $month: "$date" }, parseInt(month)] },
            { $eq: [{ $year: "$date" }, parseInt(year)] }
          ]
        }
      } : {};

    const attendance = await Attendance.aggregate([
      { $match: queryDate },
      {
        $lookup: {
          from: "users",
          localField: "studentId",
          foreignField: "_id",
          as: "student"
        }
      },
      { $unwind: "$student" },
      {
        $group: {
          _id: "$studentId",
          name: { $first: "$student.name" },
          present: {
            $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] }
          },
          total: { $sum: 1 }
        }
      },
      {
        $project: {
          name: 1,
          attendanceRate: {
            $round: [{ $multiply: [{ $divide: ["$present", "$total"] }, 100] }, 2]
          },
          present: 1,
          total: 1
        }
      },
      { $sort: { attendanceRate: -1 } }
    ]);

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== PAYROLL MANAGEMENT ==========

// Generate payslip
export const generatePayslip = async (req, res) => {
  try {
    const { employeeId, month, year, earnings, deductions } = req.body;

    const employee = await User.findById(employeeId);
    if (!employee || !["TEACHER", "FACULTY_ADMIN"].includes(employee.role)) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check if payslip already exists for this month/year
    const existingPayslip = await Payslip.findOne({
      employeeId,
      month,
      year
    });

    if (existingPayslip) {
      return res.status(400).json({ message: "Payslip already exists for this month" });
    }

    const totalEarnings = Object.values(earnings).reduce((a, b) => a + (b || 0), 0);
    const totalDeductions = Object.values(deductions).reduce((a, b) => a + (b || 0), 0);
    const netSalary = totalEarnings - totalDeductions;

    const payslip = await Payslip.create({
      employeeId,
      month,
      year,
      earnings: {
        ...earnings,
        totalEarnings
      },
      deductions: {
        ...deductions,
        totalDeductions
      },
      netSalary,
      bankDetails: employee.employeeRecord?.salary?.bankAccount || {},
      generatedBy: req.user._id,
      paymentStatus: "PROCESSED"
    });

    res.status(201).json(payslip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get payslips
export const getPayslips = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year } = req.query;

    const query = employeeId ? { employeeId } : {};
    if (year) query.year = parseInt(year);

    const payslips = await Payslip.find(query)
      .populate("employeeId", "name email employeeRecord.employeeId")
      .sort({ year: -1, month: -1 });

    res.json(payslips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get payroll summary
export const getPayrollSummary = async (req, res) => {
  try {
    const { year, month } = req.query;

    const matchStage = {};
    if (year) matchStage.year = parseInt(year);
    if (month) matchStage.month = month;

    const summary = await Payslip.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: "$year",
            month: "$month"
          },
          totalPayroll: { $sum: "$netSalary" },
          avgSalary: { $avg: "$netSalary" },
          count: { $sum: 1 },
          salaries: { $push: "$netSalary" }
        }
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          totalPayroll: 1,
          avgSalary: { $round: ["$avgSalary", 2] },
          count: 1,
          minSalary: { $min: "$salaries" },
          maxSalary: { $max: "$salaries" }
        }
      },
      { $sort: { year: -1, month: -1 } }
    ]);

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== EMPLOYEE DOCUMENTS ==========

// Upload employee document
export const uploadEmployeeDocument = async (req, res) => {
  try {
    const { employeeId, documentType, title, description, issueDate } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const document = await EmployeeDocument.create({
      employeeId,
      documentType,
      title,
      description,
      fileUrl: `/uploads/${req.file.filename}`,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      issueDate: issueDate || new Date(),
      uploadedBy: req.user._id
    });

    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get employee documents
export const getEmployeeDocuments = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { documentType } = req.query;

    const query = { employeeId };
    if (documentType) query.documentType = documentType;

    const documents = await EmployeeDocument.find(query)
      .populate("uploadedBy", "name")
      .populate("verifiedBy", "name")
      .sort({ createdAt: -1 });

    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== TEACHER SALARY & LEAVE MANAGEMENT ==========

// Get teacher salary details
export const getTeacherSalary = async (req, res) => {
  try {
    const teacher = await User.findById(req.params.id)
      .select("employeeRecord.salary");

    if (!teacher || teacher.role !== "TEACHER") {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json(teacher.employeeRecord?.salary || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update teacher salary
export const updateTeacherSalary = async (req, res) => {
  try {
    const { basic, hra, da, ta, pf, tax } = req.body;

    const teacher = await User.findById(req.params.id);

    if (!teacher || teacher.role !== "TEACHER") {
      return res.status(404).json({ message: "Teacher not found" });
    }

    if (!teacher.employeeRecord) {
      teacher.employeeRecord = {};
    }

    const basicVal = basic || teacher.employeeRecord.salary?.basic || 0;
    const hraVal = hra || teacher.employeeRecord.salary?.hra || 0;
    const daVal = da || teacher.employeeRecord.salary?.da || 0;
    const taVal = ta || teacher.employeeRecord.salary?.ta || 0;
    const pfVal = pf || teacher.employeeRecord.salary?.pf || 0;
    const taxVal = tax || teacher.employeeRecord.salary?.tax || 0;

    teacher.employeeRecord.salary = {
      basic: basicVal,
      hra: hraVal,
      da: daVal,
      ta: taVal,
      pf: pfVal,
      tax: taxVal,
      netSalary: (basicVal + hraVal + daVal + taVal) - (pfVal + taxVal)
    };

    await teacher.save();

    res.json(teacher.employeeRecord.salary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get teacher leaves
export const getTeacherLeaves = async (req, res) => {
  try {
    const teacher = await User.findById(req.params.id)
      .select("employeeRecord.leaves");

    if (!teacher || teacher.role !== "TEACHER") {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json(teacher.employeeRecord?.leaves || {
      total: 0,
      taken: 0,
      remaining: 0,
      records: []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve leave
export const approveLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { status } = req.body; // APPROVED or REJECTED

    const teacher = await User.findById(req.params.id);

    if (!teacher || teacher.role !== "TEACHER") {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const leaveRecord = teacher.employeeRecord?.leaves?.records?.id(leaveId);
    
    if (!leaveRecord) {
      return res.status(404).json({ message: "Leave record not found" });
    }

    leaveRecord.status = status;
    leaveRecord.approvedBy = req.user._id;

    if (status === "APPROVED") {
      teacher.employeeRecord.leaves.taken += leaveRecord.days;
      teacher.employeeRecord.leaves.remaining -= leaveRecord.days;
    }

    await teacher.save();

    res.json({ message: `Leave ${status.toLowerCase()} successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== FACULTY ANALYTICS ==========

// Get faculty analytics
export const getFacultyAnalytics = async (req, res) => {
  try {
    const analytics = await User.aggregate([
      { $match: { role: "FACULTY_ADMIN" } },
      {
        $lookup: {
          from: "employeedocuments",
          localField: "_id",
          foreignField: "employeeId",
          as: "documents"
        }
      },
      {
        $lookup: {
          from: "payslips",
          localField: "_id",
          foreignField: "employeeId",
          as: "payslips"
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          department: "$employeeRecord.department",
          joiningDate: "$employeeRecord.joiningDate",
          documentCount: { $size: "$documents" },
          payslipCount: { $size: "$payslips" },
          totalSalary: { $sum: "$payslips.netSalary" }
        }
      },
      {
        $group: {
          _id: null,
          totalFaculty: { $sum: 1 },
          avgDocuments: { $avg: "$documentCount" },
          avgPayslips: { $avg: "$payslipCount" },
          totalPayroll: { $sum: "$totalSalary" },
          facultyDetails: { $push: "$$ROOT" }
        }
      }
    ]);

    res.json(analytics[0] || {
      totalFaculty: 0,
      avgDocuments: 0,
      avgPayslips: 0,
      totalPayroll: 0,
      facultyDetails: []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== UPDATED EXISTING FUNCTIONS ==========

// Updated createTeacher with salary and leaves structure
export const createTeacher = async (req, res) => {
  try {
    const { name, email, password, phone, department, designation, joiningDate } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = password;
    const employeeId = generateEmployeeId("TEACHER", Date.now());
    const uniqueId = generateEmployeeUniqueId("TEACHER", name);

    const teacher = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "TEACHER",
      phone,
      uniqueId,
      employeeRecord: {
        employeeId,
        designation: designation || "Assistant Professor",
        department: department || "General",
        joiningDate: joiningDate || new Date(),
        contractType: "PERMANENT",
        salary: {
          basic: 40000,
          hra: 16000,
          da: 6000,
          ta: 2000,
          pf: 4800,
          tax: 6400,
          netSalary: 40000 + 16000 + 6000 + 2000 - 4800 - 6400
        },
        leaves: {
          total: 30,
          taken: 0,
          remaining: 30,
          records: []
        }
      }
    });

    res.status(201).json({
      _id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      employeeId: teacher.employeeRecord.employeeId,
      uniqueId: teacher.uniqueId
    });
  } catch (error) {
    console.error("Error in createTeacher:", error);
    res.status(500).json({ message: error.message });
  }
};


// Updated deleteTeacher with document cleanup
export const deleteTeacher = async (req, res) => {
  try {
    const teacher = await User.findById(req.params.id);

    if (!teacher || teacher.role !== "TEACHER") {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Remove from classrooms
    await Classroom.updateMany(
      { teacher: teacher._id },
      { $set: { teacher: null, status: "INACTIVE" } }
    );

    // Delete related records
    await EmployeeDocument.deleteMany({ employeeId: teacher._id });
    await Payslip.deleteMany({ employeeId: teacher._id });

    await teacher.deleteOne();

    res.json({ message: "Teacher deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Updated getTeacherDetails with documents and payslips
export const getTeacherDetails = async (req, res) => {
  try {
    const teacher = await User.findById(req.params.id)
      .select("-password");

    if (!teacher || teacher.role !== "TEACHER") {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const classrooms = await Classroom.find({ teacher: teacher._id })
      .select("name status students")
      .lean();

    const assignments = await Assignment.find({ createdBy: teacher._id })
      .select("title deadline totalMarks isPublished")
      .sort({ createdAt: -1 });

    const documents = await EmployeeDocument.find({ employeeId: teacher._id });
    const payslips = await Payslip.find({ employeeId: teacher._id });

    // Get attendance records for the teacher
    const attendanceRecords = await TeacherAttendanceModel.find({ 
      employeeId: teacher._id 
    })
    .sort({ date: -1 })
    .limit(30); // Last 30 days

    // Calculate attendance statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const attendanceStats = {
      totalDays: attendanceRecords.length,
      present: attendanceRecords.filter(r => r.status === "PRESENT").length,
      absent: attendanceRecords.filter(r => r.status === "ABSENT").length,
      late: attendanceRecords.filter(r => r.status === "LATE").length,
      halfDay: attendanceRecords.filter(r => r.status === "HALF_DAY").length,
      onLeave: attendanceRecords.filter(r => r.status === "ON_LEAVE").length,
      holiday: attendanceRecords.filter(r => r.status === "HOLIDAY").length,
      
      // Monthly stats
      monthly: {
        present: attendanceRecords.filter(r => 
          r.status === "PRESENT" && new Date(r.date) >= startOfMonth
        ).length,
        absent: attendanceRecords.filter(r => 
          r.status === "ABSENT" && new Date(r.date) >= startOfMonth
        ).length,
        late: attendanceRecords.filter(r => 
          r.status === "LATE" && new Date(r.date) >= startOfMonth
        ).length,
      },
      
      // Yearly stats
      yearly: {
        present: attendanceRecords.filter(r => 
          r.status === "PRESENT" && new Date(r.date) >= startOfYear
        ).length,
        absent: attendanceRecords.filter(r => 
          r.status === "ABSENT" && new Date(r.date) >= startOfYear
        ).length,
      },
      
      // Today's status
      today: attendanceRecords.find(r => 
        new Date(r.date).toDateString() === today.toDateString()
      ) || null,
      
      // Average work hours
      avgWorkHours: attendanceRecords.length > 0
        ? (attendanceRecords.reduce((acc, r) => acc + (r.totalWorkHours || 0), 0) / attendanceRecords.length).toFixed(1)
        : "0",
      
      attendanceRate: attendanceRecords.length > 0
        ? ((attendanceRecords.filter(r => 
            r.status === "PRESENT" || r.status === "LATE"
          ).length / attendanceRecords.length) * 100).toFixed(1)
        : "0",
    };

    // Get current month's attendance trend
    const monthDays = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const record = attendanceRecords.find(r => 
        new Date(r.date).toDateString() === date.toDateString()
      );
      
      monthDays.push({
        date: date.toISOString().split('T')[0],
        dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
        status: record?.status || "NO_RECORD",
        workHours: record?.totalWorkHours || 0,
        checkInTime: record?.actualCheckIn?.startTime,
        checkOutTime: record?.actualCheckOut?.startTime,
      });
    }

    res.json({
      teacher,
      stats: {
        totalClassrooms: classrooms.length,
        totalStudents: classrooms.reduce((acc, c) => acc + (c.students?.length || 0), 0),
        totalAssignments: assignments.length,
        totalDocuments: documents.length,
        totalPayslips: payslips.length,
        attendance: attendanceStats,
      },
      classrooms,
      assignments,
      documents,
      payslips,
      attendance: {
        records: attendanceRecords,
        monthTrend: monthDays,
        summary: attendanceStats,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Updated createStudent with uniqueId
export const createStudent = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      phone, 
      department,
      batch,
      currentSemester,
      cgpa,
      backlogs,
      address,
      aadharNumber,
      panNumber,
      dateOfBirth,
      gender,
      bloodGroup,
      education,
      skills,
      enrolledCourses,
      jobPreferences,
      socialLinks
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = password;
    const uniqueId = generateStudentUniqueId(department);
    const enrollmentNumber = generateEnrollmentNumber(department);

    const student = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "STUDENT",
      phone,
      uniqueId,
      enrollmentNumber,
      department,
      batch: batch || `${new Date().getFullYear()}-${new Date().getFullYear() + 3}`,
      currentSemester: currentSemester || "1",
      cgpa: cgpa || 0,
      backlogs: backlogs || 0,
      address,
      aadharNumber,
      panNumber,
      dateOfBirth,
      gender: gender || "Prefer not to say",
      bloodGroup: bloodGroup || "O+",
      education: education || [],
      skills: skills || [],
      enrolledCourses: enrolledCourses || [],
      jobPreferences: jobPreferences || {
        preferredRoles: [],
        preferredLocations: [],
        expectedSalary: "",
        jobType: [],
        immediateJoiner: false,
        noticePeriod: "30 days"
      },
      socialLinks: socialLinks || {
        linkedin: "",
        github: "",
        portfolio: "",
        twitter: ""
      },
      isProfileComplete: true,
      isPlacementEligible: false,
      placementStatus: "Not Applied",
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        uniqueId: student.uniqueId,
        enrollmentNumber: student.enrollmentNumber
      }
    });
  } catch (error) {
    console.error("Error in createStudent:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Updated deleteStudent with certificate cleanup
export const deleteStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);

    if (!student || student.role !== "STUDENT") {
      return res.status(404).json({ message: "Student not found" });
    }

    // Remove from classrooms
    await Classroom.updateMany(
      { students: student._id },
      { $pull: { students: student._id } }
    );

    // Delete submissions
    await Submission.deleteMany({ studentId: student._id });

    // Delete attendance
    await Attendance.deleteMany({ studentId: student._id });

    // Delete certificates
    await StudentCertificate.deleteMany({ studentId: student._id });

    await student.deleteOne();

    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// controllers/admin.controller.js
// controllers/admin.controller.js - Add this function
export const getSalaryStructure = async (req, res) => {
  try {
    const employees = await User.find({
      role: { $in: ["TEACHER", "FACULTY_ADMIN"] },
      employeeRecord: { $exists: true }
    }).select(
      "name email role employeeRecord.employeeId employeeRecord.department employeeRecord.designation employeeRecord.salary employeeRecord.joiningDate"
    );

    // Calculate summary statistics
    const summary = {
      totalEmployees: employees.length,
      totalMonthlyPayroll: employees.reduce((sum, emp) => sum + (emp.employeeRecord?.salary?.netSalary || 0), 0),
      averageSalary: employees.length > 0 
        ? (employees.reduce((sum, emp) => sum + (emp.employeeRecord?.salary?.netSalary || 0), 0) / employees.length).toFixed(2)
        : 0,
      byDepartment: {},
      salaryRanges: {
        below30000: 0,
        between30000to50000: 0,
        between50000to70000: 0,
        above70000: 0
      }
    };

    // Categorize by salary range and department
    employees.forEach(emp => {
      const salary = emp.employeeRecord?.salary?.netSalary || 0;
      const dept = emp.employeeRecord?.department || "Other";

      // Salary ranges
      if (salary < 30000) summary.salaryRanges.below30000++;
      else if (salary < 50000) summary.salaryRanges.between30000to50000++;
      else if (salary < 70000) summary.salaryRanges.between50000to70000++;
      else summary.salaryRanges.above70000++;

      // Department wise
      if (!summary.byDepartment[dept]) {
        summary.byDepartment[dept] = {
          count: 0,
          totalSalary: 0,
          average: 0
        };
      }
      summary.byDepartment[dept].count++;
      summary.byDepartment[dept].totalSalary += salary;
    });

    // Calculate department averages
    Object.keys(summary.byDepartment).forEach(dept => {
      summary.byDepartment[dept].average = 
        (summary.byDepartment[dept].totalSalary / summary.byDepartment[dept].count).toFixed(2);
    });

    res.json({
      employees,
      summary
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};