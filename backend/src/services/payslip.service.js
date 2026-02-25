// services/payslip.service.js
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure payslip directory exists
const PAYSLIP_DIR = path.join(__dirname, "../uploads/payslips");
if (!fs.existsSync(PAYSLIP_DIR)) {
  fs.mkdirSync(PAYSLIP_DIR, { recursive: true });
}

// Format currency
const formatCurrency = (amount) => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

// Generate PDF using PDFKit
export const generatePayslipPDF = async (payslipData) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4'
      });
      
      // Generate filename
      const filename = `payslip_${payslipData.employeeId_number || 'emp'}_${payslipData.month}_${payslipData.year}_${Date.now()}.pdf`;
      const filepath = path.join(PAYSLIP_DIR, filename);
      
      // Pipe the PDF to a file
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);
      
      // Helper function to draw a line
      const drawLine = (y) => {
        doc.strokeColor("#cccccc").lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
      };
      
      // Helper function to draw a table row
      const drawTableRow = (y, label, value, isTotal = false) => {
        doc.fontSize(10);
        if (isTotal) {
          doc.font("Helvetica-Bold");
        } else {
          doc.font("Helvetica");
        }
        doc.text(label, 70, y);
        doc.text(value, 450, y, { align: "right" });
      };
      
      // ========== HEADER ==========
      doc.fontSize(20).font("Helvetica-Bold").text(payslipData.companyDetails.name || "Learning Management System", 50, 50, { align: "center" });
      doc.fontSize(14).text(`Salary Payslip for ${payslipData.month} ${payslipData.year}`, 50, 80, { align: "center" });
      
      // Company details
      doc.fontSize(8).font("Helvetica").text(
        `${payslipData.companyDetails.address || ''}\nPAN: ${payslipData.companyDetails.pan || 'N/A'} | TAN: ${payslipData.companyDetails.tan || 'N/A'}\nGST: ${payslipData.companyDetails.gst || 'N/A'}`,
        50, 110,
        { align: "center" }
      );
      
      drawLine(150);
      
      // ========== EMPLOYEE DETAILS ==========
      doc.fontSize(12).font("Helvetica-Bold").text("Employee Details", 50, 170);
      
      // Employee details box
      doc.rect(50, 190, 500, 100).strokeColor("#e0e0e0").stroke();
      
      // Employee details grid
      doc.fontSize(10).font("Helvetica");
      doc.text("Name:", 70, 210);
      doc.font("Helvetica-Bold").text(payslipData.employeeName, 150, 210);
      
      doc.font("Helvetica").text("Employee ID:", 70, 230);
      doc.font("Helvetica-Bold").text(payslipData.employeeId_number || 'N/A', 150, 230);
      
      doc.font("Helvetica").text("Email:", 70, 250);
      doc.font("Helvetica-Bold").text(payslipData.employeeEmail, 150, 250);
      
      doc.font("Helvetica").text("Pay Period:", 320, 210);
      doc.font("Helvetica-Bold").text(`${payslipData.month} ${payslipData.year}`, 420, 210);
      
      doc.font("Helvetica").text("Payment Date:", 320, 230);
      doc.font("Helvetica-Bold").text(new Date(payslipData.paymentDate).toLocaleDateString('en-IN'), 420, 230);
      
      doc.font("Helvetica").text("Status:", 320, 250);
      doc.font("Helvetica-Bold").fillColor("#28a745").text(payslipData.paymentStatus, 420, 250);
      doc.fillColor("#000000");
      
      drawLine(300);
      
      // ========== EARNINGS TABLE ==========
      doc.fontSize(12).font("Helvetica-Bold").text("Earnings", 50, 320);
      
      // Table headers
      doc.rect(50, 340, 500, 20).fillColor("#f0f0f0").fill();
      doc.fillColor("#000000").fontSize(10).font("Helvetica-Bold");
      doc.text("Component", 70, 345);
      doc.text("Amount (₹)", 450, 345, { align: "right" });
      
      let yPos = 370;
      
      // Earnings rows
      const earnings = payslipData.earnings;
      drawTableRow(yPos, "Basic Salary", formatCurrency(earnings.basic || 0));
      yPos += 20;
      drawTableRow(yPos, "House Rent Allowance (HRA)", formatCurrency(earnings.hra || 0));
      
      if (earnings.da) {
        yPos += 20;
        drawTableRow(yPos, "Dearness Allowance (DA)", formatCurrency(earnings.da));
      }
      
      if (earnings.ta) {
        yPos += 20;
        drawTableRow(yPos, "Travel Allowance (TA)", formatCurrency(earnings.ta));
      }
      
      if (earnings.specialAllowance) {
        yPos += 20;
        drawTableRow(yPos, "Special Allowance", formatCurrency(earnings.specialAllowance));
      }
      
      if (earnings.bonus) {
        yPos += 20;
        drawTableRow(yPos, "Bonus", formatCurrency(earnings.bonus));
      }
      
      // Total Earnings
      yPos += 20;
      drawLine(yPos - 5);
      drawTableRow(yPos, "Total Earnings", formatCurrency(earnings.totalEarnings), true);
      
      // ========== DEDUCTIONS TABLE ==========
      yPos += 30;
      doc.fontSize(12).font("Helvetica-Bold").text("Deductions", 50, yPos);
      
      yPos += 20;
      
      // Table headers
      doc.rect(50, yPos, 500, 20).fillColor("#f0f0f0").fill();
      doc.fillColor("#000000").fontSize(10).font("Helvetica-Bold");
      doc.text("Component", 70, yPos + 5);
      doc.text("Amount (₹)", 450, yPos + 5, { align: "right" });
      
      yPos += 30;
      
      const deductions = payslipData.deductions;
      drawTableRow(yPos, "Provident Fund (PF)", formatCurrency(deductions.pf || 0));
      yPos += 20;
      drawTableRow(yPos, "Tax Deducted at Source (TDS)", formatCurrency(deductions.tax || 0));
      
      if (deductions.professionalTax) {
        yPos += 20;
        drawTableRow(yPos, "Professional Tax", formatCurrency(deductions.professionalTax));
      }
      
      if (deductions.loan) {
        yPos += 20;
        drawTableRow(yPos, "Loan Deduction", formatCurrency(deductions.loan));
      }
      
      // Total Deductions
      yPos += 20;
      drawLine(yPos - 5);
      drawTableRow(yPos, "Total Deductions", formatCurrency(deductions.totalDeductions), true);
      
      // ========== NET SALARY ==========
      yPos += 30;
      doc.rect(50, yPos, 500, 40).fillColor("#e6f3ff").fill();
      doc.fillColor("#0070f3").fontSize(14).font("Helvetica-Bold");
      doc.text("Net Salary:", 70, yPos + 12);
      doc.text(formatCurrency(payslipData.netSalary), 450, yPos + 12, { align: "right" });
      
      // ========== BANK DETAILS ==========
      yPos += 60;
      doc.fillColor("#000000").fontSize(10).font("Helvetica-Bold").text("Bank Details:", 50, yPos);
      doc.font("Helvetica").fontSize(9);
      
      const bank = payslipData.bankDetails;
      doc.text(
        `Account Number: ${bank.accountNumber || 'N/A'}\nIFSC Code: ${bank.ifscCode || 'N/A'}\nBank: ${bank.bankName || 'N/A'}`,
        50, yPos + 15
      );
      
      // ========== FOOTER ==========
      doc.fontSize(8).fillColor("#999999");
      doc.text(
        "This is a system generated payslip and does not require signature.",
        50, 750,
        { align: "center" }
      );
      doc.text(
        `Generated on: ${new Date().toLocaleString('en-IN')}`,
        50, 770,
        { align: "center" }
      );
      
      // Finalize the PDF
      doc.end();
      
      // Resolve with the file URL when stream is finished
      stream.on('finish', () => {
        resolve(`/uploads/payslips/${filename}`);
      });
      
      stream.on('error', (error) => {
        reject(error);
      });
      
    } catch (error) {
      reject(error);
    }
  });
};

// Bulk generate payslips for all employees
export const generateMonthlyPayslips = async (month, year) => {
  try {
    const User = mongoose.model('User');
    
    // Find all employees (teachers and faculty admins)
    const employees = await User.find({
      role: { $in: ['TEACHER', 'FACULTY_ADMIN'] },
      employeeRecord: { $exists: true }
    });
    
    const results = [];
    
    for (const employee of employees) {
      try {
        // Check if payslip already exists
        const Payslip = mongoose.model('Payslip');
        const existing = await Payslip.findOne({
          employeeId: employee._id,
          month,
          year
        });
        
        if (existing) {
          results.push({
            employee: employee.name,
            status: 'skipped',
            message: 'Payslip already exists'
          });
          continue;
        }
        
        const salary = employee.employeeRecord.salary;
        const totalEarnings = (salary.basic || 0) + (salary.hra || 0) + 
                             (salary.da || 0) + (salary.ta || 0);
        const totalDeductions = (salary.pf || 0) + (salary.tax || 0);
        const netSalary = totalEarnings - totalDeductions;
        
        // Create payslip data
        const payslipData = {
          employeeId: employee._id,
          employeeName: employee.name,
          employeeEmail: employee.email,
          employeeId_number: employee.employeeRecord?.employeeId,
          month,
          year,
          earnings: {
            basic: salary.basic || 0,
            hra: salary.hra || 0,
            da: salary.da || 0,
            ta: salary.ta || 0,
            totalEarnings,
          },
          deductions: {
            pf: salary.pf || 0,
            tax: salary.tax || 0,
            totalDeductions,
          },
          netSalary,
          bankDetails: salary.bankAccount || {},
          companyDetails: {
            name: process.env.COMPANY_NAME || "Learning Management System",
            pan: process.env.COMPANY_PAN,
            tan: process.env.COMPANY_TAN,
            gst: process.env.COMPANY_GST,
          },
          paymentDate: new Date(),
          paymentStatus: 'PROCESSED',
        };
        
        // Generate PDF
        const pdfUrl = await generatePayslipPDF(payslipData);
        
        // Save to database
        const payslip = await Payslip.create({
          ...payslipData,
          pdfUrl,
          pdfGeneratedAt: new Date(),
        });
        
        results.push({
          employee: employee.name,
          status: 'success',
          payslipId: payslip._id
        });
      } catch (error) {
        results.push({
          employee: employee.name,
          status: 'error',
          error: error.message
        });
      }
    }
    
    return results;
  } catch (error) {
    throw error;
  }
};