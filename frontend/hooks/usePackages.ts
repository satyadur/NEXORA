import { useQuery } from "@tanstack/react-query";
import { getPackagesApi } from "@/lib/api/public.api";

export const packageKeys = {
  all: ["packages"] as const,
  lists: () => [...packageKeys.all, "list"] as const,
  list: (filters: any) => [...packageKeys.lists(), filters] as const,
};

export const usePackages = () => {
  return useQuery({
    queryKey: packageKeys.lists(),
    queryFn: getPackagesApi,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};