import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type { User, Enrollment } from "@/types";

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
    mutationFn: (payload: { name: string; email: string; password: string; role: string }) =>
      apiClient.post("/api/v1/admin/users", payload),
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

export function useUserEnrollments(userId?: number) {
  return useQuery({
    queryKey: ["user-enrollments", userId],
    queryFn: async () => {
      const { data } = await apiClient.get<Enrollment[]>(
        `/api/v1/admin/users/${userId}/enrollments`
      );
      return data;
    },
    enabled: !!userId,
  });
}

export function useEnrollUserInCourse(userId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: number) =>
      apiClient.post("/api/v1/enrollments", { user_id: userId, course_id: courseId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-enrollments", userId] });
    },
  });
}

export function useUnenrollUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ enrollmentId }: { enrollmentId: number; userId: number }) =>
      apiClient.delete(`/api/v1/enrollments/${enrollmentId}`),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["user-enrollments", userId] });
    },
  });
}
