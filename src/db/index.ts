import { env } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema.ts'

const db = drizzle(env.DB, { schema, logger: import.meta.env.DEV })

export default db
