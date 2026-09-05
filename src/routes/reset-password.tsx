import { createSignal, Show } from 'solid-js'
import {
  createFileRoute,
  Link,
  useNavigate,
  useSearch,
} from '@tanstack/solid-router'
import { toast } from 'solid-sonner'
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
import { resetPassword } from '~/lib/auth.functions'
import { resetPasswordSchema } from '~/lib/schemas'

type ResetPasswordSearch = {
  token?: string
}

export const Route = createFileRoute('/reset-password')({
  validateSearch: (search: Record<string, unknown>): ResetPasswordSearch => ({
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/reset-password' })

  const [password, setPassword] = createSignal('')
  const [confirm, setConfirm] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)
  const [submitting, setSubmitting] = createSignal(false)

  async function onSubmit(e: Event) {
    e.preventDefault()
    setError(null)

    if (password() !== confirm()) {
      setError('两次输入的密码不一致')
      return
    }

    const parsed = resetPasswordSchema.safeParse({
      token: search().token,
      newPassword: password(),
    })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? '输入不合法')
      return
    }

    setSubmitting(true)
    try {
      await resetPassword({ data: parsed.data })
      toast.success('密码已重置，请用新密码登录')
      navigate({ to: '/login' })
    } catch (err) {
      setError(err instanceof Error ? err.message : '重置失败，请稍后再试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div class="flex min-h-screen items-center justify-center p-4">
      <Card class="w-full max-w-sm">
        <CardHeader>
          <CardTitle>重置密码</CardTitle>
          <CardDescription>设置一个新密码</CardDescription>
        </CardHeader>
        <Show
          when={search().token}
          fallback={
            <>
              <CardContent>
                <Alert variant="destructive">
                  <AlertTitle>链接无效</AlertTitle>
                  <AlertDescription>
                    缺少重置令牌，请重新申请忘记密码邮件
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter>
                <Link
                  to="/forgot-password"
                  class="text-sm text-primary hover:underline"
                >
                  重新申请
                </Link>
              </CardFooter>
            </>
          }
        >
          <form onSubmit={onSubmit}>
            <CardContent class="space-y-4">
              <Show when={error()}>
                <Alert variant="destructive">
                  <AlertTitle>重置失败</AlertTitle>
                  <AlertDescription>{error()}</AlertDescription>
                </Alert>
              </Show>
              <TextField value={password()} onChange={setPassword}>
                <TextFieldLabel>新密码</TextFieldLabel>
                <TextFieldInput
                  type="password"
                  placeholder="至少 8 位"
                  autocomplete="new-password"
                />
              </TextField>
              <TextField value={confirm()} onChange={setConfirm}>
                <TextFieldLabel>确认新密码</TextFieldLabel>
                <TextFieldInput
                  type="password"
                  placeholder="再输一遍"
                  autocomplete="new-password"
                />
              </TextField>
            </CardContent>
            <CardFooter>
              <Button type="submit" class="w-full" disabled={submitting()}>
                {submitting() ? '重置中…' : '重置密码'}
              </Button>
            </CardFooter>
          </form>
        </Show>
      </Card>
    </div>
  )
}
