import { createServerOnlyFn } from '@tanstack/solid-start'
import { asc, count, eq } from 'drizzle-orm'
import db from '~/db'
import { categories, recipeCategories } from '~/db/cook.schema.ts'

export type CategoryRow = typeof categories.$inferSelect

// 分页列表
export const getServerCategoryPage = createServerOnlyFn(
  async (page: number, size: number) => {
    const [items, totalRows] = await Promise.all([
      db.query.categories.findMany({
        limit: size,
        offset: (page - 1) * size,
        orderBy: [asc(categories.id)],
      }),
      db.select({ total: count() }).from(categories),
    ])

    return { items, total: totalRows[0]?.total ?? 0 }
  },
)

export const getServerCategory = createServerOnlyFn(async (id: number) =>
  db.query.categories.findFirst({
    where: eq(categories.id, id),
  }),
)

// 全量分类 + 各自菜谱数（前台分类页、后台表单选择用）
export const listServerCategories = createServerOnlyFn(async () => {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      total: count(recipeCategories.recipeId),
    })
    .from(categories)
    .leftJoin(recipeCategories, eq(recipeCategories.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.id))

  return rows
})

export const createServerCategory = createServerOnlyFn(async (name: string) => {
  // slug 分两步：先占位保证唯一，再用自增 id 生成正式 slug（与 seed 风格一致）
  const created = await db
    .insert(categories)
    .values({ name, slug: `tmp-${crypto.randomUUID()}` })
    .returning()
    .get()

  await db
    .update(categories)
    .set({ slug: `cat-${created.id}` })
    .where(eq(categories.id, created.id))

  return created.id
})

export const updateServerCategory = createServerOnlyFn(
  async (id: number, name: string) => {
    const existing = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    })
    if (!existing) throw new Error('分类不存在')

    await db.update(categories).set({ name }).where(eq(categories.id, id))
    return id
  },
)

export const deleteServerCategory = createServerOnlyFn(async (id: number) => {
  await db.delete(recipeCategories).where(eq(recipeCategories.categoryId, id))
  await db.delete(categories).where(eq(categories.id, id))
  return true
})
