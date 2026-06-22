import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type { Lesson } from "@/types";

export function useModuleLessons(moduleId: string) {
  return useQuery({
    queryKey: ["module-lessons", moduleId],
    queryFn: async () => {
      const { data } = await apiClient.get<Lesson[]>(
        `/api/v1/modules/${moduleId}/lessons`
      );
      return data;
    },
    enabled: !!moduleId && moduleId !== "0",
  });
}

export function useLesson(moduleId: string, lessonId: string) {
  return useQuery({
    queryKey: ["lesson", moduleId, lessonId],
    queryFn: async () => {
      const { data } = await apiClient.get<Lesson>(
        `/api/v1/modules/${moduleId}/lessons/${lessonId}`
      );
      return data;
    },
    enabled: !!moduleId && moduleId !== "0" && !!lessonId && lessonId !== "0",
  });
}

export function useCompleteLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId }: { lessonId: string; courseId: string }) =>
      apiClient.post(`/api/v1/lessons/${lessonId}/complete`),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ["course-progress", courseId] });
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
    },
  });
}

export function useCreateLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      moduleId,
      courseId: _courseId,
      ...payload
    }: {
      moduleId: string;
      courseId: string;
      title: string;
      type: string;
      content_url: string;
      duration_minutes?: number | null;
      order?: number;
      is_published?: boolean;
      scheduled_at?: string | null;
    }) => apiClient.post(`/api/v1/modules/${moduleId}/lessons`, payload),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["course-modules", courseId] });
    },
  });
}

export function useUpdateLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      moduleId,
      lessonId,
      courseId: _courseId,
      ...payload
    }: {
      moduleId: string;
      lessonId: number;
      courseId: string;
      title?: string;
      type?: string;
      content_url?: string;
      duration_minutes?: number | null;
      is_published?: boolean;
      scheduled_at?: string | null;
    }) =>
      apiClient.put(
        `/api/v1/modules/${moduleId}/lessons/${lessonId}`,
        payload
      ),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["course-modules", courseId] });
    },
  });
}

export function useDeleteLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      moduleId,
      lessonId,
    }: {
      moduleId: string;
      lessonId: number;
      courseId: string;
    }) =>
      apiClient.delete(`/api/v1/modules/${moduleId}/lessons/${lessonId}`),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["course-modules", courseId] });
    },
  });
}

export function useReorderLessons() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      moduleId,
      lessons,
    }: {
      moduleId: string;
      lessons: { id: number; order: number }[];
    }) =>
      apiClient.patch(`/api/v1/modules/${moduleId}/lessons/reorder`, {
        lessons,
      }),
    onSuccess: (_, { moduleId }) =>
      queryClient.invalidateQueries({ queryKey: ["module-lessons", moduleId] }),
  });
}
