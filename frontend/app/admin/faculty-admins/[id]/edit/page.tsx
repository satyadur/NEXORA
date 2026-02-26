"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Loader2, 
  Save,
  UserCog,
  Clock,
  Briefcase,
  IndianRupee,
  Calendar,
  MapPin,
  Mail,
  Phone,
  CreditCard,
  FileText,
  Award,
  GraduationCap,
  Building2,
  Globe,
  Home,
  Banknote,
  Landmark,
  Percent,
  BadgeIndianRupee,
  CalendarDays,
  UserRound,
  Heart,
  Droplets,
  Hash,
  FileBadge,
  NotebookPen
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

import { getFacultyAdminDetailsApi, updateFacultyAdminApi } from "@/lib/api/admin.api";

// Extended schema with all fields
const facultyAdminSchema = z.object({
  // Personal Information
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.enum(["Male", "Female", "Other", "Prefer not to say"]).optional().nullable(),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]).optional().nullable(),
  
  // Address
  address: z.object({
    street: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
    pincode: z.string().optional().nullable(),
  }).optional(),

  // Identity Documents
  aadharNumber: z.string().optional().nullable(),
  panNumber: z.string().optional().nullable(),
  
  // Employment Details
  employeeId: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  joiningDate: z.string().optional().nullable(),
  contractType: z.enum(["PERMANENT", "CONTRACT", "VISITING", "PROBATION"]).optional().nullable(),

  // Shift Timings
  shiftTimings: z.object({
    start: z.string().default("09:00"),
    end: z.string().default("17:00"),
    gracePeriod: z.number().default(15),
    workingHours: z.number().default(8),
  }).optional(),

  // Salary Structure
  salary: z.object({
    basic: z.number().optional(),
    hra: z.number().optional(),
    da: z.number().optional(),
    ta: z.number().optional(),
    pf: z.number().optional(),
    tax: z.number().optional(),
    netSalary: z.number().optional(),
  }).optional(),

  // Bank Details
  bankAccount: z.object({
    accountNumber: z.string().optional().nullable(),
    ifscCode: z.string().optional().nullable(),
    bankName: z.string().optional().nullable(),
  }).optional(),

  // Leave Settings
  leaveSettings: z.object({
    totalLeaves: z.number().optional(),
    taken: z.number().optional(),
    remaining: z.number().optional(),
  }).optional(),
});

type FacultyAdminFormValues = z.infer<typeof facultyAdminSchema>;

export default function EditFacultyAdminPage() {
  const router = useRouter();
  const params = useParams();
  const facultyAdminId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [calculatedNetSalary, setCalculatedNetSalary] = useState(0);
  const [facultyAdminData, setFacultyAdminData] = useState<any>(null);

  const form = useForm<FacultyAdminFormValues>({
    resolver: zodResolver(facultyAdminSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      gender: "Prefer not to say",
      bloodGroup: "O+",
      address: {
        street: "",
        city: "",
        state: "",
        country: "India",
        pincode: "",
      },
      aadharNumber: "",
      panNumber: "",
      employeeId: "",
      department: "",
      designation: "",
      contractType: "PERMANENT",
      shiftTimings: {
        start: "09:00",
        end: "17:00",
        gracePeriod: 15,
        workingHours: 8,
      },
      salary: {
        basic: 0,
        hra: 0,
        da: 0,
        ta: 0,
        pf: 0,
        tax: 0,
        netSalary: 0,
      },
      bankAccount: {
        accountNumber: "",
        ifscCode: "",
        bankName: "",
      },
      leaveSettings: {
        totalLeaves: 30,
        taken: 0,
        remaining: 30,
      },
    },
  });

  // Watch salary fields to calculate net salary
  const watchSalary = form.watch("salary");
  useEffect(() => {
    if (watchSalary) {
      const totalEarnings = (watchSalary.basic || 0) + (watchSalary.hra || 0) + 
                           (watchSalary.da || 0) + (watchSalary.ta || 0);
      const totalDeductions = (watchSalary.pf || 0) + (watchSalary.tax || 0);
      const netSalary = totalEarnings - totalDeductions;
      setCalculatedNetSalary(netSalary);
      
      // Update the netSalary field in the form
      form.setValue("salary.netSalary", netSalary);
    }
  }, [watchSalary, form]);

  useEffect(() => {
    fetchFacultyAdminDetails();
  }, [facultyAdminId]);

  const fetchFacultyAdminDetails = async () => {
    try {
      setIsLoading(true);
      const data = await getFacultyAdminDetailsApi(facultyAdminId);
      setFacultyAdminData(data);
      
      // Format dates for input fields
      let formattedDate = "";
      if (data.facultyAdmin.dateOfBirth) {
        try {
          formattedDate = new Date(data.facultyAdmin.dateOfBirth).toISOString().split('T')[0];
        } catch {
          formattedDate = "";
        }
      }

      let formattedJoiningDate = "";
      if (data.facultyAdmin.employeeRecord?.joiningDate) {
        try {
          formattedJoiningDate = new Date(data.facultyAdmin.employeeRecord.joiningDate).toISOString().split('T')[0];
        } catch {
          formattedJoiningDate = "";
        }
      }

      // Get shift timings from employeeRecord or use defaults
      const shiftTimings = data.facultyAdmin.employeeRecord?.shiftTimings || {
        start: "09:00",
        end: "17:00",
        gracePeriod: 15,
        workingHours: 8,
      };

      // Get salary info
      const salary = data.facultyAdmin.employeeRecord?.salary || {
        basic: 0,
        hra: 0,
        da: 0,
        ta: 0,
        pf: 0,
        tax: 0,
        netSalary: 0,
      };

      // Calculate net salary for display
      const totalEarnings = (salary.basic || 0) + (salary.hra || 0) + 
                           (salary.da || 0) + (salary.ta || 0);
      const totalDeductions = (salary.pf || 0) + (salary.tax || 0);
      const netSalary = totalEarnings - totalDeductions;

      // Get bank info
      const bankAccount = data.facultyAdmin.employeeRecord?.salary?.bankAccount || {
        accountNumber: "",
        ifscCode: "",
        bankName: "",
      };

      // Get leave info
      const leaveSettings = data.facultyAdmin.employeeRecord?.leaves || {
        total: 30,
        taken: 0,
        remaining: 30,
      };

      form.reset({
        name: data.facultyAdmin.name || "",
        email: data.facultyAdmin.email || "",
        phone: data.facultyAdmin.phone || "",
        dateOfBirth: formattedDate,
        gender: data.facultyAdmin.gender || "Prefer not to say",
        bloodGroup: data.facultyAdmin.bloodGroup || "O+",
        address: {
          street: data.facultyAdmin.address?.street || "",
          city: data.facultyAdmin.address?.city || "",
          state: data.facultyAdmin.address?.state || "",
          country: data.facultyAdmin.address?.country || "India",
          pincode: data.facultyAdmin.address?.pincode || "",
        },
        aadharNumber: data.facultyAdmin.aadharNumber || "",
        panNumber: data.facultyAdmin.panNumber || "",
        employeeId: data.facultyAdmin.employeeRecord?.employeeId || "",
        department: data.facultyAdmin.employeeRecord?.department || "",
        designation: data.facultyAdmin.employeeRecord?.designation || "",
        joiningDate: formattedJoiningDate,
        contractType: data.facultyAdmin.employeeRecord?.contractType || "PERMANENT",
        
        // Shift Timings
        shiftTimings: {
          start: shiftTimings.start,
          end: shiftTimings.end,
          gracePeriod: shiftTimings.gracePeriod,
          workingHours: shiftTimings.workingHours,
        },
        
        // Salary
        salary: {
          basic: salary.basic || 0,
          hra: salary.hra || 0,
          da: salary.da || 0,
          ta: salary.ta || 0,
          pf: salary.pf || 0,
          tax: salary.tax || 0,
          netSalary: netSalary,
        },
        
        // Bank
        bankAccount: {
          accountNumber: bankAccount.accountNumber || "",
          ifscCode: bankAccount.ifscCode || "",
          bankName: bankAccount.bankName || "",
        },
        
        // Leave
        leaveSettings: {
          totalLeaves: leaveSettings.total || 30,
          taken: leaveSettings.taken || 0,
          remaining: leaveSettings.remaining || 30,
        },
      });

      setCalculatedNetSalary(netSalary);
    } catch (error) {
      console.error("Error fetching faculty admin:", error);
      toast.error("Failed to load faculty admin details");
      router.push("/admin/faculty-admins");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: FacultyAdminFormValues) => {
    setIsSaving(true);
    try {
      // Format the data for API
      const updateData = {
        id: facultyAdminId,
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : undefined,
        gender: data.gender || undefined,
        bloodGroup: data.bloodGroup || undefined,
        address: data.address,
        aadharNumber: data.aadharNumber || undefined,
        panNumber: data.panNumber || undefined,
        department: data.department || undefined,
        designation: data.designation || undefined,
        joiningDate: data.joiningDate ? new Date(data.joiningDate).toISOString() : undefined,
        contractType: data.contractType || undefined,
        
        // Shift timings
        shiftTimings: data.shiftTimings,
        
        // Salary
        salary: data.salary ? {
          basic: data.salary.basic,
          hra: data.salary.hra,
          da: data.salary.da,
          ta: data.salary.ta,
          pf: data.salary.pf,
          tax: data.salary.tax,
          netSalary: calculatedNetSalary,
        } : undefined,
        
        // Bank details
        bankAccount: data.bankAccount,
        
        // Leave settings
        leaveSettings: data.leaveSettings ? {
          totalLeaves: data.leaveSettings.totalLeaves,
          taken: data.leaveSettings.taken,
          remaining: data.leaveSettings.remaining,
        } : undefined,
      };

      await updateFacultyAdminApi(updateData);
      toast.success("Faculty Admin Updated", {
        description: "The faculty admin information has been updated successfully.",
      });
      router.push(`/admin/faculty-admins/${facultyAdminId}`);
    } catch (error: any) {
      toast.error("Update Failed", {
        description: error.response?.data?.message || "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Helper function to get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading faculty admin details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 min-h-screen">
      {/* Header with Profile Summary */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {getInitials(form.watch("name") || "FA")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {form.watch("name") || "Faculty Admin"}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {form.watch("department") || "Department"}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <BadgeIndianRupee className="h-3 w-3" />
                ₹{calculatedNetSalary.toLocaleString()}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {form.watch("employeeId") || "ID"}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1 md:flex-none"
          >
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSaving}
            className="flex-1 md:flex-none bg-primary hover:bg-primary/90"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-2 md:grid-cols-7 w-full h-auto p-1 bg-white dark:bg-gray-800 shadow-sm">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <UserRound className="h-4 w-4" />
                <span className="hidden md:inline">Personal</span>
              </TabsTrigger>
              <TabsTrigger value="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="hidden md:inline">Address</span>
              </TabsTrigger>
              <TabsTrigger value="employment" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                <span className="hidden md:inline">Employment</span>
              </TabsTrigger>
              <TabsTrigger value="shift" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="hidden md:inline">Shift</span>
              </TabsTrigger>
              <TabsTrigger value="salary" className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                <span className="hidden md:inline">Salary</span>
              </TabsTrigger>
              <TabsTrigger value="bank" className="flex items-center gap-2">
                <Landmark className="h-4 w-4" />
                <span className="hidden md:inline">Bank</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden md:inline">Docs</span>
              </TabsTrigger>
            </TabsList>

            {/* ========== PERSONAL INFO TAB ========== */}
            <TabsContent value="personal">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <UserRound className="h-5 w-5 text-blue-600" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Update personal details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <UserRound className="h-3 w-3" />
                            Full Name <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter full name" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            Email <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="admin@example.com" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            Phone Number
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter phone number" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Date of Birth
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <UserRound className="h-3 w-3" />
                            Gender
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "Prefer not to say"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                              <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bloodGroup"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Droplets className="h-3 w-3" />
                            Blood Group
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "O+"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="A+">A+</SelectItem>
                              <SelectItem value="A-">A-</SelectItem>
                              <SelectItem value="B+">B+</SelectItem>
                              <SelectItem value="B-">B-</SelectItem>
                              <SelectItem value="O+">O+</SelectItem>
                              <SelectItem value="O-">O-</SelectItem>
                              <SelectItem value="AB+">AB+</SelectItem>
                              <SelectItem value="AB-">AB-</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ========== ADDRESS TAB ========== */}
            <TabsContent value="address">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800 border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-green-600" />
                    Address Information
                  </CardTitle>
                  <CardDescription>
                    Update residential address details
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="address.street"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="flex items-center gap-1">
                            <Home className="h-3 w-3" />
                            Street Address
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter street address" {...field} value={field.value || ""} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter city" {...field} value={field.value || ""} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address.state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter state" {...field} value={field.value || ""} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address.country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter country" {...field} value={field.value || "India"} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address.pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pincode</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter pincode" {...field} value={field.value || ""} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ========== EMPLOYMENT TAB ========== */}
            <TabsContent value="employment">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800 border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-purple-600" />
                    Employment Details
                  </CardTitle>
                  <CardDescription>
                    Update employment and contract information
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="employeeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            Employee ID
                          </FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} readOnly className="bg-muted" />
                          </FormControl>
                          <FormDescription>Auto-generated unique ID</FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Administration">Administration</SelectItem>
                              <SelectItem value="Academic Affairs">Academic Affairs</SelectItem>
                              <SelectItem value="Student Affairs">Student Affairs</SelectItem>
                              <SelectItem value="Finance">Finance</SelectItem>
                              <SelectItem value="Human Resources">Human Resources</SelectItem>
                              <SelectItem value="Examinations">Examinations</SelectItem>
                              <SelectItem value="Library">Library</SelectItem>
                              <SelectItem value="IT Services">IT Services</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="designation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Designation</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select designation" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Faculty Admin">Faculty Admin</SelectItem>
                              <SelectItem value="Senior Faculty Admin">Senior Faculty Admin</SelectItem>
                              <SelectItem value="Department Head">Department Head</SelectItem>
                              <SelectItem value="Dean">Dean</SelectItem>
                              <SelectItem value="Director">Director</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contractType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contract Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "PERMANENT"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="PERMANENT">Permanent</SelectItem>
                              <SelectItem value="CONTRACT">Contract</SelectItem>
                              <SelectItem value="VISITING">Visiting</SelectItem>
                              <SelectItem value="PROBATION">Probation</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="joiningDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Joining Date
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={field.value || ""} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ========== SHIFT TIMINGS TAB ========== */}
            <TabsContent value="shift">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-800 border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-600" />
                    Shift Timings
                  </CardTitle>
                  <CardDescription>
                    Configure work schedule for attendance tracking
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="shiftTimings.start"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shift Start Time</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="time"
                                className="pl-9"
                                {...field}
                                value={field.value || "09:00"}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>Regular shift start time</FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shiftTimings.end"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shift End Time</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="time"
                                className="pl-9"
                                {...field}
                                value={field.value || "17:00"}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>Regular shift end time</FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shiftTimings.gracePeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grace Period (minutes)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                className="pl-9"
                                {...field}
                                value={field.value || 15}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 15)}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>Minutes allowed after shift start without being late</FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shiftTimings.workingHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Working Hours Per Day</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                step="0.5"
                                className="pl-9"
                                {...field}
                                value={field.value || 8}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 8)}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>Expected daily working hours</FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Shift Summary */}
                  <Card className="bg-muted/50 border-0">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Shift Summary
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-center">
                          <span className="text-xs text-muted-foreground">Start</span>
                          <p className="font-bold text-lg">{form.watch("shiftTimings.start") || "09:00"}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-center">
                          <span className="text-xs text-muted-foreground">End</span>
                          <p className="font-bold text-lg">{form.watch("shiftTimings.end") || "17:00"}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-center">
                          <span className="text-xs text-muted-foreground">Grace</span>
                          <p className="font-bold text-lg">{form.watch("shiftTimings.gracePeriod") || 15} min</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-center">
                          <span className="text-xs text-muted-foreground">Hours</span>
                          <p className="font-bold text-lg">{form.watch("shiftTimings.workingHours") || 8} hrs</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ========== SALARY TAB ========== */}
            <TabsContent value="salary">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-800 border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-emerald-600" />
                    Salary Structure
                  </CardTitle>
                  <CardDescription>
                    Configure salary components and deductions
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="salary.basic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <IndianRupee className="h-3 w-3" />
                            Basic Salary
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                className="pl-9"
                                {...field}
                                value={field.value || 0}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="salary.hra"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>HRA</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                className="pl-9"
                                {...field}
                                value={field.value || 0}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="salary.da"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dearness Allowance</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                className="pl-9"
                                {...field}
                                value={field.value || 0}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="salary.ta"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Travel Allowance</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                className="pl-9"
                                {...field}
                                value={field.value || 0}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="salary.pf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PF Deduction</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                className="pl-9"
                                {...field}
                                value={field.value || 0}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="salary.tax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Deduction</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                className="pl-9"
                                {...field}
                                value={field.value || 0}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Salary Summary Card */}
                  <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <CardContent className="p-6 space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <BadgeIndianRupee className="h-5 w-5" />
                        Salary Summary
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Basic:</span>
                            <span className="font-medium">₹{(watchSalary?.basic || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">HRA:</span>
                            <span className="font-medium">₹{(watchSalary?.hra || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">DA:</span>
                            <span className="font-medium">₹{(watchSalary?.da || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">TA:</span>
                            <span className="font-medium">₹{(watchSalary?.ta || 0).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">PF:</span>
                            <span className="font-medium text-orange-600">-₹{(watchSalary?.pf || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Tax:</span>
                            <span className="font-medium text-orange-600">-₹{(watchSalary?.tax || 0).toLocaleString()}</span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between font-bold">
                            <span>Net Salary:</span>
                            <span className="text-lg text-primary">₹{calculatedNetSalary.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ========== BANK DETAILS TAB ========== */}
            <TabsContent value="bank">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800 border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-blue-600" />
                    Bank Account Details
                  </CardTitle>
                  <CardDescription>
                    Update bank information for salary transfer
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="bankAccount.accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            Account Number
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter account number" {...field} value={field.value || ""} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bankAccount.ifscCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>IFSC Code</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., SBIN0001234" {...field} value={field.value || ""} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bankAccount.bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter bank name" {...field} value={field.value || ""} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Leave Summary Card */}
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        Leave Summary
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg text-center">
                          <span className="text-sm text-muted-foreground">Total</span>
                          <p className="text-2xl font-bold">{form.watch("leaveSettings.totalLeaves") || 30}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg text-center">
                          <span className="text-sm text-muted-foreground">Taken</span>
                          <p className="text-2xl font-bold text-yellow-600">{form.watch("leaveSettings.taken") || 0}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg text-center">
                          <span className="text-sm text-muted-foreground">Remaining</span>
                          <p className="text-2xl font-bold text-green-600">{form.watch("leaveSettings.remaining") || 30}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ========== DOCUMENTS TAB ========== */}
            <TabsContent value="documents">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-gray-800 dark:to-gray-800 border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <FileText className="h-5 w-5 text-rose-600" />
                    Identity Documents
                  </CardTitle>
                  <CardDescription>
                    Update identity and verification documents
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="aadharNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <FileBadge className="h-3 w-3" />
                            Aadhar Number
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter 12-digit Aadhar number" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormDescription>12-digit unique identification number</FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="panNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <NotebookPen className="h-3 w-3" />
                            PAN Number
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., ABCDE1234F" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormDescription>Permanent Account Number</FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Document Upload Section - Optional */}
                  <Card className="bg-muted/50 border-dashed">
                    <CardContent className="p-6 text-center">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <h4 className="font-medium mb-1">Document Management</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Upload and manage official documents
                      </p>
                      <Button variant="outline" size="sm" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Manage Documents
                      </Button>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 sticky bottom-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="gap-2"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSaving}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}