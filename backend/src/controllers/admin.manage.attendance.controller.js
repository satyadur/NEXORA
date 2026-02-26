import TeacherAttendance from "../models/TeacherAttendance.model.js";
import User from "../models/User.model.js";
import mongoose from "mongoose";

/**
 * MARK ATTENDANCE BY ADMIN
 * Admin can mark attendance for any teacher/faculty on any date
 * This is used when:
 * - Employee forgot to mark attendance
 * - System was down
 * - Manual entry needed for leave/holiday
 */
export const markAttendanceByAdmin = async (req, res) => {
  try {
    const {
      employeeId,
      date,
      status,
      checkInTime,
      checkOutTime,
      notes,
      isLeave,
      leaveType,
      leaveReason,
      workHours,
      lateMinutes,
      earlyDepartureMinutes,
      checkInMethod,
      location,
      address
    } = req.body;

    // Validate employee exists and has correct role
    const employee = await User.findOne({
      _id: employeeId,
      role: { $in: ["TEACHER", "FACULTY_ADMIN"] }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Teacher or Faculty Admin not found"
      });
    }

    // Get employee's shift timings from their record
    const shiftTimings = employee.employeeRecord?.shiftTimings || {
      start: "09:00",
      end: "17:00",
      gracePeriod: 15,
      workingHours: 8
    };

    // Check if attendance already exists for this date
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const existingAttendance = await TeacherAttendance.findOne({
      employeeId,
      date: {
        $gte: attendanceDate,
        $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: "Attendance already marked for this date. Use update API instead.",
        existingAttendance
      });
    }

    // Prepare attendance data
    const attendanceData = {
      employeeId,
      employeeName: employee.name,
      employeeEmail: employee.email,
      employeeRole: employee.role,
      date: attendanceDate,
      status: status || (isLeave ? "ON_LEAVE" : "PRESENT"),
      scheduledStartTime: shiftTimings.start, // Store employee's shift start
      scheduledEndTime: shiftTimings.end,     // Store employee's shift end
      markedBy: req.user._id,
      markedAt: new Date(),
      notes: notes || "",
      metadata: {
        source: "manual_entry",
        verificationMethod: "none",
        verifiedBy: req.user._id,
        verifiedAt: new Date()
      }
    };

    // If it's a leave
    if (isLeave || status === "ON_LEAVE") {
      attendanceData.status = "ON_LEAVE";
      attendanceData.leaveId = new mongoose.Types.ObjectId(); // Generate temporary leave ID
      
      // Calculate work hours as 0 for leave
      attendanceData.totalWorkHours = 0;
      
      // Add to employee's leave record if needed
      if (employee.employeeRecord?.leaves) {
        // You might want to update the employee's leave record here
        // This depends on your business logic
      }
    } else {
      // Regular attendance with check-in/out times

      // Create check-in session
      const checkInSession = {
        startTime: checkInTime ? new Date(checkInTime) : new Date(`${date}T${shiftTimings.start}`),
        endTime: checkOutTime ? new Date(checkOutTime) : null,
        location: location || {
          type: "Point",
          coordinates: [0, 0], // Default coordinates if not provided
        },
        address: address || {
          formattedAddress: "Admin Marked",
          city: "Not Specified",
          state: "Not Specified",
          country: "India"
        },
        checkInMethod: checkInMethod || "manual",
        isWithinGeofence: true, // Admin marks are always considered within geofence
        notes: notes || "Marked by admin"
      };

      attendanceData.actualCheckIn = checkInSession;
      
      if (checkOutTime) {
        attendanceData.actualCheckOut = { ...checkInSession, startTime: new Date(checkOutTime) };
      }

      // Calculate work hours
      if (checkInTime && checkOutTime) {
        const checkIn = new Date(checkInTime);
        const checkOut = new Date(checkOutTime);
        const diffHours = (checkOut - checkIn) / (1000 * 60 * 60);
        attendanceData.totalWorkHours = workHours || diffHours;
      } else {
        attendanceData.totalWorkHours = workHours || 0;
      }

      // Calculate late minutes based on employee's shift start time
      if (checkInTime && !lateMinutes) {
        const checkInDate = new Date(checkInTime);
        const [schedHour, schedMin] = shiftTimings.start.split(':').map(Number);
        const scheduledStart = new Date(attendanceDate);
        scheduledStart.setHours(schedHour, schedMin, 0, 0);
        
        const lateDiff = Math.round((checkInDate - scheduledStart) / (1000 * 60));
        
        if (lateDiff > shiftTimings.gracePeriod) {
          attendanceData.lateMinutes = lateDiff;
          if (attendanceData.status !== "LATE" && !status) {
            attendanceData.status = "LATE";
          }
        }
      } else if (lateMinutes !== undefined) {
        attendanceData.lateMinutes = lateMinutes;
      }

      // Calculate early departure based on employee's shift end time
      if (checkOutTime && !earlyDepartureMinutes) {
        const checkOutDate = new Date(checkOutTime);
        const [schedHour, schedMin] = shiftTimings.end.split(':').map(Number);
        const scheduledEnd = new Date(attendanceDate);
        scheduledEnd.setHours(schedHour, schedMin, 0, 0);
        
        const earlyDiff = Math.round((scheduledEnd - checkOutDate) / (1000 * 60));
        if (earlyDiff > 0) {
          attendanceData.earlyDepartureMinutes = earlyDiff;
        }
      } else if (earlyDepartureMinutes !== undefined) {
        attendanceData.earlyDepartureMinutes = earlyDepartureMinutes;
      }
    }

    // Create attendance record
    const attendance = await TeacherAttendance.create(attendanceData);

    res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      attendance
    });

  } catch (error) {
    console.error("Error in markAttendanceByAdmin:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * UPDATE ATTENDANCE BY ADMIN
 * Admin can update any existing attendance record
 * This is used for corrections, adjustments, etc.
 */
export const updateAttendanceByAdmin = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const updateData = req.body;

    // Find the attendance record
    const attendance = await TeacherAttendance.findById(attendanceId);
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }

    // Prevent updating certain fields
    const allowedUpdates = [
      'status',
      'checkInTime',
      'checkOutTime',
      'notes',
      'totalWorkHours',
      'lateMinutes',
      'earlyDepartureMinutes',
      'location',
      'address'
    ];

    // Handle check-in/out updates
    if (updateData.checkInTime) {
      if (!attendance.actualCheckIn) {
        attendance.actualCheckIn = {};
      }
      attendance.actualCheckIn.startTime = new Date(updateData.checkInTime);
      attendance.actualCheckIn.checkInMethod = attendance.actualCheckIn.checkInMethod || "manual_updated";
      attendance.actualCheckIn.notes = updateData.notes || attendance.actualCheckIn.notes;
    }

    if (updateData.checkOutTime) {
      if (!attendance.actualCheckOut) {
        attendance.actualCheckOut = {};
      }
      attendance.actualCheckOut.startTime = new Date(updateData.checkOutTime);
    }

    if (updateData.location) {
      if (attendance.actualCheckIn) {
        attendance.actualCheckIn.location = updateData.location;
      }
    }

    if (updateData.address) {
      if (attendance.actualCheckIn) {
        attendance.actualCheckIn.address = updateData.address;
      }
    }

    // Update status
    if (updateData.status) {
      attendance.status = updateData.status;
    }

    // Update notes
    if (updateData.notes !== undefined) {
      attendance.notes = updateData.notes;
    }

    // Update work hours
    if (updateData.totalWorkHours !== undefined) {
      attendance.totalWorkHours = updateData.totalWorkHours;
    }

    // Update late/early minutes
    if (updateData.lateMinutes !== undefined) {
      attendance.lateMinutes = updateData.lateMinutes;
    }
    if (updateData.earlyDepartureMinutes !== undefined) {
      attendance.earlyDepartureMinutes = updateData.earlyDepartureMinutes;
    }

    // Recalculate work hours if both times are present
    if (attendance.actualCheckIn?.startTime && attendance.actualCheckOut?.startTime) {
      const diffMs = attendance.actualCheckOut.startTime - attendance.actualCheckIn.startTime;
      attendance.totalWorkHours = diffMs / (1000 * 60 * 60);
    }

    // Add metadata about update
    attendance.markedBy = req.user._id;
    attendance.markedAt = new Date();
    if (!attendance.metadata) {
      attendance.metadata = {};
    }
    attendance.metadata.lastUpdatedBy = req.user._id;
    attendance.metadata.lastUpdatedAt = new Date();
    attendance.metadata.updateReason = updateData.reason || "Admin correction";

    await attendance.save();

    res.json({
      success: true,
      message: "Attendance updated successfully",
      attendance
    });

  } catch (error) {
    console.error("Error in updateAttendanceByAdmin:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * DELETE ATTENDANCE BY ADMIN
 * Admin can delete an attendance record (use with caution)
 */
export const deleteAttendanceByAdmin = async (req, res) => {
  try {
    const { attendanceId } = req.params;

    const attendance = await TeacherAttendance.findById(attendanceId);
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }

    // Optional: Check if deletion is allowed (e.g., not too old)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (attendance.date < thirtyDaysAgo) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete attendance older than 30 days. Please mark as correction instead."
      });
    }

    // Instead of hard delete, you might want to soft delete
    // attendance.isDeleted = true;
    // await attendance.save();

    // Or hard delete
    await attendance.deleteOne();

    res.json({
      success: true,
      message: "Attendance record deleted successfully"
    });

  } catch (error) {
    console.error("Error in deleteAttendanceByAdmin:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET ATTENDANCE BY ID
 */
export const getAttendanceById = async (req, res) => {
  try {
    const { attendanceId } = req.params;

    const attendance = await TeacherAttendance.findById(attendanceId)
      .populate('employeeId', 'name email employeeRecord')
      .populate('markedBy', 'name email')
      .populate('metadata.verifiedBy', 'name email');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }

    res.json({
      success: true,
      attendance
    });

  } catch (error) {
    console.error("Error in getAttendanceById:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * BULK MARK ATTENDANCE
 * Admin can mark attendance for multiple employees at once
 * Useful for holidays, events, etc.
 * Enhanced version with better error handling and employee filtering
 */
export const bulkMarkAttendance = async (req, res) => {
  try {
    const { employeeIds, date, status, reason, markAs } = req.body;

    if (!employeeIds || !employeeIds.length || !date) {
      return res.status(400).json({
        success: false,
        message: "Employee IDs and date are required"
      });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const results = {
      successful: [],
      failed: [],
      skipped: []
    };

    // Get all employees in one query for better performance
    const employees = await User.find({
      _id: { $in: employeeIds },
      role: { $in: ["TEACHER", "FACULTY_ADMIN"] }
    });

    // Create a map for quick lookup
    const employeeMap = new Map(employees.map(emp => [emp._id.toString(), emp]));

    // Get existing attendances for this date
    const existingAttendances = await TeacherAttendance.find({
      employeeId: { $in: employeeIds },
      date: {
        $gte: attendanceDate,
        $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    // Create a set of employee IDs that already have attendance
    const existingEmployeeIds = new Set(
      existingAttendances.map(att => att.employeeId.toString())
    );

    // Process each employee
    for (const employeeId of employeeIds) {
      try {
        // Check if employee exists
        const employee = employeeMap.get(employeeId.toString());
        
        if (!employee) {
          results.failed.push({
            employeeId,
            reason: "Employee not found or invalid role"
          });
          continue;
        }

        // Check if attendance already exists
        if (existingEmployeeIds.has(employeeId.toString())) {
          results.skipped.push({
            employeeId,
            name: employee.name,
            reason: "Attendance already exists"
          });
          continue;
        }

        // Get employee's shift timings
        const shiftTimings = employee.employeeRecord?.shiftTimings || {
          start: "09:00",
          end: "17:00",
          gracePeriod: 15,
          workingHours: 8
        };

        // Create attendance with proper source enum
        const attendance = await TeacherAttendance.create({
          employeeId,
          employeeName: employee.name,
          employeeEmail: employee.email,
          employeeRole: employee.role,
          date: attendanceDate,
          status: markAs || status || "PRESENT",
          scheduledStartTime: shiftTimings.start,
          scheduledEndTime: shiftTimings.end,
          markedBy: req.user._id,
          markedAt: new Date(),
          notes: reason || `Bulk marked as ${markAs || status}`,
          metadata: {
            source: "bulk_entry", // Now this is valid after adding to enum
            verificationMethod: "none",
            verifiedBy: req.user._id,
            verifiedAt: new Date()
          },
          totalWorkHours: markAs === "HOLIDAY" || markAs === "ON_LEAVE" ? 0 : shiftTimings.workingHours
        });

        results.successful.push({
          employeeId,
          name: employee.name,
          attendanceId: attendance._id
        });

      } catch (error) {
        results.failed.push({
          employeeId,
          reason: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Bulk attendance marked: ${results.successful.length} successful, ${results.skipped.length} skipped, ${results.failed.length} failed`,
      results
    });

  } catch (error) {
    console.error("Error in bulkMarkAttendance:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET PENDING REGULARIZATION REQUESTS
 * Employees can request to regularize their attendance
 * Admin can view and approve/reject these requests
 */
export const getPendingRegularizations = async (req, res) => {
  try {
    const { page = 1, limit = 20, employeeId, fromDate, toDate } = req.query;

    const query = {
      "regularizationRequest.requested": true,
      "regularizationRequest.status": "PENDING"
    };

    if (employeeId) {
      query.employeeId = employeeId;
    }

    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = new Date(fromDate);
      if (toDate) query.date.$lte = new Date(toDate);
    }

    const regularizations = await TeacherAttendance.find(query)
      .populate('employeeId', 'name email employeeRecord')
      .populate('regularizationRequest.approvedBy', 'name email')
      .sort({ 'regularizationRequest.requestedAt': -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await TeacherAttendance.countDocuments(query);

    res.json({
      success: true,
      regularizations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Error in getPendingRegularizations:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * APPROVE/REJECT REGULARIZATION REQUEST
 */
export const approveRegularizationRequest = async (req, res) => {
  try {
    const { regularizationId } = req.params;
    const { action, reason } = req.body; // action: "APPROVED" or "REJECTED"

    const attendance = await TeacherAttendance.findOne({
      "regularizationRequest._id": regularizationId
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Regularization request not found"
      });
    }

    if (attendance.regularizationRequest.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Request already ${attendance.regularizationRequest.status.toLowerCase()}`
      });
    }

    // Update the request status
    attendance.regularizationRequest.status = action;
    attendance.regularizationRequest.approvedBy = req.user._id;
    attendance.regularizationRequest.approvedAt = new Date();
    
    if (reason) {
      attendance.regularizationRequest.adminRemarks = reason;
    }

    // If approved, update the actual attendance
    if (action === "APPROVED") {
      attendance.status = attendance.regularizationRequest.requestedStatus;
      attendance.notes = (attendance.notes || "") + " [Regularized: " + attendance.regularizationRequest.reason + "]";
      
      // Recalculate if needed
      if (attendance.actualCheckIn?.startTime && attendance.actualCheckOut?.startTime) {
        const diffMs = attendance.actualCheckOut.startTime - attendance.actualCheckIn.startTime;
        attendance.totalWorkHours = diffMs / (1000 * 60 * 60);
      }
    }

    await attendance.save();

    res.json({
      success: true,
      message: `Regularization request ${action.toLowerCase()} successfully`,
      attendance
    });

  } catch (error) {
    console.error("Error in approveRegularizationRequest:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET ATTENDANCE CALENDAR VIEW
 * Returns attendance data formatted for calendar display
 */
export const getAttendanceCalendar = async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required"
      });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const query = {
      date: { $gte: startDate, $lte: endDate }
    };

    if (employeeId && employeeId !== "all") {
      query.employeeId = employeeId;
    }

    const attendanceRecords = await TeacherAttendance.find(query)
      .populate('employeeId', 'name email')
      .sort({ date: 1 });

    // Format for calendar
    const calendarData = attendanceRecords.map(record => ({
      id: record._id,
      title: `${record.employeeName} - ${record.status}`,
      start: record.date,
      allDay: true,
      backgroundColor: getStatusColor(record.status),
      borderColor: getStatusColor(record.status),
      textColor: '#ffffff',
      extendedProps: {
        employeeId: record.employeeId._id,
        employeeName: record.employeeName,
        status: record.status,
        checkIn: record.actualCheckIn?.startTime,
        checkOut: record.actualCheckOut?.startTime,
        workHours: record.totalWorkHours,
        notes: record.notes
      }
    }));

    // Get summary
    const summary = {
      total: attendanceRecords.length,
      present: attendanceRecords.filter(r => r.status === "PRESENT").length,
      absent: attendanceRecords.filter(r => r.status === "ABSENT").length,
      late: attendanceRecords.filter(r => r.status === "LATE").length,
      leave: attendanceRecords.filter(r => r.status === "ON_LEAVE").length,
      halfDay: attendanceRecords.filter(r => r.status === "HALF_DAY").length
    };

    res.json({
      success: true,
      calendarData,
      summary,
      month: parseInt(month),
      year: parseInt(year)
    });

  } catch (error) {
    console.error("Error in getAttendanceCalendar:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET ATTENDANCE STATISTICS
 */
export const getAttendanceStats = async (req, res) => {
  try {
    const { fromDate, toDate, department, employeeId } = req.query;

    const matchStage = {};
    
    if (fromDate || toDate) {
      matchStage.date = {};
      if (fromDate) matchStage.date.$gte = new Date(fromDate);
      if (toDate) matchStage.date.$lte = new Date(toDate);
    }

    if (employeeId) {
      matchStage.employeeId = new mongoose.Types.ObjectId(employeeId);
    }

    const stats = await TeacherAttendance.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "users",
          localField: "employeeId",
          foreignField: "_id",
          as: "employee"
        }
      },
      { $unwind: "$employee" },
      {
        $match: department ? { "employee.employeeRecord.department": department } : {}
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          employees: { $addToSet: "$employeeId" },
          totalWorkHours: { $sum: "$totalWorkHours" },
          avgLateMinutes: { $avg: "$lateMinutes" }
        }
      }
    ]);

    const departmentStats = await TeacherAttendance.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "users",
          localField: "employeeId",
          foreignField: "_id",
          as: "employee"
        }
      },
      { $unwind: "$employee" },
      {
        $group: {
          _id: "$employee.employeeRecord.department",
          totalEmployees: { $addToSet: "$employeeId" },
          present: {
            $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] }
          },
          absent: {
            $sum: { $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0] }
          },
          late: {
            $sum: { $cond: [{ $eq: ["$status", "LATE"] }, 1, 0] }
          },
          leave: {
            $sum: { $cond: [{ $eq: ["$status", "ON_LEAVE"] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          department: "$_id",
          totalEmployees: { $size: "$totalEmployees" },
          present: 1,
          absent: 1,
          late: 1,
          leave: 1,
          attendanceRate: {
            $round: [
              {
                $multiply: [
                  { $divide: ["$present", { $add: ["$present", "$absent", "$late"] }] },
                  100
                ]
              },
              2
            ]
          }
        }
      }
    ]);

    res.json({
      success: true,
      summary: stats,
      byDepartment: departmentStats
    });

  } catch (error) {
    console.error("Error in getAttendanceStats:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to get color based on status
function getStatusColor(status) {
  const colors = {
    PRESENT: '#10b981', // green
    ABSENT: '#ef4444',  // red
    LATE: '#f59e0b',    // yellow/orange
    ON_LEAVE: '#3b82f6', // blue
    HALF_DAY: '#8b5cf6', // purple
    WORK_FROM_HOME: '#06b6d4', // cyan
    ON_DUTY: '#f97316', // orange
    HOLIDAY: '#6b7280'  // gray
  };
  return colors[status] || '#6b7280';
}

/**
 * CHECK EXISTING ATTENDANCES
 * Used by bulk attendance dialog to filter out employees who already have attendance
 */
export const checkExistingAttendances = async (req, res) => {
  try {
    const { date, employeeIds } = req.query;
    
    if (!date || !employeeIds) {
      return res.status(400).json({
        success: false,
        message: "Date and employeeIds are required"
      });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    
    const ids = employeeIds.split(',');
    
    const existingAttendances = await TeacherAttendance.find({
      employeeId: { $in: ids },
      date: {
        $gte: attendanceDate,
        $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
      }
    }).select('employeeId');
    
    const existingEmployeeIds = existingAttendances.map(att => att.employeeId.toString());
    
    res.json({
      success: true,
      existingEmployeeIds
    });
    
  } catch (error) {
    console.error("Error in checkExistingAttendances:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};