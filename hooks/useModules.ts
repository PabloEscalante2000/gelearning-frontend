import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type { Module } from "@/types";

export function useModules(courseId: string) {
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

export function useCreateModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      title,
      description,
      order,
    }: {
      courseId: string;
      title: string;
      description?: string;
      order?: number;
    }) =>
      apiClient.post(`/api/v1/courses/${courseId}/modules`, {
        title,
        description,
        order,
      }),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ["course-modules", courseId] });
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
    },
  });
}

export function useUpdateModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      moduleId,
      title,
      description,
    }: {
      courseId: string;
      moduleId: number;
      title: string;
      description?: string;
    }) =>
      apiClient.put(`/api/v1/courses/${courseId}/modules/${moduleId}`, {
        title,
        description,
      }),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ["course-modules", courseId] });
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
    },
  });
}

export function useDeleteModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      moduleId,
    }: {
      courseId: string;
      moduleId: number;
    }) =>
      apiClient.delete(`/api/v1/courses/${courseId}/modules/${moduleId}`),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ["course-modules", courseId] });
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
    },
  });
}
