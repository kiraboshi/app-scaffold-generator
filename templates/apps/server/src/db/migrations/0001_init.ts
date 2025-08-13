import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('chats', (t) => {
    t.uuid('id').primary().notNullable()
    t.text('title').notNullable().defaultTo('New Chat')
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
  })

  await knex.schema.createTable('messages', (t) => {
    t.uuid('id').primary().notNullable()
    t.uuid('chat_id').notNullable().references('id').inTable('chats').onDelete('CASCADE')
    t.text('role').notNullable()
    t.text('content').notNullable()
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
  })

  await knex.schema.raw(
    "CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id)"
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('messages')
  await knex.schema.dropTableIfExists('chats')
}


