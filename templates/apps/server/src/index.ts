import Fastify from 'fastify'
import cors from '@fastify/cors'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import { config } from './config/env'
import { ensureSchema } from './db'
import { createContext } from './trpc/context'
import { appRouter } from './trpc/router'

async function main() {
  const app = Fastify({ logger: true })
  await app.register(cors, { origin: config.APP_URL, credentials: true })
  await app.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: {
      router: appRouter,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createContext: ({ req }: any) => createContext(req),
    },
  })

  await ensureSchema()

  await app.listen({ port: config.SERVER_PORT, host: '0.0.0.0' })
  app.log.info({ port: config.SERVER_PORT, env: config.NODE_ENV, dataStore: config.DATA_STORE }, 'server started')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})


