// controllers/course.controller.js
import Course from "../models/Course.model.js";
import CourseCategory from "../models/CourseCategory.model.js";
import CourseEnrollment from "../models/CourseEnrollment.model.js";
import User from "../models/User.model.js";

// ==================== COURSE CRUD ====================

// Create a new course
export const createCourse = async (req, res) => {
  try {
    const courseData = req.body;
    
    // Set createdBy
    courseData.createdBy = req.user._id;
    
    // Validate instructors exist
    if (courseData.instructors && courseData.instructors.length > 0) {
      const instructors = await User.find({
        _id: { $in: courseData.instructors },
        role: { $in: ["TEACHER", "FACULTY_ADMIN"] }
      });
      
      if (instructors.length !== courseData.instructors.length) {
        return res.status(400).json({ 
          message: "One or more instructors not found or invalid role" 
        });
      }
    }
    
    const course = await Course.create(courseData);
    
    // Update category total courses
    if (course.category) {
      const category = await CourseCategory.findOne({ name: course.category });
      if (category) {
        category.totalCourses += 1;
        await category.save();
      }
    }
    
    res.status(201).json({
      message: "Course created successfully",
      course
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all courses with filters
export const getCourses = async (req, res) => {
  try {
    const { 
      department, 
      level, 
      status, 
      instructor, 
      search,
      page = 1, 
      limit = 10 
    } = req.query;

    const query = {};

    // Apply filters
    if (department) query.department = department;
    if (level) query.level = level;
    if (status) query.status = status;
    if (instructor) query.instructors = instructor;
    
    // Search by title, code, or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { shortCode: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate("instructors", "name email avatar")
        .populate("headInstructor", "name email")
        .populate("createdBy", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Course.countDocuments(query)
    ]);

    res.json({
      courses,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single course by ID
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("instructors", "name email avatar employeeRecord.department")
      .populate("headInstructor", "name email")
      .populate("createdBy", "name")
      .populate("updatedBy", "name");

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Get enrollment statistics
    const enrollments = await CourseEnrollment.find({ 
      courseId: course._id 
    }).populate("studentId", "name email avatar");

    const stats = {
      totalEnrollments: enrollments.length,
      activeEnrollments: enrollments.filter(e => 
        ["enrolled", "in_progress"].includes(e.status)
      ).length,
      completedEnrollments: enrollments.filter(e => 
        e.status === "completed"
      ).length,
      droppedEnrollments: enrollments.filter(e => 
        e.status === "dropped"
      ).length,
      recentEnrollments: enrollments.slice(0, 5)
    };

    res.json({
      course,
      stats,
      enrollments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update course
export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Track category change for count update
    const oldCategory = course.category;
    const newCategory = req.body.category;

    // Update course
    Object.assign(course, req.body);
    course.updatedBy = req.user._id;
    
    await course.save();

    // Update category counts if category changed
    if (oldCategory !== newCategory) {
      if (oldCategory) {
        const oldCat = await CourseCategory.findOne({ name: oldCategory });
        if (oldCat) {
          oldCat.totalCourses -= 1;
          await oldCat.save();
        }
      }
      
      if (newCategory) {
        const newCat = await CourseCategory.findOne({ name: newCategory });
        if (newCat) {
          newCat.totalCourses += 1;
          await newCat.save();
        }
      }
    }

    res.json({
      message: "Course updated successfully",
      course
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete course
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if there are active enrollments
    const activeEnrollments = await CourseEnrollment.countDocuments({
      courseId: course._id,
      status: { $in: ["enrolled", "in_progress"] }
    });

    if (activeEnrollments > 0) {
      return res.status(400).json({ 
        message: "Cannot delete course with active enrollments" 
      });
    }

    // Update category count
    if (course.category) {
      const category = await CourseCategory.findOne({ name: course.category });
      if (category) {
        category.totalCourses -= 1;
        await category.save();
      }
    }

    await course.deleteOne();

    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== COURSE ENROLLMENT ====================

// Enroll students in course
export const enrollStudents = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { studentIds } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const enrollments = [];
    const errors = [];

    for (const studentId of studentIds) {
      try {
        // Check if already enrolled
        const existing = await CourseEnrollment.findOne({
          courseId,
          studentId
        });

        if (existing) {
          errors.push({ studentId, message: "Already enrolled" });
          continue;
        }

        const enrollment = await CourseEnrollment.create({
          courseId,
          studentId,
          enrollmentDate: new Date(),
          status: "enrolled",
          enrolledBy: req.user._id
        });

        // Update student's enrolledCourses
        await User.findByIdAndUpdate(studentId, {
          $push: {
            enrolledCourses: {
              courseId: course._id,
              courseCode: course.code,
              courseName: course.title,
              enrollmentDate: new Date(),
              status: "enrolled"
            }
          }
        });

        enrollments.push(enrollment);

        // Update course stats
        course.enrollmentStats.totalEnrolled += 1;
        course.enrollmentStats.currentEnrolled += 1;
      } catch (error) {
        errors.push({ studentId, message: error.message });
      }
    }

    await course.save();

    res.json({
      message: `Enrolled ${enrollments.length} students`,
      enrollments,
      errors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update enrollment status
export const updateEnrollmentStatus = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { status, grade, percentage } = req.body;

    const enrollment = await CourseEnrollment.findById(enrollmentId)
      .populate("courseId")
      .populate("studentId");

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    const oldStatus = enrollment.status;
    enrollment.status = status;
    
    if (grade) enrollment.finalGrade = grade;
    if (percentage) enrollment.finalPercentage = percentage;
    
    if (status === "completed") {
      enrollment.completionDate = new Date();
      
      // Update student's enrolledCourses
      await User.updateOne(
        { 
          _id: enrollment.studentId._id,
          "enrolledCourses.courseId": enrollment.courseId._id 
        },
        {
          $set: {
            "enrolledCourses.$.status": "completed",
            "enrolledCourses.$.grade": grade,
            "enrolledCourses.$.percentage": percentage,
            "enrolledCourses.$.completionDate": new Date()
          }
        }
      );

      // Update course stats
      enrollment.courseId.enrollmentStats.completedCount += 1;
      if (oldStatus !== "completed") {
        enrollment.courseId.enrollmentStats.currentEnrolled -= 1;
      }
      await enrollment.courseId.save();
    }

    await enrollment.save();

    res.json({
      message: "Enrollment updated successfully",
      enrollment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get course enrollments
export const getCourseEnrollments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { status } = req.query;

    const query = { courseId };
    if (status) query.status = status;

    const enrollments = await CourseEnrollment.find(query)
      .populate("studentId", "name email avatar enrollmentNumber batch")
      .populate("enrolledBy", "name")
      .sort({ createdAt: -1 });

    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== COURSE CATEGORIES ====================

// Get all categories
export const getCategories = async (req, res) => {
  try {
    const categories = await CourseCategory.find()
      .populate("parentCategory", "name")
      .populate("popularCourses", "title code")
      .sort({ order: 1 });

    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create category
export const createCategory = async (req, res) => {
  try {
    const categoryData = req.body;
    categoryData.createdBy = req.user._id;

    const category = await CourseCategory.create(categoryData);
    
    res.status(201).json({
      message: "Category created successfully",
      category
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    const category = await CourseCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({
      message: "Category updated successfully",
      category
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    const category = await CourseCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if category has courses
    if (category.totalCourses > 0) {
      return res.status(400).json({ 
        message: "Cannot delete category with existing courses" 
      });
    }

    await category.deleteOne();

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== DASHBOARD STATS ====================

// Get course dashboard stats
export const getCourseStats = async (req, res) => {
  try {
    const [
      totalCourses,
      publishedCourses,
      draftCourses,
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      popularCourses,
      departmentStats
    ] = await Promise.all([
      Course.countDocuments(),
      Course.countDocuments({ status: "published" }),
      Course.countDocuments({ status: "draft" }),
      CourseEnrollment.countDocuments(),
      CourseEnrollment.countDocuments({ 
        status: { $in: ["enrolled", "in_progress"] } 
      }),
      CourseEnrollment.countDocuments({ status: "completed" }),
      Course.find({ status: "published" })
        .sort({ "enrollmentStats.totalEnrolled": -1 })
        .limit(5)
        .select("title code enrollmentStats"),
      Course.aggregate([
        {
          $group: {
            _id: "$department",
            count: { $sum: 1 },
            totalEnrollments: { $sum: "$enrollmentStats.totalEnrolled" }
          }
        },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      overview: {
        totalCourses,
        publishedCourses,
        draftCourses,
        totalEnrollments,
        activeEnrollments,
        completedEnrollments
      },
      popularCourses,
      departmentStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};