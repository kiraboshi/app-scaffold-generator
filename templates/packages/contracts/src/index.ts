import { z } from 'zod'

export const RoleSchema = z.enum(['user', 'assistant', 'system'])
export type Role = z.infer<typeof RoleSchema>

export const ChatMessageSchema = z.object({
  id: z.string(),
  chatId: z.string(),
  role: RoleSchema,
  content: z.string(),
  createdAt: z.string(),
})
export type ChatMessage = z.infer<typeof ChatMessageSchema>

export const ChatSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type ChatSummary = z.infer<typeof ChatSummarySchema>

export const ChatDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  messages: z.array(ChatMessageSchema),
})
export type ChatDetail = z.infer<typeof ChatDetailSchema>

export const CreateChatInputSchema = z.object({
  title: z.string().min(1).optional(),
  firstMessage: z.string().min(1).optional(),
})
export type CreateChatInput = z.infer<typeof CreateChatInputSchema>

export const SendMessageInputSchema = z.object({
  chatId: z.string(),
  content: z.string().min(1),
})
export type SendMessageInput = z.infer<typeof SendMessageInputSchema>

export class NotFoundError extends Error {}

export interface ChatStore {
  list(): Promise<ChatSummary[]>
  get(id: string): Promise<ChatDetail>
  create(input: { title?: string }): Promise<ChatDetail>
  addMessage(id: string, message: { role: Role; content: string }): Promise<ChatDetail>
  remove(id: string): Promise<{ id: string }>
}


