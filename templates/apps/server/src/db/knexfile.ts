import type { Knex } from 'knex'
import { config as app } from '../config/env'

const knexConfig: Knex.Config = {
  client: 'pg',
  connection: app.DATABASE_URL,
  migrations: {
    extension: 'ts',
    directory: new URL('./migrations', import.meta.url).pathname,
  },
}

export default knexConfig


