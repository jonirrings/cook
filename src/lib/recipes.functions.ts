// Export createServerFn wrappers, safe to import anywhere
import { createServerFn } from '@tanstack/solid-start'
import {
  createServerRecipe,
  deleteServerRecipe,
  getServerRandRecipe,
  getServerRecipe,
  getServerRecipePage,
  getServerRecipesByCategory,
  updateServerRecipe,
} from './recipes.server'
import { ensureSession } from './auth.functions'
import {
  categoryRecipesQuerySchema,
  paginationSchema,
  parseWithMessage,
  recipeCreateSchema,
  recipeIdSchema,
  recipeUpdateSchema,
} from './schemas'

// 随机一道菜（首页"随便看看"用）
export const getRandRecipe = createServerFn().handler(getServerRandRecipe)

// 分页列表（前台 + 后台共用）
export const listRecipes = createServerFn({ method: 'GET' })
  .validator((input: unknown) => parseWithMessage(paginationSchema, input))
  .handler(async ({ data }) => {
    return await getServerRecipePage(data.page, data.size)
  })

export const getRecipe = createServerFn({ method: 'GET' })
  .validator((input: unknown) => parseWithMessage(recipeIdSchema, input))
  .handler(async ({ data }) => {
    return await getServerRecipe(data.id)
  })

// 某个分类下的菜谱（分页）
export const listRecipesByCategory = createServerFn({ method: 'GET' })
  .validator((input: unknown) =>
    parseWithMessage(categoryRecipesQuerySchema, input),
  )
  .handler(async ({ data }) => {
    return await getServerRecipesByCategory(data.id, data.page, data.size)
  })

// ---- 后台写操作 ----

export const createRecipe = createServerFn({ method: 'POST' })
  .validator((input: unknown) => parseWithMessage(recipeCreateSchema, input))
  .handler(async ({ data }) => {
    await ensureSession()
    return await createServerRecipe(data)
  })

export const updateRecipe = createServerFn({ method: 'POST' })
  .validator((input: unknown) => parseWithMessage(recipeUpdateSchema, input))
  .handler(async ({ data }) => {
    await ensureSession()
    const { id, ...input } = data
    return await updateServerRecipe(id, input)
  })

export const deleteRecipe = createServerFn({ method: 'POST' })
  .validator((input: unknown) => parseWithMessage(recipeIdSchema, input))
  .handler(async ({ data }) => {
    await ensureSession()
    return await deleteServerRecipe(data.id)
  })
