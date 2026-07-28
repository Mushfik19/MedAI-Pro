import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { chatService } from "@/features/chat/api/chat.service"

export const chatKeys = {
  all: ["chat"] as const,
  conversations: ["chat", "conversations"] as const,
  conversation: (id: string) => ["chat", "conversations", id] as const,
}

export function useConversationsQuery() {
  return useQuery({
    queryKey: chatKeys.conversations,
    queryFn: chatService.listConversations,
  })
}

export function useConversationQuery(id: string | null) {
  return useQuery({
    queryKey: chatKeys.conversation(id ?? "none"),
    queryFn: () => chatService.getConversation(id!),
    enabled: Boolean(id),
  })
}

export function useCreateConversationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: chatService.createConversation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: chatKeys.conversations })
    },
  })
}

export function useSendMessageMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: chatService.sendMessage,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: chatKeys.conversation(variables.conversationId),
      })
      await queryClient.invalidateQueries({ queryKey: chatKeys.conversations })
    },
  })
}
