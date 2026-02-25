// seed-simple.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import User from "./src/models/User.model.js";
import Course from "./src/models/Course.model.js";
import CourseEnrollment from "./src/models/CourseEnrollment.model.js";
import CourseCategory from "./src/models/CourseCategory.model.js";
import Classroom from "./src/models/Classroom.model.js";
import Assignment from "./src/models/Assignment.model.js";
import Question from "./src/models/Question.model.js";
import Submission from "./src/models/Submission.model.js";
import Attendance from "./src/models/Attendance.model.js";
import Payslip from "./src/models/Payslip.model.js";
import EmployeeDocument from "./src/models/EmployeeDocument.model.js";
import StudentCertificate from "./src/models/StudentCertificate.model.js";
import TeacherAttendance from "./src/models/TeacherAttendance.model.js";

dotenv.config();

// ==================== HELPER FUNCTIONS ====================

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Updated unique ID generators to match new User model
const generateStudentUniqueId = (courseCode = "GEN") => {
  const prefix = "NX";
  const year = new Date().getFullYear().toString().slice(-2);
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  const coursePrefix = courseCode.slice(0, 3).toUpperCase();
  return `${prefix}${year}${coursePrefix}${random}`;
};

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

const generateAdminUniqueId = () => {
  const prefix = "ADM";
  const year = new Date().getFullYear().toString().slice(-2);
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}${year}${random}`;
};

const generateEmployeeId = (role, index) => {
  const prefix = role === "TEACHER" ? "TCH" : "FAC";
  const year = new Date().getFullYear().toString().slice(-2);
  const num = (index + 1).toString().padStart(3, '0');
  return `${prefix}${year}${num}`;
};

const generateCourseCode = (department, level, name) => {
  const deptPrefix = department.slice(0, 3).toUpperCase();
  let levelPrefix = "UG";
  if (level === "postgraduate") levelPrefix = "PG";
  if (level === "doctorate") levelPrefix = "PHD";
  if (level === "diploma") levelPrefix = "DIP";
  const namePrefix = name.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${deptPrefix}${levelPrefix}${namePrefix}${randomNum}`;
};

const months = ["January", "February", "March", "April", "May", "June"];

// ==================== MAIN SEED FUNCTION ====================

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    await mongoose.connection.dropDatabase();
    console.log("🧹 Database Cleared");

    const usedEmails = new Set();

    /* =====================================================
       👥 STEP 1: CREATE ADMIN
    ===================================================== */
    
    const admin = await User.create({
      name: "Dr. Sarah Johnson",
      email: "sarah.johnson@lms.com",
      password: "Admin@123",
      role: "ADMIN",
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=SarahJohnson`,
      phone: "9876543210",
      uniqueId: generateAdminUniqueId()
    });
    usedEmails.add(admin.email);

    /* =====================================================
       👥 STEP 2: CREATE FACULTY ADMIN
    ===================================================== */
    
    const facultyAdmin = await User.create({
      name: "Dr. Rajesh Khanna",
      email: "rajesh.khanna@lms.com",
      password: "FacultyAdmin@123",
      role: "FACULTY_ADMIN",
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=RajeshKhanna`,
      phone: "9876543211",
      dateOfBirth: new Date(1975, 0, 15),
      gender: "Male",
      bloodGroup: "O+",
      address: {
        street: "123 Admin Block",
        city: "New Delhi",
        state: "Delhi",
        country: "India",
        pincode: "110001"
      },
      aadharNumber: "123456789012",
      panNumber: "ABCDE1234F",
      uniqueId: generateEmployeeUniqueId("FACULTY_ADMIN", "Rajesh Khanna"),
      employeeRecord: {
        employeeId: generateEmployeeId("FACULTY_ADMIN", 0),
        designation: "Faculty Admin",
        department: "Administration",
        joiningDate: new Date(2020, 0, 1),
        contractType: "PERMANENT",
        qualifications: [{
          degree: "Ph.D.",
          specialization: "Educational Administration",
          university: "Delhi University",
          year: 2010
        }],
        salary: {
          basic: 75000,
          hra: 30000,
          da: 11250,
          ta: 5000,
          pf: 9000,
          tax: 12000,
          netSalary: 105250,
          bankAccount: {
            accountNumber: "1234567890",
            ifscCode: "SBIN0001234",
            bankName: "SBI"
          }
        }
      }
    });

    /* =====================================================
       👥 STEP 3: CREATE TEACHERS (3)
    ===================================================== */
    
    const teacherData = [
      { 
        name: "Prof. John Mathematics", 
        email: "john.math@lms.com", 
        subject: "Mathematics", 
        dept: "Mathematics",
        designation: "Professor",
        basicSalary: 65000
      },
      { 
        name: "Dr. Sarah Physics", 
        email: "sarah.physics@lms.com", 
        subject: "Physics", 
        dept: "Physics",
        designation: "Associate Professor",
        basicSalary: 55000
      },
      { 
        name: "Prof. David Chemistry", 
        email: "david.chem@lms.com", 
        subject: "Chemistry", 
        dept: "Chemistry",
        designation: "Professor",
        basicSalary: 60000
      }
    ];

    const teachers = [];
    for (let i = 0; i < teacherData.length; i++) {
      const t = teacherData[i];
      const basic = t.basicSalary;
      const hra = Math.floor(basic * 0.4);
      const da = Math.floor(basic * 0.15);
      const ta = Math.floor(basic * 0.1);
      const pf = Math.floor(basic * 0.12);
      const tax = Math.floor(basic * 0.1);
      const netSalary = basic + hra + da + ta - pf - tax;

      const teacher = await User.create({
        name: t.name,
        email: t.email,
        password: "Teacher@123",
        role: "TEACHER",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${t.name.replace(/\s/g, '')}`,
        phone: `98765${12340 + i}`,
        dateOfBirth: new Date(1980 + i, i, 15),
        gender: i % 2 === 0 ? "Male" : "Female",
        bloodGroup: ["A+", "B+", "O+"][i],
        address: {
          street: `${100 + i} Teacher Colony`,
          city: ["Mumbai", "Delhi", "Bangalore"][i],
          state: ["Maharashtra", "Delhi", "Karnataka"][i],
          country: "India",
          pincode: `4000${i}`
        },
        aadharNumber: `2233445566${i}`,
        panNumber: `FGHIJ${1234 + i}K`,
        uniqueId: generateEmployeeUniqueId("TEACHER", t.name),
        education: [
          {
            degree: "Ph.D.",
            specialization: t.subject,
            university: ["IIT Delhi", "IIT Bombay", "Delhi University"][i],
            yearOfPassing: 2010 + i,
            percentage: 85 + i,
            isCompleted: true
          },
          {
            degree: "M.Sc",
            specialization: t.subject,
            university: ["Delhi University", "Mumbai University", "Madras University"][i],
            yearOfPassing: 2005 + i,
            percentage: 80 + i,
            isCompleted: true
          }
        ],
        experience: [
          {
            company: ["IIT Delhi", "BITS Pilani", "VIT"][i],
            position: "Assistant Professor",
            duration: "2015-2020",
            description: "Taught undergraduate courses",
            isCurrent: false
          },
          {
            company: "Current University",
            position: t.designation,
            duration: "2020-Present",
            description: "Senior faculty member",
            isCurrent: true
          }
        ],
        skills: [
          { name: t.subject, level: "Expert" },
          { name: "Teaching", level: "Expert" },
          { name: "Research", level: "Advanced" }
        ],
        employeeRecord: {
          employeeId: generateEmployeeId("TEACHER", i),
          designation: t.designation,
          department: t.dept,
          joiningDate: new Date(2018 + i, 0, 1),
          contractType: "PERMANENT",
          qualifications: [{
            degree: "Ph.D.",
            specialization: t.subject,
            university: "IIT Delhi",
            year: 2010
          }],
          salary: {
            basic,
            hra,
            da,
            ta,
            pf,
            tax,
            netSalary,
            bankAccount: {
              accountNumber: `9876543210${i}`,
              ifscCode: "ICICI0001234",
              bankName: "ICICI Bank"
            }
          },
          leaves: {
            total: 30,
            taken: 2 + i,
            remaining: 28 - i
          }
        },
        socialLinks: {
          linkedin: `https://linkedin.com/in/${t.name.toLowerCase().replace(/\s/g, '')}`,
          github: i % 2 === 0 ? `https://github.com/${t.name.toLowerCase().replace(/\s/g, '')}` : ""
        }
      });
      teachers.push(teacher);
      usedEmails.add(t.email);
    }

    /* =====================================================
       👥 STEP 4: CREATE STUDENTS (5)
    ===================================================== */
    
    const studentNames = [
      { first: "Aarav", last: "Sharma" },
      { first: "Priya", last: "Patel" },
      { first: "Rahul", last: "Verma" },
      { first: "Ananya", last: "Singh" },
      { first: "Vikram", last: "Mehta" }
    ];

    const students = [];
    for (let i = 0; i < studentNames.length; i++) {
      const s = studentNames[i];
      const email = `${s.first.toLowerCase()}.${s.last.toLowerCase()}@student.lms.com`;
      const cgpa = (6.5 + i * 0.5).toFixed(2);
      const backlogs = i === 4 ? 2 : 0;
      const courseCode = ["CSE", "ECE", "MEC", "CIV", "CSE"][i];

      const student = await User.create({
        name: `${s.first} ${s.last}`,
        email: email,
        password: "Student@123",
        role: "STUDENT",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.first}${s.last}`,
        phone: `99887${66550 + i}`,
        dateOfBirth: new Date(2002, i, 15),
        gender: i % 2 === 0 ? "Male" : "Female",
        bloodGroup: ["A+", "B+", "O+", "AB+", "A-"][i],
        address: {
          street: `${100 + i} Student Hostel`,
          city: ["Mumbai", "Delhi", "Bangalore", "Chennai", "Pune"][i],
          state: ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Maharashtra"][i],
          country: "India",
          pincode: `4000${i}`
        },
        aadharNumber: `3344556677${i}`,
        uniqueId: generateStudentUniqueId(courseCode),
        enrollmentNumber: `ENR2024${i.toString().padStart(2, '0')}`,
        batch: "2022-2025",
        currentSemester: "6",
        cgpa: parseFloat(cgpa),
        backlogs: backlogs,
        education: [{
          degree: "B.Tech",
          specialization: ["Computer Science", "Electronics", "Mechanical", "Civil", "Computer Science"][i],
          university: ["JNTU", "VTU", "Anna University", "Delhi University", "Pune University"][i],
          yearOfPassing: 2025,
          percentage: 70 + i * 5,
          isCompleted: false
        }],
        skills: [
          { name: "JavaScript", level: ["Intermediate", "Advanced", "Beginner", "Intermediate", "Advanced"][i] },
          { name: "Python", level: ["Beginner", "Intermediate", "Advanced", "Intermediate", "Beginner"][i] },
          { name: "React", level: ["Beginner", "Intermediate", "Beginner", "Intermediate", "Advanced"][i] }
        ],
        jobPreferences: {
          preferredRoles: ["Software Developer", "Data Analyst"],
          preferredLocations: ["Mumbai", "Bangalore"],
          expectedSalary: "6-8 LPA",
          jobType: ["Full Time", "Internship"],
          immediateJoiner: i === 4,
          noticePeriod: "30 days"
        },
        socialLinks: {
          linkedin: `https://linkedin.com/in/${s.first.toLowerCase()}${s.last.toLowerCase()}`,
          github: `https://github.com/${s.first.toLowerCase()}${i}`
        },
        isProfileComplete: i < 4,
        isPlacementEligible: i !== 4,
        placementStatus: i < 2 ? "Placed" : i < 4 ? "Applied" : "Not Applied"
      });
      students.push(student);
      usedEmails.add(email);
    }

    console.log("✅ Created:");
    console.log(`   - 1 Admin`);
    console.log(`   - 1 Faculty Admin`);
    console.log(`   - 3 Teachers`);
    console.log(`   - 5 Students`);

    /* =====================================================
       🎓 STEP 5: CREATE COURSE CATEGORIES
    ===================================================== */

    const categories = await CourseCategory.create([
      {
        name: "Engineering",
        slug: "engineering",
        description: "Engineering courses across various disciplines",
        level: 1,
        order: 1,
        createdBy: admin._id
      },
      {
        name: "Computer Science",
        slug: "computer-science",
        description: "Computer Science and IT courses",
        level: 2,
        parentCategory: null, // Will update after creation
        order: 2,
        createdBy: admin._id
      },
      {
        name: "Science",
        slug: "science",
        description: "Pure and applied sciences",
        level: 1,
        order: 3,
        createdBy: admin._id
      }
    ]);

    // Set parent category for Computer Science
    const engCategory = categories.find(c => c.name === "Engineering");
    const csCategory = categories.find(c => c.name === "Computer Science");
    csCategory.parentCategory = engCategory._id;
    csCategory.path = "engineering/computer-science";
    await csCategory.save();

    console.log(`✅ Created ${categories.length} Course Categories`);

    /* =====================================================
       📚 STEP 6: CREATE COURSES
    ===================================================== */

    const courses = [];

    const courseData = [
      {
        title: "Introduction to Computer Science",
        department: "Computer Science",
        level: "undergraduate",
        credits: 4,
        duration: { value: 1, unit: "semesters" },
        description: "Fundamental concepts of computer science",
        longDescription: "Comprehensive introduction to programming, algorithms, and data structures",
        category: "Computer Science",
        instructor: teachers[2], // Emily CS
        skillsGained: ["Programming", "Algorithms", "Problem Solving"],
        fee: {
          amount: 25000,
          type: "per_semester",
          installments: [
            { dueDate: new Date(2025, 6, 15), amount: 12500, description: "First Installment" },
            { dueDate: new Date(2025, 9, 15), amount: 12500, description: "Second Installment" }
          ]
        }
      },
      {
        title: "Advanced Mathematics",
        department: "Mathematics",
        level: "undergraduate",
        credits: 3,
        duration: { value: 1, unit: "semesters" },
        description: "Advanced mathematical concepts",
        longDescription: "Calculus, linear algebra, and differential equations",
        category: "Science",
        instructor: teachers[0], // John Math
        skillsGained: ["Calculus", "Linear Algebra", "Mathematical Modeling"],
        fee: {
          amount: 20000,
          type: "per_semester",
          installments: [
            { dueDate: new Date(2025, 6, 15), amount: 10000, description: "First Installment" },
            { dueDate: new Date(2025, 9, 15), amount: 10000, description: "Second Installment" }
          ]
        }
      },
      {
        title: "Quantum Physics",
        department: "Physics",
        level: "postgraduate",
        credits: 4,
        duration: { value: 1, unit: "semesters" },
        description: "Introduction to quantum mechanics",
        longDescription: "Wave mechanics, quantum states, and applications",
        category: "Science",
        instructor: teachers[1], // Sarah Physics
        skillsGained: ["Quantum Mechanics", "Wave Functions", "Mathematical Physics"],
        fee: {
          amount: 30000,
          type: "per_semester",
          installments: [
            { dueDate: new Date(2025, 6, 15), amount: 15000, description: "First Installment" },
            { dueDate: new Date(2025, 9, 15), amount: 15000, description: "Second Installment" }
          ]
        }
      }
    ];

    for (let i = 0; i < courseData.length; i++) {
      const data = courseData[i];
      const category = categories.find(c => c.name === data.category);
      
      const course = await Course.create({
        title: data.title,
        code: generateCourseCode(data.department, data.level, data.title),
        shortCode: `${data.department.slice(0, 2).toUpperCase()}${101 + i}`,
        description: data.description,
        longDescription: data.longDescription,
        department: data.department,
        level: data.level,
        credits: data.credits,
        duration: data.duration,
        instructors: [data.instructor._id],
        headInstructor: data.instructor._id,
        fee: data.fee,
        status: "published",
        tags: [data.department, data.level, "active"],
        category: data.category,
        skillsGained: data.skillsGained,
        learningOutcomes: [
          `Understand core concepts of ${data.title}`,
          `Apply ${data.skillsGained[0]} to solve problems`,
          `Develop practical skills in ${data.department}`
        ],
        syllabus: {
          title: `${data.title} Syllabus`,
          description: `Complete syllabus for ${data.title}`,
          objectives: data.skillsGained.map(s => `Master ${s}`),
          outcomes: [`Able to work independently in ${data.department}`],
          topics: [
            { week: 1, title: "Introduction", duration: 3 },
            { week: 2, title: "Core Concepts", duration: 4 },
            { week: 3, title: "Advanced Topics", duration: 4 },
            { week: 4, title: "Applications", duration: 3 }
          ],
          textbooks: [
            { title: "Standard Textbook", author: "John Doe", edition: "1st" }
          ]
        },
        prerequisites: {
          requiredSkills: i === 2 ? ["Basic Physics"] : [],
          description: "Basic understanding of the subject"
        },
        modules: [
          {
            title: "Module 1: Introduction",
            description: "Getting started",
            duration: 5,
            order: 1,
            objectives: ["Understand basics"],
            isPublished: true
          },
          {
            title: "Module 2: Core Concepts",
            description: "Main topics",
            duration: 8,
            order: 2,
            objectives: ["Master core concepts"],
            isPublished: true
          },
          {
            title: "Module 3: Advanced Topics",
            description: "Deep dive",
            duration: 7,
            order: 3,
            objectives: ["Learn advanced concepts"],
            isPublished: true
          }
        ],
        schedule: {
          startDate: new Date(2025, 6, 1),
          endDate: new Date(2025, 11, 30),
          classes: [
            {
              dayOfWeek: "Monday",
              startTime: "10:00",
              endTime: "12:00",
              location: "Room 101",
              instructor: data.instructor._id
            },
            {
              dayOfWeek: "Wednesday",
              startTime: "14:00",
              endTime: "16:00",
              location: "Lab 202",
              instructor: data.instructor._id
            }
          ],
          importantDates: [
            { title: "Mid-term Exam", date: new Date(2025, 8, 15), description: "Mid-semester examination" },
            { title: "Final Exam", date: new Date(2025, 11, 15), description: "End-semester examination" }
          ]
        },
        createdBy: admin._id,
        careerOpportunities: [
          `Junior ${data.department} Specialist`,
          `Research Assistant`,
          `Technical Consultant`
        ],
        certificateTemplate: "standard",
        certificateIssued: true,
        thumbnail: `https://via.placeholder.com/300x200?text=${data.title.replace(/\s/g, '+')}`,
        enrollmentStats: {
          totalEnrolled: 3,
          currentEnrolled: 3,
          completedCount: 0,
          averageRating: 4.5
        }
      });

      courses.push(course);

      // Update category with course
      category.totalCourses += 1;
      category.popularCourses.push(course._id);
      await category.save();
    }

    console.log(`✅ Created ${courses.length} Courses`);

    /* =====================================================
       📝 STEP 7: ENROLL STUDENTS IN COURSES
    ===================================================== */

    const enrollments = [];
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      // Enroll each student in 1-2 courses
      const numCourses = Math.min(i % 3 + 1, courses.length);
      
      for (let j = 0; j < numCourses; j++) {
        const course = courses[j % courses.length];
        
        // Check if already enrolled
        const existingEnrollment = await CourseEnrollment.findOne({
          courseId: course._id,
          studentId: student._id
        });

        if (!existingEnrollment) {
          const enrollment = await CourseEnrollment.create({
            courseId: course._id,
            studentId: student._id,
            enrollmentDate: new Date(2025, 0, 15 + i),
            status: i === 4 ? "dropped" : (i < 2 ? "completed" : "in_progress"),
            progress: {
              modulesCompleted: [
                { moduleId: course.modules[0]._id, completedAt: new Date(2025, 1, 10), score: 85 },
                { moduleId: course.modules[1]._id, completedAt: new Date(2025, 2, 15), score: 78 }
              ],
              overallProgress: i < 2 ? 100 : (i === 2 ? 66 : (i === 3 ? 33 : 0)),
              lastAccessed: new Date()
            },
            grades: i < 3 ? [
              {
                assessmentId: new mongoose.Types.ObjectId(),
                type: "assignment",
                score: 85,
                maxScore: 100,
                percentage: 85,
                grade: "A",
                submittedAt: new Date(2025, 2, 20),
                evaluatedAt: new Date(2025, 2, 25)
              }
            ] : [],
            finalGrade: i < 2 ? "A" : undefined,
            finalPercentage: i < 2 ? 85 : undefined,
            completionDate: i < 2 ? new Date(2025, 4, 30) : undefined,
            certificateIssued: i < 2 ? true : false,
            paymentStatus: "completed",
            paymentDetails: [
              {
                amount: course.fee.amount,
                date: new Date(2025, 0, 10),
                transactionId: `TXN${Date.now()}${i}`,
                status: "completed"
              }
            ],
            enrolledBy: admin._id
          });

          enrollments.push(enrollment);

          // Update student's enrolledCourses
          student.enrolledCourses.push({
            courseId: course._id,
            courseCode: course.code,
            courseName: course.title,
            enrollmentDate: new Date(2025, 0, 15 + i),
            status: i === 4 ? "dropped" : (i < 2 ? "completed" : "in_progress"),
            grade: i < 2 ? "A" : undefined,
            percentage: i < 2 ? 85 : undefined,
            completionDate: i < 2 ? new Date(2025, 4, 30) : undefined,
            certificateIssued: i < 2 ? true : false
          });

          await student.save();

          // Update course enrollment stats
          course.enrollmentStats.totalEnrolled += 1;
          if (i < 2) {
            course.enrollmentStats.completedCount += 1;
          }
          await course.save();
        }
      }
    }

    console.log(`✅ Created ${enrollments.length} Course Enrollments`);

    /* =====================================================
       💰 STEP 8: GENERATE PAYSLIPS
    ===================================================== */

    for (let m = 0; m < 6; m++) {
      const basic = 75000;
      const hra = 30000;
      const da = 11250;
      const ta = 5000;
      const pf = 9000;
      const tax = 12000;
      const totalEarnings = basic + hra + da + ta;
      const totalDeductions = pf + tax;
      const netSalary = totalEarnings - totalDeductions;

      await Payslip.create({
        employeeId: facultyAdmin._id,
        employeeName: facultyAdmin.name,
        employeeEmail: facultyAdmin.email,
        employeeId_number: facultyAdmin.employeeRecord.employeeId,
        month: months[m],
        year: 2025,
        earnings: { basic, hra, da, ta, totalEarnings },
        deductions: { pf, tax, totalDeductions },
        netSalary,
        bankDetails: facultyAdmin.employeeRecord.salary.bankAccount,
        companyDetails: { name: "Learning Management System" },
        paymentStatus: "PAID",
        paymentDate: new Date(2025, m, 25),
        pdfUrl: `https://storage.example.com/payslips/${facultyAdmin.employeeRecord.employeeId}_${months[m]}_2025.pdf`,
        generatedBy: admin._id
      });
    }

    // Generate payslips for Teachers (3 months each)
    for (const teacher of teachers) {
      for (let m = 0; m < 3; m++) {
        const salary = teacher.employeeRecord.salary;
        const totalEarnings = salary.basic + salary.hra + salary.da + salary.ta;
        const totalDeductions = salary.pf + salary.tax;
        const netSalary = totalEarnings - totalDeductions;

        await Payslip.create({
          employeeId: teacher._id,
          employeeName: teacher.name,
          employeeEmail: teacher.email,
          employeeId_number: teacher.employeeRecord.employeeId,
          month: months[m],
          year: 2025,
          earnings: {
            basic: salary.basic,
            hra: salary.hra,
            da: salary.da,
            ta: salary.ta,
            totalEarnings
          },
          deductions: {
            pf: salary.pf,
            tax: salary.tax,
            totalDeductions
          },
          netSalary,
          bankDetails: salary.bankAccount,
          companyDetails: { name: "Learning Management System" },
          paymentStatus: "PAID",
          paymentDate: new Date(2025, m, 25),
          pdfUrl: `https://storage.example.com/payslips/${teacher.employeeRecord.employeeId}_${months[m]}_2025.pdf`,
          generatedBy: admin._id
        });
      }
    }

    console.log(`✅ Generated ${await Payslip.countDocuments()} Payslips`);

    /* =====================================================
       📄 STEP 9: CREATE EMPLOYEE DOCUMENTS
    ===================================================== */

    for (const teacher of teachers) {
      await EmployeeDocument.create([
        {
          employeeId: teacher._id,
          documentType: "OFFER_LETTER",
          title: `Offer Letter - ${teacher.name}`,
          fileUrl: `https://storage.example.com/documents/offer_${teacher.employeeRecord.employeeId}.pdf`,
          fileType: "application/pdf",
          issueDate: new Date(2020, 0, 1),
          metadata: {
            position: teacher.employeeRecord.designation,
            department: teacher.employeeRecord.department,
            joiningDate: teacher.employeeRecord.joiningDate,
            salary: teacher.employeeRecord.salary.basic
          },
          isVerified: true,
          verifiedBy: facultyAdmin._id,
          uploadedBy: facultyAdmin._id
        },
        {
          employeeId: teacher._id,
          documentType: "APPOINTMENT_LETTER",
          title: `Appointment Letter - ${teacher.name}`,
          fileUrl: `https://storage.example.com/documents/appointment_${teacher.employeeRecord.employeeId}.pdf`,
          fileType: "application/pdf",
          issueDate: teacher.employeeRecord.joiningDate,
          isVerified: true,
          verifiedBy: facultyAdmin._id,
          uploadedBy: facultyAdmin._id
        }
      ]);
    }

    console.log(`✅ Created ${await EmployeeDocument.countDocuments()} Employee Documents`);

    /* =====================================================
       🎓 STEP 10: CREATE STUDENT CERTIFICATES
    ===================================================== */

    for (let i = 0; i < 3; i++) {
      await StudentCertificate.create({
        studentId: students[i]._id,
        certificateType: "COURSE_COMPLETION",
        title: `Certificate in ${courses[i % courses.length].title}`,
        description: "Successfully completed the course with distinction",
        issueDate: new Date(2025, 4, 30),
        metadata: {
          issuedBy: "Academic Council",
          organization: "University",
          duration: "6 months",
          skills: courses[i % courses.length].skillsGained
        },
        isPublic: true,
        isVerified: true,
        referenceId: courses[i % courses.length]._id,
        referenceModel: "Course",
        score: 85,
        grade: "A",
        percentage: 85
      });
    }

    console.log(`✅ Created ${await StudentCertificate.countDocuments()} Student Certificates`);

    /* =====================================================
       🏫 STEP 11: CREATE CLASSROOMS (3)
    ===================================================== */

    const classrooms = [];
    const subjects = ["Mathematics", "Physics", "Computer Science"];

    for (let i = 0; i < 3; i++) {
      const teacher = teachers[i % teachers.length];
      const numStudents = 3 + i; // 3-5 students
      const classStudents = students.slice(0, numStudents).map(s => s._id);
      
      const classroom = await Classroom.create({
        name: `${subjects[i]} 101 - Section ${String.fromCharCode(65 + i)}`,
        description: `Introduction to ${subjects[i]}`,
        teacher: teacher._id,
        students: classStudents,
        inviteCode: crypto.randomBytes(3).toString("hex").toUpperCase(),
        status: "ACTIVE"
      });
      classrooms.push(classroom);
    }

    console.log(`✅ Created ${classrooms.length} Classrooms`);

    /* =====================================================
       📝 STEP 12: CREATE ASSIGNMENTS (2 per classroom)
    ===================================================== */

    const assignments = [];
    for (const classroom of classrooms) {
      for (let i = 1; i <= 2; i++) {
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + (i === 1 ? 7 : 14));
        
        const assignment = await Assignment.create({
          title: `${classroom.name.split(' - ')[0]} - Assignment ${i}`,
          description: `Complete the following problems`,
          classroomId: classroom._id,
          createdBy: classroom.teacher,
          totalMarks: 100,
          deadline,
          isPublished: true
        });
        assignments.push(assignment);
      }
    }

    console.log(`✅ Created ${assignments.length} Assignments`);

    /* =====================================================
       ❓ STEP 13: CREATE QUESTIONS (3 per assignment)
    ===================================================== */

    for (const assignment of assignments) {
      for (let j = 0; j < 3; j++) {
        await Question.create({
          assignmentId: assignment._id,
          type: j === 0 ? "MCQ" : "TEXT",
          questionText: `Question ${j + 1}: Explain the concept...`,
          marks: j === 0 ? 30 : 35,
          difficulty: ["EASY", "MEDIUM", "HARD"][j],
          ...(j === 0 && {
            options: [
              { text: "Option A - Correct" },
              { text: "Option B - Wrong" },
              { text: "Option C - Wrong" },
              { text: "Option D - Wrong" }
            ],
            correctAnswerIndex: 0
          })
        });
      }
    }

    console.log(`✅ Created ${await Question.countDocuments()} Questions`);

    /* =====================================================
       📤 STEP 14: CREATE SUBMISSIONS
    ===================================================== */

    let submissions = 0;
    for (const assignment of assignments) {
      const classroom = classrooms.find(c => 
        c._id.toString() === assignment.classroomId.toString()
      );
      
      if (classroom) {
        for (const studentId of classroom.students) {
          const student = students.find(s => s._id.toString() === studentId.toString());
          if (student && student.cgpa > 7) {
            const questions = await Question.find({ assignmentId: assignment._id });
            
            const answers = questions.map(q => ({
              questionId: q._id,
              answer: "Student's answer here",
              awardedMarks: Math.floor(q.marks * 0.85),
            }));

            const totalScore = answers.reduce((sum, a) => sum + a.awardedMarks, 0);

            await Submission.create({
              assignmentId: assignment._id,
              studentId,
              answers,
              totalScore,
              status: "EVALUATED"
            });
            submissions++;
          }
        }
      }
    }

    console.log(`✅ Created ${submissions} Submissions`);

    /* =====================================================
       📅 STEP 15: CREATE ATTENDANCE (last 10 days)
    ===================================================== */

    let attendanceRecords = 0;
    for (let day = 0; day < 10; day++) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      for (const classroom of classrooms) {
        for (const studentId of classroom.students) {
          const student = students.find(s => s._id.toString() === studentId.toString());
          const status = student.cgpa > 7.5 ? "PRESENT" : Math.random() > 0.3 ? "PRESENT" : "ABSENT";
          
          try {
            await Attendance.create({
              classroomId: classroom._id,
              studentId,
              date,
              status
            });
            attendanceRecords++;
          } catch (e) {
            // Skip duplicates
          }
        }
      }
    }

    console.log(`✅ Created ${attendanceRecords} Attendance Records`);

    /* =====================================================
       📊 FINAL STATISTICS
    ===================================================== */

    console.log("\n" + "=".repeat(60));
    console.log("🔥 SEED COMPLETED SUCCESSFULLY");
    console.log("=".repeat(60));
    console.log("📊 DATABASE STATISTICS:");
    console.log("-".repeat(40));
    console.log(`👥 Users: ${await User.countDocuments()}`);
    console.log(`📚 Courses: ${await Course.countDocuments()}`);
    console.log(`📝 Enrollments: ${await CourseEnrollment.countDocuments()}`);
    console.log(`🏷️ Categories: ${await CourseCategory.countDocuments()}`);
    console.log(`🏫 Classrooms: ${await Classroom.countDocuments()}`);
    console.log(`📝 Assignments: ${await Assignment.countDocuments()}`);
    console.log(`❓ Questions: ${await Question.countDocuments()}`);
    console.log(`📤 Submissions: ${await Submission.countDocuments()}`);
    console.log(`📅 Student Attendance: ${await Attendance.countDocuments()}`);
    console.log(`💰 Payslips: ${await Payslip.countDocuments()}`);
    console.log(`📄 Employee Documents: ${await EmployeeDocument.countDocuments()}`);
    console.log(`🎓 Student Certificates: ${await StudentCertificate.countDocuments()}`);
    console.log("=".repeat(60));

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed Error:", error);
    process.exit(1);
  }
};

seed();