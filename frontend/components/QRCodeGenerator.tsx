// components/QRCodeGenerator.tsx
"use client";

import { useState } from "react";
import QRCode from "qrcode.react";
import { DocumentArrowDownIcon } from "@heroicons/react/24/outline";

// ==================== Type Definitions ====================

interface QRCodeGeneratorProps {
  uniqueId: string;
  studentName: string;
  size?: number;
  logoUrl?: string;
}

// ==================== Main Component ====================

export default function QRCodeGenerator({ 
  uniqueId, 
  studentName, 
  size = 200,
  logoUrl = "/logo-small.png"
}: QRCodeGeneratorProps): JSX.Element {
  const [showQR, setShowQR] = useState<boolean>(false);
  
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify/${uniqueId}`;
  
  const downloadQRCode = (): void => {
    const canvas = document.getElementById("qr-code-canvas") as HTMLCanvasElement | null;
    
    if (!canvas) {
      console.error("QR Code canvas not found");
      return;
    }
    
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `${studentName.replace(/\s+/g, '_')}_certificate_${uniqueId}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Certificate QR Code
      </h3>
      
      <div className="flex flex-col items-center">
        <div className="bg-white p-4 border border-gray-200 rounded-lg mb-4">
          <QRCode
            id="qr-code-canvas"
            value={verificationUrl}
            size={size}
            level="H" // High error correction
            includeMargin={true}
            imageSettings={logoUrl ? {
              src: logoUrl,
              x: undefined,
              y: undefined,
              height: size * 0.2,
              width: size * 0.2,
              excavate: true,
            } : undefined}
          />
        </div>
        
        <p className="text-sm text-gray-600 text-center mb-4">
          Scan to verify certificate for <br />
          <span className="font-medium">{studentName}</span>
          <br />
          <span className="text-xs text-gray-500">ID: {uniqueId}</span>
        </p>
        
        <button
          onClick={downloadQRCode}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
          Download QR Code
        </button>
      </div>
    </div>
  );
}