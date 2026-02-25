"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useMe } from "@/hooks/use-me";
import { adminData } from "@/lib/sidebarNavItems/AdminData";
import { logoutApi } from "@/lib/api/auth.api";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: user, isLoading, isError } = useMe();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (isError || !user)) {
      logoutApi();
      router.replace("/");
    }
  }, [isLoading, isError, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
      className="font-sans"
    >
      <AppSidebar
        variant="inset"
        data={{
          ...adminData,
          user,
        }}
      />

      <SidebarInset>
        <SiteHeader />

        <div className="flex flex-1 flex-col font-sans">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
