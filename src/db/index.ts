import { env } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema.ts'

const db = drizzle(env.DB, { schema, logger: true })

export default db
