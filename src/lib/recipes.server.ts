import { createServerOnlyFn } from '@tanstack/solid-start'
import { count, desc, eq, inArray } from 'drizzle-orm'
import db from '~/db'
import { recipeCategories, recipes } from '~/db/cook.schema.ts'
import type { categories } from '~/db/cook.schema.ts'

export type RecipeInput = {
  name: string
  description?: string
  ingredients?: string[]
  steps?: string[]
  imageUrl?: string
  categoryIds?: number[]
}

type CategoryRow = typeof categories.$inferSelect

// 对外暴露的行类型：JSON 字段已解析、附带分类列表
export type RecipeRow = Omit<
  typeof recipes.$inferSelect,
  'ingredients' | 'steps'
> & {
  ingredients: string[] | null
  steps: string[] | null
  categories: CategoryRow[]
}

export type RecipePageResult = {
  items: RecipeRow[]
  total: number
}

const withCategories = {
  recipeCategories: { with: { category: true } },
} as const

function toRow(input: RecipeInput) {
  return {
    name: input.name,
    description: input.description || null,
    ingredients: input.ingredients?.length
      ? JSON.stringify(input.ingredients)
      : null,
    steps: input.steps?.length ? JSON.stringify(input.steps) : null,
    imageUrl: input.imageUrl || null,
  }
}

function parseJsonArray(value: string | null): string[] | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function parseRow<
  T extends { ingredients: string | null; steps: string | null },
>(row: T) {
  return {
    ...row,
    ingredients: parseJsonArray(row.ingredients),
    steps: parseJsonArray(row.steps),
  }
}

function flattenCategories<
  T extends { recipeCategories: { category: CategoryRow }[] },
>(row: T) {
  const { recipeCategories: rc, ...rest } = row
  return { ...rest, categories: rc.map((r) => r.category) }
}

// 分页列表（带分类）
export const getServerRecipePage: (
  page: number,
  size: number,
) => Promise<RecipePageResult> = createServerOnlyFn(
  async (page: number, size: number) => {
    const [rows, totalRows] = await Promise.all([
      db.query.recipes.findMany({
        with: withCategories,
        limit: size,
        offset: (page - 1) * size,
        orderBy: [desc(recipes.id)],
      }),
      db.select({ total: count() }).from(recipes),
    ])

    return {
      items: rows.map((row) => flattenCategories(parseRow(row))),
      total: totalRows[0]?.total ?? 0,
    }
  },
)

export const getServerRecipe: (id: number) => Promise<RecipeRow | null> =
  createServerOnlyFn(async (id: number) => {
    const row = await db.query.recipes.findFirst({
      where: eq(recipes.id, id),
      with: withCategories,
    })

    if (!row) return null
    return flattenCategories(parseRow(row))
  })

// 某个分类下的菜谱（分页）
export const getServerRecipesByCategory: (
  categoryId: number,
  page: number,
  size: number,
) => Promise<RecipePageResult> = createServerOnlyFn(
  async (categoryId: number, page: number, size: number) => {
    const [joinRows, totalRows] = await Promise.all([
      db
        .select({ recipeId: recipeCategories.recipeId })
        .from(recipeCategories)
        .where(eq(recipeCategories.categoryId, categoryId))
        .limit(size)
        .offset((page - 1) * size),
      db
        .select({ total: count() })
        .from(recipeCategories)
        .where(eq(recipeCategories.categoryId, categoryId)),
    ])

    if (!joinRows.length) return { items: [], total: 0 }

    const ids = joinRows.map((r) => r.recipeId)
    const rows = await db.query.recipes.findMany({
      where: inArray(recipes.id, ids),
      with: withCategories,
    })

    const byId = new Map(rows.map((r) => [r.id, r]))
    return {
      items: ids
        .map((id) => byId.get(id))
        .filter((r) => r !== undefined)
        .map((row) => flattenCategories(parseRow(row))),
      total: totalRows[0]?.total ?? 0,
    }
  },
)

export const getServerRandRecipe = createServerOnlyFn(() =>
  db.query.recipes.findFirst({
    orderBy: (_t, { sql }) => sql`RANDOM()`,
  }),
)

export const createServerRecipe = createServerOnlyFn(
  async (input: RecipeInput) => {
    // slug 分两步：先占位保证唯一，再用自增 id 生成正式 slug（与 seed 风格一致）
    const created = await db
      .insert(recipes)
      .values({ ...toRow(input), slug: `tmp-${crypto.randomUUID()}` })
      .returning()
      .get()

    await db
      .update(recipes)
      .set({ slug: `dish-${created.id}` })
      .where(eq(recipes.id, created.id))

    if (input.categoryIds?.length) {
      await db.insert(recipeCategories).values(
        input.categoryIds.map((categoryId) => ({
          recipeId: created.id,
          categoryId,
        })),
      )
    }

    return created.id
  },
)

export const updateServerRecipe = createServerOnlyFn(
  async (id: number, input: RecipeInput) => {
    const existing = await db.query.recipes.findFirst({
      where: eq(recipes.id, id),
    })
    if (!existing) throw new Error('菜谱不存在')

    await db.update(recipes).set(toRow(input)).where(eq(recipes.id, id))

    // 重建分类关联
    await db.delete(recipeCategories).where(eq(recipeCategories.recipeId, id))
    if (input.categoryIds?.length) {
      await db
        .insert(recipeCategories)
        .values(
          input.categoryIds.map((categoryId) => ({ recipeId: id, categoryId })),
        )
    }

    return id
  },
)

export const deleteServerRecipe = createServerOnlyFn(async (id: number) => {
  await db.delete(recipeCategories).where(eq(recipeCategories.recipeId, id))
  await db.delete(recipes).where(eq(recipes.id, id))
  return true
})
