import User from "../models/User.model.js"
import Submission from "../models/Submission.model.js"
import Course from "../models/Course.model.js"

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