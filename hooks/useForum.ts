import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type { ForumThread, ForumReply, PaginatedResponse } from "@/types";

export function useForumThreads(courseId: string) {
  return useQuery({
    queryKey: ["forum-threads", courseId],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<ForumThread>>(
        `/courses/${courseId}/forum`
      );
      return data;
    },
    enabled: !!courseId,
  });
}

export function useForumThread(courseId: string, threadId: string) {
  return useQuery({
    queryKey: ["forum-thread", courseId, threadId],
    queryFn: async () => {
      const { data } = await apiClient.get<ForumThread>(
        `/courses/${courseId}/forum/${threadId}`
      );
      return data;
    },
    enabled: !!courseId && !!threadId,
  });
}

export function useForumReplies(courseId: string, threadId: string) {
  return useQuery({
    queryKey: ["forum-replies", courseId, threadId],
    queryFn: async () => {
      const { data } = await apiClient.get<ForumReply[]>(
        `/courses/${courseId}/forum/${threadId}/replies`
      );
      return data;
    },
    enabled: !!courseId && !!threadId,
  });
}

export function useCreateThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      title,
      body,
    }: {
      courseId: string;
      title: string;
      body: string;
    }) => apiClient.post(`/courses/${courseId}/forum`, { title, body }),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ["forum-threads", courseId] });
    },
  });
}

export function useCreateReply() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      threadId,
      body,
    }: {
      courseId: string;
      threadId: string;
      body: string;
    }) => apiClient.post(`/courses/${courseId}/forum/${threadId}/replies`, { body }),
    onSuccess: (_, { courseId, threadId }) => {
      queryClient.invalidateQueries({ queryKey: ["forum-replies", courseId, threadId] });
    },
  });
}
