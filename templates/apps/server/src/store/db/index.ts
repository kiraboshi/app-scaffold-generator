import type { Knex } from 'knex'
import { randomUUID } from 'crypto'
import type { ChatDetail, ChatMessage, ChatStore, ChatSummary, Role } from '@contracts/core'

export class DbChatStore implements ChatStore {
  constructor(private db: Knex) {}

  async list(): Promise<ChatSummary[]> {
    const rows = await this.db('chats').select('*').orderBy('updated_at', 'desc')
    return rows.map(rowToSummary)
  }
  async get(id: string): Promise<ChatDetail> {
    const chat = await this.db('chats').where({ id }).first()
    if (!chat) throw new Error('NotFound')
    const rows = await this.db('messages').where({ chat_id: id }).orderBy('created_at', 'asc')
    return rowToDetail(chat, rows)
  }
  async create(input: { title?: string }): Promise<ChatDetail> {
    const id = randomUUID()
    const [chat] = await this.db('chats')
      .insert({ id, title: input.title ?? 'New Chat' })
      .returning('*')
    return rowToDetail(chat, [])
  }
  async addMessage(id: string, message: { role: Role; content: string }): Promise<ChatDetail> {
    const msgId = randomUUID()
    await this.db.transaction(async (trx: Knex.Transaction) => {
      await trx('messages').insert({ id: msgId, chat_id: id, role: message.role, content: message.content })
      await trx('chats').where({ id }).update({ updated_at: trx.fn.now() })
    })
    return this.get(id)
  }
  async remove(id: string): Promise<{ id: string }> {
    await this.db.transaction(async (trx: Knex.Transaction) => {
      await trx('messages').where({ chat_id: id }).delete()
      await trx('chats').where({ id }).delete()
    })
    return { id }
  }
}

function rowToSummary(row: any): ChatSummary {
  return {
    id: row.id,
    title: row.title,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

function rowToDetail(chatRow: any, messageRows: any[]): ChatDetail {
  const messages: ChatMessage[] = messageRows.map((r) => ({
    id: r.id,
    chatId: r.chat_id,
    role: r.role,
    content: r.content,
    createdAt: new Date(r.created_at).toISOString(),
  }))
  const summary = rowToSummary(chatRow)
  return { ...summary, messages }
}


