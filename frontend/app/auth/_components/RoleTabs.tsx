"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type Role = "ADMIN" | "TEACHER" | "STUDENT";

interface RoleTabsProps {
  value: Role;
  onChange: (role: Role) => void;
}

export function RoleTabs({ value, onChange }: RoleTabsProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as Role)}>
      <TabsList className="grid grid-cols-3 w-full">
        <TabsTrigger value="STUDENT">Student</TabsTrigger>
        <TabsTrigger value="TEACHER">Teacher</TabsTrigger>
        <TabsTrigger value="ADMIN">Admin</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
