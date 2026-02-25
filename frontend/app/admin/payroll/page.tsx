// app/admin/payroll/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  Eye,
  Filter,
  IndianRupee,
  Loader2,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  getPayslipsApi,
  getPayrollSummaryApi,
  downloadPayslipApi,
  Payslip,
} from "@/lib/api/admin.api";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

export default function PayrollPage() {
  const router = useRouter();
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    year: currentYear,
    month: "all", // Changed from "" to "all"
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [payslipsData, summaryData] = await Promise.all([
        getPayslipsApi(
          undefined,
          filters.year,
          filters.month === "all" ? undefined : filters.month,
        ),
        getPayrollSummaryApi(
          filters.year,
          filters.month === "all" ? undefined : filters.month,
        ),
      ]);
      setPayslips(payslipsData);
      setSummary(summaryData);
    } catch (error) {
      toast.error("Failed to fetch payroll data");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (payslipId: string) => {
    try {
      setDownloading(payslipId);
      const blob = await downloadPayslipApi(payslipId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payslip-${payslipId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Payslip downloaded successfully");
    } catch (error) {
      toast.error("Failed to download payslip");
    } finally {
      setDownloading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      PAID: { color: "bg-green-500 hover:bg-green-600", label: "Paid" },
      PROCESSED: { color: "bg-blue-500 hover:bg-blue-600", label: "Processed" },
      PENDING: { color: "bg-yellow-500 hover:bg-yellow-600", label: "Pending" },
      FAILED: { color: "bg-red-500 hover:bg-red-600", label: "Failed" },
    };
    const variant = variants[status] || variants.PENDING;
    return (
      <Badge className={`${variant.color} text-white`}>{variant.label}</Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payroll Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage employee salaries and payslips
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/payroll/generate")}
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate Payslips
          </Button>
          <Button
            onClick={() => router.push("/admin/payroll/salary-structure")}
          >
            <IndianRupee className="h-4 w-4 mr-2" />
            Salary Structure
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={filters.year.toString()}
              onValueChange={(value) =>
                setFilters({ ...filters, year: parseInt(value) })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.month}
              onValueChange={(value) =>
                setFilters({ ...filters, month: value })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {months.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && summary.monthly && summary.monthly.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Payroll
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{summary.monthly[0].totalPayroll.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {summary.comparison.growth > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span
                  className={`text-xs ${
                    summary.comparison.growth > 0
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {Math.abs(summary.comparison.growth).toFixed(1)}% vs last
                  month
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Salary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{summary.monthly[0].avgSalary.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Employees Paid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.monthly[0].uniqueEmployees}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Payslips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.monthly[0].count}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payslips Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payslips</CardTitle>
          <CardDescription>
            {filters.month !== "all"
              ? `Showing payslips for ${filters.month} ${filters.year}`
              : `Showing all payslips for ${filters.year}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : payslips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payslips found for the selected period
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Generated On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.map((payslip) => (
                  <TableRow key={payslip._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payslip.employeeId.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {payslip.employeeId.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {payslip.month} {payslip.year}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        ₹{payslip.netSalary.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payslip.paymentStatus)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(payslip.createdAt), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            router.push(`/admin/payroll/${payslip._id}`)
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(payslip._id)}
                          disabled={downloading === payslip._id}
                        >
                          {downloading === payslip._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
