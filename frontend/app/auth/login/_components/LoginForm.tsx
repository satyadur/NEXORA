"use client";

import { GalleryVerticalEnd } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { loginApi } from "@/lib/api/auth.api";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Role, RoleTabs } from "../../_components/RoleTabs";
import { toast } from "sonner";
import Link from "next/link";

export default function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { redirectByRole } = useAuth();
  const [role, setRole] = useState<Role>("STUDENT");
  // const router = useRouter()
  const { mutate, isPending } = useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      toast.success("Logged in successfully!");
      redirectByRole(data.user.role);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Login failed. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    mutate({
      email: form.get("email") as string,
      password: form.get("password") as string,
    });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <Link href={"/"}>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex size-10 items-center justify-center rounded-md border">
              <GalleryVerticalEnd className="size-6" />
            </div>
            <h1 className="text-xl font-bold">Welcome back</h1>
            <FieldDescription>
              Login as <b>{role.toLowerCase()}</b>
            </FieldDescription>
          </div>
          </Link>

          {/* ROLE TABS */}
          <RoleTabs value={role} onChange={setRole} />

          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input name="email" type="email" required />
          </Field>

          <Field>
            <FieldLabel>Password</FieldLabel>
            <Input name="password" type="password" required />
          </Field>

          <Field>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Logging in..." : "Login"}
            </Button>
          </Field>

          <FieldSeparator>New here?</FieldSeparator>

          <FieldDescription className="text-center">
            <a href="/auth/register" className="underline">
              Create an account
            </a>
          </FieldDescription>
        </FieldGroup>
      </form>
    </div>
  );
}
