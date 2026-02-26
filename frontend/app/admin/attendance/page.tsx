"use client";

import { useState, useEffect, useMemo } from "react";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import {
  useEmployees,
  useAttendanceRecords,
  useAttendanceSummary,
  useMarkAttendance,
  useUpdateAttendance,
  useDeleteAttendance,
  useBulkMarkAttendance,
  usePendingRegularizations,
  useApproveRegularization,
  useAttendanceCalendar,
  useAttendanceStats,
} from "@/hooks/useAttendanceQueries";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

// Icons
import {
  Calendar as CalendarIcon,
  Download,
  Filter,
  Loader2,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  UserPlus,
  Edit,
  Trash2,
  MoreHorizontal,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckSquare,
  XSquare,
  Eye,
  Save,
  RotateCcw,
  Check,
  X,
  CalendarDays,
  BarChart3,
  Settings2,
  RefreshCw,
  ArrowUpDown,
  Search,
  Upload,
  FileDown,
  Grid3x3,
  List,
  DownloadCloud,
  Printer,
  Shield,
  UserCog,
  GraduationCap,
  Briefcase,
  Building2,
  Phone,
  Mail,
  MapPinned,
  Smartphone,
  Wifi,
  Battery,
  Camera,
  Fingerprint,
  QrCode,
  Globe,
  Home,
  ChevronDown,
} from "lucide-react";

// Types
import { TeacherAttendanceRecord, Employee } from "@/lib/api/admin.attendance.api";
import { BulkAttendanceDialog } from "./_components/BulkAttendanceDialog";

// ========== UTILITY FUNCTIONS ==========

const getStatusColor = (status: string) => {
  const colors = {
    PRESENT: "bg-green-500",
    ABSENT: "bg-red-500",
    LATE: "bg-yellow-500",
    ON_LEAVE: "bg-blue-500",
    HALF_DAY: "bg-orange-500",
    WORK_FROM_HOME: "bg-purple-500",
    ON_DUTY: "bg-indigo-500",
    HOLIDAY: "bg-gray-500",
  };
  return colors[status as keyof typeof colors] || "bg-gray-500";
};

const getStatusIcon = (status: string) => {
  const icons = {
    PRESENT: CheckCircle2,
    ABSENT: XCircle,
    LATE: AlertCircle,
    ON_LEAVE: CalendarIcon,
    HALF_DAY: Clock,
    WORK_FROM_HOME: Home,
    ON_DUTY: Briefcase,
    HOLIDAY: CalendarDays,
  };
  return icons[status as keyof typeof icons] || AlertCircle;
};

const getStatusBadge = (status: string) => {
  const Icon = getStatusIcon(status);
  return (
    <Badge className={`${getStatusColor(status)} text-white flex items-center gap-1 w-fit`}>
      <Icon className="h-3 w-3" />
      {status.replace("_", " ")}
    </Badge>
  );
};

const formatTime = (dateString?: string) => {
  if (!dateString) return "-";
  return format(new Date(dateString), "hh:mm a");
};

const formatDate = (dateString: string) => {
  return format(new Date(dateString), "PPP");
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// ========== MAIN COMPONENT ==========

export default function AdminAttendancePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Queries
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { 
    data: attendanceRecords = [], 
    isLoading: recordsLoading,
    refetch: refetchRecords 
  } = useAttendanceRecords(
    dateRange.startDate,
    dateRange.endDate,
    selectedEmployee !== "all" ? selectedEmployee : undefined,
    selectedStatus !== "all" ? selectedStatus : undefined
  );
  
  const { 
    data: summary, 
    isLoading: summaryLoading 
  } = useAttendanceSummary(dateRange.startDate, dateRange.endDate);
  
  const { 
    data: calendarData,
    isLoading: calendarLoading 
  } = useAttendanceCalendar(selectedMonth, selectedYear, selectedEmployee !== "all" ? selectedEmployee : undefined);

  // Mutations
  const markAttendance = useMarkAttendance();
  const updateAttendance = useUpdateAttendance();
  const deleteAttendance = useDeleteAttendance();
  const bulkMarkAttendance = useBulkMarkAttendance();

  // Handlers
  const handleRefresh = () => {
    refetchRecords();
    toast.success("Data refreshed");
  };

  const handleExport = () => {
    const csvContent = [
      ["Date", "Employee", "Email", "Role", "Status", "Check In", "Check Out", "Work Hours", "Late (min)", "Early (min)", "Notes"],
      ...attendanceRecords.map(record => [
        formatDate(record.date),
        record.employeeName,
        record.employeeEmail,
        record.employeeRole,
        record.status,
        formatTime(record.actualCheckIn?.startTime),
        formatTime(record.actualCheckOut?.startTime),
        record.formattedWorkHours,
        record.lateMinutes || 0,
        record.earlyDepartureMinutes || 0,
        record.notes || ""
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Attendance data exported");
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
            Attendance Management
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Users className="h-4 w-4" />
            Manage and monitor teacher & faculty attendance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <MarkAttendanceDialog employees={employees} />
          <BulkAttendanceDialog employees={employees} />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white dark:bg-gray-800 border">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="records" className="gap-2">
            <List className="h-4 w-4" />
            Records
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="regularizations" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Regularizations
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* ========== OVERVIEW TAB ========== */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          {summaryLoading ? (
            <SummaryCardsSkeleton />
          ) : (
            summary && <SummaryCards summary={summary} />
          )}

          {/* Filters */}
          <FiltersCard
            employees={employees}
            employeesLoading={employeesLoading}
            selectedEmployee={selectedEmployee}
            setSelectedEmployee={setSelectedEmployee}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            dateRange={dateRange}
            setDateRange={setDateRange}
            onApply={handleRefresh}
          />

          {/* Recent Records */}
          <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Recent Attendance Records
                  </CardTitle>
                  <CardDescription>
                    Showing {attendanceRecords.length} records from {formatDate(dateRange.startDate)} to {formatDate(dateRange.endDate)}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab("records")} className="gap-2">
                  View All <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <AttendanceTable
                records={attendanceRecords.slice(0, 10)}
                loading={recordsLoading}
                onEdit={(record) => console.log("Edit", record)}
                onDelete={(id) => deleteAttendance.mutate(id)}
              />
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <QuickStatsCard
              title="Total Employees"
              value={employees.length.toString()}
              icon={Users}
              color="blue"
            />
            <QuickStatsCard
              title="Today's Present"
              value={attendanceRecords.filter(r => 
                isSameDay(new Date(r.date), new Date()) && r.status === "PRESENT"
              ).length.toString()}
              icon={CheckCircle2}
              color="green"
            />
            <QuickStatsCard
              title="On Leave Today"
              value={attendanceRecords.filter(r => 
                isSameDay(new Date(r.date), new Date()) && r.status === "ON_LEAVE"
              ).length.toString()}
              icon={CalendarIcon}
              color="yellow"
            />
            <QuickStatsCard
              title="Attendance Rate"
              value={`${summary?.attendanceRate.toFixed(1) || 0}%`}
              icon={BarChart3}
              color="purple"
            />
          </div>
        </TabsContent>

        {/* ========== RECORDS TAB ========== */}
        <TabsContent value="records" className="space-y-6">
          <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <List className="h-5 w-5 text-blue-600" />
                    All Attendance Records
                  </CardTitle>
                  <CardDescription>
                    Total {attendanceRecords.length} records found
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search..."
                    className="w-64"
                    icon={<Search className="h-4 w-4" />}
                  />
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <AttendanceTable
                records={attendanceRecords}
                loading={recordsLoading}
                onEdit={(record) => console.log("Edit", record)}
                onDelete={(id) => deleteAttendance.mutate(id)}
              />
            </CardContent>
            <CardFooter className="border-t p-4 flex justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {attendanceRecords.length} records
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ========== CALENDAR TAB ========== */}
        <TabsContent value="calendar">
          <CalendarView
            calendarData={calendarData}
            loading={calendarLoading}
            month={selectedMonth}
            year={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
            employees={employees}
            selectedEmployee={selectedEmployee}
            onEmployeeChange={setSelectedEmployee}
          />
        </TabsContent>

        {/* ========== REGULARIZATIONS TAB ========== */}
        <TabsContent value="regularizations">
          <RegularizationsView />
        </TabsContent>

        {/* ========== ANALYTICS TAB ========== */}
        <TabsContent value="analytics">
          <AnalyticsView
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ========== SUB-COMPONENTS ==========

// Summary Cards Component
function SummaryCards({ summary }: { summary: any }) {
  const cards = [
    { title: "Present", value: summary.totalPresent, color: "green", icon: CheckCircle2 },
    { title: "Late", value: summary.totalLate, color: "yellow", icon: AlertCircle },
    { title: "Absent", value: summary.totalAbsent, color: "red", icon: XCircle },
    { title: "On Leave", value: summary.totalOnLeave, color: "blue", icon: CalendarIcon },
    { title: "Holiday", value: summary.totalHoliday || 0, color: "gray", icon: CalendarDays },
    { title: "WFH", value: summary.totalWFH || 0, color: "purple", icon: Home },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className={`text-3xl font-bold text-${card.color}-600`}>{card.value}</p>
                </div>
                <div className={`p-3 bg-${card.color}-100 dark:bg-${card.color}-900/20 rounded-full`}>
                  <Icon className={`h-6 w-6 text-${card.color}-600`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Filters Card Component
function FiltersCard({
  employees,
  employeesLoading,
  selectedEmployee,
  setSelectedEmployee,
  selectedStatus,
  setSelectedStatus,
  dateRange,
  setDateRange,
  onApply,
}: any) {
  return (
    <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date Range</Label>
            <div className="flex items-center gap-2">
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="pl-9 w-[150px]"
                />
              </div>
              <span>to</span>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="pl-9 w-[150px]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Employee</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employeesLoading ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : (
                  employees.map((emp: Employee) => (
                    <SelectItem key={emp._id} value={emp._id}>
                      {emp.name} ({emp.role === "TEACHER" ? "👨‍🏫" : "👨‍💼"})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PRESENT">Present</SelectItem>
                <SelectItem value="LATE">Late</SelectItem>
                <SelectItem value="ABSENT">Absent</SelectItem>
                <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                <SelectItem value="HALF_DAY">Half Day</SelectItem>
                <SelectItem value="WORK_FROM_HOME">Work From Home</SelectItem>
                <SelectItem value="ON_DUTY">On Duty</SelectItem>
                <SelectItem value="HOLIDAY">Holiday</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={onApply} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Filter className="h-4 w-4" />
            Apply Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Attendance Table Component
function AttendanceTable({
  records,
  loading,
  onEdit,
  onDelete,
}: {
  records: TeacherAttendanceRecord[];
  loading: boolean;
  onEdit: (record: TeacherAttendanceRecord) => void;
  onDelete: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
          <CalendarIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No records found</h3>
        <p className="text-muted-foreground">
          Try adjusting your filters or mark new attendance
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-x-auto">
      <Table>
        <TableHeader className="bg-gray-50 dark:bg-gray-900">
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Employee</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Check In</TableHead>
            <TableHead>Check Out</TableHead>
            <TableHead>Hours</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Method</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record, index) => {
            const StatusIcon = getStatusIcon(record.status);
            return (
              <TableRow key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {getInitials(record.employeeName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{record.employeeName}</p>
                      <p className="text-xs text-muted-foreground">{record.employeeEmail}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{formatDate(record.date)}</TableCell>
                <TableCell>
                  <Badge className={`${getStatusColor(record.status)} text-white flex items-center gap-1 w-fit`}>
                    <StatusIcon className="h-3 w-3" />
                    {record.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  {record.actualCheckIn ? (
                    <div className="space-y-1">
                      <p className="font-medium">{formatTime(record.actualCheckIn.startTime)}</p>
                      {record.lateMinutes ? (
                        <p className="text-xs text-yellow-600">Late: {record.lateMinutes}min</p>
                      ) : null}
                    </div>
                  ) : "-"}
                </TableCell>
                <TableCell>
                  {record.actualCheckOut ? (
                    formatTime(record.actualCheckOut.startTime)
                  ) : "-"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono">
                    {record.formattedWorkHours}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm truncate max-w-[100px]">
                      {record.actualCheckIn?.address?.city || 
                       record.actualCheckIn?.address?.formattedAddress?.split(",")[0] || 
                       "N/A"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {record.actualCheckIn?.checkInMethod || "N/A"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onEdit(record)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(record._id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// Mark Attendance Dialog
function MarkAttendanceDialog({ employees }: { employees: Employee[] }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    status: "PRESENT",
    checkInTime: "",
    checkOutTime: "",
    notes: "",
    isLeave: false,
  });

  const markAttendance = useMarkAttendance();

  const handleSubmit = async () => {
    try {
      await markAttendance.mutateAsync(formData);
      setOpen(false);
      // Reset form
      setFormData({
        employeeId: "",
        date: format(new Date(), "yyyy-MM-dd"),
        status: "PRESENT",
        checkInTime: "",
        checkOutTime: "",
        notes: "",
        isLeave: false,
      });
    } catch (error) {
      // Error handled in mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <PlusCircle className="h-4 w-4" />
          Mark Attendance
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-blue-600" />
            Mark Attendance
          </DialogTitle>
          <DialogDescription>
            Mark attendance for teacher or faculty admin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Employee *</Label>
            <Select
              value={formData.employeeId}
              onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp._id} value={emp._id}>
                    {emp.name} ({emp.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date *</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="leave-mode"
              checked={formData.isLeave}
              onCheckedChange={(checked) => setFormData({ ...formData, isLeave: checked, status: checked ? "ON_LEAVE" : "PRESENT" })}
            />
            <Label htmlFor="leave-mode">Mark as Leave</Label>
          </div>

          {!formData.isLeave ? (
            <>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRESENT">Present</SelectItem>
                    <SelectItem value="LATE">Late</SelectItem>
                    <SelectItem value="ABSENT">Absent</SelectItem>
                    <SelectItem value="HALF_DAY">Half Day</SelectItem>
                    <SelectItem value="WORK_FROM_HOME">Work From Home</SelectItem>
                    <SelectItem value="ON_DUTY">On Duty</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Check In Time</Label>
                  <Input
                    type="time"
                    value={formData.checkInTime}
                    onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Check Out Time</Label>
                  <Input
                    type="time"
                    value={formData.checkOutTime}
                    onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label>Leave Notes</Label>
              <Textarea
                placeholder="Enter reason for leave..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea
              placeholder="Any additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!formData.employeeId || !formData.date || markAttendance.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {markAttendance.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Marking...
              </>
            ) : (
              "Mark Attendance"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Calendar View Component
function CalendarView({
  calendarData,
  loading,
  month,
  year,
  onMonthChange,
  onYearChange,
  employees,
  selectedEmployee,
  onEmployeeChange,
}: any) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [hoveredEvent, setHoveredEvent] = useState<any>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  // Helper function to get events for a specific date
  const getEventsForDate = (date: Date) => {
    return calendarData?.calendarData?.filter((event: any) =>
      isSameDay(new Date(event.start), date)
    ) || [];
  };

  // Get all dates in the month
  const getDaysInMonth = () => {
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));
    return eachDayOfInterval({ start, end });
  };

  const daysInMonth = getDaysInMonth();
  
  // Create a map of dates to events for quick lookup
  const eventsByDate = useMemo(() => {
    const map = new Map();
    if (calendarData?.calendarData) {
      calendarData.calendarData.forEach((event: any) => {
        const dateStr = format(new Date(event.start), "yyyy-MM-dd");
        if (!map.has(dateStr)) {
          map.set(dateStr, []);
        }
        map.get(dateStr).push(event);
      });
    }
    return map;
  }, [calendarData]);

  // Get status color for background (lighter version for boxes)
  const getStatusBgColor = (status: string, isPast: boolean = false) => {
    const colors = {
      PRESENT: isPast ? 'bg-green-100 dark:bg-green-900/30' : 'bg-green-200 dark:bg-green-800',
      ABSENT: isPast ? 'bg-red-100 dark:bg-red-900/30' : 'bg-red-200 dark:bg-red-800',
      LATE: isPast ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-yellow-200 dark:bg-yellow-800',
      ON_LEAVE: isPast ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-blue-200 dark:bg-blue-800',
      HALF_DAY: isPast ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-orange-200 dark:bg-orange-800',
      WORK_FROM_HOME: isPast ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-purple-200 dark:bg-purple-800',
      ON_DUTY: isPast ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-indigo-200 dark:bg-indigo-800',
      HOLIDAY: isPast ? 'bg-gray-100 dark:bg-gray-900/30' : 'bg-gray-200 dark:bg-gray-800',
    };
    return colors[status as keyof typeof colors] || (isPast ? 'bg-gray-100 dark:bg-gray-900/30' : 'bg-gray-200 dark:bg-gray-800');
  };

  // Get status color for badge
  const getStatusBadgeColor = (status: string) => {
    const colors = {
      PRESENT: 'bg-green-500',
      ABSENT: 'bg-red-500',
      LATE: 'bg-yellow-500',
      ON_LEAVE: 'bg-blue-500',
      HALF_DAY: 'bg-orange-500',
      WORK_FROM_HOME: 'bg-purple-500',
      ON_DUTY: 'bg-indigo-500',
      HOLIDAY: 'bg-gray-500',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  // Check if date is in the past
  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return isSameDay(date, today);
  };

  const handleMouseEnter = (events: any[], e: React.MouseEvent) => {
    setHoveredEvent(events);
    setHoverPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredEvent(null);
  };

  // Get initials helper
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-blue-600" />
              Attendance Calendar
            </CardTitle>
            <Select value={selectedEmployee} onValueChange={onEmployeeChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map((emp: Employee) => (
                  <SelectItem key={emp._id} value={emp._id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (month === 1) {
                  onMonthChange(12);
                  onYearChange(year - 1);
                } else {
                  onMonthChange(month - 1);
                }
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Select value={month.toString()} onValueChange={(v) => onMonthChange(parseInt(v))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={year.toString()} onValueChange={(v) => onYearChange(parseInt(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (month === 12) {
                  onMonthChange(1);
                  onYearChange(year + 1);
                } else {
                  onMonthChange(month + 1);
                }
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-2 border-t">
          <span className="text-sm font-medium">Status:</span>
          {[
            { status: 'PRESENT', color: 'bg-green-500' },
            { status: 'LATE', color: 'bg-yellow-500' },
            { status: 'ABSENT', color: 'bg-red-500' },
            { status: 'ON_LEAVE', color: 'bg-blue-500' },
            { status: 'HALF_DAY', color: 'bg-orange-500' },
            { status: 'WORK_FROM_HOME', color: 'bg-purple-500' },
            { status: 'HOLIDAY', color: 'bg-gray-500' },
          ].map((item) => (
            <div key={item.status} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-full ${item.color}`} />
              <span className="text-xs">{item.status.replace('_', ' ')}</span>
            </div>
          ))}
          <div className="flex items-center gap-1 ml-auto">
            <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
            <span className="text-xs">Past Date</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full ring-2 ring-blue-500" />
            <span className="text-xs">Today</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center font-medium py-2 text-muted-foreground text-sm">
              {day}
            </div>
          ))}
          
          {/* Calendar Cells */}
          {loading ? (
            Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="aspect-square p-2 border rounded-lg">
                <Skeleton className="h-full w-full" />
              </div>
            ))
          ) : (
            <>
              {/* Empty cells for days before month starts */}
              {daysInMonth && daysInMonth.length > 0 && Array.from({ length: daysInMonth[0].getDay() }).map((_, i) => (
                <div key={`empty-start-${i}`} className="aspect-square p-2 border rounded-lg bg-muted/20" />
              ))}
              
              {/* Actual days */}
              {daysInMonth.map((date) => {
                const dateStr = format(date, "yyyy-MM-dd");
                const events = eventsByDate.get(dateStr) || [];
                const past = isPastDate(date);
                const today = isToday(date);
                
                // Determine cell color based on events
                let cellColor = '';
                let statusCounts: Record<string, number> = {};
                
                if (events.length > 0) {
                  // Count statuses for this date
                  events.forEach((event: any) => {
                    const status = event.extendedProps.status;
                    statusCounts[status] = (statusCounts[status] || 0) + 1;
                  });
                  
                  // Get the most frequent status for background color
                  const topStatus = Object.entries(statusCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
                  if (topStatus) {
                    cellColor = getStatusBgColor(topStatus, past);
                  }
                } else {
                  // No events - default background
                  cellColor = past ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800';
                }

                return (
                  <div
                    key={dateStr}
                    className={`aspect-square p-2 border rounded-lg transition-all duration-200 cursor-pointer hover:shadow-md hover:scale-105 relative
                      ${cellColor}
                      ${today ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                    `}
                    onClick={() => setSelectedDate(date)}
                    onMouseEnter={(e) => events.length > 0 && handleMouseEnter(events, e)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="h-full flex flex-col">
                      <span className={`text-sm font-medium mb-1
                        ${today ? 'text-blue-600 dark:text-blue-400' : ''}
                        ${past ? 'text-muted-foreground' : ''}
                      `}>
                        {format(date, "d")}
                      </span>
                      
                      {/* Event indicators */}
                      {events.length > 0 && (
                        <div className="flex flex-col gap-1 mt-1">
                          {events.slice(0, 2).map((event: any, idx: number) => (
                            <div
                              key={idx}
                              className={`h-1.5 w-full rounded-full ${getStatusBadgeColor(event.extendedProps.status)}`}
                              title={`${event.extendedProps.employeeName}: ${event.extendedProps.status}`}
                            />
                          ))}
                          {events.length > 2 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{events.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Empty cells for days after month ends */}
              {daysInMonth && daysInMonth.length > 0 && Array.from({ length: 42 - (daysInMonth[0].getDay() + daysInMonth.length) }).map((_, i) => (
                <div key={`empty-end-${i}`} className="aspect-square p-2 border rounded-lg bg-muted/20" />
              ))}
            </>
          )}
        </div>

        {/* Hover Tooltip */}
        {hoveredEvent && hoveredEvent.length > 0 && (
          <div
            className="fixed z-50 bg-white dark:bg-gray-800 shadow-lg rounded-lg border p-3 min-w-[200px]"
            style={{
              left: hoverPosition.x + 10,
              top: hoverPosition.y - 100,
            }}
          >
            <p className="text-sm font-medium mb-2">Attendance Details</p>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {hoveredEvent.map((event: any, idx: number) => (
                <div key={idx} className="text-xs border-b last:border-0 pb-1 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{event.extendedProps.employeeName}</span>
                    <Badge className={event.backgroundColor}>
                      {event.extendedProps.status}
                    </Badge>
                  </div>
                  {event.extendedProps.checkIn && (
                    <p className="text-muted-foreground mt-1">
                      In: {formatTime(event.extendedProps.checkIn)}
                      {event.extendedProps.workHours && ` • ${event.extendedProps.workHours.toFixed(1)}h`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Date Details */}
        {selectedDate && (
          <div className="mt-6 p-4 border rounded-lg bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-blue-600" />
              Attendance for {format(selectedDate, "PPP")}
              {isToday(selectedDate) && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Today
                </Badge>
              )}
            </h3>
            
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {getEventsForDate(selectedDate).map((event: any) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(event.extendedProps.employeeName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{event.extendedProps.employeeName}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {event.extendedProps.checkIn ? (
                            <>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                In: {formatTime(event.extendedProps.checkIn)}
                              </span>
                              {event.extendedProps.checkOut && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Out: {formatTime(event.extendedProps.checkOut)}
                                </span>
                              )}
                            </>
                          ) : (
                            <span>No check-in record</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {event.extendedProps.workHours && (
                        <Badge variant="outline" className="font-mono">
                          {event.extendedProps.workHours.toFixed(1)}h
                        </Badge>
                      )}
                      <Badge className={event.backgroundColor}>
                        {event.extendedProps.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {getEventsForDate(selectedDate).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No attendance records for this date</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Regularizations View Component
function RegularizationsView() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePendingRegularizations({ page, limit: 10 });
  const approveRegularization = useApproveRegularization();

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b">
        <CardTitle className="text-xl flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-blue-600" />
          Regularization Requests
        </CardTitle>
        <CardDescription>
          Pending attendance regularization requests from employees
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Requested Status</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Requested On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.regularizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                    <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
                  <p className="text-muted-foreground">
                    All regularization requests have been processed
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              data?.regularizations.map((req: any) => (
                <TableRow key={req._id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{req.employeeId.name}</p>
                      <p className="text-xs text-muted-foreground">{req.employeeId.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(req.date)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(req.requestedStatus)}>
                      {req.requestedStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <p className="truncate">{req.reason}</p>
                  </TableCell>
                  <TableCell>{format(new Date(req.requestedAt), "PP")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-200 hover:bg-green-50"
                        onClick={() => approveRegularization.mutate({
                          id: req._id,
                          action: "APPROVED",
                        })}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => approveRegularization.mutate({
                          id: req._id,
                          action: "REJECTED",
                        })}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="border-t p-4 flex justify-between">
        <div className="text-sm text-muted-foreground">
          Page {page} of {data?.pagination.pages || 1}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page === data?.pagination.pages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

// Analytics View Component
function AnalyticsView({ startDate, endDate }: { startDate: string; endDate: string }) {
  const { data: stats, isLoading } = useAttendanceStats({ fromDate: startDate, toDate: endDate });

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Status Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Attendance Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.summary.map((item) => (
                <div key={item._id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(item._id)}`} />
                      <span className="font-medium">{item._id}</span>
                    </div>
                    <span className="font-bold">{item.count}</span>
                  </div>
                  <Progress value={(item.count / stats.summary.reduce((acc, s) => acc + s.count, 0)) * 100} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Department-wise */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Department-wise Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.byDepartment.map((dept) => (
                <div key={dept.department} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{dept.department || "Other"}</p>
                      <p className="text-xs text-muted-foreground">
                        {dept.present} present, {dept.absent} absent
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{dept.attendanceRate}%</p>
                      <p className="text-xs text-muted-foreground">Rate</p>
                    </div>
                  </div>
                  <Progress value={dept.attendanceRate} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Records"
          value={stats?.summary.reduce((acc, s) => acc + s.count, 0).toString() || "0"}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Avg Late Minutes"
          value={stats?.summary.find(s => s._id === "LATE")?.avgLateMinutes.toFixed(1) || "0"}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Total Work Hours"
          value={stats?.summary.reduce((acc, s) => acc + s.totalWorkHours, 0).toFixed(1) || "0"}
          icon={Briefcase}
          color="green"
        />
        <StatCard
          title="Unique Employees"
          value={stats?.summary.reduce((acc, s) => acc + s.employees.length, 0).toString() || "0"}
          icon={Users}
          color="purple"
        />
      </div>
    </div>
  );
}

// ========== SKELETONS ==========

function SummaryCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ========== HELPER COMPONENTS ==========

function QuickStatsCard({ title, value, icon: Icon, color }: any) {
  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
          </div>
          <div className={`p-3 bg-${color}-100 dark:bg-${color}-900/20 rounded-full`}>
            <Icon className={`h-5 w-5 text-${color}-600`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 bg-${color}-100 dark:bg-${color}-900/20 rounded-full`}>
            <Icon className={`h-5 w-5 text-${color}-600`} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}