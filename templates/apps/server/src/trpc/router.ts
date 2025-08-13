import { z } from 'zod'
import * as Contracts from '@contracts/core'
export type { ChatDetail, ChatMessage, ChatSummary, CreateChatInput, SendMessageInput } from '@contracts/core'

import { t } from './context'

export const appRouter = t.router({
  listChats: t.procedure.output(Contracts.ChatSummarySchema.array()).query(async ({ ctx }) => {
    const items = await ctx.store.list()
    return Contracts.ChatSummarySchema.array().parse(items)
  }),
  getChat: t.procedure.input(z.string()).output(Contracts.ChatDetailSchema).query(async ({ ctx, input }) => {
    const detail = await ctx.store.get(input)
    return Contracts.ChatDetailSchema.parse(detail)
  }),
  createChat: t.procedure.input(Contracts.CreateChatInputSchema.optional()).output(Contracts.ChatDetailSchema).mutation(async ({ ctx, input }) => {
    const detail = await ctx.store.create({ title: input?.title })
    if (input?.firstMessage) {
      await ctx.store.addMessage(detail.id, { role: 'user', content: input.firstMessage })
      const assistantText = await ctx.llm.completeChat([
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: input.firstMessage },
      ])
      const withAssistant = await ctx.store.addMessage(detail.id, { role: 'assistant', content: assistantText })
      return Contracts.ChatDetailSchema.parse(withAssistant)
    }
    return Contracts.ChatDetailSchema.parse(detail)
  }),
  sendMessage: t.procedure.input(Contracts.SendMessageInputSchema).output(Contracts.ChatDetailSchema).mutation(async ({ ctx, input }) => {
    const withUser = await ctx.store.addMessage(input.chatId, { role: 'user', content: input.content })
    const history = withUser.messages.map((m) => ({ role: m.role, content: m.content }))
    const assistantText = await ctx.llm.completeChat([{ role: 'system', content: 'You are a helpful assistant.' }, ...history])
    const withAssistant = await ctx.store.addMessage(input.chatId, { role: 'assistant', content: assistantText })
    return Contracts.ChatDetailSchema.parse(withAssistant)
  }),
  deleteChat: t.procedure.input(z.string()).output(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    await ctx.store.remove(input)
    return { id: input }
  }),
})

export type AppRouter = typeof appRouter


