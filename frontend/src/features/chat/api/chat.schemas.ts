import { z } from "zod"

export const chatMessageSchema = z.object({
  id: z.uuid(),
  role: z.enum(["USER", "ASSISTANT"]),
  content: z.string().min(1),
  created_at: z.iso.datetime(),
  safety_flags: z.array(z.string()),
  grounding_references: z.array(
    z.object({
      label: z.string().min(1),
      source_type: z.string().min(1),
    }),
  ),
})

export const chatConversationSummarySchema = z.object({
  id: z.uuid(),
  title: z.string().min(1),
  updated_at: z.iso.datetime(),
  message_count: z.number().int().nonnegative(),
  prediction_id: z.uuid().nullable(),
})

export const chatConversationSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1),
  prediction_id: z.uuid().nullable(),
  messages: z.array(chatMessageSchema),
})

export const chatStreamCompletionSchema = z.object({
  message_id: z.uuid(),
  safety_flags: z.array(z.string()),
  grounding_references: z.array(
    z.object({
      label: z.string().min(1),
      source_type: z.string().min(1),
    }),
  ),
})

export const chatMessageFormSchema = z.object({
  content: z.string().trim().min(1, "Enter a message.").max(4000),
})

export type ChatConversationSummary = z.infer<typeof chatConversationSummarySchema>
export type ChatMessageForm = z.infer<typeof chatMessageFormSchema>
