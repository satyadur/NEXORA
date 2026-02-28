"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

import {
  getClassrooms,
  createClassroomApi,
  updateClassroomApi,
  deleteClassroomApi,
  Classroom,
} from "@/lib/api/classroom.api";

import { getTeachersApi } from "@/lib/api/admin.api";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Plus,
  Users,
  Trash2,
  Pencil,
  Copy,
  Check,
  Search,
  Filter,
  GraduationCap,
  BookOpen,
  Clock,
  Loader2,
  DoorOpen,
} from "lucide-react";

export default function ClassRoomPage() {
  const queryClient = useQueryClient();

  /* ================= STATE ================= */
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    teacherId: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE" | "COMPLETED",
  });

  /* ================= FETCH ================= */
  const { data: classrooms, isLoading } = useQuery({
    queryKey: ["classrooms"],
    queryFn: getClassrooms,
  });

  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ["teachers"],
    queryFn: getTeachersApi,
  });

  /* ================= MUTATIONS ================= */
  const createMutation = useMutation({
    mutationFn: createClassroomApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      toast.success("Classroom created successfully", {
        description: "You can now add students to the classroom.",
      });
      resetForm();
      setOpen(false);
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error("Creation failed", {
        description: error.response?.data?.message || "Please try again.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateClassroomApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      toast.success("Classroom updated successfully");
      resetForm();
      setEditOpen(false);
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error("Update failed", {
        description: error.response?.data?.message || "Please try again.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClassroomApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      toast.success("Classroom deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedClassroom(null);
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error("Delete failed", {
        description: error.response?.data?.message || "Please try again.",
      });
    },
  });

  /* ================= HANDLERS ================= */
  const resetForm = () => {
    setFormData({
      name: "",
      teacherId: "",
      status: "ACTIVE",
    });
    setSelectedClassroom(null);
  };

  const handleEdit = (classroom: Classroom) => {
    setSelectedClassroom(classroom);
    setFormData({
      name: classroom.name,
      teacherId: classroom.teacher?._id || "",
      status: classroom.status,
    });
    setEditOpen(true);
  };

  const handleDelete = (classroom: Classroom) => {
    setSelectedClassroom(classroom);
    setDeleteDialogOpen(true);
  };

  const handleCopyInviteCode = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      toast.success("Invite code copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  /* ================= FILTERING ================= */
  const filteredClassrooms = useMemo(() => {
    if (!classrooms) return [];

    return classrooms.filter((classroom) => {
      const matchesSearch = classroom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        classroom.teacher?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "ALL" || classroom.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [classrooms, searchTerm, statusFilter]);

  /* ================= STATISTICS ================= */
  const statistics = useMemo(() => {
    if (!classrooms) return null;

    const total = classrooms.length;
    const active = classrooms.filter(c => c.status === "ACTIVE").length;
    const inactive = classrooms.filter(c => c.status === "INACTIVE").length;
    const completed = classrooms.filter(c => c.status === "COMPLETED").length;
    const totalStudents = classrooms.reduce((acc, c) => acc + (c.students?.length || 0), 0);
    const avgStudentsPerClass = total > 0 ? (totalStudents / total).toFixed(1) : 0;
    const utilizationRate = total > 0 ? ((active / total) * 100).toFixed(1) : 0;

    return {
      total,
      active,
      inactive,
      completed,
      totalStudents,
      avgStudentsPerClass,
      utilizationRate,
    };
  }, [classrooms]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading classrooms...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Classroom Management</h1>
          <p className="text-muted-foreground">
            Manage all classrooms, teachers, and student enrollments
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Classroom
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Classrooms</CardTitle>
              <DoorOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="h-5">
                  {statistics.active} Active
                </Badge>
                <Badge variant="secondary" className="h-5">
                  {statistics.inactive} Inactive
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                Avg {statistics.avgStudentsPerClass} per classroom
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Teachers</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teachers?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Ready to assign to classrooms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.utilizationRate}%</div>
              <Progress value={Number(statistics.utilizationRate)} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search classrooms by name or teacher..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active Only</SelectItem>
                  <SelectItem value="INACTIVE">Inactive Only</SelectItem>
                  <SelectItem value="COMPLETED">Completed Only</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-r-none"
                  onClick={() => setViewMode("grid")}
                >
                  Grid
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-l-none"
                  onClick={() => setViewMode("list")}
                >
                  List
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classrooms Grid/List */}
      {filteredClassrooms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DoorOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No classrooms found</p>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm || statusFilter !== "ALL" 
                ? "Try adjusting your filters" 
                : "Create your first classroom to get started"}
            </p>
            {!searchTerm && statusFilter === "ALL" && (
              <Button onClick={() => setOpen(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Classroom
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClassrooms.map((classroom) => (
            <ClassroomCard
              key={classroom._id}
              classroom={classroom}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCopyInvite={handleCopyInviteCode}
              copiedId={copiedId}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="rounded-md border">
              <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 text-sm font-medium">
                <div className="col-span-3">Classroom</div>
                <div className="col-span-2">Teacher</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Students</div>
                <div className="col-span-2">Invite Code</div>
                <div className="col-span-1">Actions</div>
              </div>
              {filteredClassrooms.map((classroom) => (
                <ClassroomListItem
                  key={classroom._id}
                  classroom={classroom}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onCopyInvite={handleCopyInviteCode}
                  copiedId={copiedId}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <ClassroomFormDialog
        open={open || editOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetForm();
            setOpen(false);
            setEditOpen(false);
          }
        }}
        mode={editOpen ? "edit" : "create"}
        formData={formData}
        setFormData={setFormData}
        teachers={teachers || []}
        teachersLoading={teachersLoading}
        onSubmit={() => {
          if (editOpen && selectedClassroom) {
            updateMutation.mutate({
              id: selectedClassroom._id,
              ...formData,
              teacher: formData.teacherId,
            });
          } else {
            createMutation.mutate({
              name: formData.name,
              teacher: formData.teacherId,
              status: formData.status,
            });
          }
        }}
        isPending={editOpen ? updateMutation.isPending : createMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Classroom</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedClassroom?.name}"? This action cannot be undone.
              All student enrollments and assignments will be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedClassroom && deleteMutation.mutate(selectedClassroom._id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Classroom"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ===================== SUB-COMPONENTS ===================== */

interface ClassroomCardProps {
  classroom: Classroom;
  onEdit: (classroom: Classroom) => void;
  onDelete: (classroom: Classroom) => void;
  onCopyInvite: (code: string, id: string) => void;
  copiedId: string | null;
}

function ClassroomCard({ classroom, onEdit, onDelete, onCopyInvite, copiedId }: ClassroomCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">{classroom.name}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <GraduationCap className="h-3 w-3" />
              {classroom.teacher?.name || "No teacher assigned"}
            </CardDescription>
          </div>
          <Badge
            variant={classroom.status === "ACTIVE" ? "outline" : "secondary"}
            className="capitalize"
          >
            {classroom.status.toLowerCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-3">
          {/* Stats */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{classroom.students?.length || 0} Students</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span>0 Assignments</span>
            </div>
          </div>

          {/* Invite Code */}
          {classroom.inviteCode && (
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold">{classroom.inviteCode}</span>
                <Badge variant="outline" className="text-[10px] h-5">
                  Invite Code
                </Badge>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => onCopyInvite(classroom.inviteCode!, classroom._id)}
                    >
                      {copiedId === classroom._id ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy invite code</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="border-t pt-3">
        <div className="flex w-full gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(classroom)}
            disabled={classroom.status === "COMPLETED"}
          >
            <Pencil className="h-3 w-3 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="flex-1"
            onClick={() => onDelete(classroom)}
          >
            <Trash2 className="h-3 w-3 mr-2" />
            Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function ClassroomListItem({ classroom, onEdit, onDelete, onCopyInvite, copiedId }: ClassroomCardProps) {
  return (
    <div className="grid grid-cols-12 gap-4 p-4 border-b last:border-0 hover:bg-muted/50 transition-colors">
      <div className="col-span-3 font-medium">{classroom.name}</div>
      <div className="col-span-2 text-sm text-muted-foreground">
        {classroom.teacher?.name || "—"}
      </div>
      <div className="col-span-2">
        <Badge
          variant={classroom.status === "ACTIVE" ? "outline" : "secondary"}
          className="capitalize"
        >
          {classroom.status.toLowerCase()}
        </Badge>
      </div>
      <div className="col-span-2 text-sm">{classroom.students?.length || 0} students</div>
      <div className="col-span-2">
        {classroom.inviteCode && (
          <div className="flex items-center gap-2">
            <code className="text-xs bg-muted px-2 py-1 rounded">
              {classroom.inviteCode}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onCopyInvite(classroom.inviteCode!, classroom._id)}
            >
              {copiedId === classroom._id ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        )}
      </div>
      <div className="col-span-1">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(classroom)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(classroom)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ClassroomFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  formData: {
    name: string;
    teacherId: string;
    status: "ACTIVE" | "INACTIVE";
  };
  setFormData: (data: any) => void;
  teachers: any[];
  teachersLoading: boolean;
  onSubmit: () => void;
  isPending: boolean;
}

function ClassroomFormDialog({
  open,
  onOpenChange,
  mode,
  formData,
  setFormData,
  teachers,
  teachersLoading,
  onSubmit,
  isPending,
}: ClassroomFormDialogProps) {
  const isEdit = mode === "edit";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Classroom" : "Create New Classroom"}</DialogTitle>
          <DialogDescription>
            {isEdit 
              ? "Update classroom details and settings" 
              : "Add a new classroom to the platform and assign a teacher"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Classroom Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Classroom Name</Label>
            <Input
              id="name"
              placeholder="e.g., Mathematics 101, Physics Lab"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Choose a descriptive name for easy identification
            </p>
          </div>

          {/* Teacher Assignment */}
          <div className="space-y-2">
            <Label htmlFor="teacher">Assign Teacher</Label>
            <Select
              value={formData.teacherId}
              onValueChange={(value) => setFormData({ ...formData, teacherId: value })}
            >
              <SelectTrigger id="teacher">
                <SelectValue placeholder="Select a teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachersLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : teachers.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No teachers available
                  </div>
                ) : (
                  teachers.map((teacher) => (
                    <SelectItem key={teacher._id} value={teacher._id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>{teacher.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div>{teacher.name}</div>
                          <div className="text-xs text-muted-foreground">{teacher.email}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Teacher will have full access to manage this classroom
            </p>
          </div>

          {/* Status Selection (for edit mode) */}
          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="status">Classroom Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "ACTIVE" | "INACTIVE") => 
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      ACTIVE - Students can enroll
                    </div>
                  </SelectItem>
                  <SelectItem value="INACTIVE">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-gray-500" />
                      INACTIVE - No new enrollments
                    </div>
                  </SelectItem>
                  <SelectItem value="COMPLETED">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      COMPLETED - Classroom is complete
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Preview */}
          {formData.name && formData.teacherId && (
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <p className="text-sm font-medium">Preview</p>
              <div className="text-sm">
                <p><span className="text-muted-foreground">Classroom:</span> {formData.name}</p>
                <p><span className="text-muted-foreground">Teacher:</span> {
                  teachers.find(t => t._id === formData.teacherId)?.name
                }</p>
                {isEdit && (
                  <p><span className="text-muted-foreground">Status:</span> {formData.status}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!formData.name || !formData.teacherId || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEdit ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{isEdit ? "Update Classroom" : "Create Classroom"}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}