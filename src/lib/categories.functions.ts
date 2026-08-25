// Export createServerFn wrappers, safe to import anywhere
import { createServerFn } from '@tanstack/solid-start'
import { ensureSession } from './auth.functions'
import db from '~/db'
import { categories } from '~/db/cook.schema.ts'

type InsertCat = typeof categories.$inferInsert

export const createPost = createServerFn({ method: 'POST' })
  .validator((data: InsertCat) => data)
  .handler(async ({ data }) => {
    await ensureSession()

    return await db.insert(categories).values({
      name: data.name,
      slug: data.slug,
    }).returning()
  })
