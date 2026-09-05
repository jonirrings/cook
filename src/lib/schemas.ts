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
