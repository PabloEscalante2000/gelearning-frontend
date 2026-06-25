import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";
import type { StudentSubmission } from "@/types";

export function useMySubmission(lessonId: string) {
  return useQuery({
    queryKey: ["my-submission", lessonId],
    queryFn: async () => {
      const { data } = await apiClient.get<StudentSubmission | null>(
        `/api/v1/lessons/${lessonId}/my-submission`
      );
      return data ?? null;
    },
    enabled: !!lessonId,
  });
}

export function useSubmitAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, file }: { lessonId: string; moduleId: string; courseId: string; file: File }) => {
      const form = new FormData();
      form.append("file", file);
      return apiClient.post<StudentSubmission>(
        `/api/v1/lessons/${lessonId}/submissions`,
        form,
        { headers: { "Content-Type": undefined } }
      );
    },
    onSuccess: (_, { lessonId, moduleId, courseId }) => {
      qc.invalidateQueries({ queryKey: ["my-submission", lessonId] });
      qc.invalidateQueries({ queryKey: ["lesson", moduleId, lessonId] });
      qc.invalidateQueries({ queryKey: ["course-progress", courseId] });
      qc.invalidateQueries({ queryKey: ["course", courseId] });
    },
  });
}

export function useLessonSubmissions(lessonId: string, enabled = false) {
  return useQuery({
    queryKey: ["lesson-submissions", lessonId],
    queryFn: async () => {
      const { data } = await apiClient.get<StudentSubmission[]>(
        `/api/v1/lessons/${lessonId}/submissions`
      );
      return data ?? [];
    },
    enabled: !!lessonId && enabled,
  });
}

export async function downloadSubmission(submission: StudentSubmission) {
  const token = useAuthStore.getState().token;
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  const res = await fetch(
    `${base}/api/v1/submissions/${submission.id}/download`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "*/*" } }
  );
  if (!res.ok) throw new Error("Error al descargar el archivo");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = submission.file_name;
  a.click();
  URL.revokeObjectURL(url);
}
