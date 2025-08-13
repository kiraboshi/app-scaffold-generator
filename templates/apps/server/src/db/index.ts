import knex, { Knex } from 'knex'
import { config } from '../config/env'
import knexConfig from './knexfile'

let knexInstance: Knex | null = null

export function getDb(): Knex {
  if (!knexInstance) {
    knexInstance = knex(knexConfig)
  }
  return knexInstance
}

export async function destroyDb(): Promise<void> {
  if (knexInstance) {
    await knexInstance.destroy()
    knexInstance = null
  }
}

export async function ensureSchema(): Promise<void> {
  if (config.DATA_STORE !== 'db') return
  const db = getDb()
  await db.migrate.latest()
}


