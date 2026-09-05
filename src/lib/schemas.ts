// shared zod schema on both server and client side
import { z } from 'zod'

export const signUpSchema = z.object({
  name: z.string().min(1, '请输入昵称').max(32, '昵称最多 32 个字符'),
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(8, '密码至少 8 位').max(128, '密码最多 128 位'),
})

export const signInSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '请输入密码'),
})

export const forgetPasswordSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, '缺少重置令牌'),
  newPassword: z.string().min(8, '密码至少 8 位').max(128, '密码最多 128 位'),
})

export const deleteAccountSchema = z.object({
  password: z.string().min(1, '请输入密码'),
})

// ---- recipes / categories ----

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(12),
})

// 路由 search 参数版：非法值（缺省/乱填）静默回退默认，而不是报错
export const paginationSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  size: z.coerce.number().int().min(1).max(100).catch(12),
})

// 作为 search 类型时字段可选，避免 Link/navigate 强制要求传分页参数
export type PaginationSearch = { page?: number; size?: number }

export const recipeInputSchema = z.object({
  name: z.string().min(1, '请输入菜名').max(100, '菜名最多 100 个字符'),
  description: z.string().max(2000, '简介最多 2000 个字符').optional(),
  ingredients: z.array(z.string().min(1, '用料不能为空行')).max(100).optional(),
  steps: z.array(z.string().min(1, '步骤不能为空行')).max(100).optional(),
  imageUrl: z
    .union([z.literal(''), z.string().url('图片地址格式不正确')])
    .optional(),
  categoryIds: z.array(z.number().int().positive()).max(50).optional(),
})

export const recipeCreateSchema = recipeInputSchema

// 更新传全量字段（与后台表单一致），避免误把未传字段清空
export const recipeUpdateSchema = recipeInputSchema.extend({
  id: z.number().int().positive(),
})

export const recipeIdSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const categoryCreateSchema = z.object({
  name: z.string().min(1, '请输入分类名').max(50, '分类名最多 50 个字符'),
})

export const categoryUpdateSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1, '请输入分类名').max(50, '分类名最多 50 个字符'),
})

export const categoryIdSchema = z.object({
  id: z.coerce.number().int().positive(),
})

// 按分类查菜谱（分页）
export const categoryRecipesQuerySchema = paginationSchema.extend({
  id: z.coerce.number().int().positive(),
})

// serverFn validator helper: throw the first issue message so client sees a clean error
export function parseWithMessage<T extends z.ZodType>(
  schema: T,
  input: unknown,
): z.output<T> {
  const result = schema.safeParse(input)
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? '输入不合法')
  }
  return result.data
}
