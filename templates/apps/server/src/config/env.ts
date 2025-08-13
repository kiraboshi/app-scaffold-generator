import 'dotenv/config'
import { z } from 'zod'

const EnvSchema = z.object({
  DATABASE_URL: z.string().url().default('postgres://postgres:postgres@localhost:5432/__DB_NAME__'),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default('openrouter/auto'),
  SERVER_PORT: z.coerce.number().default(8787),
  APP_URL: z.string().url().default('http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATA_STORE: z.enum(['memory', 'db']).default('memory'),
})

export type AppConfig = z.infer<typeof EnvSchema>

export const config: AppConfig = EnvSchema.parse(process.env)


