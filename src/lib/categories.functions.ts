// Export createServerFn wrappers, safe to import anywhere
import { createServerFn } from '@tanstack/solid-start'
import {
  createServerCategory,
  deleteServerCategory,
  getServerCategory,
  getServerCategoryPage,
  listServerCategories,
  updateServerCategory,
} from './categories.server'
import { ensureSession } from './auth.functions'
import {
  categoryCreateSchema,
  categoryIdSchema,
  categoryUpdateSchema,
  paginationSchema,
  parseWithMessage,
} from './schemas'

// 分页列表（后台用）
export const listCategories = createServerFn({ method: 'GET' })
  .validator((input: unknown) => parseWithMessage(paginationSchema, input))
  .handler(async ({ data }) => {
    return await getServerCategoryPage(data.page, data.size)
  })

// 全量分类 + 菜谱数（前台分类页、后台表单选择用）
export const listAllCategories = createServerFn({ method: 'GET' }).handler(
  listServerCategories,
)

export const getCategory = createServerFn({ method: 'GET' })
  .validator((input: unknown) => parseWithMessage(categoryIdSchema, input))
  .handler(async ({ data }) => {
    return await getServerCategory(data.id)
  })

// ---- 后台写操作 ----

export const createCategory = createServerFn({ method: 'POST' })
  .validator((input: unknown) => parseWithMessage(categoryCreateSchema, input))
  .handler(async ({ data }) => {
    await ensureSession()
    return await createServerCategory(data.name)
  })

export const updateCategory = createServerFn({ method: 'POST' })
  .validator((input: unknown) => parseWithMessage(categoryUpdateSchema, input))
  .handler(async ({ data }) => {
    await ensureSession()
    return await updateServerCategory(data.id, data.name)
  })

export const deleteCategory = createServerFn({ method: 'POST' })
  .validator((input: unknown) => parseWithMessage(categoryIdSchema, input))
  .handler(async ({ data }) => {
    await ensureSession()
    return await deleteServerCategory(data.id)
  })
