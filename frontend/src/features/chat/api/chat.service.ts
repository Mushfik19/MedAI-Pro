import {
  chatConversationSchema,
  chatConversationSummarySchema,
  chatStreamCompletionSchema,
} from "@/features/chat/api/chat.schemas"
import { apiClient, createIdempotencyKey } from "@/lib/api"
import { createEnvelopeSchema, parseResponse } from "@/lib/api/parseResponse"

const conversationListSchema = createEnvelopeSchema(
  chatConversationSummarySchema.array(),
)

function validateCompletedEvent(stream: string): void {
  const blocks = stream.split(/\r?\n\r?\n/)
  const completionBlock = blocks.find((block) =>
    block.includes("event: message.completed"),
  )
  if (!completionBlock) {
    throw new Error("The chat stream ended before completion.")
  }
  const dataLine = completionBlock
    .split(/\r?\n/)
    .find((line) => line.startsWith("data:"))
  if (!dataLine) {
    throw new Error("The chat completion payload is missing.")
  }
  chatStreamCompletionSchema.parse(JSON.parse(dataLine.slice(5).trim()))
}

export const chatService = {
  async listConversations() {
    const response = await apiClient.get("/chat/conversations")
    return parseResponse(conversationListSchema, response.data).data
  },

  async getConversation(id: string) {
    const response = await apiClient.get(`/chat/conversations/${id}`)
    return parseResponse(
      createEnvelopeSchema(chatConversationSchema),
      response.data,
    ).data
  },

  async createConversation() {
    const response = await apiClient.post(
      "/chat/conversations",
      { prediction_id: null },
      { headers: { "Idempotency-Key": createIdempotencyKey() } },
    )
    return parseResponse(
      createEnvelopeSchema(chatConversationSummarySchema),
      response.data,
    ).data
  },

  async sendMessage({
    content,
    conversationId,
  }: {
    content: string
    conversationId: string
  }): Promise<void> {
    const response = await apiClient.post(
      `/chat/conversations/${conversationId}/messages`,
      { client_message_id: createIdempotencyKey(), content },
      {
        headers: {
          Accept: "text/event-stream",
          "Idempotency-Key": createIdempotencyKey(),
        },
        responseType: "text",
      },
    )
    validateCompletedEvent(response.data as string)
  },
}
