// app/admin/payroll/[id]/page.tsx
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Download,
  Printer,
  Edit,
  Trash2,
  Mail,
  Phone,
  Building,
  Calendar,
  IndianRupee,
  CreditCard,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  getPayslipByIdApi,
  downloadPayslipApi,
  deletePayslipApi,
  updatePayslipStatusApi,
  Payslip,
} from "@/lib/api/admin.api";

export default function PayslipDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPayslip();
  }, [id]);

  const fetchPayslip = async () => {
    try {
      setLoading(true);
      const data = await getPayslipByIdApi(id as string);
      setPayslip(data);
    } catch (error) {
      toast.error("Failed to fetch payslip details");
      router.push("/admin/payroll");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const blob = await downloadPayslipApi(id as string);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${payslip?.month}-${payslip?.year}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Payslip downloaded successfully");
    } catch (error) {
      toast.error("Failed to download payslip");
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this payslip?")) return;
    
    try {
      setDeleting(true);
      await deletePayslipApi(id as string);
      toast.success("Payslip deleted successfully");
      router.push("/admin/payroll");
    } catch (error) {
      toast.error("Failed to delete payslip");
      setDeleting(false);
    }
  };

  const handleStatusUpdate = async (status: "PENDING" | "PROCESSED" | "PAID" | "FAILED") => {
    try {
      const updated = await updatePayslipStatusApi(id as string, status);
      setPayslip(updated);
      toast.success(`Payslip status updated to ${status}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-64" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!payslip) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Payslip Details</h1>
            <p className="text-muted-foreground mt-1">
              {payslip.month} {payslip.year}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload} disabled={downloading}>
            {downloading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Download PDF
          </Button>
          <Button variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>
        </div>
      </div>

      {/* Status Update */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Payment Status:</span>
              <Badge className={
                payslip.paymentStatus === "PAID" ? "bg-green-500" :
                payslip.paymentStatus === "PROCESSED" ? "bg-blue-500" :
                payslip.paymentStatus === "PENDING" ? "bg-yellow-500" :
                "bg-red-500"
              }>
                {payslip.paymentStatus}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusUpdate("PROCESSED")}
                disabled={payslip.paymentStatus === "PROCESSED"}
              >
                Mark Processed
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusUpdate("PAID")}
                disabled={payslip.paymentStatus === "PAID"}
                className="bg-green-500 text-white hover:bg-green-600"
              >
                Mark Paid
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Details */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Employee Name</p>
              <p className="font-medium">{payslip.employeeId.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{payslip.employeeId.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Employee ID</p>
              <p className="font-medium">
                {payslip.employeeId.employeeRecord?.employeeId || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pay Period</p>
              <p className="font-medium">{payslip.month} {payslip.year}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Date</p>
              <p className="font-medium">
                {payslip.paymentDate 
                  ? format(new Date(payslip.paymentDate), "PPP")
                  : "Not paid yet"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Generated On</p>
              <p className="font-medium">
                {format(new Date(payslip.createdAt), "PPP")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-green-500" />
              Earnings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Basic Salary</span>
              <span className="font-medium">₹{payslip.earnings.basic.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">HRA</span>
              <span className="font-medium">₹{payslip.earnings.hra.toLocaleString()}</span>
            </div>
            {payslip.earnings.da > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dearness Allowance</span>
                <span className="font-medium">₹{payslip.earnings.da.toLocaleString()}</span>
              </div>
            )}
            {payslip.earnings.ta > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Travel Allowance</span>
                <span className="font-medium">₹{payslip.earnings.ta.toLocaleString()}</span>
              </div>
            )}
            {payslip.earnings.specialAllowance && payslip.earnings.specialAllowance > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Special Allowance</span>
                <span className="font-medium">₹{payslip.earnings.specialAllowance.toLocaleString()}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total Earnings</span>
              <span className="text-green-600">₹{payslip.earnings.totalEarnings.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-red-500" />
              Deductions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">PF</span>
              <span className="font-medium">₹{payslip.deductions.pf.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-medium">₹{payslip.deductions.tax.toLocaleString()}</span>
            </div>
            {payslip.deductions.professionalTax && payslip.deductions.professionalTax > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Professional Tax</span>
                <span className="font-medium">₹{payslip.deductions.professionalTax.toLocaleString()}</span>
              </div>
            )}
            {payslip.deductions.loan && payslip.deductions.loan > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loan Deduction</span>
                <span className="font-medium">₹{payslip.deductions.loan.toLocaleString()}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total Deductions</span>
              <span className="text-red-600">-₹{payslip.deductions.totalDeductions.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Net Salary */}
      <Card className="bg-primary/5">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Net Salary</p>
              <p className="text-3xl font-bold text-primary">
                ₹{payslip.netSalary.toLocaleString()}
              </p>
            </div>
            <Badge className="text-lg px-4 py-2">
              {((payslip.netSalary / payslip.earnings.totalEarnings) * 100).toFixed(1)}% of Gross
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      {payslip.bankDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Bank Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Account Number</p>
                <p className="font-medium">{payslip.bankDetails.accountNumber || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">IFSC Code</p>
                <p className="font-medium">{payslip.bankDetails.ifscCode || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bank Name</p>
                <p className="font-medium">{payslip.bankDetails.bankName || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Company Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Company Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Company Name</p>
              <p className="font-medium">{payslip.companyDetails?.name || "LMS"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">PAN</p>
              <p className="font-medium">{payslip.companyDetails?.pan || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">TAN</p>
              <p className="font-medium">{payslip.companyDetails?.tan || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}