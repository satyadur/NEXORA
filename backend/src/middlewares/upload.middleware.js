import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Avatar validation
  if (file.fieldname === "avatar") {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Avatar must be an image file"), false);
    }
  }

  // Resume validation
  if (file.fieldname === "resume") {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error("Resume must be PDF, DOC, or DOCX"),
        false
      );
    }
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
});

export default upload;
