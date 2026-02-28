"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { verifyCertificateByIdApi } from "@/lib/api/public.api";

export default function CertificateVerificationPage() {

  const { certificateId } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["verify-certificate", certificateId],
    queryFn: () => verifyCertificateByIdApi(certificateId as string),
    enabled: !!certificateId,
  });

  if (isLoading) return <div>Loading certificate...</div>;

  if (!data?.success)
    return <div>Certificate not found</div>;

  const { student, certificate, verification } = data;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">

      <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full">

        <h1 className="text-2xl font-bold mb-4">
          Certificate Verification
        </h1>

        <p className="text-green-600 font-semibold">
          ✓ Authentic Certificate
        </p>

        <hr className="my-4" />

        <h2 className="text-lg font-semibold">
          {certificate.title}
        </h2>

        <p className="text-gray-600">
          {certificate.description}
        </p>

        <div className="mt-4">

          <p>
            <strong>Student:</strong> {student.name}
          </p>

          <p>
            <strong>Unique ID:</strong> {student.uniqueId}
          </p>

          <p>
            <strong>Enrollment:</strong> {student.enrollmentNumber}
          </p>

          <p>
            <strong>Batch:</strong> {student.batch}
          </p>

          <p>
            <strong>Issued:</strong>{" "}
            {new Date(certificate.issueDate).toDateString()}
          </p>

        </div>

        <div className="mt-6 text-sm text-gray-500">
          Verified at {new Date(verification.verifiedAt).toLocaleString()}
        </div>

      </div>

    </div>
  );
}