// controllers/teacher.attendance.controller.js
import TeacherAttendance from "../models/TeacherAttendance.model.js";
import AttendanceQR from "../models/AttendanceQR.model.js";
import Geofence from "../models/Geofence.model.js";
import User from "../models/User.model.js";
import { getDistance } from "geolib";
import TeacherAttendanceModel from "../models/TeacherAttendance.model.js";

// Helper function to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  return getDistance(
    { latitude: lat1, longitude: lon1 },
    { latitude: lat2, longitude: lon2 }
  );
};

// Check if location is within geofence
const checkGeofence = async (latitude, longitude, employeeId, classroomId) => {
  const geofences = await Geofence.find({
    isActive: true,
    $or: [
      { "applicableTo.allTeachers": true },
      { "applicableTo.allFacultyAdmins": true },
      { "applicableTo.specificEmployees": employeeId },
      { "applicableTo.specificClassrooms": classroomId },
    ],
  });

  for (const geofence of geofences) {
    const distance = calculateDistance(
      latitude,
      longitude,
      geofence.location.coordinates[1],
      geofence.location.coordinates[0]
    );
    
    if (distance <= geofence.radius) {
      return {
        isWithin: true,
        geofence: geofence.name,
        distance,
      };
    }
  }

  return {
    isWithin: false,
    geofence: null,
    distance: null,
  };
};

// controllers/teacher.attendance.controller.js
// Update the checkIn function

export const checkIn = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      accuracy,
      altitude,
      speed,
      heading,
      address,
      deviceInfo,
      wifiInfo,
      batteryLevel,
      method = "gps",
      classroomId,
      qrCode,
    } = req.body;

    // Get the full user from database using the ID from req.user
    const employee = await User.findById(req.user.id);
    
    if (!employee) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get employee's shift timings
    const shiftTimings = employee.employeeRecord?.shiftTimings || {
      start: "09:00",
      end: "17:00",
      gracePeriod: 15,
      workingHours: 8
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existingAttendance = await TeacherAttendance.findOne({
      employeeId: employee._id,
      date: today,
    });

    if (existingAttendance && existingAttendance.actualCheckIn) {
      return res.status(400).json({
        message: "Already checked in today",
        attendance: existingAttendance,
      });
    }

    // Validate QR code if provided
    let qrData = null;
    if (qrCode) {
      qrData = await AttendanceQR.findOne({
        code: qrCode,
        isActive: true,
        validFrom: { $lte: new Date() },
        validUntil: { $gte: new Date() },
      });

      if (!qrData) {
        return res.status(400).json({ message: "Invalid or expired QR code" });
      }

      if (qrData.currentUses >= qrData.maxUses) {
        return res.status(400).json({ message: "QR code has reached maximum uses" });
      }
    }

    // Check geofence
    const geofenceCheck = await checkGeofence(
      latitude,
      longitude,
      employee._id,
      classroomId
    );

    const session = {
      startTime: new Date(),
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      accuracy,
      altitude,
      speed,
      heading,
      address: address || {},
      deviceInfo: deviceInfo || {},
      wifiInfo: wifiInfo || {},
      batteryLevel,
      isWithinGeofence: geofenceCheck.isWithin,
      checkInMethod: qrCode ? "qr_scan" : method,
    };

    // Determine status based on employee's shift timings
    const checkInTime = new Date();
    const [schedHour, schedMin] = shiftTimings.start.split(':').map(Number);
    
    // Create scheduled start time for today
    const scheduledStart = new Date();
    scheduledStart.setHours(schedHour, schedMin, 0, 0);

    let status = "PRESENT";
    let lateMinutes = 0;
    
    // Calculate if employee is late
    if (checkInTime > scheduledStart) {
      const diffMinutes = Math.round((checkInTime.getTime() - scheduledStart.getTime()) / (1000 * 60));
      
      // Check if beyond grace period
      if (diffMinutes > shiftTimings.gracePeriod) {
        lateMinutes = diffMinutes;
        status = "LATE";
      }
    }

    // Check if employee is checking in on a holiday/weekend? (Optional)
    // You could add holiday checking logic here

    // Create attendance data object with shift timings
    const attendanceData = {
      employeeId: employee._id,
      employeeName: employee.name,
      employeeEmail: employee.email,
      employeeRole: employee.role,
      date: today,
      status,
      lateMinutes,
      scheduledStartTime: shiftTimings.start, // Store employee's shift start time
      scheduledEndTime: shiftTimings.end,     // Store employee's shift end time
      actualCheckIn: session,
      sessions: [session],
      markedBy: employee._id,
      metadata: {
        source: qrCode ? "qr_scanner" : "web_app",
        verificationMethod: qrCode ? "qr_code" : "none",
        verifiedBy: null,
        verifiedAt: null,
      },
    };

    // Add geofence info if within zone
    if (geofenceCheck.isWithin) {
      attendanceData.geofenceZones = [{
        name: geofenceCheck.geofence,
        center: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        radius: geofenceCheck.distance,
        enteredAt: new Date(),
      }];
    }

    let attendance;
    if (existingAttendance) {
      attendance = await TeacherAttendance.findByIdAndUpdate(
        existingAttendance._id,
        { $set: attendanceData },
        { new: true, runValidators: true }
      );
    } else {
      attendance = await TeacherAttendance.create(attendanceData);
    }

    // Update QR code usage
    if (qrData) {
      qrData.currentUses += 1;
      qrData.usedBy.push({
        employeeId: employee._id,
        usedAt: new Date(),
        location: {
          coordinates: [longitude, latitude],
          accuracy,
        },
      });
      await qrData.save();
    }

    // Prepare response with shift information
    res.status(201).json({
      success: true,
      message: "Check-in successful",
      attendance: {
        ...attendance.toObject(),
        shiftInfo: {
          scheduledStart: shiftTimings.start,
          scheduledEnd: shiftTimings.end,
          gracePeriod: shiftTimings.gracePeriod,
          workingHours: shiftTimings.workingHours,
          lateMinutes,
          status,
        },
      },
      geofenceStatus: geofenceCheck,
      shiftStatus: {
        onTime: lateMinutes === 0,
        lateBy: lateMinutes > 0 ? lateMinutes : 0,
        gracePeriodUsed: lateMinutes > 0 && lateMinutes <= shiftTimings.gracePeriod,
      },
    });
  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Also update checkOut function
export const checkOut = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      accuracy,
      altitude,
      address,
      deviceInfo,
    } = req.body;

    const employee = await User.findById(req.user.id);
    
    if (!employee) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get employee's shift timings
    const shiftTimings = employee.employeeRecord?.shiftTimings || {
      start: "09:00",
      end: "17:00",
      gracePeriod: 15,
      workingHours: 8
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's attendance
    const attendance = await TeacherAttendance.findOne({
      employeeId: employee._id,
      date: today,
    });

    if (!attendance) {
      return res.status(404).json({ message: "No check-in found for today" });
    }

    if (attendance.actualCheckOut) {
      return res.status(400).json({ message: "Already checked out today" });
    }

    // Create check-out session
    const checkOutTime = new Date();
    const checkOutSession = {
      startTime: checkOutTime,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      accuracy,
      altitude,
      address: address || {},
      deviceInfo: deviceInfo || {},
    };

    attendance.actualCheckOut = checkOutSession;
    attendance.sessions.push(checkOutSession);

    // Calculate total work hours
    if (attendance.actualCheckIn) {
      const checkInTime = attendance.actualCheckIn.startTime;
      const diffMs = checkOutTime - checkInTime;
      attendance.totalWorkHours = diffMs / (1000 * 60 * 60);
    }

    // Calculate early departure based on shift end time
    const [schedHour, schedMin] = shiftTimings.end.split(':').map(Number);
    const scheduledEnd = new Date();
    scheduledEnd.setHours(schedHour, schedMin, 0, 0);

    if (checkOutTime < scheduledEnd) {
      const earlyMinutes = Math.round((scheduledEnd.getTime() - checkOutTime.getTime()) / (1000 * 60));
      attendance.earlyDepartureMinutes = earlyMinutes;
      
      // Optionally update status if left early
      if (earlyMinutes > shiftTimings.gracePeriod && attendance.status === "PRESENT") {
        // Could set to HALF_DAY or keep as is based on your business logic
        // attendance.status = "HALF_DAY";
      }
    }

    await attendance.save();

    res.json({
      success: true,
      message: "Check-out successful",
      attendance: {
        ...attendance.toObject(),
        shiftInfo: {
          scheduledEnd: shiftTimings.end,
          earlyDeparture: attendance.earlyDepartureMinutes,
          totalWorkHours: attendance.formattedWorkHours,
        },
      },
    });
  } catch (error) {
    console.error("Check-out error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Generate QR code for attendance
export const generateAttendanceQR = async (req, res) => {
  try {
    const {
      classroomId,
      validHours = 1,
      maxUses = 1,
      latitude,
      longitude,
      geofenceRadius = 100,
    } = req.body;

    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + validHours);

    const qrData = await AttendanceQR.create({
      classroomId,
      generatedBy: req.user.id,
      validUntil,
      maxUses,
      location: latitude && longitude ? {
        type: "Point",
        coordinates: [longitude, latitude],
      } : undefined,
      geofenceRadius,
    });

    // Generate QR code URL
    const qrCodeUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/attendance/scan/${qrData.code}`;

    res.status(201).json({
      message: "QR code generated successfully",
      qrCode: qrData.code,
      qrCodeUrl,
      validUntil,
    });
  } catch (error) {
    console.error("QR generation error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get today's attendance
export const getTodayAttendance = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await TeacherAttendance.findOne({
      employeeId,
      date: today,
    });
    
    if (!attendance) {
      return res.status(404).json({ message: "No attendance record for today" });
    }
    
    // Add formatted work hours if needed
    const attendanceObj = attendance.toObject();
    if (attendance.totalWorkHours) {
      const hours = Math.floor(attendance.totalWorkHours);
      const minutes = Math.round((attendance.totalWorkHours - hours) * 60);
      attendanceObj.formattedWorkHours = `${hours}h ${minutes}m`;
    }
    
    res.json(attendanceObj);
  } catch (error) {
    console.error("Get today attendance error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get attendance history
export const getAttendanceHistory = async (req, res) => {
  try {
    // If employeeId is provided in params, use that (for admin viewing)
    // Otherwise, use the logged-in user's ID (for teacher viewing their own)
    const employeeId = req.params.employeeId || req.user.id;
    
    const { startDate, endDate, status } = req.query;

    const query = { employeeId };
    
    if (status) query.status = status;
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendance = await TeacherAttendance.find(query)
      .populate("employeeId", "name email")
      .populate("markedBy", "name")
      .sort({ date: -1 });

    // Add formatted work hours
    const formattedAttendance = attendance.map(record => {
      const recordObj = record.toObject();
      if (record.totalWorkHours) {
        const hours = Math.floor(record.totalWorkHours);
        const minutes = Math.round((record.totalWorkHours - hours) * 60);
        recordObj.formattedWorkHours = `${hours}h ${minutes}m`;
      }
      return recordObj;
    });

    res.json(formattedAttendance);
  } catch (error) {
    console.error("Get attendance history error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get live location tracking
export const getLiveLocation = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await TeacherAttendance.findOne({
      employeeId,
      date: today,
      actualCheckIn: { $exists: true },
      actualCheckOut: { $exists: false },
    }).populate("employeeId", "name email");

    if (!attendance) {
      return res.status(404).json({ message: "Employee is not checked in or already checked out" });
    }

    const sessionDuration = Math.floor((Date.now() - new Date(attendance.actualCheckIn.startTime).getTime()) / 60000);

    res.json({
      employee: attendance.employeeId,
      checkInTime: attendance.actualCheckIn.startTime,
      lastLocation: attendance.actualCheckIn.location,
      lastAddress: attendance.actualCheckIn.address?.formattedAddress,
      sessionDuration, // in minutes
    });
  } catch (error) {
    console.error("Get live location error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Create geofence
export const createGeofence = async (req, res) => {
  try {
    const {
      name,
      description,
      latitude,
      longitude,
      radius,
      address,
      applicableTo,
      timeRestrictions,
    } = req.body;

    const geofence = await Geofence.create({
      name,
      description,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      radius,
      address,
      applicableTo: applicableTo || {
        allTeachers: true,
        allFacultyAdmins: true,
      },
      timeRestrictions,
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: "Geofence created successfully",
      geofence,
    });
  } catch (error) {
    console.error("Create geofence error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get attendance analytics with location data
export const getAttendanceAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const analytics = await TeacherAttendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            employeeId: "$employeeId",
            employeeName: "$employeeName",
          },
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] },
          },
          lateDays: {
            $sum: { $cond: [{ $eq: ["$status", "LATE"] }, 1, 0] },
          },
          absentDays: {
            $sum: { $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0] },
          },
          averageWorkHours: { $avg: "$totalWorkHours" },
          totalWorkHours: { $sum: "$totalWorkHours" },
          // Location based
          geoTaggedEntries: {
            $sum: { $cond: [{ $gt: ["$actualCheckIn.location.coordinates", null] }, 1, 0] },
          },
          withinGeofenceCount: {
            $sum: { $cond: ["$actualCheckIn.isWithinGeofence", 1, 0] },
          },
        },
      },
      {
        $project: {
          employeeName: "$_id.employeeName",
          totalDays: 1,
          presentDays: 1,
          lateDays: 1,
          absentDays: 1,
          attendanceRate: {
            $multiply: [
              { $divide: ["$presentDays", "$totalDays"] },
              100,
            ],
          },
          averageWorkHours: { $round: ["$averageWorkHours", 2] },
          totalWorkHours: { $round: ["$totalWorkHours", 2] },
          geoTaggedPercentage: {
            $multiply: [
              { $divide: ["$geoTaggedEntries", "$totalDays"] },
              100,
            ],
          },
          geofenceCompliance: {
            $multiply: [
              { $divide: ["$withinGeofenceCount", "$geoTaggedEntries"] },
              100,
            ],
          },
        },
      },
      { $sort: { attendanceRate: -1 } },
    ]);

    // Overall statistics
    const overall = await TeacherAttendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          averageAttendanceRate: { $avg: "$status" },
          totalWorkHours: { $sum: "$totalWorkHours" },
          averageWorkHours: { $avg: "$totalWorkHours" },
          geoTaggedTotal: {
            $sum: { $cond: [{ $gt: ["$actualCheckIn.location.coordinates", null] }, 1, 0] },
          },
        },
      },
    ]);

    res.json({
      employeeAnalytics: analytics,
      overall: overall[0] || {
        totalRecords: 0,
        averageAttendanceRate: 0,
        totalWorkHours: 0,
        averageWorkHours: 0,
        geoTaggedTotal: 0,
      },
    });
  } catch (error) {
    console.error("Get attendance analytics error:", error);
    res.status(500).json({ message: error.message });
  }
};