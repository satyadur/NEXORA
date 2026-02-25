// app/admin/salary-structure/page.tsx
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IndianRupee,
  ArrowLeft,
  Building,
  Users,
  TrendingUp,
  Download,
  Eye,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import api from "@/lib/api/axios";

interface Employee {
  _id: string;
  name: string;
  email: string;
  role: "TEACHER" | "FACULTY_ADMIN";
  employeeRecord?: {
    employeeId: string;
    department: string;
    designation: string;
    joiningDate: string;
    salary: {
      basic: number;
      hra: number;
      da: number;
      ta: number;
      pf: number;
      tax: number;
      netSalary: number;
      bankAccount?: {
        accountNumber: string;
        ifscCode: string;
        bankName: string;
      };
    };
  };
}

interface SalarySummary {
  totalEmployees: number;
  totalMonthlyPayroll: number;
  averageSalary: number;
  byDepartment: Record<string, {
    count: number;
    totalSalary: number;
    average: number;
  }>;
  salaryRanges: {
    below30000: number;
    between30000to50000: number;
    between50000to70000: number;
    above70000: number;
  };
}

export default function SalaryStructurePage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [summary, setSummary] = useState<SalarySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalaryStructure();
  }, []);

  const fetchSalaryStructure = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/salary-structure");
      setEmployees(res.data.employees);
      setSummary(res.data.summary);
    } catch (error) {
      toast.error("Failed to fetch salary structure");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRoleBadge = (role: string) => {
    return role === "TEACHER" ? (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        Teacher
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
        Faculty Admin
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Salary Structure</h1>
            <p className="text-muted-foreground mt-2">
              View and manage employee salary details
            </p>
          </div>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{summary.totalEmployees}</div>
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monthly Payroll
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {formatCurrency(summary.totalMonthlyPayroll)}
                </div>
                <IndianRupee className="h-5 w-5 text-muted-foreground" />
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
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {formatCurrency(summary.averageSalary)}
                </div>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Departments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {Object.keys(summary.byDepartment).length}
                </div>
                <Building className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="employees" className="space-y-6">
        <TabsList>
          <TabsTrigger value="employees">Employee List</TabsTrigger>
          <TabsTrigger value="summary">Summary View</TabsTrigger>
          <TabsTrigger value="departments">Department Wise</TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>Employee Salary Details</CardTitle>
              <CardDescription>
                List of all employees with their salary structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Basic</TableHead>
                    <TableHead>HRA</TableHead>
                    <TableHead>DA</TableHead>
                    <TableHead>TA</TableHead>
                    <TableHead>PF</TableHead>
                    <TableHead>Tax</TableHead>
                    <TableHead className="text-right">Net Salary</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                        No employees found
                      </TableCell>
                    </TableRow>
                  ) : (
                    employees.map((emp) => (
                      <TableRow key={emp._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{emp.name}</p>
                            <p className="text-sm text-muted-foreground">{emp.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {emp.employeeRecord?.employeeId || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>{emp.employeeRecord?.department || "N/A"}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm">{emp.employeeRecord?.designation}</p>
                            {getRoleBadge(emp.role)}
                          </div>
                        </TableCell>
                        <TableCell>₹{emp.employeeRecord?.salary?.basic?.toLocaleString() || 0}</TableCell>
                        <TableCell>₹{emp.employeeRecord?.salary?.hra?.toLocaleString() || 0}</TableCell>
                        <TableCell>₹{emp.employeeRecord?.salary?.da?.toLocaleString() || 0}</TableCell>
                        <TableCell>₹{emp.employeeRecord?.salary?.ta?.toLocaleString() || 0}</TableCell>
                        <TableCell className="text-destructive">
                          -₹{emp.employeeRecord?.salary?.pf?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell className="text-destructive">
                          -₹{emp.employeeRecord?.salary?.tax?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          ₹{emp.employeeRecord?.salary?.netSalary?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/admin/employees/${emp._id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/admin/payroll/generate?employeeId=${emp._id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Salary Range Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Salary Range Distribution</CardTitle>
                <CardDescription>
                  Number of employees in each salary bracket
                </CardDescription>
              </CardHeader>
              <CardContent>
                {summary && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Below ₹30,000</span>
                        <span className="font-medium">{summary.salaryRanges.below30000}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${(summary.salaryRanges.below30000 / summary.totalEmployees) * 100}%`
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>₹30,000 - ₹50,000</span>
                        <span className="font-medium">{summary.salaryRanges.between30000to50000}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${(summary.salaryRanges.between30000to50000 / summary.totalEmployees) * 100}%`
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>₹50,000 - ₹70,000</span>
                        <span className="font-medium">{summary.salaryRanges.between50000to70000}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${(summary.salaryRanges.between50000to70000 / summary.totalEmployees) * 100}%`
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Above ₹70,000</span>
                        <span className="font-medium">{summary.salaryRanges.above70000}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${(summary.salaryRanges.above70000 / summary.totalEmployees) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Statistics</CardTitle>
                <CardDescription>
                  Key salary metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {summary && (
                  <div className="space-y-4">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Highest Salary</span>
                      <span className="font-bold text-primary">
                        {formatCurrency(Math.max(...employees.map(e => e.employeeRecord?.salary?.netSalary || 0)))}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Lowest Salary</span>
                      <span className="font-bold">
                        {formatCurrency(Math.min(...employees.map(e => e.employeeRecord?.salary?.netSalary || 0)))}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Teachers</span>
                      <span className="font-bold">
                        {employees.filter(e => e.role === "TEACHER").length}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Faculty Admins</span>
                      <span className="font-bold">
                        {employees.filter(e => e.role === "FACULTY_ADMIN").length}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Total PF Contribution</span>
                      <span className="font-bold">
                        {formatCurrency(employees.reduce((sum, e) => sum + (e.employeeRecord?.salary?.pf || 0), 0))}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Department Wise */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Department Wise Summary</CardTitle>
                <CardDescription>
                  Salary distribution across departments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Total Monthly</TableHead>
                      <TableHead>Average</TableHead>
                      <TableHead>Min</TableHead>
                      <TableHead>Max</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary && Object.entries(summary.byDepartment).map(([dept, data]) => {
                      const deptEmployees = employees.filter(e => e.employeeRecord?.department === dept);
                      const salaries = deptEmployees.map(e => e.employeeRecord?.salary?.netSalary || 0);
                      const min = Math.min(...salaries);
                      const max = Math.max(...salaries);

                      return (
                        <TableRow key={dept}>
                          <TableCell className="font-medium">{dept}</TableCell>
                          <TableCell>{data.count}</TableCell>
                          <TableCell>{formatCurrency(data.totalSalary)}</TableCell>
                          <TableCell>{formatCurrency(data.average)}</TableCell>
                          <TableCell>{formatCurrency(min)}</TableCell>
                          <TableCell>{formatCurrency(max)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments">
          <div className="grid gap-6 md:grid-cols-2">
            {summary && Object.entries(summary.byDepartment).map(([dept, data]) => {
              const deptEmployees = employees.filter(e => e.employeeRecord?.department === dept);

              return (
                <Card key={dept}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{dept}</span>
                      <Badge>{data.count} Employees</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Monthly</span>
                        <span className="font-bold">{formatCurrency(data.totalSalary)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Average</span>
                        <span className="font-bold">{formatCurrency(data.average)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Min</span>
                        <span className="font-bold">
                          {formatCurrency(Math.min(...deptEmployees.map(e => e.employeeRecord?.salary?.netSalary || 0)))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max</span>
                        <span className="font-bold">
                          {formatCurrency(Math.max(...deptEmployees.map(e => e.employeeRecord?.salary?.netSalary || 0)))}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}