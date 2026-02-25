"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Briefcase, 
  Building, 
  IdCard,
  MapPin,
  Linkedin,
  Github,
  Globe,
  Twitter,
  Upload,
  Edit,
  Save,
  X,
  Plus,
  Award,
  BookOpen,
  GraduationCap,
  Clock,
  Sparkles,
  CheckCircle2,
  Camera,
  Share2,
  Bell,
  Settings,
  IndianRupee,
  Banknote,
  Wallet,
  CreditCard,
  FileText,
  Users,
  BookMarked,
  ChevronRight,
  TrendingUp,
  Star,
  Activity
} from "lucide-react";

import { useMe } from "@/hooks/use-me";
import { getProfileApi, updateProfileApi } from "@/lib/api/auth.api";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

import { z } from "zod";

// Types for education and experience
interface Education {
  degree: string;
  specialization: string;
  university?: string;
  yearOfPassing?: number;
  percentage?: number;
}

interface Experience {
  company: string;
  position: string;
  duration?: string;
  description?: string;
  isCurrent?: boolean;
}

// Form schema for editable teacher profile
const teacherProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    pincode: z.string().optional(),
  }).optional(),
  socialLinks: z.object({
    linkedin: z.string().optional(),
    github: z.string().optional(),
    portfolio: z.string().optional(),
    twitter: z.string().optional(),
  }).optional(),
});

type TeacherProfileForm = z.infer<typeof teacherProfileSchema>;

// Helper function to format date for input (YYYY-MM-DD)
const formatDateForInput = (dateString?: string) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
};

// Format currency
const formatCurrency = (amount?: number) => {
  if (!amount) return "N/A";
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function TeacherProfile() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showEducationDialog, setShowEducationDialog] = useState(false);
  const [showExperienceDialog, setShowExperienceDialog] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("professional");
  
  // State for new education/experience entries
  const [newEducation, setNewEducation] = useState<Education>({
    degree: "",
    specialization: "",
    university: "",
    yearOfPassing: undefined,
    percentage: undefined,
  });
  
  const [newExperience, setNewExperience] = useState<Experience>({
    company: "",
    position: "",
    duration: "",
    description: "",
    isCurrent: false,
  });

  // Local state for education and experience arrays
  const [educationList, setEducationList] = useState<Education[]>([]);
  const [experienceList, setExperienceList] = useState<Experience[]>([]);

  // Get user from useMe hook
  const { data: user, isLoading: userLoading } = useMe();

  // Fetch full profile
  const { data: profile, isLoading: profileLoading, isError } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfileApi,
    enabled: !!user,
  });

  // Update local state when profile loads
  useEffect(() => {
    if (profile) {
      setEducationList(profile.education || []);
      setExperienceList(profile.experience || []);
    }
  }, [profile]);

  const form = useForm<TeacherProfileForm>({
    resolver: zodResolver(teacherProfileSchema),
    values: {
      name: profile?.name || "",
      phone: profile?.phone || "",
      dateOfBirth: formatDateForInput(profile?.dateOfBirth),
      gender: profile?.gender || "",
      address: profile?.address || {
        street: "",
        city: "",
        state: "",
        country: "",
        pincode: "",
      },
      socialLinks: profile?.socialLinks || {
        linkedin: "",
        github: "",
        portfolio: "",
        twitter: "",
      },
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateProfileApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated successfully", {
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      });
      setIsEditing(false);
      setAvatarFile(null);
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddEducation = () => {
    const degree = newEducation.degree?.trim();
    const specialization = newEducation.specialization?.trim();
    
    if (!degree || !specialization) {
      toast.error("Degree and Specialization are required");
      return;
    }
    
    setEducationList([...educationList, { ...newEducation }]);
    setNewEducation({
      degree: "",
      specialization: "",
      university: "",
      yearOfPassing: undefined,
      percentage: undefined,
    });
    setShowEducationDialog(false);
    toast.success("Education added successfully");
  };

  const handleRemoveEducation = (index: number) => {
    setEducationList(educationList.filter((_, i) => i !== index));
    toast.success("Education removed");
  };

  const handleAddExperience = () => {
    const company = newExperience.company?.trim();
    const position = newExperience.position?.trim();
    
    if (!company || !position) {
      toast.error("Company and Position are required");
      return;
    }
    
    setExperienceList([...experienceList, { ...newExperience }]);
    setNewExperience({
      company: "",
      position: "",
      duration: "",
      description: "",
      isCurrent: false,
    });
    setShowExperienceDialog(false);
    toast.success("Experience added successfully");
  };

  const handleRemoveExperience = (index: number) => {
    setExperienceList(experienceList.filter((_, i) => i !== index));
    toast.success("Experience removed");
  };

  const handleSubmit = (values: TeacherProfileForm) => {
    const formData = new FormData();
    
    // Add all form values
    Object.entries(values).forEach(([key, value]) => {
      if (key === "address" || key === "socialLinks") {
        if (value && typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        }
      } else if (value) {
        formData.append(key, value as string);
      }
    });

    // Add education array
    if (educationList.length > 0) {
      formData.append("education", JSON.stringify(educationList));
    }

    // Add experience array
    if (experienceList.length > 0) {
      formData.append("experience", JSON.stringify(experienceList));
    }

    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    updateMutation.mutate(formData);
  };

  if (userLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse"></div>
          <div className="relative bg-card rounded-full p-8 shadow-2xl border border-border">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border border-border">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertDescription>Failed to load profile. Please try again.</AlertDescription>
            </Alert>
            <Button 
              className="w-full mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract employee record data
  const employeeRecord = profile.employeeRecord || {};
  const salary = employeeRecord.salary || {};

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none"></div>

      <div className="relative container mx-auto py-12 px-4 w-full z-10">
        {/* Header */}
        <div className="mb-12">
          <Card className="border border-border bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                      <GraduationCap className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold text-foreground">
                        Teacher Profile
                      </h1>
                      <p className="text-muted-foreground mt-1">Manage your personal and professional information</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={() => setIsEditing(!isEditing)}
                    variant={isEditing ? "outline" : "default"}
                    className={`gap-2 px-6 rounded-full h-12 ${isEditing ? '' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
                  >
                    {isEditing ? (
                      <>
                        <X className="h-4 w-4" />
                        Cancel
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
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card className="border border-border bg-card hover:shadow-lg transition-all duration-300">
              <div className="relative h-32 bg-gradient-to-r from-primary/20 to-secondary/20">
                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                  <div className="relative">
                    <Avatar className="h-28 w-28 border-4 border-background shadow-xl ring-2 ring-primary/20">
                      <AvatarImage src={avatarPreview || profile.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary text-4xl">
                        {profile.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <label
                        htmlFor="avatar-upload"
                        className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-all shadow-lg"
                      >
                        <Camera className="h-4 w-4" />
                      </label>
                    )}
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                </div>
              </div>

              <CardContent className="pt-16 pb-6 text-center">
                <h2 className="text-2xl font-bold text-foreground">
                  {profile.name}
                </h2>
                <p className="text-muted-foreground flex items-center justify-center gap-2 mt-1">
                  <Mail className="h-4 w-4" />
                  {profile.email}
                </p>
                
                <div className="flex justify-center gap-2 mt-4">
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0 px-4 py-1">
                    {employeeRecord.designation || "Not Specified"}
                  </Badge>
                  <Badge variant="outline" className="border-border px-4 py-1">
                    {employeeRecord.department || "Not Specified"}
                  </Badge>
                </div>

                <Separator className="my-6 bg-border" />

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all">
                    <Award className="h-6 w-6 mx-auto text-primary mb-1" />
                    <div className="text-sm font-semibold text-foreground">{educationList.length}</div>
                    <div className="text-xs text-muted-foreground">Degrees</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all">
                    <Briefcase className="h-6 w-6 mx-auto text-primary mb-1" />
                    <div className="text-sm font-semibold text-foreground">{experienceList.length}</div>
                    <div className="text-xs text-muted-foreground">Experiences</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all">
                    <Clock className="h-6 w-6 mx-auto text-primary mb-1" />
                    <div className="text-sm font-semibold text-foreground">
                      {employeeRecord.joiningDate ? new Date(employeeRecord.joiningDate).getFullYear() : 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">Joined</div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="mt-6 space-y-3 text-left">
                  {profile.phone && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-foreground">{profile.phone}</span>
                    </div>
                  )}
                  {employeeRecord.employeeId && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <IdCard className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-foreground">ID: {employeeRecord.employeeId}</span>
                    </div>
                  )}
                </div>

                {/* Profile Completeness */}
                <div className="mt-6 p-4 rounded-lg bg-muted/30">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-foreground">Profile Completeness</span>
                    <span className="font-bold text-primary">{profile.isProfileComplete ? "100%" : "70%"}</span>
                  </div>
                  <Progress 
                    value={profile.isProfileComplete ? 100 : 70} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Salary Card */}
            <Card className="border border-border bg-card hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <IndianRupee className="h-5 w-5 text-primary" />
                  Salary Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">Basic</span>
                  <span className="font-semibold text-foreground">{formatCurrency(salary.basic)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">HRA</span>
                  <span className="font-semibold text-foreground">{formatCurrency(salary.hra)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">DA</span>
                  <span className="font-semibold text-foreground">{formatCurrency(salary.da)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">TA</span>
                  <span className="font-semibold text-foreground">{formatCurrency(salary.ta)}</span>
                </div>
                <Separator className="bg-border" />
                <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                  <span className="font-medium text-foreground">Net Salary</span>
                  <span className="font-bold text-primary text-lg">{formatCurrency(salary.netSalary)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Social Links Card */}
            <Card className="border border-border bg-card hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-primary" />
                  Social Presence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {profile.socialLinks?.linkedin && (
                    <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" 
                       className="p-3 bg-muted rounded-lg hover:bg-muted/80 transition-all">
                      <Linkedin className="h-5 w-5 text-primary" />
                    </a>
                  )}
                  {profile.socialLinks?.github && (
                    <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer"
                       className="p-3 bg-muted rounded-lg hover:bg-muted/80 transition-all">
                      <Github className="h-5 w-5 text-foreground" />
                    </a>
                  )}
                  {profile.socialLinks?.portfolio && (
                    <a href={profile.socialLinks.portfolio} target="_blank" rel="noopener noreferrer"
                       className="p-3 bg-muted rounded-lg hover:bg-muted/80 transition-all">
                      <Globe className="h-5 w-5 text-primary" />
                    </a>
                  )}
                  {profile.socialLinks?.twitter && (
                    <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer"
                       className="p-3 bg-muted rounded-lg hover:bg-muted/80 transition-all">
                      <Twitter className="h-5 w-5 text-sky-500" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Detailed Info */}
          <div className="lg:col-span-2">
            <Card className="border border-border bg-card">
              <CardContent className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)}>
                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-4 mb-8 bg-muted">
                        <TabsTrigger value="professional">Professional</TabsTrigger>
                        <TabsTrigger value="education">Education</TabsTrigger>
                        <TabsTrigger value="experience">Experience</TabsTrigger>
                        <TabsTrigger value="additional">Additional</TabsTrigger>
                      </TabsList>

                      {/* Professional Tab */}
                      <TabsContent value="professional" className="space-y-6">
                        {/* Employment Details (Read-only) */}
                        <div className="bg-muted/30 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                            <Briefcase className="h-5 w-5 text-primary" />
                            Employment Details
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">Department</p>
                              <p className="font-medium text-foreground bg-background p-3 rounded-lg border border-border">
                                {employeeRecord.department || "Not Specified"}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">Designation</p>
                              <p className="font-medium text-foreground bg-background p-3 rounded-lg border border-border">
                                {employeeRecord.designation || "Not Specified"}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">Employee ID</p>
                              <p className="font-medium text-foreground bg-background p-3 rounded-lg border border-border">
                                {employeeRecord.employeeId || "Not Specified"}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">Joining Date</p>
                              <p className="font-medium text-foreground bg-background p-3 rounded-lg border border-border">
                                {employeeRecord.joiningDate ? new Date(employeeRecord.joiningDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : "Not Specified"}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">Contract Type</p>
                              <p className="font-medium text-foreground bg-background p-3 rounded-lg border border-border">
                                {employeeRecord.contractType || "Not Specified"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Leave Details (Read-only) */}
                        {employeeRecord.leaves && (
                          <div className="bg-muted/30 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                              <Clock className="h-5 w-5 text-primary" />
                              Leave Details
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center p-4 bg-background rounded-lg border border-border">
                                <p className="text-2xl font-bold text-foreground">{employeeRecord.leaves.total || 0}</p>
                                <p className="text-sm text-muted-foreground">Total Leaves</p>
                              </div>
                              <div className="text-center p-4 bg-background rounded-lg border border-border">
                                <p className="text-2xl font-bold text-yellow-600">{employeeRecord.leaves.taken || 0}</p>
                                <p className="text-sm text-muted-foreground">Taken</p>
                              </div>
                              <div className="text-center p-4 bg-background rounded-lg border border-border">
                                <p className="text-2xl font-bold text-green-600">{employeeRecord.leaves.remaining || 0}</p>
                                <p className="text-sm text-muted-foreground">Remaining</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Editable Personal Info */}
                        <div className="bg-muted/30 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                            <User className="h-5 w-5 text-primary" />
                            Personal Information
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-foreground">Full Name</FormLabel>
                                  <FormControl>
                                    <Input 
                                      disabled={!isEditing} 
                                      className={`${!isEditing ? 'bg-muted' : 'bg-background'} border-border focus:border-primary focus:ring-primary`}
                                      {...field} 
                                    />
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
                                  <FormLabel className="text-foreground">Phone Number</FormLabel>
                                  <FormControl>
                                    <Input 
                                      disabled={!isEditing} 
                                      className={`${!isEditing ? 'bg-muted' : 'bg-background'} border-border focus:border-primary focus:ring-primary`}
                                      {...field} 
                                    />
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
                                  <FormLabel className="text-foreground">Date of Birth</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="date" 
                                      disabled={!isEditing} 
                                      className={`${!isEditing ? 'bg-muted' : 'bg-background'} border-border focus:border-primary focus:ring-primary`}
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
                              name="gender"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-foreground">Gender</FormLabel>
                                  <Select
                                    disabled={!isEditing}
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  >
                                    <FormControl>
                                      <SelectTrigger className={`${!isEditing ? 'bg-muted' : 'bg-background'} border-border focus:border-primary focus:ring-primary`}>
                                        <SelectValue placeholder="Select gender" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Male">Male</SelectItem>
                                      <SelectItem value="Female">Female</SelectItem>
                                      <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </TabsContent>

                      {/* Education Tab */}
                      <TabsContent value="education" className="space-y-6">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                              <GraduationCap className="h-5 w-5 text-primary" />
                              Education & Qualifications
                            </h3>
                            {isEditing && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => setShowEducationDialog(true)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Education
                              </Button>
                            )}
                          </div>

                          {educationList.length > 0 ? (
                            <div className="space-y-4">
                              {educationList.map((edu, index) => (
                                <div key={index} className="group relative bg-muted/30 rounded-lg p-6 hover:shadow-md transition-all border border-border hover:border-primary/50">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                          <Award className="h-4 w-4 text-primary" />
                                        </div>
                                        <h4 className="font-bold text-lg text-foreground">
                                          {edu.degree} in {edu.specialization}
                                        </h4>
                                      </div>
                                      <p className="text-muted-foreground ml-11">{edu.university}</p>
                                      <div className="flex gap-4 mt-2 ml-11">
                                        {edu.yearOfPassing && (
                                          <Badge variant="outline" className="border-border">
                                            {edu.yearOfPassing}
                                          </Badge>
                                        )}
                                        {edu.percentage && (
                                          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0">
                                            {edu.percentage}%
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    {isEditing && (
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all opacity-0 group-hover:opacity-100"
                                        onClick={() => handleRemoveEducation(index)}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12 px-4 bg-muted/30 rounded-lg">
                              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                              <p className="text-muted-foreground">No education details added yet</p>
                              {isEditing && (
                                <Button
                                  type="button"
                                  onClick={() => setShowEducationDialog(true)}
                                  className="mt-4"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Your First Education
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      {/* Experience Tab */}
                      <TabsContent value="experience" className="space-y-6">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                              <Briefcase className="h-5 w-5 text-primary" />
                              Work Experience
                            </h3>
                            {isEditing && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => setShowExperienceDialog(true)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Experience
                              </Button>
                            )}
                          </div>

                          {experienceList.length > 0 ? (
                            <div className="space-y-4">
                              {experienceList.map((exp, index) => (
                                <div key={index} className="group relative bg-muted/30 rounded-lg p-6 hover:shadow-md transition-all border border-border hover:border-primary/50">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                          <Briefcase className="h-4 w-4 text-primary" />
                                        </div>
                                        <h4 className="font-bold text-lg text-foreground">{exp.position}</h4>
                                      </div>
                                      <p className="text-muted-foreground ml-11">{exp.company}</p>
                                      <div className="flex gap-2 mt-2 ml-11">
                                        {exp.duration && (
                                          <Badge variant="outline" className="border-border">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {exp.duration}
                                          </Badge>
                                        )}
                                        {exp.isCurrent && (
                                          <Badge className="bg-green-500/10 text-green-600 border-0">
                                            Current
                                          </Badge>
                                        )}
                                      </div>
                                      {exp.description && (
                                        <p className="text-sm text-muted-foreground mt-2 ml-11">{exp.description}</p>
                                      )}
                                    </div>
                                    {isEditing && (
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all opacity-0 group-hover:opacity-100"
                                        onClick={() => handleRemoveExperience(index)}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12 px-4 bg-muted/30 rounded-lg">
                              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                              <p className="text-muted-foreground">No experience details added yet</p>
                              {isEditing && (
                                <Button
                                  type="button"
                                  onClick={() => setShowExperienceDialog(true)}
                                  className="mt-4"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Your First Experience
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      {/* Additional Tab */}
                      <TabsContent value="additional" className="space-y-6">
                        {/* Address */}
                        <div className="bg-muted/30 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                            <MapPin className="h-5 w-5 text-primary" />
                            Address
                          </h3>
                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name="address.street"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      disabled={!isEditing} 
                                      placeholder="Street Address" 
                                      className={`${!isEditing ? 'bg-muted' : 'bg-background'} border-border focus:border-primary focus:ring-primary`}
                                      {...field} 
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="address.city"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input 
                                        disabled={!isEditing} 
                                        placeholder="City" 
                                        className={`${!isEditing ? 'bg-muted' : 'bg-background'} border-border focus:border-primary focus:ring-primary`}
                                        {...field} 
                                        value={field.value || ""}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="address.state"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input 
                                        disabled={!isEditing} 
                                        placeholder="State" 
                                        className={`${!isEditing ? 'bg-muted' : 'bg-background'} border-border focus:border-primary focus:ring-primary`}
                                        {...field} 
                                        value={field.value || ""}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="address.country"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input 
                                        disabled={!isEditing} 
                                        placeholder="Country" 
                                        className={`${!isEditing ? 'bg-muted' : 'bg-background'} border-border focus:border-primary focus:ring-primary`}
                                        {...field} 
                                        value={field.value || ""}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="address.pincode"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input 
                                        disabled={!isEditing} 
                                        placeholder="Pincode" 
                                        className={`${!isEditing ? 'bg-muted' : 'bg-background'} border-border focus:border-primary focus:ring-primary`}
                                        {...field} 
                                        value={field.value || ""}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Social Links */}
                        <div className="bg-muted/30 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                            <Share2 className="h-5 w-5 text-primary" />
                            Social Links
                          </h3>
                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name="socialLinks.linkedin"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <div className="relative">
                                      <Linkedin className="absolute left-3 top-3 h-4 w-4 text-primary" />
                                      <Input 
                                        disabled={!isEditing} 
                                        placeholder="LinkedIn URL" 
                                        className={`pl-10 ${!isEditing ? 'bg-muted' : 'bg-background'} border-border focus:border-primary focus:ring-primary`}
                                        {...field} 
                                        value={field.value || ""}
                                      />
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
                                  <FormControl>
                                    <div className="relative">
                                      <Github className="absolute left-3 top-3 h-4 w-4 text-foreground" />
                                      <Input 
                                        disabled={!isEditing} 
                                        placeholder="GitHub URL" 
                                        className={`pl-10 ${!isEditing ? 'bg-muted' : 'bg-background'} border-border focus:border-primary focus:ring-primary`}
                                        {...field} 
                                        value={field.value || ""}
                                      />
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
                                  <FormControl>
                                    <div className="relative">
                                      <Globe className="absolute left-3 top-3 h-4 w-4 text-primary" />
                                      <Input 
                                        disabled={!isEditing} 
                                        placeholder="Portfolio URL" 
                                        className={`pl-10 ${!isEditing ? 'bg-muted' : 'bg-background'} border-border focus:border-primary focus:ring-primary`}
                                        {...field} 
                                        value={field.value || ""}
                                      />
                                    </div>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>

                    {/* Save Button */}
                    {isEditing && (
                      <div className="mt-8 flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={updateMutation.isPending} 
                          className="gap-2 px-8 py-6"
                        >
                          {updateMutation.isPending ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              Saving Changes...
                            </>
                          ) : (
                            <>
                              <Save className="h-5 w-5" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Education Dialog */}
      <Dialog open={showEducationDialog} onOpenChange={setShowEducationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">
              Add Education
            </DialogTitle>
            <DialogDescription>
              Add your academic qualification details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input 
              placeholder="Degree (e.g., M.Tech)" 
              className="border-border focus:border-primary"
              value={newEducation.degree}
              onChange={(e) => setNewEducation({...newEducation, degree: e.target.value})}
            />
            <Input 
              placeholder="Specialization" 
              className="border-border focus:border-primary"
              value={newEducation.specialization}
              onChange={(e) => setNewEducation({...newEducation, specialization: e.target.value})}
            />
            <Input 
              placeholder="University/Institute" 
              className="border-border focus:border-primary"
              value={newEducation.university}
              onChange={(e) => setNewEducation({...newEducation, university: e.target.value})}
            />
            <Input 
              placeholder="Year of Passing" 
              type="number" 
              className="border-border focus:border-primary"
              value={newEducation.yearOfPassing || ""}
              onChange={(e) => setNewEducation({...newEducation, yearOfPassing: e.target.value ? parseInt(e.target.value) : undefined})}
            />
            <Input 
              placeholder="Percentage/CGPA" 
              type="number" 
              step="0.01" 
              className="border-border focus:border-primary"
              value={newEducation.percentage || ""}
              onChange={(e) => setNewEducation({...newEducation, percentage: e.target.value ? parseFloat(e.target.value) : undefined})}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEducationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEducation}>
              Add Education
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Experience Dialog */}
      <Dialog open={showExperienceDialog} onOpenChange={setShowExperienceDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">
              Add Experience
            </DialogTitle>
            <DialogDescription>
              Add your work experience details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input 
              placeholder="Company/Institution" 
              className="border-border focus:border-primary"
              value={newExperience.company}
              onChange={(e) => setNewExperience({...newExperience, company: e.target.value})}
            />
            <Input 
              placeholder="Position" 
              className="border-border focus:border-primary"
              value={newExperience.position}
              onChange={(e) => setNewExperience({...newExperience, position: e.target.value})}
            />
            <Input 
              placeholder="Duration (e.g., 2 years)" 
              className="border-border focus:border-primary"
              value={newExperience.duration}
              onChange={(e) => setNewExperience({...newExperience, duration: e.target.value})}
            />
            <Input 
              placeholder="Description (Optional)" 
              className="border-border focus:border-primary"
              value={newExperience.description}
              onChange={(e) => setNewExperience({...newExperience, description: e.target.value})}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isCurrent"
                checked={newExperience.isCurrent}
                onChange={(e) => setNewExperience({...newExperience, isCurrent: e.target.checked})}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="isCurrent" className="text-sm text-foreground">I currently work here</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExperienceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddExperience}>
              Add Experience
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}