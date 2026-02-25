import User from "../models/User.model.js"
import Submission from "../models/Submission.model.js"

/* ================= PUBLIC FACULTY ================= */
export const getPublicFaculty = async (req, res) => {
  try {
    const teachers = await User.find({ role: "TEACHER" })
      .select("_id name avatar")
      .limit(6)

    res.json(teachers)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/* ================= TOP STUDENTS ================= */
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
