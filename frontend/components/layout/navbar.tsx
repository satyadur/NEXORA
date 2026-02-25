"use client";

import { logoutApi } from "@/lib/api/auth.api";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  const logout = () => {
    logoutApi();
    router.push("/auth/login");
  };

  return (
    <header className="h-14 border-b flex items-center justify-between px-6 bg-background">
      <h1 className="font-semibold text-lg">Dynamic Assignment Maker</h1>
      <button
        onClick={logout}
        className="text-sm bg-red-500 text-white px-3 py-1 rounded"
      >
        Logout
      </button>
    </header>
  );
}
