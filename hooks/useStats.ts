import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type { AdminStats, InstructorCourseStats } from "@/types";

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data } = await apiClient.get<AdminStats>("/api/v1/admin/stats");
      return data;
    },
  });
}

export function useInstructorStats() {
  return useQuery({
    queryKey: ["instructor-stats"],
    queryFn: async () => {
      const { data } = await apiClient.get<InstructorCourseStats[]>("/api/v1/instructor/stats");
      return data;
    },
  });
}
