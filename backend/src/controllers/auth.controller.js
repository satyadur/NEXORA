import User from "../models/User.model.js";
import { generateToken } from "../utils/jwt.js";
import cloudinary from "../utils/cloudinary.js";

/* ================= PROFILE COMPLETENESS ================= */
function checkProfileCompleteness(user) {
  if (user.role === "STUDENT") {
    return !!(
      user.name &&
      user.email &&
      user.phone &&
      user.education?.length > 0 &&
      user.skills?.length > 0
    );
  }

  if (user.role === "TEACHER") {
    return !!(
      user.name &&
      user.email &&
      user.phone &&
      user.department &&
      user.designation &&
      user.education?.length > 0
    );
  }

  return true;
}

/* ================= REGISTER ================= */
/* ================= REGISTER ================= */
export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      dateOfBirth,
      gender,
      enrollmentNumber,
      batch,
      currentSemester,
      cgpa,
      education,
      experience,
      skills,
      enrolledCourses, // NEW: Add this
      jobPreferences,
      socialLinks,
      address,
      selectedPackage, // Add package selection
    } = req.body;

    // Check existing email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const safeRole = role === "TEACHER" ? "TEACHER" : "STUDENT";
    
    // For now, only students can register through this flow
    if (safeRole !== "STUDENT") {
      return res.status(400).json({ message: "Only student registration is allowed" });
    }

    let avatarUrl = "";
    let resumeUrl = "";

    /* ===== Avatar Upload ===== */
    if (req.files?.avatar?.[0]) {
      const avatarFile = req.files.avatar[0];
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: "lms-users/avatars" },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          )
          .end(avatarFile.buffer);
      });
      avatarUrl = result.secure_url;
    }

    /* ===== Resume Upload ===== */
    if (req.files?.resume?.[0]) {
      const resumeFile = req.files.resume[0];
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "lms-users/resumes",
              resource_type: "raw",
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          )
          .end(resumeFile.buffer);
      });
      resumeUrl = result.secure_url;
    }

    // ============= PARSE JSON STRINGS TO OBJECTS =============
    let parsedSkills = [];
    let parsedJobPreferences = {};
    let parsedSocialLinks = {};
    let parsedAddress = {};
    let parsedEducation = [];
    let parsedExperience = [];
    let parsedEnrolledCourses = []; // NEW

    try {
      if (skills) parsedSkills = JSON.parse(skills);
      if (jobPreferences) parsedJobPreferences = JSON.parse(jobPreferences);
      if (socialLinks) parsedSocialLinks = JSON.parse(socialLinks);
      if (address) parsedAddress = JSON.parse(address);
      if (education) parsedEducation = JSON.parse(education);
      if (experience) parsedExperience = JSON.parse(experience);
      if (enrolledCourses) parsedEnrolledCourses = JSON.parse(enrolledCourses); // NEW
    } catch (e) {
      console.log("⚠️ JSON parse error:", e.message);
    }

    // ============= BUILD USER DATA =============
    const userData = {
      name,
      email,
      password,
      role: safeRole,
      avatar: avatarUrl,
      resume: resumeUrl,
      phone,
      dateOfBirth,
      gender,
      address: parsedAddress,
      socialLinks: parsedSocialLinks,
      jobPreferences: parsedJobPreferences,
      skills: parsedSkills,
      education: parsedEducation,
      experience: parsedExperience,
      enrolledCourses: parsedEnrolledCourses, // NEW: Add enrolled courses
      
      // Student specific fields
      enrollmentNumber,
      batch,
      currentSemester: currentSemester ? parseInt(currentSemester) : undefined,
      cgpa: cgpa ? parseFloat(cgpa) : undefined,
      
      // Package selection (you might want to store this in a separate collection)
      selectedPackage,
    };

    console.log("📦 Creating user with data:", userData);

    const user = await User.create(userData);

    const isProfileComplete = checkProfileCompleteness(user);
    user.isProfileComplete = isProfileComplete;
    await user.save();

    console.log("✅ User created successfully:", user._id);

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      resume: user.resume,
      isProfileComplete,
      enrolledCourses: user.enrolledCourses, // Return enrolled courses
    });

  } catch (error) {
    console.error("❌ Register error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ================= LOGIN ================= */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
console.log('====================================');
console.log(email,password);
console.log('====================================');
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken({
      id: user._id,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= ME ================= */
export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    res.json(user);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= UPDATE PROFILE ================= */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    delete updates.password;
    delete updates.role;
    delete updates.email;

    if (req.files?.avatar?.[0]) {
      const avatarFile = req.files.avatar[0];
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: "lms-users/avatars" },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          )
          .end(avatarFile.buffer);
      });
      updates.avatar = result.secure_url;
    }

    if (req.files?.resume?.[0]) {
      const resumeFile = req.files.resume[0];
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "lms-users/resumes",
              resource_type: "raw",
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          )
          .end(resumeFile.buffer);
      });
      updates.resume = result.secure_url;
    }

    // Parse JSON strings if they exist
    if (updates.skills && typeof updates.skills === 'string') {
      updates.skills = JSON.parse(updates.skills);
    }
    if (updates.jobPreferences && typeof updates.jobPreferences === 'string') {
      updates.jobPreferences = JSON.parse(updates.jobPreferences);
    }
    if (updates.socialLinks && typeof updates.socialLinks === 'string') {
      updates.socialLinks = JSON.parse(updates.socialLinks);
    }
    if (updates.address && typeof updates.address === 'string') {
      updates.address = JSON.parse(updates.address);
    }
    if (updates.education && typeof updates.education === 'string') {
      updates.education = JSON.parse(updates.education);
    }
    if (updates.experience && typeof updates.experience === 'string') {
      updates.experience = JSON.parse(updates.experience);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    const isProfileComplete = checkProfileCompleteness(updatedUser);
    updatedUser.isProfileComplete = isProfileComplete;
    await updatedUser.save();

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ================= GET PROFILE ================= */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= GET STUDENT PROFILES (for admin) ================= */
export const getStudentsForJobs = async (req, res) => {
  try {
    const students = await User.find({ 
      role: "STUDENT",
      isProfileComplete: true 
    }).select(
      "name email phone education skills cgpa backlogs batch jobPreferences placementStatus"
    );

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};