"use client";

import { useMe } from "@/hooks/use-me";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import TeacherProfile from "./_components/TeacherProfile";
import { logoutApi } from "@/lib/api/auth.api";

export default function ProfilePage() {
  const router = useRouter();
  const { data: user, isLoading } = useMe();

  useEffect(() => {
    if (!isLoading && !user) {
      logoutApi();
      router.push("/auth/login");
    }
    if (!isLoading && user && user.role !== "TEACHER") {
      router.push(`/${user.role.toLowerCase()}`);
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <TeacherProfile />;
}