import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type { User, Invitation } from "@/types";

export function useUsers(role?: string) {
  return useQuery({
    queryKey: ["users", role],
    queryFn: async () => {
      const params = role ? `?role=${role}` : "";
      const { data } = await apiClient.get<User[]>(`/api/v1/admin/users${params}`);
      return data;
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      name: string;
      email: string;
      password: string;
      role: string;
    }) => apiClient.post("/api/v1/admin/users", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      ...payload
    }: {
      userId: number;
      name?: string;
      email?: string;
      password?: string | null;
      role?: string;
    }) => apiClient.put(`/api/v1/admin/users/${userId}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => apiClient.delete(`/api/v1/admin/users/${userId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

// ── Invitations ───────────────────────────────────────────────────────────────

export function useInvitations(courseId?: string | number) {
  return useQuery({
    queryKey: ["invitations", courseId],
    queryFn: async () => {
      const params = courseId ? `?course_id=${courseId}` : "";
      const { data } = await apiClient.get<Invitation[]>(`/api/v1/invitations${params}`);
      return data;
    },
    enabled: !!courseId,
  });
}

export function useSendInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { email: string; course_id: number }) =>
      apiClient.post("/api/v1/invitations", payload),
    onSuccess: (_, { course_id }) => {
      queryClient.invalidateQueries({ queryKey: ["invitations", course_id] });
    },
  });
}
