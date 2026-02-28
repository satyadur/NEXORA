// import User from "../models/User.model.js"
// import Submission from "../models/Submission.model.js"
// import Course from "../models/Course.model.js"

import User from "../models/User.model.js";
import Submission from "../models/Submission.model.js";
import Assignment from "../models/Assignment.model.js";
import Course from "../models/Course.model.js";
import CourseEnrollment from "../models/CourseEnrollment.model.js";
import { QRCode } from "../models/User.model.js";

/* ================= PUBLIC FACULTY ================= */
export const getPublicFaculty = async (req, res) => {
  try {
    const teachers = await User.find({ role: "TEACHER" })
      .select("_id name avatar designation department")
      .limit(6)

    res.json(teachers)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/* ================= TOP STUDENTS ================= */
export const getTopStudents = async (req, res) => {
  try {
    const result = await Submission.aggregate([
      {
        $group: {
          _id: "$studentId",
          averageScore: { $avg: "$totalScore" },
          highestScore: { $max: "$totalScore" },
          totalSubmissions: { $sum: 1 }
        }
      },
      { $sort: { averageScore: -1 } },
      { $limit: 10 },
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
          _id: "$student._id",
          name: "$student.name",
          avatar: "$student.avatar",
          averageScore: { $round: ["$averageScore", 2] },
          highestScore: 1,
          totalSubmissions: 1
        }
      }
    ])

    res.json(result)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/* ================= GET ALL COURSES ================= */
export const getAllCourses = async (req, res) => {
  try {
    const { 
      department, 
      level, 
      status = "published",
      limit = 20,
      page = 1 
    } = req.query;

    const query = { status };
    
    if (department) query.department = department;
    if (level) query.level = level;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const courses = await Course.find(query)
      .select("title code shortCode description department level credits duration thumbnail instructors enrollmentStats fee price tags")
      .populate("instructors", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Course.countDocuments(query);

    // Add enrollment status to each course
    const coursesWithStats = courses.map(course => ({
      ...course.toObject(),
      enrollmentStatus: course.enrollmentStatus,
      durationFormatted: course.durationFormatted,
      formattedCode: course.formattedCode,
    }));

    res.json({
      success: true,
      courses: coursesWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error in getAllCourses:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/* ================= GET COURSE BY ID/SLUG ================= */
export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await Course.findOne({
      $or: [
        { _id: id },
        { code: id },
        { shortCode: id }
      ],
      status: "published"
    })
      .populate("instructors", "name avatar designation")
      .populate("headInstructor", "name avatar designation")
      .populate("prerequisites.requiredCourses", "title code");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    // Get average rating
    const avgRating = course.calculateAverageRating();

    res.json({
      success: true,
      course: {
        ...course.toObject(),
        averageRating: avgRating,
        enrollmentStatus: course.enrollmentStatus,
        durationFormatted: course.durationFormatted,
        formattedCode: course.formattedCode,
      }
    });
  } catch (error) {
    console.error("Error in getCourseById:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/* ================= GET COURSES BY DEPARTMENT ================= */
export const getCoursesByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    const { level } = req.query;

    const courses = await Course.findByDepartment(department, level)
      .select("title code shortCode description level credits duration thumbnail instructors")
      .populate("instructors", "name avatar")
      .limit(20);

    res.json({
      success: true,
      department,
      count: courses.length,
      courses
    });
  } catch (error) {
    console.error("Error in getCoursesByDepartment:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/* ================= GET POPULAR COURSES ================= */
export const getPopularCourses = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const courses = await Course.getPopularCourses(parseInt(limit))
      .select("title code shortCode description level credits duration thumbnail instructors enrollmentStats price")
      .populate("instructors", "name avatar");

    res.json({
      success: true,
      courses
    });
  } catch (error) {
    console.error("Error in getPopularCourses:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/* ================= GET COURSE PACKAGES ================= */
export const getCoursePackages = async (req, res) => {
  try {
    // Define available packages
    const packages = [
      {
        id: "basic",
        name: "Basic",
        price: 0,
        duration: "Lifetime",
        features: [
          "Access to free courses",
          "Basic community support",
          "Course materials access",
          "Discussion forums"
        ],
        limits: {
          courses: "Unlimited free courses",
          certificates: false,
          mentoring: false
        }
      },
      {
        id: "standard",
        name: "Standard",
        price: 4999,
        duration: "1 Year",
        features: [
          "All Basic features",
          "Access to premium courses",
          "Priority support",
          "Course certificates",
          "Practice tests",
          "Project reviews"
        ],
        limits: {
          courses: "All courses",
          certificates: true,
          mentoring: false
        },
        popular: true
      },
      {
        id: "premium",
        name: "Premium",
        price: 9999,
        duration: "1 Year",
        features: [
          "All Standard features",
          "1-on-1 mentoring sessions",
          "Career guidance",
          "Interview preparation",
          "Resume review",
          "Job placement assistance",
          "Networking events"
        ],
        limits: {
          courses: "All courses + Exclusive content",
          certificates: true,
          mentoring: "12 sessions/year"
        }
      }
    ];

    res.json({
      success: true,
      packages
    });
  } catch (error) {
    console.error("Error in getCoursePackages:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/* ================= SEARCH COURSES ================= */
export const searchCourses = async (req, res) => {
  try {
    const { q, department, level, minPrice, maxPrice } = req.query;

    const query = { status: "published" };

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { code: { $regex: q, $options: "i" } },
        { tags: { $in: [new RegExp(q, "i")] } }
      ];
    }

    if (department) query.department = department;
    if (level) query.level = level;
    
    // Price range filter
    if (minPrice || maxPrice) {
      query["fee.amount"] = {};
      if (minPrice) query["fee.amount"].$gte = parseInt(minPrice);
      if (maxPrice) query["fee.amount"].$lte = parseInt(maxPrice);
    }

    const courses = await Course.find(query)
      .select("title code shortCode description department level credits duration thumbnail instructors fee price tags")
      .populate("instructors", "name avatar")
      .limit(30);

    res.json({
      success: true,
      count: courses.length,
      courses
    });
  } catch (error) {
    console.error("Error in searchCourses:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const getCertificateVerification = async (req, res) => {
  try {
    const { uniqueId } = req.params;

    if (!uniqueId) {
      return res.status(400).json({
        success: false,
        message: "Invalid certificate ID",
      });
    }

    /* -----------------------------
       Find Student (Public Fields Only)
    ------------------------------ */

    const student = await User.findOne({
      $or: [{ uniqueId }, { enrollmentNumber: uniqueId }],
      role: "STUDENT",
    })
      .select(
        "name uniqueId enrollmentNumber avatar batch currentSemester cgpa backlogs " +
          "education skills certificates placementStatus isPlacementEligible enrolledCourses"
      )
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    /* -----------------------------
       Track QR Scan Access
    ------------------------------ */

    await QRCode.findOneAndUpdate(
      { uniqueId },
      {
        $inc: { accessCount: 1 },
        lastAccessed: new Date(),
        $push: {
          accessLogs: {
            timestamp: new Date(),
            ip: req.ip,
            userAgent: req.get("user-agent"),
            referrer: req.get("referer"),
          },
        },
      },
      { upsert: true }
    );

    /* -----------------------------
       Fetch Submissions
    ------------------------------ */

    const submissions = await Submission.find({
      studentId: student._id,
    })
      .populate({
        path: "assignmentId",
        select: "title totalMarks classroomId",
        populate: {
          path: "classroomId",
          select: "name",
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    /* -----------------------------
       Fetch Course Enrollments
    ------------------------------ */

    const enrollments = await CourseEnrollment.find({
      studentId: student._id,
    })
      .populate({
        path: "courseId",
        select: "title code credits level department thumbnail",
      })
      .sort({ enrollmentDate: -1 })
      .lean();

    /* -----------------------------
       Format Submissions
    ------------------------------ */

    const formattedSubmissions = submissions.map((sub) => {
      const totalMarks = sub.assignmentId?.totalMarks || 0;
      const obtained = sub.totalScore || 0;

      const percentage =
        totalMarks > 0 ? ((obtained / totalMarks) * 100).toFixed(2) : 0;

      return {
        _id: sub._id,
        assignmentId: sub.assignmentId?._id,
        assignmentTitle: sub.assignmentId?.title || "Unknown Assignment",
        classroomName: sub.assignmentId?.classroomId?.name || "Unknown Class",
        totalMarks,
        obtainedMarks: obtained,
        percentage: Number(percentage),
        status: sub.status,
        submittedAt: sub.createdAt,
        feedback: sub.feedback,
      };
    });

    /* -----------------------------
       Assignment Statistics
    ------------------------------ */

    const assignmentStats = {
      totalAssignments: formattedSubmissions.length,
      submittedCount: formattedSubmissions.filter(
        (s) => s.status === "SUBMITTED"
      ).length,

      evaluatedCount: formattedSubmissions.filter(
        (s) => s.status === "EVALUATED"
      ).length,

      averageScore:
        formattedSubmissions.length > 0
          ? (
              formattedSubmissions.reduce(
                (sum, s) => sum + Number(s.percentage || 0),
                0
              ) / formattedSubmissions.length
            ).toFixed(2)
          : 0,

      totalObtainedMarks: formattedSubmissions.reduce(
        (sum, s) => sum + (s.obtainedMarks || 0),
        0
      ),

      totalPossibleMarks: formattedSubmissions.reduce(
        (sum, s) => sum + (s.totalMarks || 0),
        0
      ),
    };

    /* -----------------------------
       Format Course Enrollments
    ------------------------------ */

    const formattedEnrollments = enrollments.map((en) => ({
      _id: en._id,
      courseId: en.courseId?._id,
      courseTitle: en.courseId?.title,
      courseCode: en.courseId?.code,
      credits: en.courseId?.credits,
      level: en.courseId?.level,
      department: en.courseId?.department,
      thumbnail: en.courseId?.thumbnail,
      enrollmentDate: en.enrollmentDate,
      status: en.status,
      progress: en.progress?.overallProgress || 0,
      grade: en.finalGrade,
      percentage: en.finalPercentage,
      completionDate: en.completionDate,
      certificateIssued: en.certificateIssued,
      certificateUrl: en.certificateUrl,
    }));

    /* -----------------------------
       Course Statistics
    ------------------------------ */

    const courseStats = {
      totalEnrolled: formattedEnrollments.length,
      completed: formattedEnrollments.filter((c) => c.status === "completed")
        .length,
      inProgress: formattedEnrollments.filter((c) => c.status === "in_progress")
        .length,
      dropped: formattedEnrollments.filter((c) => c.status === "dropped")
        .length,
    };

    /* -----------------------------
       Public Certificates
    ------------------------------ */

    const formattedCertificates = (student.certificates || [])
      .filter((cert) => cert.isPublic)
      .map((cert) => ({
        _id: cert._id,
        type: cert.type,
        title: cert.title,
        description: cert.description,
        issueDate: cert.issueDate,
        expiryDate: cert.expiryDate,
        url: cert.url,
        qrCode: cert.qrCode,
        metadata: cert.metadata,
      }));

    /* -----------------------------
       Assignment Certificates
    ------------------------------ */

    const assignmentCertificates = formattedSubmissions
      .filter((sub) => sub.percentage >= 70)
      .map((sub) => ({
        _id: `sub_${sub._id}`,
        type: "ASSIGNMENT",
        title: `Achievement: ${sub.assignmentTitle}`,
        description: `Scored ${sub.obtainedMarks}/${sub.totalMarks} (${sub.percentage}%)`,
        issueDate: sub.submittedAt,
        metadata: {
          assignmentId: sub.assignmentId,
          score: sub.obtainedMarks,
          maxScore: sub.totalMarks,
          percentage: sub.percentage,
        },
      }));

    /* -----------------------------
       Course Completion Certificates
    ------------------------------ */

    const courseCompletionCertificates = formattedEnrollments
      .filter((en) => en.status === "completed" && en.certificateIssued)
      .map((en) => ({
        _id: `course_${en._id}`,
        type: "COURSE_COMPLETION",
        title: `Course Completion: ${en.courseTitle}`,
        description: `Completed ${en.courseTitle} with ${
          en.grade || "Pass"
        }`,
        issueDate: en.completionDate,
        url: en.certificateUrl,
        metadata: {
          courseId: en.courseId,
          grade: en.grade,
          percentage: en.percentage,
          credits: en.credits,
        },
      }));

    /* -----------------------------
       Combine Certificates
    ------------------------------ */

    const allCertificates = [
      ...formattedCertificates,
      ...assignmentCertificates,
      ...courseCompletionCertificates,
    ].sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));

    /* -----------------------------
       Final Response
    ------------------------------ */

    res.json({
      success: true,

      student: {
        _id: student._id,
        name: student.name,
        uniqueId: student.uniqueId,
        enrollmentNumber: student.enrollmentNumber,
        avatar: student.avatar,
        batch: student.batch,
        currentSemester: student.currentSemester,
        cgpa: student.cgpa,
        backlogs: student.backlogs || 0,
        placementStatus: student.placementStatus,
        isPlacementEligible: student.isPlacementEligible,

        education: student.education,
        skills: student.skills,

        stats: {
          cgpa: student.cgpa,
          backlogs: student.backlogs || 0,
          totalCertificates: allCertificates.length,
          ...assignmentStats,
          ...courseStats,
        },
      },

      assignments: formattedSubmissions,

      courses: {
        detailed: formattedEnrollments,
      },

      certificates: allCertificates,

      verification: {
        verifiedAt: new Date().toISOString(),
        method: "QR_CODE",
        uniqueId,
        issuedBy: "NX Institute",
        isAuthentic: true,
      },
    });
  } catch (error) {
    console.error("Certificate verification error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

/**
 * Quick verification - returns minimal info
 * @route GET /api/public/verify/:uniqueId/quick
 */
export const quickVerifyCertificate = async (req, res) => {
  try {
    const { uniqueId } = req.params;

    const student = await User.findOne({
      $or: [
        { uniqueId: uniqueId },
        { enrollmentNumber: uniqueId }
      ],
      role: "STUDENT"
    }).select("name uniqueId enrollmentNumber batch avatar");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Get certificate count
    const certificateCount = (student.certificates?.filter(c => c.isPublic)?.length || 0) +
      (await CourseEnrollment.countDocuments({ 
        studentId: student._id, 
        status: "completed",
        certificateIssued: true 
      }));

    res.json({
      success: true,
      student: {
        name: student.name,
        uniqueId: student.uniqueId,
        enrollmentNumber: student.enrollmentNumber,
        batch: student.batch,
        avatar: student.avatar
      },
      stats: {
        certificatesIssued: certificateCount
      },
      verificationUrl: `${process.env.FRONTEND_URL}/verify/${student.uniqueId}`
    });

  } catch (error) {
    console.error("Quick verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};