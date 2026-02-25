"use client";

import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { UserRole } from "@/types/auth";

export function useAuth() {
  const router = useRouter();

  const role = Cookies.get("role") as UserRole | undefined;
  const token = Cookies.get("token");

  const isAuthenticated = !!token;

  const redirectByRole = (role: UserRole) => {
    if (role === "ADMIN") router.push("/admin");
    else if (role === "TEACHER") router.push("/teacher");
    else router.push("/student");
  };

  const logout = () => {
    Cookies.remove("token");
    Cookies.remove("role");
    router.push("/");
  };

  return {
    role,
    token,
    isAuthenticated,
    redirectByRole,
    logout,
  };
}
