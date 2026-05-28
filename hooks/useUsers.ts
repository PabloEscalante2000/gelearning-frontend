import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type { User, Invitation, PaginatedResponse } from "@/types";

export function useUsers(page = 1) {
  return useQuery({
    queryKey: ["users", page],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<User>>(
        `/admin/users?page=${page}`
      );
      return data;
    },
  });
}

export function useInvitations() {
  return useQuery({
    queryKey: ["invitations"],
    queryFn: async () => {
      const { data } = await apiClient.get<Invitation[]>(`/admin/invitations`);
      return data;
    },
  });
}

export function useSendInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { email: string; role: string }) =>
      apiClient.post(`/admin/invitations`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) =>
      apiClient.patch(`/admin/users/${userId}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
