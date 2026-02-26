"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Loader2, 
  Save,
  UserPlus,
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
  ChevronRight
} from "lucide-react";
import { createFacultyAdminApi } from "@/lib/api/admin.api";

// Extended schema with shift timings and all fields
const facultyAdminSchema = z.object({
  // Personal Information
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["Male", "Female", "Other", "Prefer not to say"]).optional(),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]).optional(),
  
  // Address
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    pincode: z.string().optional(),
  }).optional(),

  // Identity Documents
  aadharNumber: z.string().optional(),
  panNumber: z.string().optional(),
  
  // Employment Details
  employeeId: z.string().optional(),
  department: z.string().min(1, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
  joiningDate: z.string().optional(),
  contractType: z.enum(["PERMANENT", "CONTRACT", "VISITING", "PROBATION"]).default("PERMANENT"),

  // Shift Timings
  shiftTimings: z.object({
    start: z.string().default("09:00"),
    end: z.string().default("17:00"),
    gracePeriod: z.number().default(15),
    workingHours: z.number().default(8),
  }).optional(),

  // Salary Structure
  salary: z.object({
    basic: z.number().min(0).default(50000),
    hra: z.number().min(0).default(20000),
    da: z.number().min(0).default(7500),
    ta: z.number().min(0).default(3000),
    pf: z.number().min(0).default(6000),
    tax: z.number().min(0).default(8000),
  }).optional(),

  // Bank Details
  bankAccount: z.object({
    accountNumber: z.string().optional(),
    ifscCode: z.string().optional(),
    bankName: z.string().optional(),
  }).optional(),

  // Leave Settings
  leaveSettings: z.object({
    totalLeaves: z.number().default(30),
  }).optional(),

  // Qualifications
  qualifications: z.array(z.object({
    degree: z.string(),
    specialization: z.string(),
    university: z.string(),
    year: z.number(),
    percentage: z.number().optional(),
  })).optional(),
});

type FacultyAdminFormValues = z.infer<typeof facultyAdminSchema>;

export default function CreateFacultyAdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [previewMode, setPreviewMode] = useState(false);
  const [calculatedNetSalary, setCalculatedNetSalary] = useState(0);

  const form = useForm<FacultyAdminFormValues>({
    resolver: zodResolver(facultyAdminSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
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
      employeeId: `FAC${new Date().getFullYear()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      department: "",
      designation: "Faculty Admin",
      contractType: "PERMANENT",
      shiftTimings: {
        start: "09:00",
        end: "17:00",
        gracePeriod: 15,
        workingHours: 8,
      },
      salary: {
        basic: 50000,
        hra: 20000,
        da: 7500,
        ta: 3000,
        pf: 6000,
        tax: 8000,
      },
      bankAccount: {
        accountNumber: "",
        ifscCode: "",
        bankName: "",
      },
      leaveSettings: {
        totalLeaves: 30,
      },
      qualifications: [],
    },
  });

  // Watch salary fields to calculate net salary
  const watchSalary = form.watch("salary");
  useEffect(() => {
    if (watchSalary) {
      const totalEarnings = (watchSalary.basic || 0) + (watchSalary.hra || 0) + 
                           (watchSalary.da || 0) + (watchSalary.ta || 0);
      const totalDeductions = (watchSalary.pf || 0) + (watchSalary.tax || 0);
      setCalculatedNetSalary(totalEarnings - totalDeductions);
    }
  }, [watchSalary]);

  const onSubmit = async (data: FacultyAdminFormValues) => {
    setIsLoading(true);
    try {
      // Format the data for API
      const apiData = {
        ...data,
        joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
        salary: data.salary ? {
          ...data.salary,
          netSalary: calculatedNetSalary,
        } : undefined,
      };

      await createFacultyAdminApi(apiData);
      toast.success("Faculty Admin Created", {
        description: "New faculty admin has been added successfully.",
      });
      router.push("/admin/faculty-admins");
    } catch (error: any) {
      toast.error("Creation Failed", {
        description: error.response?.data?.message || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Preview Component
  const PreviewCard = () => (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>Profile Preview</CardTitle>
        <CardDescription>Review faculty admin information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {form.watch("name")?.charAt(0) || "F"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-lg">{form.watch("name") || "Faculty Admin"}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {form.watch("email") || "email@example.com"}
            </p>
            {form.watch("phone") && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {form.watch("phone")}
              </p>
            )}
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Department:</span>
            <span className="font-medium">{form.watch("department") || "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Designation:</span>
            <span className="font-medium">{form.watch("designation") || "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Net Salary:</span>
            <span className="font-medium">₹{calculatedNetSalary.toLocaleString()}</span>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-medium mb-2">Shift Timings</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start:</span>
              <span>{form.watch("shiftTimings.start") || "09:00"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">End:</span>
              <span>{form.watch("shiftTimings.end") || "17:00"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Grace Period:</span>
              <span>{form.watch("shiftTimings.gracePeriod") || 15} min</span>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-medium mb-2">Salary Breakdown</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Basic:</span>
              <span>₹{form.watch("salary.basic")?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">HRA:</span>
              <span>₹{form.watch("salary.hra")?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-destructive">
              <span>Total Deductions:</span>
              <span>-₹{((form.watch("salary.pf") || 0) + (form.watch("salary.tax") || 0)).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add Faculty Admin</h1>
            <p className="text-muted-foreground mt-1">
              Create a new faculty administrator account with complete details
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? "Hide Preview" : "Show Preview"}
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            Create Faculty Admin
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main Form */}
        <div className={`flex-1 ${previewMode ? "w-2/3" : "w-full"}`}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid grid-cols-8 w-full">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="address">Address</TabsTrigger>
                  <TabsTrigger value="employment">Employment</TabsTrigger>
                  <TabsTrigger value="shift">Shift</TabsTrigger>
                  <TabsTrigger value="salary">Salary</TabsTrigger>
                  <TabsTrigger value="bank">Bank</TabsTrigger>
                  <TabsTrigger value="leave">Leave</TabsTrigger>
                  <TabsTrigger value="documents">Docs</TabsTrigger>
                </TabsList>

                {/* Personal Info Tab */}
                <TabsContent value="personal">
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>
                        Enter the faculty admin's personal details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input placeholder="Enter full name" {...field} />
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
                              <FormLabel>Email Address <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="admin@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormDescription>Minimum 6 characters</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter phone number" {...field} />
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
                              <FormLabel>Date of Birth</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
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
                              <FormLabel>Gender</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
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
                              <FormLabel>Blood Group</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select blood group" />
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

                {/* Address Tab */}
                <TabsContent value="address">
                  <Card>
                    <CardHeader>
                      <CardTitle>Address Information</CardTitle>
                      <CardDescription>
                        Enter the faculty admin's address details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="address.street"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Street Address</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter street address" {...field} />
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
                                <Input placeholder="Enter city" {...field} />
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
                                <Input placeholder="Enter state" {...field} />
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
                                <Input placeholder="Enter country" {...field} />
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
                                <Input placeholder="Enter pincode" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Employment Tab */}
                <TabsContent value="employment">
                  <Card>
                    <CardHeader>
                      <CardTitle>Employment Details</CardTitle>
                      <CardDescription>
                        Enter employment information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="employeeId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Employee ID</FormLabel>
                              <FormControl>
                                <Input {...field} readOnly className="bg-muted" />
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
                              <FormLabel>Department <span className="text-destructive">*</span></FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                              <FormLabel>Designation <span className="text-destructive">*</span></FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                              <FormLabel>Joining Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Shift Timings Tab */}
                <TabsContent value="shift">
                  <Card>
                    <CardHeader>
                      <CardTitle>Shift Timings</CardTitle>
                      <CardDescription>
                        Configure work schedule for attendance tracking
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
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
                      <Card className="bg-muted/50">
                        <CardContent className="p-4">
                          <h4 className="font-medium mb-3">Shift Summary</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Start Time:</span>
                              <p className="font-medium">{form.watch("shiftTimings.start") || "09:00"}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">End Time:</span>
                              <p className="font-medium">{form.watch("shiftTimings.end") || "17:00"}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Grace Period:</span>
                              <p className="font-medium">{form.watch("shiftTimings.gracePeriod") || 15} minutes</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Working Hours:</span>
                              <p className="font-medium">{form.watch("shiftTimings.workingHours") || 8} hours/day</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Salary Tab */}
                <TabsContent value="salary">
                  <Card>
                    <CardHeader>
                      <CardTitle>Salary Structure</CardTitle>
                      <CardDescription>
                        Configure salary components
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="salary.basic"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Basic Salary</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    type="number"
                                    className="pl-9"
                                    {...field}
                                    value={field.value || 50000}
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
                                    value={field.value || 20000}
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
                                    value={field.value || 7500}
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
                                    value={field.value || 3000}
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
                                    value={field.value || 6000}
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
                                    value={field.value || 8000}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Salary Summary */}
                      <Card className="bg-muted/50">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between text-sm">
                            <span>Total Earnings:</span>
                            <span className="font-medium text-green-600">
                              ₹{((watchSalary?.basic || 0) + (watchSalary?.hra || 0) + 
                                 (watchSalary?.da || 0) + (watchSalary?.ta || 0)).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Total Deductions:</span>
                            <span className="font-medium text-destructive">
                              -₹{((watchSalary?.pf || 0) + (watchSalary?.tax || 0)).toLocaleString()}
                            </span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-bold">
                            <span>Net Salary:</span>
                            <span className="text-primary text-lg">
                              ₹{calculatedNetSalary.toLocaleString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Bank Details Tab */}
                <TabsContent value="bank">
                  <Card>
                    <CardHeader>
                      <CardTitle>Bank Account Details</CardTitle>
                      <CardDescription>
                        Enter bank information for salary transfer
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="bankAccount.accountNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Account Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter account number" {...field} />
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
                                <Input placeholder="e.g., SBIN0001234" {...field} />
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
                                <Input placeholder="Enter bank name" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Leave Settings Tab */}
                <TabsContent value="leave">
                  <Card>
                    <CardHeader>
                      <CardTitle>Leave Settings</CardTitle>
                      <CardDescription>
                        Configure leave policies
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="leaveSettings.totalLeaves"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Annual Leave Quota</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                value={field.value || 30}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                              />
                            </FormControl>
                            <FormDescription>Number of leaves per year</FormDescription>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents">
                  <Card>
                    <CardHeader>
                      <CardTitle>Identity Documents</CardTitle>
                      <CardDescription>
                        Upload identity proofs
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="aadharNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Aadhar Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter 12-digit Aadhar number" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="panNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>PAN Number</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., ABCDE1234F" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Form Actions */}
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Create Faculty Admin
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* Preview Panel */}
        {previewMode && (
          <div className="w-1/3">
            <PreviewCard />
          </div>
        )}
      </div>
    </div>
  );
}