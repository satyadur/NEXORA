"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getAvailableClassroomsApi,
  joinClassroomApi,
} from "@/lib/api/student.api";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Loader2,
  Users,
  School,
  Plus,
} from "lucide-react";

import { toast } from "sonner";

export default function StudentClassroomsPage() {
  const [inviteCode, setInviteCode] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["available-classrooms"],
    queryFn: getAvailableClassroomsApi,
  });

  const mutation = useMutation({
    mutationFn: joinClassroomApi,
    onSuccess: () => {
      toast.success("Joined successfully!");
      setInviteCode("");
      refetch();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Failed to join classroom"
      );
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin size-8" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">
          Join Classroom
        </h1>
        <p className="text-muted-foreground">
          Enter invite code or browse available classrooms.
        </p>
      </div>

      {/* JOIN BOX */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Join via Invite Code</CardTitle>
          <CardDescription>
            Ask your teacher for classroom code
          </CardDescription>
        </CardHeader>

        <CardContent className="flex gap-4">
          <Input
            placeholder="Enter invite code"
            value={inviteCode}
            onChange={(e) =>
              setInviteCode(e.target.value)
            }
          />
          <Button
            onClick={() =>
              mutation.mutate(inviteCode)
            }
            disabled={mutation.isPending}
          >
            <Plus className="mr-2" size={16} />
            Join
          </Button>
        </CardContent>
      </Card>

      {/* AVAILABLE CLASSROOMS */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

        {data?.length === 0 && (
          <p className="text-muted-foreground">
            No classrooms available.
          </p>
        )}

        {data?.map((classroom: any) => (
          <Card
            key={classroom._id}
            className="hover:shadow-xl transition-all duration-300"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School size={18} />
                {classroom.name}
              </CardTitle>
              <CardDescription>
                Teacher: {classroom.teacher.name}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex justify-between items-center">
              <Badge variant="secondary">
                Code: {classroom.inviteCode}
              </Badge>

              <Button
                size="sm"
                onClick={() =>
                  mutation.mutate(
                    classroom.inviteCode
                  )
                }
              >
                <Users className="mr-2" size={14} />
                Join
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
