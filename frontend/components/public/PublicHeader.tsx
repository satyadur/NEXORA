"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useMe } from "@/hooks/use-me";
import { logoutApi } from "@/lib/api/auth.api";

import {
  GraduationCap,
  LayoutDashboard,
  LogOut,
  LogIn,
  UserPlus,
  Home,
  BookOpen,
  Users,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { AnimatedThemeToggler } from "../AnimatedTheamTogler";

export default function PublicHeader() {
  const { data: user, isLoading } = useMe();
  const router = useRouter();
  const queryClient = useQueryClient();

  const getDashboardPath = () => {
    if (!user) return "/";
    if (user.role === "ADMIN") return "/admin";
    if (user.role === "TEACHER") return "/teacher";
    return "/student";
  };

  const handleLogout = () => {
    logoutApi();
    queryClient.removeQueries({ queryKey: ["me"] });
    queryClient.clear();
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* ================= LOGO - REDESIGNED ================= */}
        <Link 
          href="/" 
          className="group flex items-center gap-3 transition-all hover:opacity-90"
        >
          {/* Logo Icon with Gradient */}
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-background shadow-lg ring-1 ring-primary/20 transition-all group-hover:shadow-primary/25 group-hover:ring-primary/30">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <GraduationCap className="relative h-5 w-5 text-primary transition-transform group-hover:scale-110" />
          </div>

          {/* Brand Text with Improved Typography */}
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-tight tracking-tight bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text">
              EduFlow
            </span>
            <span className="text-[10px] font-medium leading-tight text-muted-foreground tracking-wider uppercase">
              Coaching Platform
            </span>
          </div>

          {/* Premium Badge */}
          <div className="hidden sm:flex ml-2 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary ring-1 ring-primary/20">
            <Sparkles className="h-3 w-3" />
            <span>LMS</span>
          </div>
        </Link>

        {/* ================= NAVIGATION - IMPROVED ================= */}
        <nav className="flex items-center gap-1 sm:gap-2">
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1 mr-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>
            <Link href="/courses">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <BookOpen className="h-4 w-4" />
                Courses
              </Button>
            </Link>
            <Link href="/instructors">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <Users className="h-4 w-4" />
                Instructors
              </Button>
            </Link>
          </div>

          <AnimatedThemeToggler />

          {isLoading ? (
            <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative flex items-center gap-3 rounded-full pl-1 pr-3 hover:bg-muted/80 transition-all"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-primary/20 ring-offset-2 ring-offset-background transition-all group-hover:ring-primary/30">
                    <AvatarImage src={user.avatar || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                      {user.name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:inline text-sm font-medium">
                    {user.name?.split(' ')[0]}
                  </span>
                  <ChevronRight className="hidden lg:block h-4 w-4 rotate-90 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 mt-1">
                <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground border-b">
                  Signed in as <span className="text-foreground">{user.email}</span>
                </div>
                
                <DropdownMenuItem
                  onClick={() => router.push(getDashboardPath())}
                  className="gap-2 cursor-pointer mt-1"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2 text-muted-foreground hover:text-foreground hidden sm:flex"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="sm:hidden"
                >
                  <LogIn className="h-4 w-4" />
                </Button>
              </Link>

              <Link href="/auth/register">
                <Button 
                  size="sm" 
                  className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all"
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Register</span>
                </Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}