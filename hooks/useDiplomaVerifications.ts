import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type { DiplomaVerification } from "@/types";

// Separate client for the public verify endpoint — no auth interceptor so it
// never redirects unauthenticated visitors to /login/
const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});
publicApi.interceptors.response.use((res) => {
  if (res.data && typeof res.data === "object" && "data" in res.data && "success" in res.data) {
    res.data = res.data.data;
  }
  return res;
});

export function useDiplomaVerifications() {
  return useQuery({
    queryKey: ["diploma-verifications"],
    queryFn: async () => {
      const { data } = await apiClient.get<DiplomaVerification[]>(
        "/api/v1/admin/diploma-verifications"
      );
      return data;
    },
  });
}

export function useCreateDiplomaVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      student_name: string;
      student_document?: string;
      course_id: number;
      issued_at: string;
    }) => {
      const { data } = await apiClient.post<DiplomaVerification>(
        "/api/v1/admin/diploma-verifications",
        payload
      );
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["diploma-verifications"] }),
  });
}

export function useVerifyDiploma(code: string) {
  return useQuery({
    queryKey: ["diploma-verify", code],
    queryFn: async () => {
      const { data } = await publicApi.get<DiplomaVerification>(
        `/api/v1/diploma-verifications/${code}`
      );
      return data;
    },
    enabled: !!code,
    retry: false,
  });
}
