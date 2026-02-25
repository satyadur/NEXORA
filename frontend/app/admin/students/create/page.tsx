// app/admin/students/create/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Save,
  User,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  MapPin,
  BookOpen,
  Award,
  Briefcase,
  Plus,
  X,
  Eye,
  EyeOff,
  IndianRupee,
  Globe,
  Linkedin,
  Github,
  Twitter,
  CheckCircle2,
  AlertCircle,
  BookMarked,
  Clock,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

import { createStudentApi } from "@/lib/api/admin.api";
import { Course, getCoursesApi } from "@/lib/api/course.api";

// Password strength checker
const checkPasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  return strength;
};

const getPasswordStrengthLabel = (strength: number) => {
  switch (strength) {
    case 0: return { label: "Very Weak", color: "bg-red-500", textColor: "text-red-500" };
    case 1: return { label: "Weak", color: "bg-orange-500", textColor: "text-orange-500" };
    case 2: return { label: "Fair", color: "bg-yellow-500", textColor: "text-yellow-500" };
    case 3: return { label: "Good", color: "bg-blue-500", textColor: "text-blue-500" };
    case 4: return { label: "Strong", color: "bg-green-500", textColor: "text-green-500" };
    case 5: return { label: "Very Strong", color: "bg-green-600", textColor: "text-green-600" };
    default: return { label: "Unknown", color: "bg-gray-500", textColor: "text-gray-500" };
  }
};

// Generate enrollment number in format: ENR-YYYY-DEPT-SEQ
const generateEnrollmentNumber = (department: string = "GEN") => {
  const year = new Date().getFullYear();
  const deptCode = department.slice(0, 3).toUpperCase();
  const sequence = Math.floor(1000 + Math.random() * 9000);
  return `ENR-${year}-${deptCode}-${sequence}`;
};

// Validation Schema
const studentSchema = z.object({
  // Personal Information
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
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

  // Academic Details
  enrollmentNumber: z.string().optional(),
  batch: z.string().optional(),
  currentSemester: z.string().optional(),
  department: z.string().optional(),
  cgpa: z.number().min(0).max(10).optional(),
  backlogs: z.number().min(0).default(0),

  // Education
  education: z.array(z.object({
    degree: z.string(),
    specialization: z.string(),
    university: z.string(),
    yearOfPassing: z.number(),
    percentage: z.number(),
    isCompleted: z.boolean().default(true),
  })).optional(),

  // Skills
  skills: z.array(z.object({
    name: z.string(),
    level: z.enum(["Beginner", "Intermediate", "Advanced", "Expert"]),
  })).optional(),

  // Selected Courses
  enrolledCourses: z.array(z.object({
    courseId: z.string(),
    courseCode: z.string(),
    courseName: z.string(),
    status: z.enum(["enrolled", "in_progress", "completed", "dropped"]).default("enrolled"),
  })).optional(),

  // Job Preferences
  jobPreferences: z.object({
    preferredRoles: z.array(z.string()).optional(),
    preferredLocations: z.array(z.string()).optional(),
    expectedSalary: z.string().optional(),
    jobType: z.array(z.enum(["Full Time", "Part Time", "Internship", "Work from Home", "Contract"])).optional(),
    immediateJoiner: z.boolean().default(false),
    noticePeriod: z.string().optional(),
  }).optional(),

  // Social Links
  socialLinks: z.object({
    linkedin: z.string().url().optional().or(z.literal("")),
    github: z.string().url().optional().or(z.literal("")),
    portfolio: z.string().url().optional().or(z.literal("")),
    twitter: z.string().url().optional().or(z.literal("")),
  }).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type StudentFormValues = z.infer<typeof studentSchema>;

export default function CreateStudentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  // Dynamic form sections
  const [educationList, setEducationList] = useState<any[]>([]);
  const [skillList, setSkillList] = useState<any[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<any[]>([]);
  const [preferredRoles, setPreferredRoles] = useState<string[]>([]);
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);

  // New item inputs
  const [newEducation, setNewEducation] = useState({
    degree: "",
    specialization: "",
    university: "",
    yearOfPassing: "",
    percentage: "",
  });
  const [newSkill, setNewSkill] = useState({ name: "", level: "Beginner" as const });
  const [newRole, setNewRole] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [searchCourse, setSearchCourse] = useState("");

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
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
      enrollmentNumber: generateEnrollmentNumber(),
      batch: `${new Date().getFullYear()}-${new Date().getFullYear() + 3}`,
      currentSemester: "1",
      department: "",
      cgpa: 0,
      backlogs: 0,
      education: [],
      skills: [],
      enrolledCourses: [],
      jobPreferences: {
        preferredRoles: [],
        preferredLocations: [],
        expectedSalary: "",
        jobType: [],
        immediateJoiner: false,
        noticePeriod: "30 days",
      },
      socialLinks: {
        linkedin: "",
        github: "",
        portfolio: "",
        twitter: "",
      },
    },
  });

  // Fetch available courses
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setCoursesLoading(true);
    try {
      const data = await getCoursesApi({ status: "published", limit: 100 });
      setCourses(data.courses);
    } catch (error) {
      toast.error("Failed to fetch courses");
    } finally {
      setCoursesLoading(false);
    }
  };

  const password = form.watch("password");
  const passwordStrength = checkPasswordStrength(password || "");
  const strengthLabel = getPasswordStrengthLabel(passwordStrength);

  // Update enrollment number when department changes
  const watchDepartment = form.watch("department");
  useEffect(() => {
    if (watchDepartment) {
      form.setValue("enrollmentNumber", generateEnrollmentNumber(watchDepartment));
    }
  }, [watchDepartment, form]);

  // Add Education
  const addEducation = () => {
    if (newEducation.degree && newEducation.specialization) {
      const education = {
        degree: newEducation.degree,
        specialization: newEducation.specialization,
        university: newEducation.university,
        yearOfPassing: parseInt(newEducation.yearOfPassing) || new Date().getFullYear(),
        percentage: parseFloat(newEducation.percentage) || 0,
        isCompleted: true,
      };
      setEducationList([...educationList, education]);
      form.setValue("education", [...educationList, education]);
      setNewEducation({
        degree: "",
        specialization: "",
        university: "",
        yearOfPassing: "",
        percentage: "",
      });
      toast.success("Education added");
    } else {
      toast.error("Please fill in degree and specialization");
    }
  };

  const removeEducation = (index: number) => {
    const updated = educationList.filter((_, i) => i !== index);
    setEducationList(updated);
    form.setValue("education", updated);
    toast.success("Education removed");
  };

  // Add Skill
  const addSkill = () => {
    if (newSkill.name.trim()) {
      const skill = { name: newSkill.name, level: newSkill.level };
      const updated = [...skillList, skill];
      setSkillList(updated);
      form.setValue("skills", updated);
      setNewSkill({ name: "", level: "Beginner" });
      toast.success("Skill added");
    }
  };

  const removeSkill = (index: number) => {
    const updated = skillList.filter((_, i) => i !== index);
    setSkillList(updated);
    form.setValue("skills", updated);
    toast.success("Skill removed");
  };

  // Add Course
  const addCourse = (course: Course) => {
    if (!selectedCourses.find(c => c.courseId === course._id)) {
      const courseEnrollment = {
        courseId: course._id,
        courseCode: course.code,
        courseName: course.title,
        status: "enrolled" as const,
      };
      const updated = [...selectedCourses, courseEnrollment];
      setSelectedCourses(updated);
      form.setValue("enrolledCourses", updated);
      toast.success(`${course.title} added`);
    }
  };

  const removeCourse = (index: number) => {
    const updated = selectedCourses.filter((_, i) => i !== index);
    setSelectedCourses(updated);
    form.setValue("enrolledCourses", updated);
    toast.success("Course removed");
  };

  // Filter courses by search
  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchCourse.toLowerCase()) ||
    course.code.toLowerCase().includes(searchCourse.toLowerCase()) ||
    course.department.toLowerCase().includes(searchCourse.toLowerCase())
  );

  // Add Preferred Role
  const addRole = () => {
    if (newRole.trim() && !preferredRoles.includes(newRole.trim())) {
      const updated = [...preferredRoles, newRole.trim()];
      setPreferredRoles(updated);
      form.setValue("jobPreferences.preferredRoles", updated);
      setNewRole("");
      toast.success("Role added");
    }
  };

  const removeRole = (index: number) => {
    const updated = preferredRoles.filter((_, i) => i !== index);
    setPreferredRoles(updated);
    form.setValue("jobPreferences.preferredRoles", updated);
  };

  // Add Location
  const addLocation = () => {
    if (newLocation.trim() && !preferredLocations.includes(newLocation.trim())) {
      const updated = [...preferredLocations, newLocation.trim()];
      setPreferredLocations(updated);
      form.setValue("jobPreferences.preferredLocations", updated);
      setNewLocation("");
      toast.success("Location added");
    }
  };

  const removeLocation = (index: number) => {
    const updated = preferredLocations.filter((_, i) => i !== index);
    setPreferredLocations(updated);
    form.setValue("jobPreferences.preferredLocations", updated);
  };

  // Toggle Job Type
  const toggleJobType = (type: string) => {
    const updated = jobTypes.includes(type)
      ? jobTypes.filter(t => t !== type)
      : [...jobTypes, type];
    setJobTypes(updated);
    form.setValue("jobPreferences.jobType", updated as any);
  };

  const onSubmit = async (data: StudentFormValues) => {
    setIsLoading(true);
    try {
      await createStudentApi(data);
      toast.success("Student Created", {
        description: "New student has been added successfully.",
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      });
      router.push("/admin/students");
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
        <CardDescription>Review student information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {form.watch("name")?.charAt(0) || "S"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-lg">{form.watch("name") || "Student Name"}</h3>
            <p className="text-sm text-muted-foreground">{form.watch("email") || "email@example.com"}</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Enrollment:</span>
            <span className="font-medium font-mono text-xs">{form.watch("enrollmentNumber") || "ENR-2024-GEN-1234"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Department:</span>
            <span className="font-medium">{form.watch("department") || "Not selected"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Batch:</span>
            <span className="font-medium">{form.watch("batch") || "N/A"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Semester:</span>
            <span className="font-medium">{form.watch("currentSemester") || "N/A"}</span>
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-sm font-medium mb-2">Enrolled Courses ({selectedCourses.length})</p>
          {selectedCourses.length > 0 ? (
            <div className="space-y-2">
              {selectedCourses.slice(0, 3).map((course, i) => (
                <div key={i} className="text-xs p-2 bg-muted rounded">
                  <p className="font-medium">{course.courseName}</p>
                  <p className="text-muted-foreground">{course.courseCode}</p>
                </div>
              ))}
              {selectedCourses.length > 3 && (
                <p className="text-xs text-muted-foreground">+{selectedCourses.length - 3} more courses</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No courses selected</p>
          )}
        </div>

        <Separator />

        <div>
          <p className="text-sm font-medium mb-2">Skills</p>
          <div className="flex flex-wrap gap-1">
            {skillList.length > 0 ? (
              skillList.slice(0, 3).map((skill, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {skill.name}
                </Badge>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No skills added</p>
            )}
            {skillList.length > 3 && <Badge variant="outline" className="text-xs">+{skillList.length - 3}</Badge>}
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
            <h1 className="text-3xl font-bold tracking-tight">Add New Student</h1>
            <p className="text-muted-foreground mt-1">
              Create a new student account with complete details
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Student
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main Form */}
        <div className="flex-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-6 w-full">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="academic">Academic</TabsTrigger>
                  <TabsTrigger value="courses">Courses</TabsTrigger>
                  <TabsTrigger value="education">Education</TabsTrigger>
                  <TabsTrigger value="skills">Skills</TabsTrigger>
                  <TabsTrigger value="preferences">Preferences</TabsTrigger>
                </TabsList>

                {/* Personal Information Tab */}
                <TabsContent value="personal" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>
                        Enter the student's personal details
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
                                <div className="relative">
                                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input className="pl-9" placeholder="Enter full name" {...field} />
                                </div>
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
                                <div className="relative">
                                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input className="pl-9" type="email" placeholder="student@example.com" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={showPassword ? "text" : "password"}
                                    className="pr-10"
                                    placeholder="••••••••"
                                    {...field}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </FormControl>
                              {password && (
                                <div className="mt-2 space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Password strength:</span>
                                    <span className={strengthLabel.textColor}>{strengthLabel.label}</span>
                                  </div>
                                  <Progress value={passwordStrength * 20} className="h-1" />
                                </div>
                              )}
                              <FormDescription>Minimum 6 characters</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={showConfirmPassword ? "text" : "password"}
                                    className="pr-10"
                                    placeholder="••••••••"
                                    {...field}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input className="pl-9" placeholder="Enter phone number" {...field} />
                                </div>
                              </FormControl>
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
                                <div className="relative">
                                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input className="pl-9" type="date" {...field} />
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      {/* Address Section */}
                      <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                          <MapPin className="h-5 w-5" />
                          Address Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="address.street"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Street Address</FormLabel>
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
                      </div>

                      <Separator />

                      {/* Identity Documents */}
                      <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                          <Award className="h-5 w-5" />
                          Identity Documents
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="aadharNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Aadhar Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter 12-digit Aadhar number" {...field} value={field.value || ""} />
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
                                  <Input placeholder="e.g., ABCDE1234F" {...field} value={field.value || ""} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Academic Details Tab */}
                <TabsContent value="academic" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Academic Details</CardTitle>
                      <CardDescription>
                        Enter the student's academic information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="enrollmentNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Enrollment Number</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="ENR-YYYY-DEPT-XXXX" 
                                  {...field} 
                                  readOnly 
                                  className="bg-muted font-mono text-sm"
                                />
                              </FormControl>
                              <FormDescription>
                                Auto-generated format: ENR-{new Date().getFullYear()}-DEPT-XXXX
                              </FormDescription>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="department"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Department</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select department" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                                  <SelectItem value="Information Technology">Information Technology</SelectItem>
                                  <SelectItem value="Electronics">Electronics</SelectItem>
                                  <SelectItem value="Electrical">Electrical</SelectItem>
                                  <SelectItem value="Mechanical">Mechanical</SelectItem>
                                  <SelectItem value="Civil">Civil</SelectItem>
                                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                                  <SelectItem value="Physics">Physics</SelectItem>
                                  <SelectItem value="Chemistry">Chemistry</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>Department affects enrollment number format</FormDescription>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="batch"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Batch</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select batch" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="2022-2025">2022-2025</SelectItem>
                                  <SelectItem value="2023-2026">2023-2026</SelectItem>
                                  <SelectItem value="2024-2027">2024-2027</SelectItem>
                                  <SelectItem value="2025-2028">2025-2028</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="currentSemester"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Semester</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select semester" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="1">1st Semester</SelectItem>
                                  <SelectItem value="2">2nd Semester</SelectItem>
                                  <SelectItem value="3">3rd Semester</SelectItem>
                                  <SelectItem value="4">4th Semester</SelectItem>
                                  <SelectItem value="5">5th Semester</SelectItem>
                                  <SelectItem value="6">6th Semester</SelectItem>
                                  <SelectItem value="7">7th Semester</SelectItem>
                                  <SelectItem value="8">8th Semester</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="cgpa"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CGPA</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  min="0" 
                                  max="10" 
                                  placeholder="Enter CGPA"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="backlogs"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Number of Backlogs</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  placeholder="Enter backlogs"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Courses Tab */}
                <TabsContent value="courses" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Course Enrollment</CardTitle>
                      <CardDescription>
                        Select courses for the student to enroll in
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Selected Courses List */}
                      {selectedCourses.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Selected Courses ({selectedCourses.length})</h4>
                          <div className="space-y-2">
                            {selectedCourses.map((course, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div className="flex-1">
                                  <p className="font-medium">{course.courseName}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {course.courseCode}
                                    </Badge>
                                    <Badge className="bg-green-500/10 text-green-600 text-xs">
                                      Enrolled
                                    </Badge>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => removeCourse(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Separator />

                      {/* Course Search and Selection */}
                      <div>
                        <h4 className="text-sm font-medium mb-4">Available Courses</h4>
                        <Input
                          placeholder="Search courses by name, code, or department..."
                          value={searchCourse}
                          onChange={(e) => setSearchCourse(e.target.value)}
                          className="mb-4"
                        />

                        {coursesLoading ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                            {filteredCourses.length === 0 ? (
                              <p className="text-center py-8 text-muted-foreground">
                                No courses found
                              </p>
                            ) : (
                              filteredCourses.map((course) => {
                                const isSelected = selectedCourses.some(c => c.courseId === course._id);
                                return (
                                  <div
                                    key={course._id}
                                    className={`flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors ${
                                      isSelected ? 'bg-primary/5 border-primary/20' : ''
                                    }`}
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <BookMarked className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">{course.title}</span>
                                      </div>
                                      <div className="flex items-center gap-3 mt-1 text-xs">
                                        <Badge variant="outline">{course.code}</Badge>
                                        <span className="text-muted-foreground">{course.department}</span>
                                        <span className="text-muted-foreground">{course.credits} credits</span>
                                      </div>
                                    </div>
                                    <Button
                                      type="button"
                                      variant={isSelected ? "outline" : "default"}
                                      size="sm"
                                      onClick={() => isSelected ? null : addCourse(course)}
                                      disabled={isSelected}
                                      className="ml-2"
                                    >
                                      {isSelected ? 'Added' : 'Add'}
                                    </Button>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Education Tab */}
                <TabsContent value="education" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Educational Qualifications</CardTitle>
                      <CardDescription>
                        Add the student's educational background
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Education List */}
                      {educationList.length > 0 && (
                        <div className="space-y-4">
                          {educationList.map((edu, index) => (
                            <div key={index} className="relative bg-muted/50 rounded-lg p-4 border">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2"
                                onClick={() => removeEducation(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <div className="grid grid-cols-2 gap-4">
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
                                  <p className="text-xs text-muted-foreground">Year</p>
                                  <p className="font-medium">{edu.yearOfPassing}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Education Form */}
                      <div className="bg-muted/30 rounded-lg p-6 border-2 border-dashed">
                        <h4 className="font-medium mb-4 flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Add Education
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            onChange={(e) => setNewEducation({ ...newEducation, yearOfPassing: e.target.value })}
                          />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Percentage/CGPA"
                            value={newEducation.percentage}
                            onChange={(e) => setNewEducation({ ...newEducation, percentage: e.target.value })}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addEducation}
                          className="w-full mt-4"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Education
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Skills Tab */}
                <TabsContent value="skills" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Skills</CardTitle>
                      <CardDescription>
                        Add technical and professional skills
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Skills List */}
                      {skillList.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {skillList.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="px-3 py-1 group">
                              {skill.name} - {skill.level}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeSkill(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Add Skill Form */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Input
                          placeholder="Skill name"
                          value={newSkill.name}
                          onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                          className="flex-1"
                        />
                        <Select
                          value={newSkill.level}
                          onValueChange={(value: any) => setNewSkill({ ...newSkill, level: value })}
                        >
                          <SelectTrigger className="w-full sm:w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Beginner">Beginner</SelectItem>
                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                            <SelectItem value="Advanced">Advanced</SelectItem>
                            <SelectItem value="Expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button type="button" onClick={addSkill}>
                          <Plus className="h-4 w-4 mr-2" /> Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Preferences Tab */}
                <TabsContent value="preferences" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Job Preferences</CardTitle>
                      <CardDescription>
                        Set job preferences for placements
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Preferred Roles */}
                      <div>
                        <FormLabel>Preferred Roles</FormLabel>
                        <div className="flex flex-wrap gap-2 mt-2 mb-4">
                          {preferredRoles.map((role, index) => (
                            <Badge key={index} variant="secondary" className="px-3 py-1 group">
                              {role}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100"
                                onClick={() => removeRole(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="e.g., Software Engineer"
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addRole())}
                            className="flex-1"
                          />
                          <Button type="button" onClick={addRole}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Preferred Locations */}
                      <div>
                        <FormLabel>Preferred Locations</FormLabel>
                        <div className="flex flex-wrap gap-2 mt-2 mb-4">
                          {preferredLocations.map((loc, index) => (
                            <Badge key={index} variant="secondary" className="px-3 py-1 group">
                              {loc}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100"
                                onClick={() => removeLocation(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="e.g., Mumbai"
                            value={newLocation}
                            onChange={(e) => setNewLocation(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addLocation())}
                            className="flex-1"
                          />
                          <Button type="button" onClick={addLocation}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="jobPreferences.expectedSalary"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expected Salary</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input className="pl-9" placeholder="e.g., 6 LPA" {...field} value={field.value || ""} />
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="jobPreferences.noticePeriod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notice Period</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 30 days" {...field} value={field.value || ""} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Job Type */}
                      <div>
                        <FormLabel>Job Type</FormLabel>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {["Full Time", "Part Time", "Internship", "Work from Home", "Contract"].map((type) => (
                            <Button
                              key={type}
                              type="button"
                              variant={jobTypes.includes(type) ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleJobType(type)}
                              className="rounded-full"
                            >
                              {type}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="jobPreferences.immediateJoiner"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-3">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="!mt-0">I am available to join immediately</FormLabel>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Social Links */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Social Links</CardTitle>
                      <CardDescription>
                        Add social media and portfolio links
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="socialLinks.linkedin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LinkedIn</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Linkedin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input className="pl-9" placeholder="https://linkedin.com/in/username" {...field} value={field.value || ""} />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="socialLinks.github"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GitHub</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Github className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input className="pl-9" placeholder="https://github.com/username" {...field} value={field.value || ""} />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="socialLinks.portfolio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Portfolio</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input className="pl-9" placeholder="https://yourportfolio.com" {...field} value={field.value || ""} />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="socialLinks.twitter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Twitter</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Twitter className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input className="pl-9" placeholder="https://twitter.com/username" {...field} value={field.value || ""} />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </div>

        {/* Preview Panel */}
        <div className="w-80 hidden xl:block">
          <PreviewCard />
        </div>
      </div>
    </div>
  );
}