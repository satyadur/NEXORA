"use client";

import { useState, useEffect } from "react";
import { useMe } from "@/hooks/use-me";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
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
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Loader2,
  Upload,
  Plus,
  X,
  Github,
  Linkedin,
  Twitter,
  Globe,
  MapPin,
  GraduationCap,
  Briefcase,
  Award,
  BookOpen,
  Mail,
  Phone,
  UserCircle,
  AlertCircle,
  Calendar,
  Building,
  Edit,
  Eye,
  Download,
  Share2,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  FileText,
  Medal,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  updateProfileApi,
  uploadAvatarApi,
  getProfileApi,
} from "@/lib/api/auth.api";
import { User } from "@/types/auth";
import { AxiosError } from "axios";
import { format } from "date-fns";

// Define types based on the schema
interface Education {
  degree: string;
  specialization: string;
  university?: string;
  yearOfPassing?: number;
  percentage?: number;
  isCompleted: boolean;
}

interface Experience {
  company: string;
  position: string;
  duration: string;
  description?: string;
  isCurrent: boolean;
}

interface Skill {
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
}

// Form validation schema
const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z
    .enum(["Male", "Female", "Other", "Prefer not to say"])
    .optional()
    .nullable(),

  address: z
    .object({
      street: z.string().optional().nullable(),
      city: z.string().optional().nullable(),
      state: z.string().optional().nullable(),
      country: z.string().optional().nullable(),
      pincode: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),

  enrollmentNumber: z.string().optional().nullable(),
  batch: z.string().optional().nullable(),
  currentSemester: z.string().optional().nullable(),
  cgpa: z.number().optional().nullable(),
  backlogs: z.number().optional().default(0),

  socialLinks: z
    .object({
      linkedin: z.string().url().optional().nullable().or(z.literal("")),
      github: z.string().url().optional().nullable().or(z.literal("")),
      portfolio: z.string().url().optional().nullable().or(z.literal("")),
      twitter: z.string().url().optional().nullable().or(z.literal("")),
    })
    .optional()
    .nullable(),

  jobPreferences: z
    .object({
      preferredRoles: z.string().optional().default(""),
      preferredLocations: z.string().optional().default(""),
      expectedSalary: z.string().optional().nullable(),
      jobType: z
        .array(
          z.enum([
            "Full Time",
            "Part Time",
            "Internship",
            "Work from Home",
            "Contract",
          ]),
        )
        .optional()
        .default([]),
      immediateJoiner: z.boolean().default(false),
      noticePeriod: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
});

type ProfileFormValues = z.input<typeof profileFormSchema>;

const StudentProfile = () => {
  const { data: userFromHook, refetch: refetchUser } = useMe();
  const [profileData, setProfileData] = useState<User | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [educationList, setEducationList] = useState<Education[]>([]);
  const [experienceList, setExperienceList] = useState<Experience[]>([]);
  const [skillList, setSkillList] = useState<Skill[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newSkill, setNewSkill] = useState<Skill>({
    name: "",
    level: "Beginner",
  });
  const [newEducation, setNewEducation] = useState({
    degree: "",
    specialization: "",
    university: "",
    yearOfPassing: "",
    percentage: "",
    isCompleted: true,
  });
  const [newExperience, setNewExperience] = useState({
    company: "",
    position: "",
    duration: "",
    description: "",
    isCurrent: false,
  });
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      dateOfBirth: "",
      gender: "Prefer not to say",
      address: {
        street: "",
        city: "",
        state: "",
        country: "India",
        pincode: "",
      },
      enrollmentNumber: "",
      batch: "",
      currentSemester: "",
      cgpa: undefined,
      backlogs: 0,
      socialLinks: {
        linkedin: "",
        github: "",
        portfolio: "",
        twitter: "",
      },
      jobPreferences: {
        preferredRoles: "",
        preferredLocations: "",
        expectedSalary: "",
        jobType: [],
        immediateJoiner: false,
        noticePeriod: "",
      },
    },
  });

  // Fetch profile data using getProfileApi
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoadingProfile(true);
        setError(null);
        const data = await getProfileApi();
        setProfileData(data);
      } catch (err) {
        setError("Failed to load profile data");
        toast.error("Failed to load profile data");
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  // Load data into form when profileData is available
  useEffect(() => {
    if (profileData) {
      // Format date if exists
      let formattedDate = "";
      if (profileData.dateOfBirth) {
        try {
          formattedDate = new Date(profileData.dateOfBirth)
            .toISOString()
            .split("T")[0];
        } catch {
          formattedDate = "";
        }
      }

      form.reset({
        name: profileData.name || "",
        phone: profileData.phone || "",
        dateOfBirth: formattedDate,
        gender: profileData.gender ?? "Prefer not to say",
        address: {
          street: profileData.address?.street || "",
          city: profileData.address?.city || "",
          state: profileData.address?.state || "",
          country: profileData.address?.country || "India",
          pincode: profileData.address?.pincode || "",
        },
        enrollmentNumber: profileData.enrollmentNumber || "",
        batch: profileData.batch || "",
        currentSemester:
          profileData.currentSemester !== undefined
            ? String(profileData.currentSemester)
            : "",
        cgpa: profileData.cgpa || undefined,
        backlogs: profileData.backlogs || 0,
        socialLinks: {
          linkedin: profileData.socialLinks?.linkedin || "",
          github: profileData.socialLinks?.github || "",
          portfolio: profileData.socialLinks?.portfolio || "",
          twitter: profileData.socialLinks?.twitter || "",
        },
        jobPreferences: {
          preferredRoles:
            profileData.jobPreferences?.preferredRoles?.join(", ") ?? "",
          preferredLocations:
            profileData.jobPreferences?.preferredLocations?.join(", ") ?? "",
          expectedSalary: profileData.jobPreferences?.expectedSalary || "",
          jobType: profileData.jobPreferences?.jobType || [],
          immediateJoiner: profileData.jobPreferences?.immediateJoiner || false,
          noticePeriod: profileData.jobPreferences?.noticePeriod || "",
        },
      });
      setEducationList(
        (profileData.education || []).map((edu) => ({
          ...edu,
          isCompleted: edu.isCompleted ?? true,
        })),
      );
      setExperienceList(profileData.experience || []);
      setSkillList(profileData.skills || []);
    }
  }, [profileData, form]);

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      await uploadAvatarApi(file);
      toast.success("Avatar uploaded successfully");
      refetchUser();
      const updatedProfile = await getProfileApi();
      setProfileData(updatedProfile);
    } catch (error) {
      toast.error("Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const addSkill = () => {
    if (newSkill.name.trim()) {
      const updatedSkills = [...skillList, newSkill];
      setSkillList(updatedSkills);
      setNewSkill({ name: "", level: "Beginner" });
      toast.success("Skill added");
    }
  };

  const removeSkill = (index: number) => {
    const updatedSkills = skillList.filter((_, i) => i !== index);
    setSkillList(updatedSkills);
    toast.success("Skill removed");
  };

  const addEducation = () => {
    if (newEducation.degree && newEducation.specialization) {
      const education: Education = {
        degree: newEducation.degree,
        specialization: newEducation.specialization,
        university: newEducation.university || undefined,
        yearOfPassing: newEducation.yearOfPassing
          ? parseInt(newEducation.yearOfPassing)
          : undefined,
        percentage: newEducation.percentage
          ? parseFloat(newEducation.percentage)
          : undefined,
        isCompleted: true,
      };
      setEducationList([...educationList, education]);
      setNewEducation({
        degree: "",
        specialization: "",
        university: "",
        yearOfPassing: "",
        percentage: "",
        isCompleted: true,
      });
      toast.success("Education added");
    } else {
      toast.error("Please fill in degree and specialization");
    }
  };

  const removeEducation = (index: number) => {
    setEducationList(educationList.filter((_, i) => i !== index));
    toast.success("Education removed");
  };

  const addExperience = () => {
    if (newExperience.company && newExperience.position) {
      const experience: Experience = {
        company: newExperience.company,
        position: newExperience.position,
        duration: newExperience.duration,
        description: newExperience.description || undefined,
        isCurrent: newExperience.isCurrent,
      };
      setExperienceList([...experienceList, experience]);
      setNewExperience({
        company: "",
        position: "",
        duration: "",
        description: "",
        isCurrent: false,
      });
      toast.success("Experience added");
    } else {
      toast.error("Please fill in company and position");
    }
  };

  const removeExperience = (index: number) => {
    setExperienceList(experienceList.filter((_, i) => i !== index));
    toast.success("Experience removed");
  };

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      const rolesArray =
        data.jobPreferences?.preferredRoles
          ?.split(",")
          .map((s) => s.trim())
          .filter(Boolean) ?? [];

      const locationsArray =
        data.jobPreferences?.preferredLocations
          ?.split(",")
          .map((s) => s.trim())
          .filter(Boolean) ?? [];

      Object.entries(data).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          key !== "education" && key !== "skills" && key !== "jobPreferences" && key !== "experience"
        ) {
          if (typeof value === "object") {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });

      formData.append(
        "jobPreferences",
        JSON.stringify({
          ...(data.jobPreferences ?? {}),
          preferredRoles: rolesArray,
          preferredLocations: locationsArray,
        })
      );

      formData.append("education", JSON.stringify(educationList));
      formData.append("experience", JSON.stringify(experienceList));
      formData.append("skills", JSON.stringify(skillList));

      await updateProfileApi(formData);

      toast.success("Profile updated successfully");
      refetchUser();
      const updatedProfile = await getProfileApi();
      setProfileData(updatedProfile);
      setIsEditMode(false);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(
          error.response?.data?.message || "Failed to update profile",
        );
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update profile");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          <div className="space-y-8">
            <Skeleton className="h-12 w-64" />
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  <Skeleton className="h-32 w-32 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="grid gap-6">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const user = profileData || userFromHook;

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No user data available</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const completionPercentage = Math.round(
    ((user.isProfileComplete ? 1 : 0) * 100)
  );

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not provided";
    try {
      return format(new Date(dateString), "PPP");
    } catch {
      return "Invalid date";
    }
  };

  // Get skill level color
  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case "Beginner": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "Intermediate": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Advanced": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "Expert": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header with Actions */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Student Profile
            </h1>
            <p className="text-muted-foreground mt-2">
              View and manage your professional profile
            </p>
          </div>
          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.print()}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download Profile</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share Profile</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              onClick={() => setIsEditMode(!isEditMode)}
              variant={isEditMode ? "outline" : "default"}
              className="gap-2"
            >
              {isEditMode ? (
                <>
                  <Eye className="h-4 w-4" />
                  View Mode
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Profile Header Card */}
        <Card className="mb-8 overflow-hidden">
          <div className="h-48 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 relative">
            <div className="absolute inset-0 bg-grid-white/10" />
          </div>
          <CardContent className="relative pt-0">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-20">
              <div className="relative group">
                <Avatar className="h-40 w-40 border-4 border-background shadow-xl">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="text-5xl bg-primary/10 text-primary">
                    {user.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isEditMode && (
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-2 right-2 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </label>
                )}
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={isUploadingAvatar}
                />
              </div>

              <div className="flex-1 pt-4 md:pt-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-3xl font-bold text-foreground">
                        {user.name}
                      </h2>
                      {user.isProfileComplete ? (
                        <Badge className="bg-green-500 hover:bg-green-600 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <XCircle className="h-3 w-3 mr-1" />
                          Incomplete
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                      {user.enrollmentNumber && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <BookOpen className="h-4 w-4" />
                          <span>Enrollment: {user.enrollmentNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-muted-foreground">
                        Profile Strength
                      </div>
                      <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${completionPercentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-primary">
                        {completionPercentage}%
                      </span>
                    </div>
                    {user.isPlacementEligible && (
                      <Badge className="bg-green-500 hover:bg-green-600 text-white px-3 py-1">
                        <Medal className="h-3 w-3 mr-1" />
                        Placement Eligible
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isEditMode ? (
          // Edit Mode - Form View
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Tabs defaultValue="basic" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 gap-2 bg-transparent h-auto p-0">
                  {[
                    { value: "basic", label: "Basic Info", icon: UserCircle },
                    { value: "education", label: "Education", icon: GraduationCap },
                    { value: "experience", label: "Experience", icon: Briefcase },
                    { value: "skills", label: "Skills", icon: Award },
                    { value: "academic", label: "Academic", icon: BookOpen },
                    { value: "preferences", label: "Preferences", icon: Star },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg py-3 px-4 transition-all"
                    >
                      <tab.icon className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">{tab.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Basic Information Tab - Edit Mode */}
                <TabsContent value="basic">
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                      <CardDescription>
                        Update your personal information and contact details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} />
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
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} />
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
                              <FormLabel>Gender</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value || "Prefer not to say"}
                              >
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
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-lg font-semibold mb-4">Address</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="address.street"
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
                            control={form.control}
                            name="address.city"
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
                            control={form.control}
                            name="address.state"
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
                            control={form.control}
                            name="address.country"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Country</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} />
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
                                  <Input {...field} value={field.value || ""} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-lg font-semibold mb-4">Social Links</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="socialLinks.linkedin"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>LinkedIn</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://linkedin.com/in/username" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
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
                                  <Input placeholder="https://github.com/username" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
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
                                  <Input placeholder="https://yourportfolio.com" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
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
                                  <Input placeholder="https://twitter.com/username" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Education Tab - Edit Mode */}
                <TabsContent value="education">
                  <Card>
                    <CardHeader>
                      <CardTitle>Education</CardTitle>
                      <CardDescription>Add your educational qualifications</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {educationList.map((edu, index) => (
                        <div key={index} className="relative bg-muted rounded-lg p-4">
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
                              <p className="text-sm text-muted-foreground">Degree</p>
                              <p className="font-medium">{edu.degree}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Specialization</p>
                              <p className="font-medium">{edu.specialization}</p>
                            </div>
                            {edu.university && (
                              <div>
                                <p className="text-sm text-muted-foreground">University</p>
                                <p className="font-medium">{edu.university}</p>
                              </div>
                            )}
                            {edu.yearOfPassing && (
                              <div>
                                <p className="text-sm text-muted-foreground">Year</p>
                                <p className="font-medium">{edu.yearOfPassing}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      <div className="border-2 border-dashed rounded-lg p-4">
                        <h4 className="font-medium mb-4">Add New Education</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            placeholder="Degree"
                            value={newEducation.degree}
                            onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
                          />
                          <Input
                            placeholder="Specialization"
                            value={newEducation.specialization}
                            onChange={(e) => setNewEducation({ ...newEducation, specialization: e.target.value })}
                          />
                          <Input
                            placeholder="University"
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
                            placeholder="Percentage"
                            value={newEducation.percentage}
                            onChange={(e) => setNewEducation({ ...newEducation, percentage: e.target.value })}
                          />
                        </div>
                        <Button type="button" onClick={addEducation} className="w-full mt-4">
                          <Plus className="h-4 w-4 mr-2" /> Add Education
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Experience Tab - Edit Mode */}
                <TabsContent value="experience">
                  <Card>
                    <CardHeader>
                      <CardTitle>Work Experience</CardTitle>
                      <CardDescription>Add your work experience</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {experienceList.map((exp, index) => (
                        <div key={index} className="relative bg-muted rounded-lg p-4">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => removeExperience(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Company</p>
                              <p className="font-medium">{exp.company}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Position</p>
                              <p className="font-medium">{exp.position}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Duration</p>
                              <p className="font-medium">{exp.duration}</p>
                            </div>
                            {exp.isCurrent && (
                              <div>
                                <Badge variant="outline" className="bg-green-500/10 text-green-600">Current</Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      <div className="border-2 border-dashed rounded-lg p-4">
                        <h4 className="font-medium mb-4">Add New Experience</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            placeholder="Company"
                            value={newExperience.company}
                            onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                          />
                          <Input
                            placeholder="Position"
                            value={newExperience.position}
                            onChange={(e) => setNewExperience({ ...newExperience, position: e.target.value })}
                          />
                          <Input
                            placeholder="Duration (e.g., 2022-2024)"
                            value={newExperience.duration}
                            onChange={(e) => setNewExperience({ ...newExperience, duration: e.target.value })}
                          />
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="isCurrent"
                              checked={newExperience.isCurrent}
                              onChange={(e) => setNewExperience({ ...newExperience, isCurrent: e.target.checked })}
                              className="rounded border-input"
                            />
                            <label htmlFor="isCurrent" className="text-sm">I currently work here</label>
                          </div>
                          <Textarea
                            placeholder="Description (optional)"
                            className="col-span-2"
                            value={newExperience.description}
                            onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
                          />
                        </div>
                        <Button type="button" onClick={addExperience} className="w-full mt-4">
                          <Plus className="h-4 w-4 mr-2" /> Add Experience
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Skills Tab - Edit Mode */}
                <TabsContent value="skills">
                  <Card>
                    <CardHeader>
                      <CardTitle>Skills</CardTitle>
                      <CardDescription>Add your technical skills</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex flex-wrap gap-2">
                        {skillList.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="px-3 py-1">
                            {skill.name} - {skill.level}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 ml-2"
                              onClick={() => removeSkill(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Input
                          placeholder="Skill name"
                          value={newSkill.name}
                          onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                          className="flex-1"
                        />
                        <Select
                          value={newSkill.level}
                          onValueChange={(value: Skill["level"]) => setNewSkill({ ...newSkill, level: value })}
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

                {/* Academic Tab - Edit Mode */}
                <TabsContent value="academic">
                  <Card>
                    <CardHeader>
                      <CardTitle>Academic Details</CardTitle>
                      <CardDescription>Update your academic information</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="enrollmentNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Enrollment Number</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="batch"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Batch</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 2022-2025" {...field} value={field.value || ""} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="currentSemester"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Semester</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} />
                              </FormControl>
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
                                  {...field}
                                  value={field.value ?? ""}
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
                              <FormLabel>Backlogs</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  value={field.value ?? 0}
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

                {/* Preferences Tab - Edit Mode */}
                <TabsContent value="preferences">
                  <Card>
                    <CardHeader>
                      <CardTitle>Job Preferences</CardTitle>
                      <CardDescription>Set your job preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="jobPreferences.preferredRoles"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Roles</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Software Engineer, Data Analyst"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="jobPreferences.preferredLocations"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Locations</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Mumbai, Bangalore, Pune"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="jobPreferences.expectedSalary"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expected Salary</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 6 LPA" {...field} value={field.value || ""} />
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

                      <FormField
                        control={form.control}
                        name="jobPreferences.jobType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Type</FormLabel>
                            <Select
                              onValueChange={(value: any) => {
                                const current = field.value || [];
                                if (!current.includes(value)) {
                                  field.onChange([...current, value]);
                                }
                              }}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select job types" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Full Time">Full Time</SelectItem>
                                <SelectItem value="Part Time">Part Time</SelectItem>
                                <SelectItem value="Internship">Internship</SelectItem>
                                <SelectItem value="Work from Home">Work from Home</SelectItem>
                                <SelectItem value="Contract">Contract</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {field.value?.map((type, index) => (
                                <Badge key={index} variant="secondary" className="px-3 py-1">
                                  {type}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 ml-2"
                                    onClick={() => {
                                      const updated = field.value?.filter((_, i) => i !== index);
                                      field.onChange(updated);
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              ))}
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="jobPreferences.immediateJoiner"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-3">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4 rounded border-input"
                              />
                            </FormControl>
                            <FormLabel className="!mt-0">I am available to join immediately</FormLabel>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="mt-8 flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditMode(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          // View Mode - Professional Profile Display
          <div className="space-y-6">
            {/* Quick Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Education</p>
                    <p className="font-semibold">{educationList.length} Degrees</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Experience</p>
                    <p className="font-semibold">{experienceList.length} Positions</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Skills</p>
                    <p className="font-semibold">{skillList.length} Skills</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Star className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CGPA</p>
                    <p className="font-semibold">{user.cgpa || "N/A"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Profile Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Personal Info */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <UserCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Full Name</p>
                        <p className="font-medium">{user.name}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                    </div>

                    {user.phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">{user.phone}</p>
                        </div>
                      </div>
                    )}

                    {user.dateOfBirth && (
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Date of Birth</p>
                          <p className="font-medium">{formatDate(user.dateOfBirth)}</p>
                        </div>
                      </div>
                    )}

                    {user.gender && (
                      <div className="flex items-start gap-3">
                        <UserCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Gender</p>
                          <p className="font-medium">{user.gender}</p>
                        </div>
                      </div>
                    )}

                    {user.address && (
                      <>
                        <Separator />
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Address</p>
                            <p className="font-medium">
                              {[
                                user.address.street,
                                user.address.city,
                                user.address.state,
                                user.address.pincode
                              ].filter(Boolean).join(", ")}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Social Links Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Social Links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {user.socialLinks?.linkedin && (
                      <a
                        href={user.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Linkedin className="h-5 w-5" />
                        <span className="flex-1 truncate">LinkedIn Profile</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    {user.socialLinks?.github && (
                      <a
                        href={user.socialLinks.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Github className="h-5 w-5" />
                        <span className="flex-1 truncate">GitHub Profile</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    {user.socialLinks?.portfolio && (
                      <a
                        href={user.socialLinks.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Globe className="h-5 w-5" />
                        <span className="flex-1 truncate">Portfolio</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    {user.socialLinks?.twitter && (
                      <a
                        href={user.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Twitter className="h-5 w-5" />
                        <span className="flex-1 truncate">Twitter Profile</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    {!user.socialLinks?.linkedin && !user.socialLinks?.github && 
                     !user.socialLinks?.portfolio && !user.socialLinks?.twitter && (
                      <p className="text-muted-foreground text-sm">No social links added</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Education, Experience, Skills */}
              <div className="lg:col-span-2 space-y-6">
                {/* Education Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      Education
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {educationList.length > 0 ? (
                      educationList.map((edu, index) => (
                        <div key={index} className="relative pl-4 border-l-2 border-primary/20">
                          <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-primary/20" />
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{edu.degree}</h3>
                              <Badge variant="outline" className="text-xs">
                                {edu.specialization}
                              </Badge>
                            </div>
                            {edu.university && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {edu.university}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm">
                              {edu.yearOfPassing && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {edu.yearOfPassing}
                                </span>
                              )}
                              {edu.percentage && (
                                <span className="flex items-center gap-1">
                                  <Award className="h-3 w-3" />
                                  {edu.percentage}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No education details added</p>
                    )}
                  </CardContent>
                </Card>

                {/* Experience Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Work Experience
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {experienceList.length > 0 ? (
                      experienceList.map((exp, index) => (
                        <div key={index} className="relative pl-4 border-l-2 border-primary/20">
                          <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-primary/20" />
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{exp.position}</h3>
                              {exp.isCurrent && (
                                <Badge className="bg-green-500 text-white text-xs">Current</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {exp.company}
                            </p>
                            <p className="text-sm flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {exp.duration}
                            </p>
                            {exp.description && (
                              <p className="text-sm text-muted-foreground mt-2">{exp.description}</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No work experience added</p>
                    )}
                  </CardContent>
                </Card>

                {/* Skills Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {skillList.length > 0 ? (
                        skillList.map((skill, index) => (
                          <Badge
                            key={index}
                            className={`px-3 py-1 ${getSkillLevelColor(skill.level)}`}
                          >
                            {skill.name}
                            <span className="ml-1 text-xs opacity-70">• {skill.level}</span>
                          </Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No skills added</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Academic Details Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Academic Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {user.enrollmentNumber && (
                        <div>
                          <p className="text-sm text-muted-foreground">Enrollment</p>
                          <p className="font-medium">{user.enrollmentNumber}</p>
                        </div>
                      )}
                      {user.batch && (
                        <div>
                          <p className="text-sm text-muted-foreground">Batch</p>
                          <p className="font-medium">{user.batch}</p>
                        </div>
                      )}
                      {user.currentSemester && (
                        <div>
                          <p className="text-sm text-muted-foreground">Semester</p>
                          <p className="font-medium">{user.currentSemester}</p>
                        </div>
                      )}
                      {user.cgpa && (
                        <div>
                          <p className="text-sm text-muted-foreground">CGPA</p>
                          <p className="font-medium">{user.cgpa}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Job Preferences Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Star className="h-5 w-5 text-primary" />
                      Job Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {user.jobPreferences?.preferredRoles && user.jobPreferences.preferredRoles.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Preferred Roles</p>
                        <div className="flex flex-wrap gap-2">
                          {user.jobPreferences.preferredRoles.map((role, index) => (
                            <Badge key={index} variant="outline">{role}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {user.jobPreferences?.preferredLocations && user.jobPreferences.preferredLocations.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Preferred Locations</p>
                        <div className="flex flex-wrap gap-2">
                          {user.jobPreferences.preferredLocations.map((location, index) => (
                            <Badge key={index} variant="outline" className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {location}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {user.jobPreferences?.expectedSalary && (
                        <div>
                          <p className="text-sm text-muted-foreground">Expected Salary</p>
                          <p className="font-medium">{user.jobPreferences.expectedSalary} LPA</p>
                        </div>
                      )}
                      {user.jobPreferences?.noticePeriod && (
                        <div>
                          <p className="text-sm text-muted-foreground">Notice Period</p>
                          <p className="font-medium">{user.jobPreferences.noticePeriod}</p>
                        </div>
                      )}
                    </div>

                    {user.jobPreferences?.jobType && user.jobPreferences.jobType.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Job Type</p>
                        <div className="flex flex-wrap gap-2">
                          {user.jobPreferences.jobType.map((type, index) => (
                            <Badge key={index} variant="secondary">{type}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {user.jobPreferences?.immediateJoiner && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Available for immediate joining</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;