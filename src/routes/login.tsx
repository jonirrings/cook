import { createSignal, Show } from 'solid-js'
import {
  createFileRoute,
  Link,
  redirect,
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
import { useInvalidateSession } from '~/integrations/better-auth/session'
import { getSession, signIn } from '~/lib/auth.functions'
import { signInSchema } from '~/lib/schemas'

type LoginSearch = {
  redirect?: string
}

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  beforeLoad: async () => {
    // 已登录直接回首页
    const session = await getSession()
    if (session) {
      throw redirect({ to: '/' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/login' })
  const invalidateSession = useInvalidateSession()

  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)
  const [submitting, setSubmitting] = createSignal(false)

  async function onSubmit(e: Event) {
    e.preventDefault()
    setError(null)

    const parsed = signInSchema.safeParse({
      email: email(),
      password: password(),
    })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? '输入不合法')
      return
    }

    setSubmitting(true)
    try {
      await signIn({ data: parsed.data })
      await invalidateSession()
      toast.success('登录成功')
      // 只允许跳转到站内已知页面
      const target = search().redirect === '/dashboard' ? '/dashboard' : '/'
      navigate({ to: target })
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请稍后再试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div class="flex min-h-screen items-center justify-center p-4">
      <Card class="w-full max-w-sm">
        <CardHeader>
          <CardTitle>登录</CardTitle>
          <CardDescription>登录你的账号，记录今晚吃什么</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent class="space-y-4">
            <Show when={error()}>
              <Alert variant="destructive">
                <AlertTitle>登录失败</AlertTitle>
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
            <TextField value={password()} onChange={setPassword}>
              <TextFieldLabel>密码</TextFieldLabel>
              <TextFieldInput
                type="password"
                placeholder="••••••••"
                autocomplete="current-password"
              />
            </TextField>
          </CardContent>
          <CardFooter class="flex-col gap-3">
            <Button type="submit" class="w-full" disabled={submitting()}>
              {submitting() ? '登录中…' : '登录'}
            </Button>
            <div class="flex w-full items-center justify-between text-sm">
              <Link
                to="/forgot-password"
                class="text-muted-foreground hover:text-foreground"
              >
                忘记密码？
              </Link>
              <Link to="/register" class="text-primary hover:underline">
                注册新账号
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
