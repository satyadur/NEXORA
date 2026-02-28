import Classroom from "../models/Classroom.model.js";
import User from "../models/User.model.js";
import QRCode from "qrcode";
import crypto from "crypto";
import { generateCertificatePdf } from "../utils/generateCertificate.js";

/* Create Classroom */
export const createClassroom = async (req, res) => {
  try {
    const { name, teacher, status } = req.body;

    const teacherExists = await User.findById(teacher);

    if (!teacherExists || teacherExists.role !== "TEACHER") {
      return res.status(400).json({ message: "Invalid teacher selected" });
    }

    const classroom = await Classroom.create({
      name,
      teacher,
      status: status || "ACTIVE",
    });

    const populated = await classroom.populate("teacher", "name email");

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* Get All Classrooms */
export const getAllClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find()
      .populate("teacher", "name email")
      .populate("students", "name email")
      .sort({ createdAt: -1 });
    console.log(classrooms);

    res.json(classrooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* Add Student to Classroom */
export const addStudentToClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);

    classroom.students.push(req.body.studentId);
    await classroom.save();

    res.json(classroom);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// const generateCertificateId = () => {
//   const prefix = "NX-CERT";
//   const year = new Date().getFullYear();
//   const random = crypto.randomBytes(3).toString("hex").toUpperCase();
//   return `${prefix}-${year}-${random}`;
// };

/* UPDATE CLASSROOM */
const generateCertificateId = () => {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `NX-CERT-${year}-${random}`;
};

export const updateClassroom = async (req, res) => {
  try {
    const { name, teacher, status } = req.body;

    const classroom = await Classroom.findById(req.params.id)
      .populate("students");

    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    /* -------------------------
       Validate Teacher
    ------------------------- */

    if (teacher) {
      const teacherExists = await User.findById(teacher);

      if (!teacherExists || teacherExists.role !== "TEACHER") {
        return res.status(400).json({ message: "Invalid teacher selected" });
      }

      classroom.teacher = teacher;
    }

    /* -------------------------
       Update Classroom Name
    ------------------------- */

    if (name) classroom.name = name;

    /* -------------------------
       Issue Certificates
    ------------------------- */

    if (status === "COMPLETED" && classroom.status !== "COMPLETED") {

      for (const student of classroom.students) {

        const existing = student.certificates?.find(
          (cert) => cert.metadata?.classroomId?.toString() === classroom._id.toString()
        );

        if (!existing) {

          const certificateId = generateCertificateId();

          const verificationUrl =
            `${process.env.FRONTEND_URL}/verify/cert/${certificateId}`;

          const qrImage = await QRCode.toDataURL(verificationUrl);
const certificateUrl = await generateCertificatePdf({
  studentName: student.name,
  courseName: classroom.name,
  certificateId,
  qrCode: qrImage,
});
          await User.findByIdAndUpdate(student._id, {
            $push: {
              certificates: {
                certificateId,
                type: "COURSE_COMPLETION",
                title: classroom.name,
                description: `Successfully completed ${classroom.name}`,
                issueDate: new Date(),
                url: certificateUrl,
                qrCode: qrImage,
                isPublic: true,
                metadata: {
                  classroomId: classroom._id,
                  issuedBy: req.user?.id,
                },
              },
            },
          });

        }
      }
    }

    /* -------------------------
       Update Status
    ------------------------- */

    if (status) classroom.status = status;

    await classroom.save();

    const populated = await classroom.populate("teacher", "name email");

    res.json({
      success: true,
      message: "Classroom updated successfully",
      classroom: populated,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* DELETE CLASSROOM */
export const deleteClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findByIdAndDelete(req.params.id);

    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    res.json({ message: "Classroom deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
