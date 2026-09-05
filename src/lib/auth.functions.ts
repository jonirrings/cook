import { createServerFn } from '@tanstack/solid-start'
import { getRequestHeaders } from '@tanstack/solid-start/server'
import { count } from 'drizzle-orm'
import db from '~/db'
import { users } from '~/db/auth.schema'
import { auth } from '~/lib/auth'
import {
  deleteAccountSchema,
  forgetPasswordSchema,
  parseWithMessage,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from '~/lib/schemas'

export const getSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    return session
  },
)

export const ensureSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session) {
      throw new Error('Unauthorized')
    }

    return session
  },
)

// 用户总数（单用户应用：已有用户时禁止再注册）
export const countUsers = createServerFn({ method: 'GET' }).handler(async () => {
  const rows = await db.select({ total: count() }).from(users)
  return rows[0]?.total ?? 0
})

// 注册：成功后 better-auth 会直接创建会话（cookie 由 tanstackStartCookies 插件落盘）
export const signUp = createServerFn({ method: 'POST' })
  .validator((input: unknown) => parseWithMessage(signUpSchema, input))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    return await auth.api.signUpEmail({
      body: data,
      headers,
    })
  })

// 登陆
export const signIn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => parseWithMessage(signInSchema, input))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    return await auth.api.signInEmail({
      body: data,
      headers,
    })
  })

// 登出
export const signOut = createServerFn({ method: 'POST' }).handler(async () => {
  const headers = getRequestHeaders()
  return await auth.api.signOut({ headers })
})

// 注销（删除账号），需验证当前密码
export const deleteAccount = createServerFn({ method: 'POST' })
  .validator((input: unknown) => parseWithMessage(deleteAccountSchema, input))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    return await auth.api.deleteUser({
      body: data,
      headers,
    })
  })

// 忘记密码：请求重置邮件（用户不存在时 better-auth 返回同样的成功文案，防枚举）
export const forgetPassword = createServerFn({ method: 'POST' })
  .validator((input: unknown) => parseWithMessage(forgetPasswordSchema, input))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    return await auth.api.requestPasswordReset({
      body: data,
      headers,
    })
  })

// 重置密码
export const resetPassword = createServerFn({ method: 'POST' })
  .validator((input: unknown) => parseWithMessage(resetPasswordSchema, input))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    return await auth.api.resetPassword({
      body: data,
      headers,
    })
  })
