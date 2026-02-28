// app/verify/[uniqueId]/CertificateVerificationClient.tsx
"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { verifyCertificateApi } from "@/lib/api/public.api";
import {
  ShieldCheckIcon,
  AcademicCapIcon,
  CalendarIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  DocumentCheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckBadgeIcon,
  BookOpenIcon,
  BriefcaseIcon,
  TrophyIcon,
  LinkIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { useParams } from "next/navigation";

// ==================== Types ====================
interface CertificateMetadata {
  courseCode?: string;
  credits?: number;
  grade?: string;
  score?: number;
  maxScore?: number;
  percentage?: number;
  assignmentId?: string;
  courseId?: string;
}

interface Certificate {
  _id: string;
  type: "ASSIGNMENT" | "COURSE_COMPLETION" | "ACHIEVEMENT" | "INTERNSHIP" | "PLACEMENT";
  title: string;
  description?: string;
  issueDate: string;
  expiryDate?: string;
  url?: string;
  qrCode?: string;
  metadata?: CertificateMetadata;
}

interface Education {
  degree: string;
  specialization: string;
  university: string;
  yearOfPassing: number;
  percentage?: number;
  isCompleted: boolean;
}

interface Skill {
  name: string;
  level?: "Beginner" | "Intermediate" | "Advanced" | "Expert";
}

interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

interface SocialLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
  twitter?: string;
}

interface Submission {
  _id: string;
  assignmentId: string;
  assignmentTitle: string;
  classroomName: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  status: "SUBMITTED" | "EVALUATED";
  submittedAt: string;
  feedback?: string;
}

interface CourseEnrollment {
  _id: string;
  courseId: string;
  courseTitle: string;
  courseCode: string;
  credits: number;
  level: string;
  department: string;
  thumbnail?: string;
  enrollmentDate: string;
  status: "enrolled" | "in_progress" | "completed" | "dropped" | "failed";
  progress: number;
  grade?: string;
  percentage?: number;
  certificateIssued: boolean;
  certificateUrl?: string;
}

interface StudentStats {
  cgpa: number;
  backlogs: number;
  totalCertificates: number;
  totalAssignments: number;
  submittedCount: number;
  evaluatedCount: number;
  averageScore: string;
  totalObtainedMarks: number;
  totalPossibleMarks: number;
  totalEnrolled: number;
  completed: number;
  inProgress: number;
  dropped: number;
}

interface Student {
  _id: string;
  name: string;
  email?: string;
  uniqueId: string;
  enrollmentNumber?: string;
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: Address;
  batch?: string;
  currentSemester?: string;
  cgpa?: number;
  backlogs: number;
  placementStatus: string;
  isPlacementEligible: boolean;
  education: Education[];
  skills: Skill[];
  socialLinks?: SocialLinks;
  stats: StudentStats;
}

interface CertificateData {
  success: boolean;
  student: Student;
  assignments: Submission[];
  courses: {
    detailed: CourseEnrollment[];
  };
  certificates: Certificate[];
  verification: {
    verifiedAt: string;
    method: string;
    uniqueId: string;
    issuedBy?: string;
    isAuthentic: boolean;
  };
}

// ==================== Helper Functions ====================
const formatDate = (dateString?: string): string => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "Invalid Date";
  }
};

const getStatusColor = (status: string): string => {
  const statusMap: Record<string, string> = {
    completed: "bg-green-100 text-green-800",
    EVALUATED: "bg-green-100 text-green-800",
    in_progress: "bg-blue-100 text-blue-800",
    enrolled: "bg-blue-100 text-blue-800",
    SUBMITTED: "bg-yellow-100 text-yellow-800",
    dropped: "bg-red-100 text-red-800",
    failed: "bg-red-100 text-red-800",
  };
  return statusMap[status] || "bg-gray-100 text-gray-800";
};

const getScoreColor = (percentage: number): string => {
  if (percentage >= 90) return "text-green-600";
  if (percentage >= 75) return "text-blue-600";
  if (percentage >= 60) return "text-yellow-600";
  if (percentage >= 40) return "text-orange-600";
  return "text-red-600";
};

// ==================== Main Component ====================
export default function CertificateVerificationClient() {
  const { uniqueId } = useParams();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    assignments: true,
    courses: true,
    certificates: true,
  });

  const { data, isLoading, error } = useQuery<CertificateData>({
    queryKey: ["certificate-verification", uniqueId],
    queryFn: () => verifyCertificateApi(uniqueId as string),
    enabled: !!uniqueId,
  });

  // Memoized calculations
  const stats = useMemo(() => {
    if (!data?.student?.stats) return null;
    return data.student.stats;
  }, [data]);

  const recentAssignments = useMemo(() => {
    if (!data?.assignments) return [];
    return [...data.assignments]
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 5);
  }, [data?.assignments]);

  const activeCourses = useMemo(() => {
    if (!data?.courses?.detailed) return [];
    return data.courses.detailed.filter(c => 
      c.status === "enrolled" || c.status === "in_progress"
    );
  }, [data?.courses?.detailed]);

  const completedCourses = useMemo(() => {
    if (!data?.courses?.detailed) return [];
    return data.courses.detailed.filter(c => c.status === "completed");
  }, [data?.courses?.detailed]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-48"></div>
              <div className="p-8 space-y-6">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.success || !data.student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <ExclamationTriangleIcon className="h-20 w-20 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Certificate Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The certificate with ID <span className="font-mono font-bold bg-gray-100 px-2 py-1 rounded">{uniqueId}</span> could not be verified.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-8">
              <p className="text-sm text-yellow-800">
                Please check the QR code or contact our support team for assistance.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { student, assignments, courses, certificates, verification } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Verification Badge */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex items-center bg-green-100 border border-green-300 rounded-full px-6 py-3 shadow-md">
            <ShieldCheckIcon className="h-6 w-6 text-green-600 mr-2" />
            <span className="text-sm font-semibold text-green-800">
              ✓ Verified Certificate • {formatDate(verification.verifiedAt)}
            </span>
            {verification.issuedBy && (
              <>
                <span className="mx-2 text-green-400">•</span>
                <span className="text-sm text-green-700">Issued by {verification.issuedBy}</span>
              </>
            )}
          </div>
        </div>

        {/* Main Profile Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 px-8 py-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full transform translate-x-32 -translate-y-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full transform -translate-x-24 translate-y-24"></div>
            
            <div className="flex flex-col md:flex-row items-center relative z-10">
              <div className="flex-shrink-0 mb-6 md:mb-0 md:mr-8">
                {student.avatar ? (
                  <div className="relative h-32 w-32">
                    <Image
                      src={student.avatar}
                      alt={student.name}
                      fill
                      className="rounded-full border-4 border-white shadow-xl object-cover"
                      sizes="(max-width: 768px) 128px, 128px"
                      priority
                      unoptimized={student.avatar.includes('dicebear.com')}
                    />
                  </div>
                ) : (
                  <div className="h-32 w-32 rounded-full bg-white bg-opacity-20 flex items-center justify-center border-4 border-white shadow-xl">
                    <UserIcon className="h-16 w-16 text-white" />
                  </div>
                )}
              </div>
              
              <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                  {student.name}
                </h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-blue-100">
                  <div className="flex items-center">
                    <DocumentCheckIcon className="h-5 w-5 mr-1" />
                    <span className="text-sm">ID: {student.uniqueId}</span>
                  </div>
                  {student.enrollmentNumber && (
                    <>
                      <span className="hidden md:inline">•</span>
                      <div className="flex items-center">
                        <AcademicCapIcon className="h-5 w-5 mr-1" />
                        <span className="text-sm">Enroll: {student.enrollmentNumber}</span>
                      </div>
                    </>
                  )}
                  {student.batch && (
                    <>
                      <span className="hidden md:inline">•</span>
                      <div className="flex items-center">
                        <CalendarIcon className="h-5 w-5 mr-1" />
                        <span className="text-sm">Batch: {student.batch}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50 border-b border-gray-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.cgpa?.toFixed(2) || "N/A"}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">CGPA</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.totalAssignments}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Assignments</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.completed}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Courses Done</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.totalCertificates}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Certificates</div>
              </div>
            </div>
          )}

          {/* Personal Details */}
          <div className="p-8 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <UserIcon className="h-6 w-6 text-blue-600 mr-2" />
              Personal Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {student.email && (
                <div className="flex items-start space-x-3">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900 truncate">{student.email}</p>
                  </div>
                </div>
              )}
              
              {student.phone && (
                <div className="flex items-start space-x-3">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-gray-900">{student.phone}</p>
                  </div>
                </div>
              )}
              
              {student.dateOfBirth && (
                <div className="flex items-start space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    <p className="text-gray-900">{formatDate(student.dateOfBirth)}</p>
                  </div>
                </div>
              )}
              
              {student.gender && (
                <div className="flex items-start space-x-3">
                  <UserIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <p className="text-gray-900">{student.gender}</p>
                  </div>
                </div>
              )}
              
              {student.currentSemester && (
                <div className="flex items-start space-x-3">
                  <AcademicCapIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Current Semester</p>
                    <p className="text-gray-900">{student.currentSemester}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start space-x-3">
                <BriefcaseIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Placement Status</p>
                  <p className="text-gray-900">
                    {student.placementStatus}
                    {student.isPlacementEligible && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Eligible
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Address */}
            {student.address && Object.values(student.address).some(Boolean) && (
              <div className="mt-6 flex items-start space-x-3">
                <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="text-gray-900">
                    {[
                      student.address.street,
                      student.address.city,
                      student.address.state,
                      student.address.pincode,
                      student.address.country
                    ].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>
            )}

            {/* Social Links */}
            {student.socialLinks && Object.values(student.socialLinks).some(Boolean) && (
              <div className="mt-6 flex flex-wrap gap-3">
                {student.socialLinks.linkedin && (
                  <a 
                    href={student.socialLinks.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition"
                  >
                    <LinkIcon className="h-4 w-4 mr-1" /> LinkedIn
                  </a>
                )}
                {student.socialLinks.github && (
                  <a 
                    href={student.socialLinks.github} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 bg-gray-50 text-gray-700 rounded-full text-sm hover:bg-gray-100 transition"
                  >
                    <LinkIcon className="h-4 w-4 mr-1" /> GitHub
                  </a>
                )}
                {student.socialLinks.portfolio && (
                  <a 
                    href={student.socialLinks.portfolio} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm hover:bg-purple-100 transition"
                  >
                    <LinkIcon className="h-4 w-4 mr-1" /> Portfolio
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Education */}
          {student.education.length > 0 && (
            <div className="p-8 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <AcademicCapIcon className="h-6 w-6 text-blue-600 mr-2" />
                Education
              </h2>
              
              <div className="space-y-4">
                {student.education.map((edu, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-xl p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {edu.degree} in {edu.specialization}
                        </h3>
                        <p className="text-gray-600 mt-1">{edu.university}</p>
                      </div>
                      {!edu.isCompleted && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pursuing
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm">
                      <span className="text-gray-500">Year: {edu.yearOfPassing}</span>
                      {edu.percentage && (
                        <span className="text-gray-500">Percentage: {edu.percentage}%</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {student.skills.length > 0 && (
            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <SparklesIcon className="h-6 w-6 text-blue-600 mr-2" />
                Skills & Expertise
              </h2>
              
              <div className="flex flex-wrap gap-2">
                {student.skills.map((skill, idx) => (
                  <div 
                    key={idx} 
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg px-4 py-2 inline-flex items-center"
                  >
                    <span className="font-medium text-gray-900">{skill.name}</span>
                    {skill.level && (
                      <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                        {skill.level}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Assignments Section */}
        {assignments.length > 0 && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
            <button
              onClick={() => toggleSection("assignments")}
              className="w-full px-8 py-6 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors"
              aria-expanded={expandedSections.assignments}
            >
              <div className="flex items-center">
                <DocumentCheckIcon className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-bold text-gray-900">
                  Assignments & Submissions
                </h2>
                <span className="ml-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                  {assignments.length}
                </span>
              </div>
              {expandedSections.assignments ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              )}
            </button>

            {expandedSections.assignments && stats && (
              <div className="p-8">
                {/* Assignment Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.averageScore}%</div>
                    <div className="text-xs text-gray-600">Average Score</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.evaluatedCount}</div>
                    <div className="text-xs text-gray-600">Evaluated</div>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.submittedCount}</div>
                    <div className="text-xs text-gray-600">Pending Review</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.totalObtainedMarks}/{stats.totalPossibleMarks}</div>
                    <div className="text-xs text-gray-600">Total Marks</div>
                  </div>
                </div>

                {/* Assignments List */}
                <div className="space-y-4">
                  {assignments.map((assignment) => {
                    const scoreColor = getScoreColor(assignment.percentage);
                    return (
                      <div key={assignment._id} className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{assignment.assignmentTitle}</h3>
                            <p className="text-sm text-gray-500 mt-1">{assignment.classroomName}</p>
                            <div className="flex flex-wrap items-center gap-4 mt-2">
                              <span className="flex items-center text-xs text-gray-500">
                                <ClockIcon className="h-3 w-3 mr-1" />
                                {formatDate(assignment.submittedAt)}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(assignment.status)}`}>
                                {assignment.status}
                              </span>
                            </div>
                          </div>
                          <div className="mt-4 md:mt-0 text-left md:text-right">
                            <div className={`text-2xl font-bold ${scoreColor}`}>
                              {assignment.obtainedMarks}/{assignment.totalMarks}
                            </div>
                            <div className="text-sm text-gray-500">
                              {assignment.percentage}%
                            </div>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              assignment.percentage >= 75 ? "bg-green-600" :
                              assignment.percentage >= 60 ? "bg-blue-600" :
                              assignment.percentage >= 40 ? "bg-yellow-600" : "bg-red-600"
                            }`}
                            style={{ width: `${assignment.percentage}%` }}
                          />
                        </div>
                        
                        {assignment.feedback && (
                          <div className="mt-4 text-sm bg-blue-50 rounded-lg p-3">
                            <span className="font-medium text-gray-700">Feedback: </span>
                            <span className="text-gray-600">{assignment.feedback}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Courses Section */}
        {courses.detailed.length > 0 && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
            <button
              onClick={() => toggleSection("courses")}
              className="w-full px-8 py-6 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-colors"
              aria-expanded={expandedSections.courses}
            >
              <div className="flex items-center">
                <BookOpenIcon className="h-6 w-6 text-green-600 mr-3" />
                <h2 className="text-xl font-bold text-gray-900">
                  Course Enrollments
                </h2>
                <span className="ml-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm">
                  {courses.detailed.length}
                </span>
              </div>
              {expandedSections.courses ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              )}
            </button>

            {expandedSections.courses && stats && (
              <div className="p-8">
                {/* Course Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                    <div className="text-xs text-gray-600">Completed</div>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{activeCourses.length}</div>
                    <div className="text-xs text-gray-600">In Progress</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.totalEnrolled}</div>
                    <div className="text-xs text-gray-600">Total Enrolled</div>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.dropped}</div>
                    <div className="text-xs text-gray-600">Dropped</div>
                  </div>
                </div>

                {/* Active Courses Section */}
                {activeCourses.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Courses</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeCourses.map((enrollment) => (
                        <div key={enrollment._id} className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 truncate">{enrollment.courseTitle}</h4>
                              <p className="text-sm text-gray-500">{enrollment.courseCode}</p>
                            </div>
                            <span className={`ml-2 text-xs px-3 py-1 rounded-full flex-shrink-0 ${getStatusColor(enrollment.status)}`}>
                              {enrollment.status.replace("_", " ")}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div>
                              <p className="text-xs text-gray-500">Credits</p>
                              <p className="text-sm font-medium">{enrollment.credits}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Progress</p>
                              <p className="text-sm font-medium">{enrollment.progress}%</p>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${enrollment.progress}%` }}
                            />
                          </div>
                          
                          <p className="text-xs text-gray-500 mt-3">
                            Enrolled: {formatDate(enrollment.enrollmentDate)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Courses Section */}
                {completedCourses.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Completed Courses</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {completedCourses.map((enrollment) => (
                        <div key={enrollment._id} className="bg-green-50 rounded-xl p-6 border border-green-100 hover:shadow-md transition">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 truncate">{enrollment.courseTitle}</h4>
                              <p className="text-sm text-gray-500">{enrollment.courseCode}</p>
                            </div>
                            <CheckBadgeIcon className="h-5 w-5 text-green-600 flex-shrink-0 ml-2" />
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3 mb-4">
                            <div>
                              <p className="text-xs text-gray-500">Credits</p>
                              <p className="text-sm font-medium">{enrollment.credits}</p>
                            </div>
                            {enrollment.grade && (
                              <div>
                                <p className="text-xs text-gray-500">Grade</p>
                                <p className="text-sm font-medium">{enrollment.grade}</p>
                              </div>
                            )}
                            {enrollment.percentage && (
                              <div>
                                <p className="text-xs text-gray-500">Score</p>
                                <p className="text-sm font-medium">{enrollment.percentage}%</p>
                              </div>
                            )}
                          </div>
                          
                          {enrollment.certificateUrl && (
                            <a
                              href={enrollment.certificateUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                            >
                              <DocumentCheckIcon className="h-4 w-4 mr-1" />
                              View Certificate
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Certificates Section */}
        {certificates.length > 0 && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
            <button
              onClick={() => toggleSection("certificates")}
              className="w-full px-8 py-6 flex items-center justify-between bg-gradient-to-r from-yellow-50 to-amber-50 hover:from-yellow-100 hover:to-amber-100 transition-colors"
              aria-expanded={expandedSections.certificates}
            >
              <div className="flex items-center">
                <TrophyIcon className="h-6 w-6 text-yellow-600 mr-3" />
                <h2 className="text-xl font-bold text-gray-900">
                  Certificates & Achievements
                </h2>
                <span className="ml-4 bg-yellow-600 text-white px-3 py-1 rounded-full text-sm">
                  {certificates.length}
                </span>
              </div>
              {expandedSections.certificates ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              )}
            </button>

            {expandedSections.certificates && (
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {certificates.map((cert) => (
                    <div 
                      key={cert._id} 
                      className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 border border-yellow-100 hover:shadow-lg transition"
                    >
                      <div className="flex items-start mb-3">
                        <CheckBadgeIcon className="h-6 w-6 text-yellow-600 mr-2 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{cert.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{cert.description}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                        <div>
                          <p className="text-xs text-gray-500">Type</p>
                          <p className="text-sm font-medium">{cert.type.replace("_", " ")}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Issued</p>
                          <p className="text-sm font-medium">{formatDate(cert.issueDate)}</p>
                        </div>
                      </div>
                      
                      {cert.metadata?.percentage && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500">Score</p>
                          <p className={`text-sm font-medium ${
                            cert.metadata.percentage >= 90 ? "text-green-600" :
                            cert.metadata.percentage >= 75 ? "text-blue-600" : "text-yellow-600"
                          }`}>
                            {cert.metadata.percentage}% ({cert.metadata.score}/{cert.metadata.maxScore})
                          </p>
                        </div>
                      )}
                      
                      {cert.qrCode && (
                        <div className="mt-4">
                          <p className="text-xs text-gray-500 mb-2">QR Code</p>
                          <img 
                            src={cert.qrCode} 
                            alt="Certificate QR Code"
                            className="w-20 h-20 border border-gray-200 rounded"
                          />
                        </div>
                      )}
                      
                      {cert.url && (
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_URL}${cert.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                        >
                          <DocumentCheckIcon className="h-4 w-4 mr-1" />
                          View Certificate
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8 pb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <p className="font-medium">Official Certificate Verification</p>
            <p className="mt-2">
              This is an authentic certificate issued by NX Institute
            </p>
            <p className="mt-3 text-xs opacity-75">
              Verified on {formatDate(verification.verifiedAt)} • Unique ID: {verification.uniqueId}
            </p>
            <div className="mt-4 flex justify-center space-x-4">
              <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Visit NX Institute
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/contact" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}