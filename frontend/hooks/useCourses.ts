import { useQuery } from "@tanstack/react-query";
import { getCoursesApi } from "@/lib/api/public.api";

export const courseKeys = {
  all: ["courses"] as const,
  lists: () => [...courseKeys.all, "list"] as const,
  list: (filters: any) => [...courseKeys.lists(), filters] as const,
  details: () => [...courseKeys.all, "detail"] as const,
  detail: (id: string) => [...courseKeys.details(), id] as const,
};

export const useCourses = (params?: {
  department?: string;
  level?: string;
  page?: number;
  limit?: number;
  status?: string;
}) => {
  return useQuery({
    queryKey: courseKeys.list(params || {}),
    queryFn: () => getCoursesApi(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};