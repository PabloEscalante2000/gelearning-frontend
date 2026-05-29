import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type { Course, Module, CourseProgress, Certificate } from "@/types";

export function useCourses() {
  return useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data } = await apiClient.get<Course[]>("/api/v1/courses");
      return data;
    },
  });
}

export function useCourse(courseId: string) {
  return useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const { data } = await apiClient.get<Course>(`/api/v1/courses/${courseId}`);
      return data;
    },
    enabled: !!courseId && courseId !== "0",
  });
}

export function useCourseModules(courseId: string) {
  return useQuery({
    queryKey: ["course-modules", courseId],
    queryFn: async () => {
      const { data } = await apiClient.get<Module[]>(
        `/api/v1/courses/${courseId}/modules`
      );
      return data;
    },
    enabled: !!courseId && courseId !== "0",
  });
}

export function useCourseProgress(courseId: string) {
  return useQuery({
    queryKey: ["course-progress", courseId],
    queryFn: async () => {
      const { data } = await apiClient.get<CourseProgress>(
        `/api/v1/courses/${courseId}/progress`
      );
      return data;
    },
    enabled: !!courseId && courseId !== "0",
  });
}

export function useCourseCertificate(courseId: string) {
  return useQuery({
    queryKey: ["course-certificate", courseId],
    queryFn: async () => {
      const { data } = await apiClient.get<Certificate>(
        `/api/v1/courses/${courseId}/certificate`
      );
      return data;
    },
    enabled: !!courseId && courseId !== "0",
    retry: false,
  });
}

export function useCourseStudents(courseId: string) {
  return useQuery({
    queryKey: ["course-students", courseId],
    queryFn: async () => {
      const { data } = await apiClient.get<import("@/types").User[]>(
        `/api/v1/courses/${courseId}/students`
      );
      return data;
    },
    enabled: !!courseId && courseId !== "0",
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { title: string; description: string; thumbnail_url?: string; status?: string }) =>
      apiClient.post("/api/v1/courses", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, ...payload }: { courseId: string; title?: string; description?: string; thumbnail_url?: string; status?: string }) =>
      apiClient.put(`/api/v1/courses/${courseId}`, payload),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => apiClient.delete(`/api/v1/courses/${courseId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
  });
}

export function useEnrollStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ user_id, course_id }: { user_id: number; course_id: number }) =>
      apiClient.post("/api/v1/enrollments", { user_id, course_id }),
    onSuccess: (_, { course_id }) => {
      queryClient.invalidateQueries({ queryKey: ["course-students", String(course_id)] });
    },
  });
}
