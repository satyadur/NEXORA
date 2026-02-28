import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const generateCertificatePdf = async ({
  studentName,
  courseName,
  certificateId,
  qrCode,
  issueDate = new Date(),
  studentGrade,
  studentPercentage,
  instructorName = "Academic Director",
  duration,
}) => {

  const dir = path.join(process.cwd(), "public", "certificates");

  // Create folder if not exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filePath = path.join(dir, `${certificateId}.pdf`);
  const publicUrl = `/certificates/${certificateId}.pdf`;

  // Create a new PDF document with custom size for certificate
  const doc = new PDFDocument({
    layout: "landscape",
    size: "A4",
    margins: {
      top: 30,
      bottom: 30,
      left: 40,
      right: 40
    },
    info: {
      Title: `Certificate of Completion - ${studentName}`,
      Author: "Nexora Institute",
      Subject: "Course Completion Certificate",
      Keywords: "certificate, completion, education, nexora",
      CreationDate: new Date()
    }
  });

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Add subtle background pattern
  drawBackgroundPattern(doc);

  // Add decorative borders
  drawDecorativeBorders(doc);

  // Add company logo
  await addLogo(doc);

  // Add gold seal/stamp effect
  addGoldSeal(doc);

  // Main content - Adjusted Y coordinates to fit on one page
  addCertificateContent(doc, {
    studentName,
    courseName,
    certificateId,
    issueDate,
    studentGrade,
    studentPercentage,
    instructorName,
    duration
  });

  // Add QR code
  await addQRCode(doc, qrCode, certificateId);

  // Add footer
  addFooter(doc, certificateId);

  // Finalize the PDF
  doc.end();

  return publicUrl;
};

// Helper function to draw subtle background pattern
function drawBackgroundPattern(doc) {
  doc.save();

  // Draw diagonal lines pattern
  for (let i = -100; i < doc.page.width + 100; i += 30) {
    doc
      .moveTo(i, -50)
      .lineTo(i - 50, doc.page.height + 50)
      .lineWidth(0.5)
      .strokeColor("#e9ecef")
      .stroke();
  }

  doc.restore();
}

// Helper function to draw decorative borders
function drawDecorativeBorders(doc) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = 20;

  doc.save();

  // Outer gold border
  doc
    .rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2)
    .lineWidth(2)
    .strokeColor("#bf9b30")
    .stroke();

  // Inner border
  doc
    .rect(margin + 8, margin + 8, pageWidth - (margin + 8) * 2, pageHeight - (margin + 8) * 2)
    .lineWidth(0.5)
    .strokeColor("#d4af37")
    .stroke();

  // Corner decorations
  const cornerSize = 30;
  
  // Top-left corner
  doc
    .moveTo(margin + 10, margin + 10)
    .lineTo(margin + cornerSize, margin + 10)
    .moveTo(margin + 10, margin + 10)
    .lineTo(margin + 10, margin + cornerSize)
    .lineWidth(1.5)
    .strokeColor("#bf9b30")
    .stroke();

  // Top-right corner
  doc
    .moveTo(pageWidth - margin - 10, margin + 10)
    .lineTo(pageWidth - margin - cornerSize, margin + 10)
    .moveTo(pageWidth - margin - 10, margin + 10)
    .lineTo(pageWidth - margin - 10, margin + cornerSize)
    .stroke();

  // Bottom-left corner
  doc
    .moveTo(margin + 10, pageHeight - margin - 10)
    .lineTo(margin + cornerSize, pageHeight - margin - 10)
    .moveTo(margin + 10, pageHeight - margin - 10)
    .lineTo(margin + 10, pageHeight - margin - cornerSize)
    .stroke();

  // Bottom-right corner
  doc
    .moveTo(pageWidth - margin - 10, pageHeight - margin - 10)
    .lineTo(pageWidth - margin - cornerSize, pageHeight - margin - 10)
    .moveTo(pageWidth - margin - 10, pageHeight - margin - 10)
    .lineTo(pageWidth - margin - 10, pageHeight - margin - cornerSize)
    .stroke();

  doc.restore();
}

// Helper function to add logo
async function addLogo(doc) {
  try {
    doc.save();
    
    // Add Nexora logo as text with styling
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor("#1a2b4c")
      .text("NEXORA", 70, 50, { align: "left" })
      .fontSize(10)
      .font('Helvetica')
      .fillColor("#666666")
      .text("Institute of Excellence", 70, 75, { align: "left" });

    // Add a small decorative element
    doc
      .rect(70, 88, 150, 1.5)
      .fillColor("#d4af37")
      .fill();

    doc.restore();
  } catch (error) {
    console.error("Error adding logo:", error);
  }
}

// Helper function to add gold seal/stamp
function addGoldSeal(doc) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  doc.save();

  // Draw circular seal in bottom right
  const sealX = pageWidth - 120;
  const sealY = pageHeight - 120;

  // Outer circle
  doc
    .circle(sealX, sealY, 35)
    .lineWidth(1.5)
    .strokeColor("#bf9b30")
    .stroke();

  // Inner circle
  doc
    .circle(sealX, sealY, 25)
    .lineWidth(0.5)
    .strokeColor("#d4af37")
    .stroke();

  // Add text in circle
  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor("#bf9b30")
    .text("VERIFIED", sealX - 20, sealY - 8, { width: 40, align: "center" })
    .text("AUTHENTIC", sealX - 20, sealY, { width: 40, align: "center" });

  doc.restore();
}

// Helper function to add main certificate content
function addCertificateContent(doc, { 
  studentName, 
  courseName, 
  issueDate,
  studentGrade,
  studentPercentage,
  instructorName,
  duration 
}) {
  const pageWidth = doc.page.width;
  const formattedDate = issueDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  doc.save();

  // Certificate title - Adjusted Y coordinates to fit on one page
  doc
    .fontSize(36)
    .font('Helvetica-Bold')
    .fillColor("#1a2b4c")
    .text("CERTIFICATE", 0, 120, { 
      align: "center",
      width: pageWidth 
    })
    .fontSize(28)
    .fillColor("#bf9b30")
    .text("OF COMPLETION", 0, 160, { 
      align: "center",
      width: pageWidth 
    });

  // "This is to certify that"
  doc
    .fontSize(14)
    .font('Helvetica')
    .fillColor("#666666")
    .text("THIS IS TO CERTIFY THAT", 0, 200, {
      align: "center",
      width: pageWidth
    });

  // Student name
  doc
    .fontSize(42)
    .font('Helvetica-Bold')
    .fillColor("#1a2b4c")
    .text(studentName, 0, 225, {
      align: "center",
      width: pageWidth
    });

  // Decorative line under name
  const nameWidth = doc.widthOfString(studentName);
  const startX = (pageWidth - nameWidth) / 2;
  doc
    .moveTo(startX, 270)
    .lineTo(startX + nameWidth, 270)
    .lineWidth(1.5)
    .strokeColor("#d4af37")
    .stroke();

  // "has successfully completed"
  doc
    .fontSize(14)
    .font('Helvetica')
    .fillColor("#666666")
    .text("has successfully completed", 0, 285, {
      align: "center",
      width: pageWidth
    });

  // Course name
  doc
    .fontSize(24)
    .font('Helvetica-Bold')
    .fillColor("#1a2b4c")
    .text(courseName, 0, 310, {
      align: "center",
      width: pageWidth
    });

  // Course duration if provided
  if (duration) {
    doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor("#666666")
      .text(`Course Duration: ${duration}`, 0, 340, {
        align: "center",
        width: pageWidth
      });
  }

  // Grade and percentage
  if (studentGrade || studentPercentage) {
    let gradeText = "";
    if (studentGrade) gradeText += `Grade: ${studentGrade}`;
    if (studentGrade && studentPercentage) gradeText += " • ";
    if (studentPercentage) gradeText += `Score: ${studentPercentage}%`;
    
    doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor("#666666")
      .text(gradeText, 0, 365, {
        align: "center",
        width: pageWidth
      });
  }

  // Issue date
  doc
    .fontSize(11)
    .font('Helvetica')
    .fillColor("#999999")
    .text(`Issued on ${formattedDate}`, 0, 390, {
      align: "center",
      width: pageWidth
    });

  // Signatures - Adjusted Y coordinate
  const signatureY = 425;
  
  // Left signature line
  doc
    .moveTo(120, signatureY)
    .lineTo(320, signatureY)
    .lineWidth(1)
    .strokeColor("#bf9b30")
    .stroke()
    .fontSize(10)
    .fillColor("#666666")
    .text(instructorName, 120, signatureY + 8, { width: 200, align: "center" })
    .fontSize(9)
    .fillColor("#999999")
    .text("Academic Director", 120, signatureY + 22, { width: 200, align: "center" });

  // Right signature line
  doc
    .moveTo(480, signatureY)
    .lineTo(680, signatureY)
    .lineWidth(1)
    .strokeColor("#bf9b30")
    .stroke()
    .fontSize(10)
    .fillColor("#666666")
    .text("Dr. Sarah Johnson", 480, signatureY + 8, { width: 200, align: "center" })
    .fontSize(9)
    .fillColor("#999999")
    .text("Dean of Academics", 480, signatureY + 22, { width: 200, align: "center" });

  doc.restore();
}

// Helper function to add QR code
async function addQRCode(doc, qrCode, certificateId) {
  if (!qrCode) return;

  doc.save();

  try {
    // Position QR code at bottom left
    const qrX = 70;
    const qrY = 440; // Adjusted to fit on one page

    if (qrCode.startsWith('data:image')) {
      // Extract base64 data
      const base64Data = qrCode.replace(/^data:image\/\w+;base64,/, "");
      const qrBuffer = Buffer.from(base64Data, 'base64');
      
      // Save buffer to temp file
      const tempPath = path.join(process.cwd(), "temp", `qr-${certificateId}.png`);
      if (!fs.existsSync(path.join(process.cwd(), "temp"))) {
        fs.mkdirSync(path.join(process.cwd(), "temp"), { recursive: true });
      }
      fs.writeFileSync(tempPath, qrBuffer);
      
      // Add QR code to PDF
      doc.image(tempPath, qrX, qrY, {
        fit: [70, 70]
      });

      // Clean up temp file
      fs.unlinkSync(tempPath);
    }

    // Add label for QR code
    doc
      .fontSize(8)
      .fillColor("#999999")
      .text("Scan to verify", qrX, qrY + 75, { width: 70, align: "center" });

  } catch (error) {
    console.error("Error adding QR code:", error);
  }

  doc.restore();
}

// Helper function to add footer
function addFooter(doc, certificateId) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  doc.save();

  // Certificate ID at bottom left
  doc
    .fontSize(8)
    .fillColor("#999999")
    .text(`ID: ${certificateId}`, 70, pageHeight - 45, {
      align: "left",
      width: 200
    });

  // Verification URL at bottom center
  const verificationUrl = `verify.nexora.com/${certificateId.slice(-6)}`;
  doc
    .fontSize(8)
    .fillColor("#999999")
    .text(`Verify: ${verificationUrl}`, 300, pageHeight - 45, {
      align: "center",
      width: 200
    });

  // Copyright at bottom right
  doc
    .fontSize(8)
    .fillColor("#999999")
    .text(`© ${new Date().getFullYear()} Nexora`, pageWidth - 200, pageHeight - 45, {
      align: "right",
      width: 150
    });

  doc.restore();
}

// Export additional utility for batch generation
export const generateMultipleCertificates = async (certificatesData) => {
  const results = [];
  
  for (const data of certificatesData) {
    try {
      const pdfPath = await generateCertificatePdf(data);
      results.push({
        certificateId: data.certificateId,
        success: true,
        path: pdfPath
      });
    } catch (error) {
      results.push({
        certificateId: data.certificateId,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
};

// Export utility to verify certificate
export const verifyCertificate = (certificateId) => {
  const certPath = path.join(process.cwd(), "public", "certificates", `${certificateId}.pdf`);
  return fs.existsSync(certPath);
};