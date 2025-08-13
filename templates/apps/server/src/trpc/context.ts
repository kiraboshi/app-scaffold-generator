import type { FastifyRequest } from 'fastify'
import { initTRPC } from '@trpc/server'
import { config } from '../config/env'
import { getDb } from '../db'
import { MemoryChatStore } from '../store/memory'
import { DbChatStore } from '../store/db'
import { createLLM } from '../llm/openrouter'

export type Context = {
  config: typeof config
  store: MemoryChatStore | DbChatStore
  llm: ReturnType<typeof createLLM>
}

let storeSingleton: MemoryChatStore | DbChatStore | null = null
function getStoreSingleton(): MemoryChatStore | DbChatStore {
  if (!storeSingleton) {
    storeSingleton = config.DATA_STORE === 'db' ? new DbChatStore(getDb()) : new MemoryChatStore()
  }
  return storeSingleton
}

export async function createContext(_req: FastifyRequest): Promise<Context> {
  const llm = createLLM({ apiKey: config.OPENROUTER_API_KEY, model: config.OPENROUTER_MODEL })
  const store = getStoreSingleton()
  return { config, store, llm }
}

export const t = initTRPC.context<Context>().create()


