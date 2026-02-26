"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { 
  Upload, 
  Users, 
  Loader2, 
  CheckCircle2, 
  Clock,
  FileText,
  Calendar as CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { useAvailableEmployees, useBulkMarkAttendance } from "@/hooks/useAttendanceQueries";
import { Employee } from "@/lib/api/admin.attendance.api";

// Helper function to get status color
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    PRESENT: "bg-green-500",
    ABSENT: "bg-red-500",
    LATE: "bg-yellow-500",
    ON_LEAVE: "bg-blue-500",
    HALF_DAY: "bg-orange-500",
    WORK_FROM_HOME: "bg-purple-500",
    ON_DUTY: "bg-indigo-500",
    HOLIDAY: "bg-gray-500",
  };
  return colors[status] || "bg-gray-500";
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

interface BulkAttendanceDialogProps {
  employees: Employee[];
}

export function BulkAttendanceDialog({ employees }: BulkAttendanceDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    markAs: "PRESENT",
    reason: "",
  });

  // Get employee IDs as a stable string for the query key
  const employeeIdsString = useMemo(() => 
    employees.map(e => e._id).join(','), 
    [employees]
  );

  // Use TanStack Query to check existing attendances
  const { 
    data: checkData, 
    isLoading: checking,
    refetch: refetchAvailable 
  } = useAvailableEmployees(
    formData.date,
    employees.map(e => e._id),
    open // Only fetch when dialog is open
  );

  // Bulk mark mutation
  const bulkMark = useBulkMarkAttendance();

  // Create a Set of existing employee IDs for efficient lookup - memoized
  const existingEmployeeIdsSet = useMemo(() => 
    new Set(checkData?.existingEmployeeIds || []), 
    [checkData?.existingEmployeeIds]
  );

  // Filter employees based on existing attendances - memoized
  const availableEmployees = useMemo(() => 
    employees.filter(emp => !existingEmployeeIdsSet.has(emp._id)),
    [employees, existingEmployeeIdsSet]
  );

  // Reset selections when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedEmployees([]);
    }
  }, [open]);

  // Clear selected employees that are no longer available - with proper dependencies
  useEffect(() => {
    // Only run if there are selected employees
    if (selectedEmployees.length > 0) {
      setSelectedEmployees(prev => 
        prev.filter(id => availableEmployees.some(emp => emp._id === id))
      );
    }
  }, [availableEmployees, selectedEmployees.length]); // Removed selectedEmployees from deps to avoid loop

  const handleSelectAll = useCallback(() => {
    if (selectedEmployees.length === availableEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(availableEmployees.map(e => e._id));
    }
  }, [selectedEmployees.length, availableEmployees]);

  const handleSubmit = async () => {
    if (selectedEmployees.length === 0) {
      toast.error("Select at least one employee");
      return;
    }

    await bulkMark.mutateAsync({
      employeeIds: selectedEmployees,
      ...formData,
    });
    
    setOpen(false);
    setSelectedEmployees([]);
  };

  // Get badge for selected status
  const StatusBadge = ({ status }: { status: string }) => (
    <Badge className={`${getStatusColor(status)} text-white`}>
      {status.replace("_", " ")}
    </Badge>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Bulk Mark
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Bulk Mark Attendance
          </DialogTitle>
          <DialogDescription>
            Mark attendance for multiple employees at once
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 px-1">
          <div className="space-y-4">
            {/* Date Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date *</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  max={format(new Date(), "yyyy-MM-dd")}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Status Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Mark As *</Label>
              <Select
                value={formData.markAs}
                onValueChange={(value) => setFormData({ ...formData, markAs: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRESENT">Present</SelectItem>
                  <SelectItem value="ABSENT">Absent</SelectItem>
                  <SelectItem value="LATE">Late</SelectItem>
                  <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                  <SelectItem value="HALF_DAY">Half Day</SelectItem>
                  <SelectItem value="WORK_FROM_HOME">Work From Home</SelectItem>
                  <SelectItem value="ON_DUTY">On Duty</SelectItem>
                  <SelectItem value="HOLIDAY">Holiday</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Reason (Optional)</Label>
              <Textarea
                placeholder="Reason for bulk marking..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="resize-none"
                rows={2}
              />
            </div>

            <Separator />

            {/* Employee Selection */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-semibold">
                    Select Employees
                  </Label>
                  {employees.length - availableEmployees.length > 0 && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      {employees.length - availableEmployees.length} already marked
                    </Badge>
                  )}
                </div>
                {availableEmployees.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleSelectAll}
                    className="text-xs"
                  >
                    {selectedEmployees.length === availableEmployees.length ? "Deselect All" : "Select All"}
                  </Button>
                )}
              </div>
              
              {/* Loading State */}
              {checking ? (
                <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-muted/20">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">Checking existing attendance...</p>
                </div>
              ) : availableEmployees.length === 0 ? (
                <Card className="bg-muted/50 border-dashed">
                  <CardContent className="py-12 text-center">
                    <div className="inline-flex p-3 bg-background rounded-full mb-4">
                      <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h4 className="font-medium mb-1">No employees available</h4>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      All employees already have attendance marked for {format(new Date(formData.date), "PPP")}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <ScrollArea className="h-[280px] border rounded-lg">
                    <div className="p-4 space-y-2">
                      {availableEmployees.map((emp) => {
                        const shiftInfo = emp.employeeRecord?.shiftTimings;
                        return (
                          <div 
                            key={emp._id} 
                            className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                              selectedEmployees.includes(emp._id) 
                                ? 'bg-primary/5 border border-primary/20' 
                                : 'hover:bg-muted/50 border border-transparent'
                            }`}
                          >
                            <Checkbox
                              id={emp._id}
                              checked={selectedEmployees.includes(emp._id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedEmployees([...selectedEmployees, emp._id]);
                                } else {
                                  setSelectedEmployees(selectedEmployees.filter(id => id !== emp._id));
                                }
                              }}
                              className="mt-1"
                            />
                            <Label htmlFor={emp._id} className="flex-1 cursor-pointer">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                      {getInitials(emp.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-sm">{emp.name}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                      <Badge variant="secondary" className="text-xs">
                                        {emp.role === "TEACHER" ? "👨‍🏫 Teacher" : "👨‍💼 Faculty Admin"}
                                      </Badge>
                                      {shiftInfo && (
                                        <Badge variant="outline" className="text-xs gap-1">
                                          <Clock className="h-3 w-3" />
                                          {shiftInfo.start} - {shiftInfo.end}
                                        </Badge>
                                      )}
                                      {emp.employeeRecord?.department && (
                                        <Badge variant="outline" className="text-xs">
                                          {emp.employeeRecord.department}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {emp.employeeRecord?.designation && (
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {emp.employeeRecord.designation}
                                  </span>
                                )}
                              </div>
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                  
                  <div className="flex items-center justify-between mt-3 text-sm">
                    <p className="text-muted-foreground">
                      Selected: <span className="font-medium text-foreground">{selectedEmployees.length}</span> of {availableEmployees.length} available
                    </p>
                    {selectedEmployees.length > 0 && (
                      <Badge variant="secondary" className="bg-primary/10">
                        <Users className="h-3 w-3 mr-1" />
                        {selectedEmployees.length} selected
                      </Badge>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Summary Card */}
            {selectedEmployees.length > 0 && !checking && (
              <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-4">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Bulk Operation Summary
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Action:</span>
                      <span className="font-medium flex items-center gap-2">
                        Mark as <StatusBadge status={formData.markAs} />
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">{format(new Date(formData.date), "PPP")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Employees:</span>
                      <span className="font-medium">{selectedEmployees.length} selected</span>
                    </div>
                    {formData.reason && (
                      <div className="pt-2 border-t">
                        <span className="text-muted-foreground block mb-1">Reason:</span>
                        <p className="text-sm bg-background/50 p-2 rounded">{formData.reason}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <DialogFooter className="border-t pt-4 mt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={selectedEmployees.length === 0 || !formData.date || bulkMark.isPending || checking}
            className="bg-blue-600 hover:bg-blue-700 min-w-[140px]"
          >
            {bulkMark.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                Mark ({selectedEmployees.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}