// app/teacher/attendance/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Navigation,
  Calendar,
  TrendingUp,
  History,
  Loader2,
  RefreshCw,
  LogIn,
  LogOut,
} from "lucide-react";

// API functions
import {
  checkInApi,
  checkOutApi,
  getTodayAttendanceApi,
  getAttendanceHistoryApi,
  AttendanceRecord,
} from "@/lib/api/teacher.attendance.api";

// Location service
import { getCurrentLocation, type LocationData } from "@/lib/services/location.service";

export default function TeacherAttendancePage() {
  const router = useRouter();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [activeTab, setActiveTab] = useState("today");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get current location
  const getLocation = async () => {
    setIsLocating(true);
    setLocationError(null);
    try {
      const locationData = await getCurrentLocation();
      setLocation(locationData);
    } catch (error: any) {
      setLocationError(error.message);
      toast.error("Failed to get location", {
        description: error.message,
      });
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  // Queries
  const { 
    data: todayAttendance, 
    isLoading: todayLoading,
    refetch: refetchToday,
    isFetching: isFetchingToday
  } = useQuery({
    queryKey: ["teacher-attendance-today"],
    queryFn: getTodayAttendanceApi,
  });

  const { 
    data: historyData, 
    isLoading: historyLoading,
    refetch: refetchHistory,
    isFetching: isFetchingHistory
  } = useQuery({
    queryKey: ["teacher-attendance-history"],
    queryFn: () => getAttendanceHistoryApi(),
  });

  // Mutations
  const checkInMutation = useMutation({
    mutationFn: checkInApi,
    onSuccess: (data) => {
      toast.success("Check-in successful", {
        description: `Checked in at ${format(new Date(), "hh:mm a")}`,
      });
      refetchToday();
      refetchHistory();
    },
    onError: (error: any) => {
      toast.error("Check-in failed", {
        description: error.message,
      });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: checkOutApi,
    onSuccess: (data) => {
      toast.success("Check-out successful", {
        description: `Worked for ${data.workHours}`,
      });
      refetchToday();
      refetchHistory();
    },
    onError: (error: any) => {
      toast.error("Check-out failed", {
        description: error.message,
      });
    },
  });

  // Refresh all data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchToday(),
        refetchHistory(),
        getLocation()
      ]);
      toast.success("Data refreshed", {
        description: "Latest attendance data loaded",
      });
    } catch (error) {
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCheckIn = () => {
    if (!location) {
      toast.error("Location required", {
        description: "Please enable location services to check in",
      });
      return;
    }

    checkInMutation.mutate({
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      altitude: location.altitude,
      address: location.address,
      deviceInfo: {
        platform: navigator.platform,
        userAgent: navigator.userAgent,
      },
    });
  };

  const handleCheckOut = () => {
    if (!location) {
      toast.error("Location required", {
        description: "Please enable location services to check out",
      });
      return;
    }

    checkOutMutation.mutate({
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      altitude: location.altitude,
      address: location.address,
    });
  };

  const isCheckedIn = todayAttendance?.actualCheckIn && !todayAttendance?.actualCheckOut;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Tracking</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <MapPin className="h-4 w-4" />
            Check in/out with location tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={isRefreshing || isFetchingToday || isFetchingHistory}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={getLocation} 
            disabled={isLocating}
            className="gap-2"
          >
            {isLocating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            {isLocating ? "Getting Location..." : "Update Location"}
          </Button>
        </div>
      </div>

      {/* Location Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                location ? "bg-green-100" : "bg-yellow-100"
              }`}>
                <MapPin className={`h-5 w-5 ${
                  location ? "text-green-600" : "text-yellow-600"
                }`} />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {location ? "Location Available" : "Location Required"}
                </p>
                {location ? (
                  <p className="text-xs text-muted-foreground">
                    Accuracy: ±{location.accuracy?.toFixed(1)}m • 
                    {location.address?.city || "Location detected"}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {locationError || "Please enable location services"}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(isFetchingToday || isFetchingHistory) && (
                <Badge variant="outline" className="gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Updating...
                </Badge>
              )}
              {isCheckedIn && (
                <Badge className="bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Checked In
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Check In/Out Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Check In Card */}
        <Card className={!isCheckedIn ? "border-primary/50 border-2" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-primary" />
              Check In
            </CardTitle>
            <CardDescription>
              Mark your arrival at the institute
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {todayAttendance?.actualCheckIn ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Checked in at</span>
                  </div>
                  <span className="font-bold">
                    {format(new Date(todayAttendance.actualCheckIn.startTime), "hh:mm a")}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>📍 Location: {todayAttendance.actualCheckIn.address?.formattedAddress || "N/A"}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center p-4">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    You haven't checked in today
                  </p>
                </div>
                <Button 
                  className="w-full h-12 text-lg"
                  onClick={handleCheckIn}
                  disabled={!location || checkInMutation.isPending}
                >
                  {checkInMutation.isPending ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <LogIn className="h-5 w-5 mr-2" />
                  )}
                  Check In Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Check Out Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-destructive" />
              Check Out
            </CardTitle>
            <CardDescription>
              Mark your departure from the institute
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {todayAttendance?.actualCheckOut ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-orange-600" />
                    <span className="font-medium">Checked out at</span>
                  </div>
                  <span className="font-bold">
                    {format(new Date(todayAttendance.actualCheckOut.startTime), "hh:mm a")}
                  </span>
                </div>
                {todayAttendance.totalWorkHours > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium">Total Work Hours</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {todayAttendance.formattedWorkHours}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center p-4">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {!todayAttendance?.actualCheckIn 
                      ? "Check in first to mark checkout" 
                      : "You are currently checked in"}
                  </p>
                </div>
                <Button 
                  variant="destructive"
                  className="w-full h-12 text-lg"
                  onClick={handleCheckOut}
                  disabled={!location || !isCheckedIn || checkOutMutation.isPending}
                >
                  {checkOutMutation.isPending ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <LogOut className="h-5 w-5 mr-2" />
                  )}
                  Check Out Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today's Session Details */}
      {todayAttendance && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Session Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={
                  todayAttendance.status === "PRESENT" ? "bg-green-500" :
                  todayAttendance.status === "LATE" ? "bg-yellow-500" :
                  "bg-gray-500"
                }>
                  {todayAttendance.status}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Check-in Time</p>
                <p className="font-medium">
                  {todayAttendance.actualCheckIn 
                    ? format(new Date(todayAttendance.actualCheckIn.startTime), "hh:mm a")
                    : "N/A"}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Check-out Time</p>
                <p className="font-medium">
                  {todayAttendance.actualCheckOut
                    ? format(new Date(todayAttendance.actualCheckOut.startTime), "hh:mm a")
                    : "Not checked out"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance History */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="today" className="gap-2">
            <Calendar className="h-4 w-4" />
            Today
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          {todayLoading || isFetchingToday ? (
            <Card>
              <CardContent className="py-8">
                <div className="flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ) : todayAttendance ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayAttendance.sessions?.map((session: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          {index === 0 ? "Check In" : "Check Out"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(session.startTime), "hh:mm a")}
                        </TableCell>
                        <TableCell>
                          {session.address?.city || "Location recorded"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No attendance record for today</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Work Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyLoading || isFetchingHistory ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : historyData?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        No attendance history found
                      </TableCell>
                    </TableRow>
                  ) : (
                    historyData?.map((record: AttendanceRecord) => (
                      <TableRow key={record._id}>
                        <TableCell>{format(new Date(record.date), "PP")}</TableCell>
                        <TableCell>
                          <Badge className={
                            record.status === "PRESENT" ? "bg-green-500" :
                            record.status === "LATE" ? "bg-yellow-500" :
                            "bg-gray-500"
                          }>
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {record.actualCheckIn 
                            ? format(new Date(record.actualCheckIn.startTime), "hh:mm a")
                            : "-"
                          }
                        </TableCell>
                        <TableCell>
                          {record.actualCheckOut
                            ? format(new Date(record.actualCheckOut.startTime), "hh:mm a")
                            : "-"
                          }
                        </TableCell>
                        <TableCell>{record.formattedWorkHours || "0h"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Present Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {historyData?.filter((r: AttendanceRecord) => 
                    r.status === "PRESENT" || r.status === "LATE"
                  ).length || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {historyData?.reduce((acc: number, r: AttendanceRecord) => 
                    acc + (r.totalWorkHours || 0), 0
                  ).toFixed(1) || 0}h
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg. Hours/Day</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {historyData?.length > 0
                    ? (historyData.reduce((acc, r) => acc + (r.totalWorkHours || 0), 0) / historyData.length).toFixed(1)
                    : "0"}h
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}