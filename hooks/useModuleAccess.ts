import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";

export function useModuleAccess(courseId: string, userId: string) {
  return useQuery({
    queryKey: ["module-access", courseId, userId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ module_ids: number[] }>(
        `/api/v1/admin/courses/${courseId}/students/${userId}/module-access`
      );
      return data as { module_ids: number[] };
    },
    enabled: !!courseId && !!userId,
  });
}

export function useUpdateModuleAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      userId,
      moduleIds,
    }: {
      courseId: string;
      userId: string;
      moduleIds: number[];
    }) =>
      apiClient.put(
        `/api/v1/admin/courses/${courseId}/students/${userId}/module-access`,
        { module_ids: moduleIds }
      ),
    onSuccess: (_, { courseId, userId }) => {
      qc.invalidateQueries({ queryKey: ["module-access", courseId, userId] });
    },
  });
}
