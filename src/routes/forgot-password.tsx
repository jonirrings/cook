import { createSignal, Show } from 'solid-js'
import { createFileRoute, Link } from '@tanstack/solid-router'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import {
  TextField,
  TextFieldInput,
  TextFieldLabel,
} from '~/components/ui/text-field'
import { forgetPassword } from '~/lib/auth.functions'
import { forgetPasswordSchema } from '~/lib/schemas'

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const [email, setEmail] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)
  const [sent, setSent] = createSignal(false)
  const [submitting, setSubmitting] = createSignal(false)

  async function onSubmit(e: Event) {
    e.preventDefault()
    setError(null)

    const parsed = forgetPasswordSchema.safeParse({ email: email() })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? '输入不合法')
      return
    }

    setSubmitting(true)
    try {
      // 无论邮箱是否注册，接口都返回成功，防止账号枚举
      await forgetPassword({ data: parsed.data })
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败，请稍后再试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div class="flex min-h-screen items-center justify-center p-4">
      <Card class="w-full max-w-sm">
        <CardHeader>
          <CardTitle>忘记密码</CardTitle>
          <CardDescription>
            输入注册邮箱，我们会发送重置密码链接
          </CardDescription>
        </CardHeader>
        <Show
          when={!sent()}
          fallback={
            <>
              <CardContent>
                <Alert>
                  <AlertTitle>邮件已发送</AlertTitle>
                  <AlertDescription>
                    如果该邮箱已注册，请查收重置链接（1
                    小时内有效）。开发环境下请查看服务器终端日志中的链接。
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter class="flex-col gap-3">
                <Link to="/login" class="text-sm text-primary hover:underline">
                  返回登录
                </Link>
              </CardFooter>
            </>
          }
        >
          <form onSubmit={onSubmit}>
            <CardContent class="space-y-4">
              <Show when={error()}>
                <Alert variant="destructive">
                  <AlertTitle>请求失败</AlertTitle>
                  <AlertDescription>{error()}</AlertDescription>
                </Alert>
              </Show>
              <TextField value={email()} onChange={setEmail}>
                <TextFieldLabel>邮箱</TextFieldLabel>
                <TextFieldInput
                  type="email"
                  placeholder="you@example.com"
                  autocomplete="email"
                />
              </TextField>
            </CardContent>
            <CardFooter class="flex-col gap-3">
              <Button type="submit" class="w-full" disabled={submitting()}>
                {submitting() ? '发送中…' : '发送重置邮件'}
              </Button>
              <Link
                to="/login"
                class="text-sm text-muted-foreground hover:text-foreground"
              >
                返回登录
              </Link>
            </CardFooter>
          </form>
        </Show>
      </Card>
    </div>
  )
}
