import { relations, sql } from 'drizzle-orm'
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// 分类表
// 注意：时间列用 timestamp_ms + unixepoch 整数默认值（与 auth.schema 一致）。
// 之前用 mode:'timestamp' + CURRENT_TIMESTAMP，SQLite 会存成 TEXT 格式，
// drizzle 按秒读回来变成 Invalid Date。
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
})

// 菜谱表
export const recipes = sqliteTable('recipes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'), // 简介（可选）
  ingredients: text('ingredients'), // 用料（JSON 数组，可选）
  steps: text('steps'), // 步骤（JSON 数组，可选）
  imageUrl: text('image_url'), // 图片 URL（可选）
  createdBy: text('created_by'), // 创建者 user id（关联 Better Auth）
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

// 菜谱-分类 关联表（多对多）
export const recipeCategories = sqliteTable('recipe_categories', {
  recipeId: integer('recipe_id')
    .references(() => recipes.id)
    .notNull(),
  categoryId: integer('category_id')
    .references(() => categories.id)
    .notNull(),
})

// 关联定义（供 db.query 关系查询使用）
export const recipesRelations = relations(recipes, ({ many }) => ({
  recipeCategories: many(recipeCategories),
}))

export const categoriesRelations = relations(categories, ({ many }) => ({
  recipeCategories: many(recipeCategories),
}))

export const recipeCategoriesRelations = relations(recipeCategories, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeCategories.recipeId],
    references: [recipes.id],
  }),
  category: one(categories, {
    fields: [recipeCategories.categoryId],
    references: [categories.id],
  }),
}))
