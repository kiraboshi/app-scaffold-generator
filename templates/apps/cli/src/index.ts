#!/usr/bin/env node
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from '@__SCOPE__/server'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

type CliContext = {
  baseUrl: string
}

function createClient(ctx: CliContext) {
  return createTRPCClient<AppRouter>({
    links: [httpBatchLink({ url: `${ctx.baseUrl}/trpc` })],
  })
}

async function main(argv: string[]) {
  const args = await yargs(hideBin(argv))
    .scriptName('trpc-cli')
    .usage('$0 <cmd> [args]')
    .option('url', {
      type: 'string',
      default: process.env.APP_URL ?? 'http://localhost:5173',
      describe: 'Base URL of the web app (used to reach /trpc via proxy). If calling server directly, set to server URL',
    })
    .command(
      'list',
      'List chats',
      (y) => y,
      async (argv2) => {
        const ctx: CliContext = { baseUrl: String(argv2.url) }
        const client = createClient(ctx)
        const items = await client.listChats.query()
        for (const c of items) console.log(`${c.id}\t${c.title ?? ''}`)
      }
    )
    .command(
      'get <id>',
      'Get a chat by id',
      (y) => y.positional('id', { type: 'string', demandOption: true }),
      async (argv2) => {
        const ctx: CliContext = { baseUrl: String(argv2.url) }
        const client = createClient(ctx)
        const detail = await client.getChat.query(String(argv2.id))
        console.log(JSON.stringify(detail, null, 2))
      }
    )
    .command(
      'create [title] [firstMessage]',
      'Create a chat; optionally send first message to get assistant reply',
      (y) =>
        y
          .positional('title', { type: 'string', describe: 'Title for the chat' })
          .positional('firstMessage', { type: 'string', describe: 'First user message' }),
      async (argv2) => {
        const ctx: CliContext = { baseUrl: String(argv2.url) }
        const client = createClient(ctx)
        const detail = await client.createChat.mutate({
          title: argv2.title as string | undefined,
          firstMessage: argv2.firstMessage as string | undefined,
        })
        console.log(JSON.stringify(detail, null, 2))
      }
    )
    .command(
      'send <chatId> <content>',
      'Send a message to a chat and print updated chat',
      (y) => y.positional('chatId', { type: 'string', demandOption: true }).positional('content', { type: 'string', demandOption: true }),
      async (argv2) => {
        const ctx: CliContext = { baseUrl: String(argv2.url) }
        const client = createClient(ctx)
        const detail = await client.sendMessage.mutate({ chatId: String(argv2.chatId), content: String(argv2.content) })
        console.log(JSON.stringify(detail, null, 2))
      }
    )
    .command(
      'delete <id>',
      'Delete a chat by id',
      (y) => y.positional('id', { type: 'string', demandOption: true }),
      async (argv2) => {
        const ctx: CliContext = { baseUrl: String(argv2.url) }
        const client = createClient(ctx)
        const res = await client.deleteChat.mutate(String(argv2.id))
        console.log(JSON.stringify(res, null, 2))
      }
    )
    .demandCommand(1)
    .help().argv

  return args
}

main(process.argv)
  .then(() => {})
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })


