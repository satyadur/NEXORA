import { AuthResponse, User } from "@/types/auth";
import api from "./axios";
import Cookies from "js-cookie";

export const loginApi = async (payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  const res = await api.post("/auth/login", payload);

  Cookies.set("token", res.data.token, { expires: 7 });
  Cookies.set("role", res.data.user.role, { expires: 7 });

  return res.data;
};
export interface RegisterResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export const registerApi = async (
  payload: FormData
): Promise<RegisterResponse> => {
  const res = await api.post("/auth/register", payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};


export const logoutApi = () => {
  Cookies.remove("token");
  Cookies.remove("role");
};

export const getMeApi = async () => {
  const res = await api.get("/auth/me");
  return res.data;
};

export const getAdminStats = async () => {
  const res = await api.get("/admin/stats");
  return res.data;
};

export const getMonthlyGrowth = async () => {
  const res = await api.get("/admin/monthly-growth");
  return res.data;
};

export const getAssignmentPerformance = async () => {
  const res = await api.get("/admin/assignment-performance");
  return res.data;
};


export interface UpdateProfileData {
  name?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  department?: string;
  designation?: string;
  employeeId?: string;
  joiningDate?: string;
  education?: Array<{
    degree: string;
    specialization: string;
    university: string;
    yearOfPassing: string;
    percentage: string;
  }>;
  experience?: Array<{
    company: string;
    position: string;
    duration: string;
  }>;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
  socialLinks?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
    twitter?: string;
  };
}

export interface UpdateProfileResponse {
  message: string;
  user: User;
}

export const getProfileApi = async (): Promise<User> => {
  const res = await api.get("/auth/profile");
  return res.data;
};

export const updateProfileApi = async (
  payload: FormData
): Promise<UpdateProfileResponse> => {
  const res = await api.put("/auth/update", payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const uploadAvatarApi = async (file: File): Promise<{ avatar: string }> => {
  const formData = new FormData();
  formData.append("avatar", file);
  const res = await api.put("/auth/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};