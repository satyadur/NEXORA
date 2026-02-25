// app/admin/faculty-admins/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  UserCircle,
  Briefcase,
  IndianRupee,
  FileText,
  Download,
  Edit,
  Printer,
  CreditCard,
  Building,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { format, isValid, parseISO } from "date-fns";
import { getFacultyAdminDetailsApi } from "@/lib/api/admin.api";

// Helper function to safely format dates
const formatDate = (dateString: string | undefined | null) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return isValid(date) ? format(date, "PPP") : "N/A";
  } catch {
    return "N/A";
  }
};

// Helper function to format month/year
const formatMonthYear = (month: string, year: number) => {
  return `${month} ${year}`;
};

export default function FacultyAdminDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const response = await getFacultyAdminDetailsApi(id as string);
      setData(response);
    } catch (error) {
      toast.error("Failed to fetch faculty admin details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-64" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!data) return null;

  const { facultyAdmin, stats, documents, payslips } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Faculty Admin Details</h1>
            <p className="text-muted-foreground mt-1">
              View and manage faculty administrator information
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/admin/faculty-admins/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-background">
              <AvatarImage src={facultyAdmin.avatar} />
              <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                {facultyAdmin.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">{facultyAdmin.name}</h2>
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{facultyAdmin.email}</span>
                    </div>
                    {facultyAdmin.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{facultyAdmin.phone}</span>
                      </div>
                    )}
                    <Badge variant="outline" className="px-3 py-1">
                      <Briefcase className="h-3 w-3 mr-1" />
                      {facultyAdmin.employeeRecord?.employeeId}
                    </Badge>
                  </div>
                </div>
                <Badge className="bg-green-500 hover:bg-green-600 text-white px-3 py-1">
                  Active
                </Badge>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Documents</p>
                  <p className="text-2xl font-bold">{stats.totalDocuments}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <IndianRupee className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payslips</p>
                  <p className="text-2xl font-bold">{stats.totalPayslips}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="text-sm font-medium">
                    {facultyAdmin.employeeRecord?.joiningDate 
                      ? formatDate(facultyAdmin.employeeRecord.joiningDate)
                      : "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="text-sm font-medium">{facultyAdmin.employeeRecord?.department || "N/A"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList>
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="salary">Salary</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="payslips">Payslips</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{facultyAdmin.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{facultyAdmin.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{facultyAdmin.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">
                    {formatDate(facultyAdmin.dateOfBirth)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium">{facultyAdmin.gender || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Blood Group</p>
                  <p className="font-medium">{facultyAdmin.bloodGroup || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aadhar Number</p>
                  <p className="font-medium">{facultyAdmin.aadharNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">PAN Number</p>
                  <p className="font-medium">{facultyAdmin.panNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unique ID</p>
                  <p className="font-medium">{facultyAdmin.uniqueId || "N/A"}</p>
                </div>
              </div>

              <Separator className="my-6" />

              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </h3>
                <p className="text-muted-foreground">
                  {facultyAdmin.address ? (
                    <>
                      {facultyAdmin.address.street && <>{facultyAdmin.address.street},<br /></>}
                      {facultyAdmin.address.city && <>{facultyAdmin.address.city}, </>}
                      {facultyAdmin.address.state && <>{facultyAdmin.address.state} - </>}
                      {facultyAdmin.address.pincode && <>{facultyAdmin.address.pincode}</>}
                      {facultyAdmin.address.country && <><br />{facultyAdmin.address.country}</>}
                    </>
                  ) : (
                    "No address provided"
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employment">
          <Card>
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Employee ID</p>
                  <p className="font-medium">{facultyAdmin.employeeRecord?.employeeId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{facultyAdmin.employeeRecord?.department}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Designation</p>
                  <p className="font-medium">{facultyAdmin.employeeRecord?.designation}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Joining Date</p>
                  <p className="font-medium">
                    {formatDate(facultyAdmin.employeeRecord?.joiningDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contract Type</p>
                  <p className="font-medium">{facultyAdmin.employeeRecord?.contractType || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salary">
          <Card>
            <CardHeader>
              <CardTitle>Salary Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Basic Salary</p>
                  <p className="font-medium">₹{facultyAdmin.employeeRecord?.salary?.basic?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">HRA</p>
                  <p className="font-medium">₹{facultyAdmin.employeeRecord?.salary?.hra?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dearness Allowance</p>
                  <p className="font-medium">₹{facultyAdmin.employeeRecord?.salary?.da?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Travel Allowance</p>
                  <p className="font-medium">₹{facultyAdmin.employeeRecord?.salary?.ta?.toLocaleString() || 0}</p>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground text-destructive">PF Deduction</p>
                  <p className="font-medium text-destructive">-₹{facultyAdmin.employeeRecord?.salary?.pf?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground text-destructive">Tax Deduction</p>
                  <p className="font-medium text-destructive">-₹{facultyAdmin.employeeRecord?.salary?.tax?.toLocaleString() || 0}</p>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="bg-primary/5 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Net Salary</span>
                  <span className="text-2xl font-bold text-primary">
                    ₹{facultyAdmin.employeeRecord?.salary?.netSalary?.toLocaleString() || 0}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Bank Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Account Number</p>
                    <p className="font-medium">{facultyAdmin.employeeRecord?.salary?.bankAccount?.accountNumber || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">IFSC Code</p>
                    <p className="font-medium">{facultyAdmin.employeeRecord?.salary?.bankAccount?.ifscCode || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bank Name</p>
                    <p className="font-medium">{facultyAdmin.employeeRecord?.salary?.bankAccount?.bankName || "N/A"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Employee Documents</CardTitle>
              <CardDescription>
                All documents related to this employee
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!documents || documents.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No documents uploaded yet
                </p>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc: any) => (
                    <div
                      key={doc._id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-medium">{doc.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {doc.documentType?.replace(/_/g, " ") || "Document"} • 
                            Uploaded on {doc.createdAt ? formatDate(doc.createdAt) : "N/A"}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payslips">
          <Card>
            <CardHeader>
              <CardTitle>Payslips History</CardTitle>
              <CardDescription>
                Monthly salary payslips
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!payslips || payslips.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No payslips generated yet
                </p>
              ) : (
                <div className="space-y-4">
                  {payslips.map((payslip: any) => (
                    <div
                      key={payslip._id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {payslip.month && payslip.year 
                            ? formatMonthYear(payslip.month, payslip.year)
                            : "N/A"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Net Salary: ₹{payslip.netSalary?.toLocaleString() || 0} • 
                          Status: {payslip.paymentStatus || "N/A"}
                        </p>
                        {payslip.paymentDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Paid on: {formatDate(payslip.paymentDate)}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                        {payslip.pdfUrl && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={payslip.pdfUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest actions and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!stats.recentActivity || stats.recentActivity.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No recent activity
                </p>
              ) : (
                <div className="space-y-4">
                  {stats.recentActivity.map((activity: any) => (
                    <div
                      key={activity._id}
                      className="flex items-start gap-3 p-3 border rounded-lg"
                    >
                      <FileText className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">{activity.title || "Untitled Document"}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.documentType?.replace(/_/g, " ") || "Document"} • 
                          Uploaded for {activity.employeeId?.name || "Unknown"} • 
                          {activity.uploadedAt ? formatDate(activity.uploadedAt) : "N/A"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}