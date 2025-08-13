import { randomUUID } from 'crypto'
import type { ChatDetail, ChatMessage, ChatStore, ChatSummary, Role } from '@contracts/core'

function nowIso(): string {
  return new Date().toISOString()
}

export class MemoryChatStore implements ChatStore {
  private chats = new Map<string, ChatDetail>()

  async list(): Promise<ChatSummary[]> {
    return Array.from(this.chats.values())
      .map((c) => ({ id: c.id, title: c.title, createdAt: c.createdAt, updatedAt: c.updatedAt }))
      .sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : 1))
  }
  async get(id: string): Promise<ChatDetail> {
    const c = this.chats.get(id)
    if (!c) throw new Error('NotFound')
    return c
  }
  async create(input: { title?: string }): Promise<ChatDetail> {
    const id = randomUUID()
    const now = nowIso()
    const detail: ChatDetail = { id, title: input.title ?? 'New Chat', createdAt: now, updatedAt: now, messages: [] }
    this.chats.set(id, detail)
    return detail
  }
  async addMessage(id: string, message: { role: Role; content: string }): Promise<ChatDetail> {
    const cur = await this.get(id)
    const msg: ChatMessage = {
      id: randomUUID(),
      chatId: id,
      role: message.role,
      content: message.content,
      createdAt: nowIso(),
    }
    const next: ChatDetail = { ...cur, messages: [...cur.messages, msg], updatedAt: msg.createdAt }
    this.chats.set(id, next)
    return next
  }
  async remove(id: string): Promise<{ id: string }> {
    this.chats.delete(id)
    return { id }
  }
}


