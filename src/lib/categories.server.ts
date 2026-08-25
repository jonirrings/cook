import db from '~/db'
import { createServerOnlyFn } from '@tanstack/solid-start'
import { categories } from '~/db/cook.schema.ts'
import { eq } from 'drizzle-orm'

export const getTags = createServerOnlyFn((page: number, size: number) =>
  db.query.categories.findMany({
    limit: size,
    offset: (page - 1) * size,
  }),
)

export const getTag = createServerOnlyFn((id: number) =>
  db.query.categories.findFirst({
    where: eq(categories.id, id),
  }),
)
