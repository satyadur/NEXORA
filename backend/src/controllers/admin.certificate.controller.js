import User from "../models/User.model.js";
import crypto from "crypto";
import QRCode from "qrcode";

const generateCertificateId = () => {
  const prefix = "NX-CERT";
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${year}-${random}`;
};

export const issueCertificatesBulk = async (req, res) => {
  try {
    const { studentIds, title, description, type, score } = req.body;

    if (!studentIds || studentIds.length === 0) {
      return res.status(400).json({ message: "No students selected" });
    }

    const students = await User.find({
      _id: { $in: studentIds },
      role: "STUDENT",
    });

    const issuedCertificates = [];

    for (const student of students) {
      const certificateId = generateCertificateId();

      const verificationUrl = `${process.env.FRONTEND_URL}/verify/cert/${certificateId}`;

      const qrImage = await QRCode.toDataURL(verificationUrl);

      const certificate = {
        certificateId,
        type,
        title,
        description,
        issueDate: new Date(),
        qrCode: qrImage,
        metadata: {
          score,
          issuedBy: req.user._id,
        },
        isPublic: true,
      };

      student.certificates.push(certificate);

      issuedCertificates.push({
        studentId: student._id,
        certificateId,
      });
    }

    await Promise.all(students.map((s) => s.save()));

    res.json({
      success: true,
      message: "Certificates issued successfully",
      issuedCertificates,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};