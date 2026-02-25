import Cookies from "js-cookie";
import { UserRole } from "@/types/auth";

export const getUserRole = (): UserRole | null => {
  return Cookies.get("role") as UserRole | null;
};
