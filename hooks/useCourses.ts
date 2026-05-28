import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type { Course, Module, CourseProgress, PaginatedResponse } from "@/types";

export function useCourses(page = 1) {
  return useQuery({
    queryKey: ["courses", page],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Course>>(
        `/courses?page=${page}`
      );
      return data;
    },
  });
}

export function useCourse(courseId: number | string) {
  return useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const { data } = await apiClient.get<Course>(`/courses/${courseId}`);
      return data;
    },
    enabled: !!courseId,
  });
}

export function useCourseModules(courseId: number | string) {
  return useQuery({
    queryKey: ["course-modules", courseId],
    queryFn: async () => {
      const { data } = await apiClient.get<Module[]>(`/courses/${courseId}/modules`);
      return data;
    },
    enabled: !!courseId,
  });
}

export function useCourseProgress(courseId: number | string) {
  return useQuery({
    queryKey: ["course-progress", courseId],
    queryFn: async () => {
      const { data } = await apiClient.get<CourseProgress>(
        `/courses/${courseId}/progress`
      );
      return data;
    },
    enabled: !!courseId,
  });
}

export function useEnrollCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: number) =>
      apiClient.post(`/courses/${courseId}/enroll`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}
