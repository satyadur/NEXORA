// controllers/admin.attendance.controller.js
import TeacherAttendance from "../models/TeacherAttendance.model.js";
import User from "../models/User.model.js";

// Get all teacher/faculty attendance with filters
// Get teacher attendance with filters
export const getTeacherAttendance = async (req, res) => {
  try {
    const { startDate, endDate, employeeId, status } = req.query;
    
    const query = {};
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }
    
    if (employeeId) {
      query.employeeId = employeeId;
    }
    
    if (status) {
      query.status = status;
    }
    
    const attendance = await TeacherAttendance.find(query)
      .populate('employeeId', 'name email employeeRecord.shiftTimings')
      .sort({ date: -1 });
    
    // Format the response
    const formattedAttendance = attendance.map(record => ({
      _id: record._id,
      employeeId: record.employeeId,
      employeeName: record.employeeName,
      employeeEmail: record.employeeEmail,
      employeeRole: record.employeeRole,
      date: record.date,
      status: record.status,
      scheduledStartTime: record.scheduledStartTime,
      scheduledEndTime: record.scheduledEndTime,
      actualCheckIn: record.actualCheckIn,
      actualCheckOut: record.actualCheckOut,
      totalWorkHours: record.totalWorkHours,
      formattedWorkHours: record.formattedWorkHours,
      lateMinutes: record.lateMinutes,
      earlyDepartureMinutes: record.earlyDepartureMinutes,
      notes: record.notes,
      shiftTimings: record.employeeId?.employeeRecord?.shiftTimings // Include shift timings
    }));
    
    res.json(formattedAttendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get attendance summary
export const getAttendanceSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const summary = await TeacherAttendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalPresent: {
            $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] }
          },
          totalLate: {
            $sum: { $cond: [{ $eq: ["$status", "LATE"] }, 1, 0] }
          },
          totalAbsent: {
            $sum: { $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0] }
          },
          totalOnLeave: {
            $sum: { $cond: [{ $eq: ["$status", "ON_LEAVE"] }, 1, 0] }
          },
          totalHalfDay: {
            $sum: { $cond: [{ $eq: ["$status", "HALF_DAY"] }, 1, 0] }
          },
          totalRecords: { $sum: 1 },
          totalWorkHours: { $sum: "$totalWorkHours" },
        }
      },
      {
        $project: {
          _id: 0,
          totalPresent: 1,
          totalLate: 1,
          totalAbsent: 1,
          totalOnLeave: 1,
          totalHalfDay: 1,
          totalRecords: 1,
          totalWorkHours: { $round: ["$totalWorkHours", 1] },
          attendanceRate: {
            $multiply: [
              { $divide: [
                { $add: ["$totalPresent", "$totalLate"] },
                { $max: ["$totalRecords", 1] }
              ] },
              100
            ]
          }
        }
      }
    ]);

    const result = summary[0] || {
      totalPresent: 0,
      totalLate: 0,
      totalAbsent: 0,
      totalOnLeave: 0,
      totalHalfDay: 0,
      totalRecords: 0,
      totalWorkHours: 0,
      attendanceRate: 0
    };

    res.json(result);
  } catch (error) {
    console.error("Error fetching attendance summary:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get today's attendance status
export const getTodayAttendanceStatus = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats = await TeacherAttendance.aggregate([
      {
        $match: {
          date: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      PRESENT: 0,
      LATE: 0,
      ABSENT: 0,
      ON_LEAVE: 0,
      HALF_DAY: 0,
      total: 0
    };

    stats.forEach(stat => {
      result[stat._id] = stat.count;
      result.total += stat.count;
    });

    // Get total employees
    const totalEmployees = await User.countDocuments({
      role: { $in: ["TEACHER", "FACULTY_ADMIN"] }
    });

    result.totalEmployees = totalEmployees;
    result.notMarked = totalEmployees - result.total;

    res.json(result);
  } catch (error) {
    console.error("Error fetching today's attendance:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get attendance by employee
export const getEmployeeAttendance2 = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;

    const query = { employeeId };

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendance = await TeacherAttendance.find(query)
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    console.error("Error fetching employee attendance:", error);
    res.status(500).json({ message: error.message });
  }
};