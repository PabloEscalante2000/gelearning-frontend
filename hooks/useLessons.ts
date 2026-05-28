import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type { Lesson } from "@/types";

export function useLesson(courseId: string, moduleId: string, lessonId: string) {
  return useQuery({
    queryKey: ["lesson", courseId, moduleId, lessonId],
    queryFn: async () => {
      const { data } = await apiClient.get<Lesson>(
        `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`
      );
      return data;
    },
    enabled: !!courseId && !!moduleId && !!lessonId,
  });
}

export function useCompleteLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      moduleId,
      lessonId,
    }: {
      courseId: string;
      moduleId: string;
      lessonId: string;
    }) =>
      apiClient.post(
        `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/complete`
      ),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ["course-progress", courseId] });
      queryClient.invalidateQueries({ queryKey: ["course-modules", courseId] });
    },
  });
}
