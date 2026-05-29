import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type { ForumThread } from "@/types";

// Base path: /api/v1/courses/{courseId}/forum/threads
const threadBase = (courseId: string) =>
  `/api/v1/courses/${courseId}/forum/threads`;

export function useForumThreads(courseId: string) {
  return useQuery({
    queryKey: ["forum-threads", courseId],
    queryFn: async () => {
      const { data } = await apiClient.get<ForumThread[]>(threadBase(courseId));
      return data;
    },
    enabled: !!courseId && courseId !== "0",
  });
}

// Thread detail includes replies[] directly
export function useForumThread(courseId: string, threadId: string) {
  return useQuery({
    queryKey: ["forum-thread", courseId, threadId],
    queryFn: async () => {
      const { data } = await apiClient.get<ForumThread>(
        `${threadBase(courseId)}/${threadId}`
      );
      return data;
    },
    enabled: !!courseId && courseId !== "0" && !!threadId && threadId !== "0",
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
    }) => apiClient.post(threadBase(courseId), { title, body }),
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
    }) =>
      apiClient.post(
        `${threadBase(courseId)}/${threadId}/replies`,
        { body }
      ),
    onSuccess: (_, { courseId, threadId }) => {
      queryClient.invalidateQueries({ queryKey: ["forum-thread", courseId, threadId] });
    },
  });
}

export function useEditReply() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ replyId, body }: { replyId: number; body: string; courseId: string; threadId: string }) =>
      apiClient.put(`/api/v1/replies/${replyId}`, { body }),
    onSuccess: (_, { courseId, threadId }) => {
      queryClient.invalidateQueries({ queryKey: ["forum-thread", courseId, threadId] });
    },
  });
}

export function useDeleteReply() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ replyId }: { replyId: number; courseId: string; threadId: string }) =>
      apiClient.delete(`/api/v1/replies/${replyId}`),
    onSuccess: (_, { courseId, threadId }) => {
      queryClient.invalidateQueries({ queryKey: ["forum-thread", courseId, threadId] });
    },
  });
}

export function usePinThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, threadId }: { courseId: string; threadId: string }) =>
      apiClient.patch(`${threadBase(courseId)}/${threadId}/pin`),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ["forum-threads", courseId] });
    },
  });
}

export function useCloseThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, threadId }: { courseId: string; threadId: string }) =>
      apiClient.patch(`${threadBase(courseId)}/${threadId}/close`),
    onSuccess: (_, { courseId, threadId }) => {
      queryClient.invalidateQueries({ queryKey: ["forum-thread", courseId, threadId] });
    },
  });
}
