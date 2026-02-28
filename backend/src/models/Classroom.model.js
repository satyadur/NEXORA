import mongoose from "mongoose";
import crypto from "crypto";

const classroomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    description: String,

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    inviteCode: {
      type: String,
      unique: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "COMPLETED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

/* Auto-generate invite code */
classroomSchema.pre("save", function (next) {
  if (!this.inviteCode) {
    this.inviteCode = crypto.randomBytes(3).toString("hex").toUpperCase();
  }
  next();
});

export default mongoose.model("Classroom", classroomSchema);
