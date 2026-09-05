import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start/solid'
import db from '~/db'
import { sendEmail } from '~/lib/email'

export const auth = betterAuth({
  // baseURL 线上取自 wrangler vars 里的 BETTER_AUTH_URL，
  // 本地开发回退为请求 origin（localhost:3000）
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }) => {
      // better-auth 生成的 url 指向 /reset-password/:token API 回调路由，
      // 本项目走 serverFn 没有该路由，改为直链到前端页面
      const resetUrl = `${new URL(url).origin}/reset-password?token=${token}`

      await sendEmail({
        to: user.email,
        subject: '重置密码 - 今晚吃啥',
        html: `
          <p>你好，${user.name}：</p>
          <p>点击下方链接重置密码（1 小时内有效）：</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>如果不是你本人操作，请忽略此邮件。</p>
        `,
      })
    },
  },
  // 注销账号：走 password 校验后立即删除（不配置邮件二次确认）
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  plugins: [tanstackStartCookies()],
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    usePlural: true,
    debugLogs: true,
  }),
})
