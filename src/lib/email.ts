import { env } from 'cloudflare:workers'

type SendEmailOptions = {
  to: string
  subject: string
  html: string
}

// 通过 Resend 发送邮件（无额外依赖，直接调 REST API）。
// 配置方式：
//   线上：wrangler secret put RESEND_API_KEY / EMAIL_FROM
//   本地：写入 .dev.vars
// 未配置时：开发环境把内容打到终端日志，生产环境直接报错（避免"已发送"假象）。
export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const apiKey = env.RESEND_API_KEY
  const from = env.EMAIL_FROM

  if (!apiKey || !from) {
    if (import.meta.env.DEV) {
      console.warn(
        `[auth] 未配置 RESEND_API_KEY/EMAIL_FROM，跳过发送邮件给 ${to}\n` +
          `subject: ${subject}\n${html}`,
      )
      return
    }
    throw new Error('邮件服务未配置（RESEND_API_KEY / EMAIL_FROM）')
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  })

  if (!res.ok) {
    throw new Error(`邮件发送失败：${res.status} ${await res.text()}`)
  }
}
