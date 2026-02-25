"use client";

import { useQuery } from "@tanstack/react-query";
import { getMeApi } from "@/lib/api/auth.api";

export const useMe = () => {
  return useQuery({
    queryKey: ["me"],
    queryFn: getMeApi,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
};
