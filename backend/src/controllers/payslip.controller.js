// controllers/payslip.controller.js
import Payslip from "../models/Payslip.model.js";
import User from "../models/User.model.js";
import { generatePayslipPDF, generateMonthlyPayslips } from "../services/payslip.service.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate single payslip
// controllers/payslip.controller.js - Update the generatePayslip function

export const generatePayslip = async (req, res) => {
  try {
    const { employeeId, month, year, earnings, deductions, notes } = req.body;

    const employee = await User.findById(employeeId);
    if (!employee || !["TEACHER", "FACULTY_ADMIN"].includes(employee.role)) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check if payslip already exists
    const existingPayslip = await Payslip.findOne({
      employeeId,
      month,
      year,
    });

    if (existingPayslip) {
      return res.status(400).json({ message: "Payslip already exists for this month" });
    }

    const totalEarnings = Object.values(earnings).reduce((a, b) => a + (b || 0), 0);
    const totalDeductions = Object.values(deductions).reduce((a, b) => a + (b || 0), 0);
    const netSalary = totalEarnings - totalDeductions;

    // Prepare payslip data
    const payslipData = {
      employeeId: employee._id,
      employeeName: employee.name,
      employeeEmail: employee.email,
      employeeId_number: employee.employeeRecord?.employeeId,
      month,
      year,
      earnings: {
        ...earnings,
        totalEarnings,
      },
      deductions: {
        ...deductions,
        totalDeductions,
      },
      netSalary,
      bankDetails: employee.employeeRecord?.salary?.bankAccount || {},
      companyDetails: {
        name: process.env.COMPANY_NAME || "Learning Management System",
        pan: process.env.COMPANY_PAN,
        tan: process.env.COMPANY_TAN,
        gst: process.env.COMPANY_GST,
      },
      paymentDate: new Date(),
      paymentStatus: 'PROCESSED',
      generatedBy: req.user._id,
      notes,
    };

    // Generate PDF
    const pdfUrl = await generatePayslipPDF(payslipData);

    // Save to database
    const payslip = await Payslip.create({
      ...payslipData,
      pdfUrl,
      pdfGeneratedAt: new Date(),
    });

    res.status(201).json(payslip);
  } catch (error) {
    console.error('Payslip generation error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Generate payslips for all employees (monthly)
export const generateMonthlyPayslipsBatch = async (req, res) => {
  try {
    const { month, year } = req.body;
    
    const results = await generateMonthlyPayslips(month, year);
    
    res.json({
      message: `Generated payslips for ${results.filter(r => r.status === 'success').length} employees`,
      results,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all payslips
export const getPayslips = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year, month, status } = req.query;

    const query = {};
    if (employeeId) query.employeeId = employeeId;
    if (year) query.year = parseInt(year);
    if (month) query.month = month;
    if (status) query.paymentStatus = status;

    const payslips = await Payslip.find(query)
      .populate("employeeId", "name email employeeRecord.employeeId")
      .populate("generatedBy", "name")
      .sort({ year: -1, month: -1 });

    res.json(payslips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get payslip by ID
export const getPayslipById = async (req, res) => {
  try {
    const payslip = await Payslip.findById(req.params.id)
      .populate("employeeId", "name email employeeRecord.employeeId")
      .populate("generatedBy", "name");

    if (!payslip) {
      return res.status(404).json({ message: "Payslip not found" });
    }

    res.json(payslip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download payslip PDF
export const downloadPayslip = async (req, res) => {
  try {
    const payslip = await Payslip.findById(req.params.id);

    if (!payslip || !payslip.pdfUrl) {
      return res.status(404).json({ message: "Payslip PDF not found" });
    }

    // Extract filename from URL
    const filename = payslip.pdfUrl.split('/').pop();
    const filepath = path.join(__dirname, '../uploads/payslips', filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ message: "PDF file not found" });
    }

    // Track download
    payslip.isDownloaded = true;
    payslip.downloadedAt = new Date();
    payslip.downloadedBy = req.user._id;
    await payslip.save();

    res.download(filepath, `payslip_${payslip.month}_${payslip.year}.pdf`);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get payroll summary
export const getPayrollSummary = async (req, res) => {
  try {
    const { year, month } = req.query;

    const matchStage = {};
    if (year) matchStage.year = parseInt(year);
    if (month) matchStage.month = month;

    const summary = await Payslip.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: "$year",
            month: "$month",
          },
          totalPayroll: { $sum: "$netSalary" },
          avgSalary: { $avg: "$netSalary" },
          count: { $sum: 1 },
          salaries: { $push: "$netSalary" },
          employees: { $addToSet: "$employeeId" },
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          totalPayroll: { $round: ["$totalPayroll", 2] },
          avgSalary: { $round: ["$avgSalary", 2] },
          count: 1,
          minSalary: { $min: "$salaries" },
          maxSalary: { $max: "$salaries" },
          uniqueEmployees: { $size: "$employees" },
        },
      },
      { $sort: { year: -1, month: -1 } },
    ]);

    // Get monthly comparison
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    const prevMonthStr = previousMonth.toLocaleString('default', { month: 'long' });
    const prevYear = previousMonth.getFullYear();

    const previousTotal = await Payslip.aggregate([
      {
        $match: {
          month: prevMonthStr,
          year: prevYear,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$netSalary" },
        },
      },
    ]);

    const currentTotal = summary[0]?.totalPayroll || 0;
    const previousTotalValue = previousTotal[0]?.total || 0;
    
    const growth = previousTotalValue > 0 
      ? ((currentTotal - previousTotalValue) / previousTotalValue * 100).toFixed(2)
      : 0;

    res.json({
      monthly: summary,
      comparison: {
        previousMonth: prevMonthStr,
        previousYear: prevYear,
        previousTotal: previousTotalValue,
        currentTotal,
        growth: parseFloat(growth),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update payslip status
export const updatePayslipStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const payslip = await Payslip.findById(req.params.id);

    if (!payslip) {
      return res.status(404).json({ message: "Payslip not found" });
    }

    payslip.paymentStatus = status;
    if (status === 'PAID') {
      payslip.paymentDate = new Date();
    }

    await payslip.save();

    res.json(payslip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete payslip
export const deletePayslip = async (req, res) => {
  try {
    const payslip = await Payslip.findById(req.params.id);

    if (!payslip) {
      return res.status(404).json({ message: "Payslip not found" });
    }

    // Delete PDF file if exists
    if (payslip.pdfUrl) {
      const filename = payslip.pdfUrl.split('/').pop();
      const filepath = path.join(__dirname, '../uploads/payslips', filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }

    await payslip.deleteOne();

    res.json({ message: "Payslip deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};