import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type { PaymentPreference, PaymentStatusResponse } from "@/types";

export function useCreatePaymentPreference() {
  return useMutation({
    mutationFn: async (courseId: number) => {
      const { data } = await apiClient.post<PaymentPreference>(
        `/api/v1/courses/${courseId}/payment`
      );
      return data;
    },
  });
}

export function usePaymentStatus(paymentId: string | null, mpId?: string | null) {
  return useQuery({
    queryKey: ["payment-status", paymentId, mpId],
    queryFn: async () => {
      const params = mpId ? `?mp_id=${mpId}` : "";
      const { data } = await apiClient.get<PaymentStatusResponse>(
        `/api/v1/payments/${paymentId}/status${params}`
      );
      return data;
    },
    enabled: !!paymentId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "approved" || status === "rejected" || status === "cancelled") {
        return false;
      }
      return 3000;
    },
  });
}
