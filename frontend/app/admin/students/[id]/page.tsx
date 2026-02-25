// app/admin/students/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { getStudentDetailsApi, updateStudentApi } from "@/lib/api/admin.api";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Loader2,
  ArrowLeft,
  CalendarCheck,
  GraduationCap,
  BookOpen,
  Award,
  Users,
  Clock,
  MapPin,
  Mail,
  Phone,
  Calendar,
  User,
  Briefcase,
  IndianRupee,
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Edit,
  Printer,
  RefreshCw,
  Save,
  X,
  Plus,
  Pencil,
} from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Validation Schema for Personal Info
const personalInfoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["Male", "Female", "Other", "Prefer not to say"]).optional(),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]).optional(),
});

// Validation Schema for Address
const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
});

// Validation Schema for Academic Info
const academicInfoSchema = z.object({
  enrollmentNumber: z.string().optional(),
  batch: z.string().optional(),
  currentSemester: z.string().optional(),
  cgpa: z.number().min(0).max(10).optional(),
  backlogs: z.number().min(0).default(0),
});

// Validation Schema for Education
const educationSchema = z.object({
  degree: z.string().min(1, "Degree is required"),
  specialization: z.string().min(1, "Specialization is required"),
  university: z.string().min(1, "University is required"),
  yearOfPassing: z.number().min(1900).max(2100),
  percentage: z.number().min(0).max(100),
});

// Validation Schema for Job Preferences
const jobPreferencesSchema = z.object({
  preferredRoles: z.array(z.string()).optional(),
  preferredLocations: z.array(z.string()).optional(),
  expectedSalary: z.string().optional(),
  jobType: z.array(z.enum(["Full Time", "Part Time", "Internship", "Work from Home", "Contract"])).optional(),
  immediateJoiner: z.boolean().default(false),
  noticePeriod: z.string().optional(),
});

// Validation Schema for Social Links
const socialLinksSchema = z.object({
  linkedin: z.string().url().optional().or(z.literal("")),
  github: z.string().url().optional().or(z.literal("")),
  portfolio: z.string().url().optional().or(z.literal("")),
  twitter: z.string().url().optional().or(z.literal("")),
});

type PersonalInfoFormValues = z.infer<typeof personalInfoSchema>;
type AddressFormValues = z.infer<typeof addressSchema>;
type AcademicInfoFormValues = z.infer<typeof academicInfoSchema>;
type EducationFormValues = z.infer<typeof educationSchema>;
type JobPreferencesFormValues = z.infer<typeof jobPreferencesSchema>;
type SocialLinksFormValues = z.infer<typeof socialLinksSchema>;

export default function StudentDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [assignmentFilter, setAssignmentFilter] = useState("ALL");

  // Edit mode states
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditingAcademic, setIsEditingAcademic] = useState(false);
  const [isEditingEducation, setIsEditingEducation] = useState(false);
  const [isEditingJobPrefs, setIsEditingJobPrefs] = useState(false);
  const [isEditingSocial, setIsEditingSocial] = useState(false);
  const [editingEducationIndex, setEditingEducationIndex] = useState<number | null>(null);
  const [showEducationDialog, setShowEducationDialog] = useState(false);
  const [educationList, setEducationList] = useState<any[]>([]);

  // New education form state
  const [newEducation, setNewEducation] = useState<EducationFormValues>({
    degree: "",
    specialization: "",
    university: "",
    yearOfPassing: new Date().getFullYear(),
    percentage: 0,
  });

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["student-details", id],
    queryFn: () => getStudentDetailsApi(id as string),
  });

  // Initialize forms
  const personalForm = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      gender: "Prefer not to say",
      bloodGroup: "O+",
    },
  });

  const addressForm = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
    },
  });

  const academicForm = useForm<AcademicInfoFormValues>({
    resolver: zodResolver(academicInfoSchema),
    defaultValues: {
      enrollmentNumber: "",
      batch: "",
      currentSemester: "",
      cgpa: 0,
      backlogs: 0,
    },
  });

  const jobPrefsForm = useForm<JobPreferencesFormValues>({
    resolver: zodResolver(jobPreferencesSchema),
    defaultValues: {
      preferredRoles: [],
      preferredLocations: [],
      expectedSalary: "",
      jobType: [],
      immediateJoiner: false,
      noticePeriod: "",
    },
  });

  const socialForm = useForm<SocialLinksFormValues>({
    resolver: zodResolver(socialLinksSchema),
    defaultValues: {
      linkedin: "",
      github: "",
      portfolio: "",
      twitter: "",
    },
  });

  // Update forms when data loads
  useEffect(() => {
    if (data?.student) {
      const student = data.student;
      
      // Format date for input
      let formattedDate = "";
      if (student.dateOfBirth) {
        try {
          formattedDate = new Date(student.dateOfBirth).toISOString().split('T')[0];
        } catch {
          formattedDate = "";
        }
      }

      personalForm.reset({
        name: student.name || "",
        email: student.email || "",
        phone: student.phone || "",
        dateOfBirth: formattedDate,
        gender: student.gender || "Prefer not to say",
        bloodGroup: student.bloodGroup || "O+",
      });

      addressForm.reset({
        street: student.address?.street || "",
        city: student.address?.city || "",
        state: student.address?.state || "",
        country: student.address?.country || "India",
        pincode: student.address?.pincode || "",
      });

      academicForm.reset({
        enrollmentNumber: student.enrollmentNumber || "",
        batch: student.batch || "",
        currentSemester: student.currentSemester || "",
        cgpa: student.cgpa || 0,
        backlogs: student.backlogs || 0,
      });

      if (student.jobPreferences) {
        jobPrefsForm.reset({
          preferredRoles: student.jobPreferences.preferredRoles || [],
          preferredLocations: student.jobPreferences.preferredLocations || [],
          expectedSalary: student.jobPreferences.expectedSalary || "",
          jobType: student.jobPreferences.jobType || [],
          immediateJoiner: student.jobPreferences.immediateJoiner || false,
          noticePeriod: student.jobPreferences.noticePeriod || "",
        });
      }

      if (student.socialLinks) {
        socialForm.reset({
          linkedin: student.socialLinks.linkedin || "",
          github: student.socialLinks.github || "",
          portfolio: student.socialLinks.portfolio || "",
          twitter: student.socialLinks.twitter || "",
        });
      }

      setEducationList(student.education || []);
    }
  }, [data, personalForm, addressForm, academicForm, jobPrefsForm, socialForm]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (updateData: any) => updateStudentApi(id as string, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-details", id] });
      toast.success("Student updated successfully");
      
      // Exit edit modes
      setIsEditingPersonal(false);
      setIsEditingAddress(false);
      setIsEditingAcademic(false);
      setIsEditingJobPrefs(false);
      setIsEditingSocial(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update student");
    },
  });

  // Calculate missed assignments
  const missedCount = useMemo(() => {
    if (!data) return 0;
    const assignments = data.statistics?.assignments || {};
    return assignments.total - assignments.submitted;
  }, [data]);

  // Filter assignments
  const filteredAssignments = useMemo(() => {
    if (!data) return [];
    const assignments = data.statistics?.assignments?.list || [];
    if (assignmentFilter === "ALL") return assignments;
    return assignments.filter((a: any) => a.status === assignmentFilter);
  }, [assignmentFilter, data]);

  // Handle personal info save
  const handlePersonalSave = (values: PersonalInfoFormValues) => {
    updateMutation.mutate({
      name: values.name,
      email: values.email,
      phone: values.phone,
      dateOfBirth: values.dateOfBirth ? new Date(values.dateOfBirth).toISOString() : undefined,
      gender: values.gender,
      bloodGroup: values.bloodGroup,
    });
  };

  // Handle address save
  const handleAddressSave = (values: AddressFormValues) => {
    updateMutation.mutate({
      address: values,
    });
  };

  // Handle academic info save
  const handleAcademicSave = (values: AcademicInfoFormValues) => {
    updateMutation.mutate({
      enrollmentNumber: values.enrollmentNumber,
      batch: values.batch,
      currentSemester: values.currentSemester,
      cgpa: values.cgpa,
      backlogs: values.backlogs,
    });
  };

  // Handle education save
  const handleEducationSave = () => {
    let updatedEducation;
    if (editingEducationIndex !== null) {
      // Edit existing
      updatedEducation = educationList.map((edu, index) => 
        index === editingEducationIndex ? newEducation : edu
      );
    } else {
      // Add new
      updatedEducation = [...educationList, newEducation];
    }
    
    updateMutation.mutate({
      education: updatedEducation,
    });
    
    setShowEducationDialog(false);
    setEditingEducationIndex(null);
    setNewEducation({
      degree: "",
      specialization: "",
      university: "",
      yearOfPassing: new Date().getFullYear(),
      percentage: 0,
    });
  };

  // Handle education delete
  const handleEducationDelete = (index: number) => {
    const updatedEducation = educationList.filter((_, i) => i !== index);
    updateMutation.mutate({
      education: updatedEducation,
    });
  };

  // Handle job preferences save
  const handleJobPrefsSave = (values: JobPreferencesFormValues) => {
    updateMutation.mutate({
      jobPreferences: values,
    });
  };

  // Handle social links save
  const handleSocialSave = (values: SocialLinksFormValues) => {
    updateMutation.mutate({
      socialLinks: values,
    });
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin size-8 text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <p className="text-muted-foreground">Student not found</p>
      </div>
    );
  }

  const { student, statistics } = data;

  // Helper functions
  const getStatusColor = (status: string) => {
    switch(status) {
      case "EVALUATED": return "bg-green-500/10 text-green-600 border-green-200";
      case "SUBMITTED": return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "MISSED": return "bg-red-500/10 text-red-600 border-red-200";
      case "PENDING": return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      default: return "";
    }
  };

  const getCourseStatusColor = (status: string) => {
    switch(status) {
      case "completed": return "bg-green-500/10 text-green-600 border-green-200";
      case "in_progress": return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "enrolled": return "bg-purple-500/10 text-purple-600 border-purple-200";
      case "dropped": return "bg-red-500/10 text-red-600 border-red-200";
      default: return "";
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Students</span>
              <span>/</span>
              <span className="text-foreground font-medium">{student.name}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-1">Student Profile</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => refetch()}
                  disabled={isRefetching}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh data</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <Printer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Print profile</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download report</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Student Profile Card */}
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5" />
        <CardContent className="pt-0 px-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-6 -mt-16">
            <Avatar className="h-32 w-32 border-4 border-background">
              <AvatarImage src={student.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                {student.name?.charAt(0) || "S"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold">{student.name}</h2>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <Badge variant="outline" className="px-3 py-1">
                      <Mail className="h-3 w-3 mr-1" />
                      {student.email}
                    </Badge>
                    {student.phone && (
                      <Badge variant="outline" className="px-3 py-1">
                        <Phone className="h-3 w-3 mr-1" />
                        {student.phone}
                      </Badge>
                    )}
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      <GraduationCap className="h-3 w-3 mr-1" />
                      Student
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge className={student.isActive ? "bg-green-500" : "bg-gray-500"}>
                    {student.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline">ID: {student.uniqueId || "N/A"}</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        {/* Quick Stats */}
        <div className="border-t bg-muted/50">
          <div className="grid grid-cols-2 md:grid-cols-6 divide-x divide-border">
            <div className="p-4 text-center">
              <p className="text-2xl font-bold">{statistics.classrooms.total}</p>
              <p className="text-xs text-muted-foreground">Classrooms</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold">{statistics.assignments.total}</p>
              <p className="text-xs text-muted-foreground">Assignments</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold">{statistics.courses.total}</p>
              <p className="text-xs text-muted-foreground">Courses</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold">{statistics.certificates.total}</p>
              <p className="text-xs text-muted-foreground">Certificates</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold">{student.cgpa || "N/A"}</p>
              <p className="text-xs text-muted-foreground">CGPA</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold">{student.batch || "N/A"}</p>
              <p className="text-xs text-muted-foreground">Batch</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Personal Info Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personal Information
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingPersonal(!isEditingPersonal)}
                >
                  {isEditingPersonal ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                </Button>
              </CardHeader>
              <CardContent>
                {isEditingPersonal ? (
                  <Form {...personalForm}>
                    <form onSubmit={personalForm.handleSubmit(handlePersonalSave)} className="space-y-4">
                      <FormField
                        control={personalForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={personalForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={personalForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={personalForm.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={personalForm.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
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
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={personalForm.control}
                        name="bloodGroup"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Blood Group</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
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
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingPersonal(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={updateMutation.isPending}>
                          {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                          Save
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">{student.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{student.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{student.phone || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Date of Birth</p>
                        <p className="font-medium">{formatDate(student.dateOfBirth)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Gender</p>
                        <p className="font-medium">{student.gender || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Blood Group</p>
                        <p className="font-medium">{student.bloodGroup || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Academic Info Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Academic Information
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingAcademic(!isEditingAcademic)}
                >
                  {isEditingAcademic ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                </Button>
              </CardHeader>
              <CardContent>
                {isEditingAcademic ? (
                  <Form {...academicForm}>
                    <form onSubmit={academicForm.handleSubmit(handleAcademicSave)} className="space-y-4">
                      <FormField
                        control={academicForm.control}
                        name="enrollmentNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Enrollment Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={academicForm.control}
                        name="batch"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Batch</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={academicForm.control}
                        name="currentSemester"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Semester</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={academicForm.control}
                        name="cgpa"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CGPA</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={academicForm.control}
                        name="backlogs"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Backlogs</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingAcademic(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={updateMutation.isPending}>
                          {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                          Save
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Enrollment No.</p>
                        <p className="font-medium">{student.enrollmentNumber || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Unique ID</p>
                        <p className="font-medium">{student.uniqueId || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Batch</p>
                        <p className="font-medium">{student.batch || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Semester</p>
                        <p className="font-medium">{student.currentSemester || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">CGPA</p>
                        <p className="font-medium">{student.cgpa || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Backlogs</p>
                        <p className="font-medium">{student.backlogs || 0}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{statistics.assignments.submitted}</p>
                    <p className="text-xs text-muted-foreground">Submitted</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">{statistics.assignments.pending}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{missedCount}</p>
                    <p className="text-xs text-muted-foreground">Missed</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{statistics.assignments.averageScore}%</p>
                    <p className="text-xs text-muted-foreground">Avg Score</p>
                  </div>
                </div>

                {/* Attendance Progress */}
                <div className="mt-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Attendance Rate</span>
                    <span className="font-medium">{statistics.attendance.attendancePercentage}%</span>
                  </div>
                  <Progress value={statistics.attendance.attendancePercentage} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Assignments</CardTitle>
              <div className="flex gap-2">
                {["ALL", "EVALUATED", "SUBMITTED", "MISSED", "PENDING"].map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={assignmentFilter === status ? "default" : "outline"}
                    onClick={() => setAssignmentFilter(status)}
                    className="capitalize"
                  >
                    {status.toLowerCase()}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {filteredAssignments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No assignments found for this filter
                </div>
              ) : (
                filteredAssignments.map((assignment: any) => {
                  const percentage = Number(assignment.percentage);
                  
                  return (
                    <div
                      key={assignment._id}
                      className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-lg">
                            {assignment.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            <CalendarCheck className="inline h-3 w-3 mr-1" />
                            Deadline: {formatDate(assignment.deadline)}
                          </p>
                          {assignment.classroom && (
                            <p className="text-xs text-muted-foreground mt-1">
                              <BookOpen className="inline h-3 w-3 mr-1" />
                              {assignment.classroom}
                            </p>
                          )}
                        </div>
                        <Badge 
                          variant="outline"
                          className={getStatusColor(assignment.status)}
                        >
                          {assignment.status}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Score</span>
                          <span className="font-medium">
                            {assignment.score} / {assignment.totalMarks}
                          </span>
                        </div>
                        <Progress 
                          value={percentage} 
                          className={`h-2 ${
                            percentage >= 75 ? "bg-green-100" :
                            percentage >= 50 ? "bg-yellow-100" :
                            "bg-red-100"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statistics.courses.list.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No courses enrolled</p>
                ) : (
                  statistics.courses.list.map((course: any) => (
                    <Card key={course.courseId}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{course.courseName}</h3>
                            <p className="text-sm text-muted-foreground">{course.courseCode}</p>
                          </div>
                          <Badge className={getCourseStatusColor(course.status)}>
                            {course.status.replace('_', ' ')}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Enrolled</p>
                            <p className="font-medium">{formatDate(course.enrollmentDate)}</p>
                          </div>
                          {course.grade && (
                            <div>
                              <p className="text-xs text-muted-foreground">Grade</p>
                              <p className="font-medium">{course.grade}</p>
                            </div>
                          )}
                          {course.percentage && (
                            <div>
                              <p className="text-xs text-muted-foreground">Percentage</p>
                              <p className="font-medium">{course.percentage}%</p>
                            </div>
                          )}
                        </div>

                        {course.courseDetails && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm">
                              <span className="text-muted-foreground">Credits:</span> {course.courseDetails.credits} | 
                              <span className="text-muted-foreground ml-2">Department:</span> {course.courseDetails.department}
                            </p>
                          </div>
                        )}

                        {course.certificateIssued && (
                          <div className="mt-2 flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm">Certificate Issued</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{statistics.attendance.present}</p>
                  <p className="text-sm text-muted-foreground">Present</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{statistics.attendance.absent}</p>
                  <p className="text-sm text-muted-foreground">Absent</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{statistics.attendance.totalDays}</p>
                  <p className="text-sm text-muted-foreground">Total Days</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Classroom</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statistics.attendance.records.map((record: any) => (
                    <TableRow key={record._id}>
                      <TableCell>{formatDate(record.date)}</TableCell>
                      <TableCell>{record.classroomId?.name || "N/A"}</TableCell>
                      <TableCell>
                        <Badge className={record.status === "PRESENT" ? "bg-green-500" : "bg-red-500"}>
                          {record.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Address */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingAddress(!isEditingAddress)}
                >
                  {isEditingAddress ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                </Button>
              </CardHeader>
              <CardContent>
                {isEditingAddress ? (
                  <Form {...addressForm}>
                    <form onSubmit={addressForm.handleSubmit(handleAddressSave)} className="space-y-4">
                      <FormField
                        control={addressForm.control}
                        name="street"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addressForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addressForm.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addressForm.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || "India"} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addressForm.control}
                        name="pincode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pincode</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingAddress(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={updateMutation.isPending}>
                          {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                          Save
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  student.address ? (
                    <p className="text-sm">
                      {student.address.street && <>{student.address.street},<br /></>}
                      {student.address.city && <>{student.address.city}, </>}
                      {student.address.state && <>{student.address.state} - </>}
                      {student.address.pincode && <>{student.address.pincode}</>}
                      {student.address.country && <><br />{student.address.country}</>}
                    </p>
                  ) : (
                    <p className="text-muted-foreground">No address provided</p>
                  )
                )}
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Identity Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">Aadhar Number</span>
                  <span className="font-medium">{student.aadharNumber || "N/A"}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">PAN Number</span>
                  <span className="font-medium">{student.panNumber || "N/A"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Education Section */}
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Education
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingEducationIndex(null);
                    setNewEducation({
                      degree: "",
                      specialization: "",
                      university: "",
                      yearOfPassing: new Date().getFullYear(),
                      percentage: 0,
                    });
                    setShowEducationDialog(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Education
                </Button>
              </CardHeader>
              <CardContent>
                {educationList.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">No education details added</p>
                ) : (
                  <div className="space-y-4">
                    {educationList.map((edu, index) => (
                      <div key={index} className="relative p-4 border rounded-lg group">
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingEducationIndex(index);
                              setNewEducation({
                                degree: edu.degree,
                                specialization: edu.specialization,
                                university: edu.university,
                                yearOfPassing: edu.yearOfPassing,
                                percentage: edu.percentage,
                              });
                              setShowEducationDialog(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleEducationDelete(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Degree</p>
                            <p className="font-medium">{edu.degree}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Specialization</p>
                            <p className="font-medium">{edu.specialization}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">University</p>
                            <p className="font-medium">{edu.university}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Year / Percentage</p>
                            <p className="font-medium">{edu.yearOfPassing} • {edu.percentage}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Job Preferences */}
            {student.jobPreferences && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Job Preferences
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingJobPrefs(!isEditingJobPrefs)}
                  >
                    {isEditingJobPrefs ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                  </Button>
                </CardHeader>
                <CardContent>
                  {isEditingJobPrefs ? (
                    <Form {...jobPrefsForm}>
                      <form onSubmit={jobPrefsForm.handleSubmit(handleJobPrefsSave)} className="space-y-4">
                        <FormField
                          control={jobPrefsForm.control}
                          name="expectedSalary"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expected Salary</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={jobPrefsForm.control}
                          name="noticePeriod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notice Period</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={jobPrefsForm.control}
                          name="immediateJoiner"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="h-4 w-4 rounded border-input"
                                />
                              </FormControl>
                              <FormLabel className="!mt-0">Immediate Joiner</FormLabel>
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end gap-2 pt-4">
                          <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingJobPrefs(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" size="sm" disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Save
                          </Button>
                        </div>
                      </form>
                    </Form>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Preferred Roles</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {student.jobPreferences.preferredRoles?.map((role: string, i: number) => (
                            <Badge key={i} variant="outline">{role}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Preferred Locations</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {student.jobPreferences.preferredLocations?.map((loc: string, i: number) => (
                            <Badge key={i} variant="outline">{loc}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Expected Salary</p>
                          <p className="font-medium">{student.jobPreferences.expectedSalary || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Notice Period</p>
                          <p className="font-medium">{student.jobPreferences.noticePeriod || "N/A"}</p>
                        </div>
                      </div>
                      {student.jobPreferences.immediateJoiner && (
                        <Badge className="bg-green-500">Immediate Joiner</Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Social Links */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Social Links
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingSocial(!isEditingSocial)}
                >
                  {isEditingSocial ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                </Button>
              </CardHeader>
              <CardContent>
                {isEditingSocial ? (
                  <Form {...socialForm}>
                    <form onSubmit={socialForm.handleSubmit(handleSocialSave)} className="space-y-4">
                      <FormField
                        control={socialForm.control}
                        name="linkedin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LinkedIn</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} placeholder="https://linkedin.com/in/..." />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={socialForm.control}
                        name="github"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GitHub</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} placeholder="https://github.com/..." />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={socialForm.control}
                        name="portfolio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Portfolio</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} placeholder="https://..." />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={socialForm.control}
                        name="twitter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Twitter</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} placeholder="https://twitter.com/..." />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingSocial(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={updateMutation.isPending}>
                          {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                          Save
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-2">
                    {student.socialLinks?.linkedin && (
                      <a href={student.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                        LinkedIn
                      </a>
                    )}
                    {student.socialLinks?.github && (
                      <a href={student.socialLinks.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:underline">
                        GitHub
                      </a>
                    )}
                    {student.socialLinks?.portfolio && (
                      <a href={student.socialLinks.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:underline">
                        Portfolio
                      </a>
                    )}
                    {student.socialLinks?.twitter && (
                      <a href={student.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-sky-600 hover:underline">
                        Twitter
                      </a>
                    )}
                    {!student.socialLinks?.linkedin && !student.socialLinks?.github && 
                     !student.socialLinks?.portfolio && !student.socialLinks?.twitter && (
                      <p className="text-muted-foreground">No social links added</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Placement Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Placement Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className={student.isPlacementEligible ? "bg-green-500" : "bg-yellow-500"}>
                      {student.placementStatus || "Not Applied"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Eligible</span>
                    <span>{student.isPlacementEligible ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Profile Complete</span>
                    <span>{student.isProfileComplete ? "Yes" : "No"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Education Dialog */}
      <Dialog open={showEducationDialog} onOpenChange={setShowEducationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingEducationIndex !== null ? "Edit Education" : "Add Education"}
            </DialogTitle>
            <DialogDescription>
              Enter your educational details below
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Degree (e.g., B.Tech)"
              value={newEducation.degree}
              onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
            />
            <Input
              placeholder="Specialization"
              value={newEducation.specialization}
              onChange={(e) => setNewEducation({ ...newEducation, specialization: e.target.value })}
            />
            <Input
              placeholder="University/Institute"
              value={newEducation.university}
              onChange={(e) => setNewEducation({ ...newEducation, university: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Year of Passing"
              value={newEducation.yearOfPassing}
              onChange={(e) => setNewEducation({ ...newEducation, yearOfPassing: parseInt(e.target.value) })}
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Percentage/CGPA"
              value={newEducation.percentage}
              onChange={(e) => setNewEducation({ ...newEducation, percentage: parseFloat(e.target.value) })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEducationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEducationSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingEducationIndex !== null ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}