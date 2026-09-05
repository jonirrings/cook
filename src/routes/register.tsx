import { createSignal, Show } from 'solid-js'
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
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
import { getSession, signUp } from '~/lib/auth.functions'
import { signUpSchema } from '~/lib/schemas'

export const Route = createFileRoute('/register')({
  beforeLoad: async () => {
    // 已登录直接回首页
    const session = await getSession()
    if (session) {
      throw redirect({ to: '/' })
    }
  },
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const invalidateSession = useInvalidateSession()

  const [name, setName] = createSignal('')
  const [email, setEmail] = createSignal('')
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

    const parsed = signUpSchema.safeParse({
      name: name(),
      email: email(),
      password: password(),
    })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? '输入不合法')
      return
    }

    setSubmitting(true)
    try {
      await signUp({ data: parsed.data })
      await invalidateSession()
      toast.success('注册成功，已自动登录')
      navigate({ to: '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请稍后再试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div class="flex min-h-screen items-center justify-center p-4">
      <Card class="w-full max-w-sm">
        <CardHeader>
          <CardTitle>注册</CardTitle>
          <CardDescription>创建账号，解决今晚吃什么</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent class="space-y-4">
            <Show when={error()}>
              <Alert variant="destructive">
                <AlertTitle>注册失败</AlertTitle>
                <AlertDescription>{error()}</AlertDescription>
              </Alert>
            </Show>
            <TextField value={name()} onChange={setName}>
              <TextFieldLabel>昵称</TextFieldLabel>
              <TextFieldInput placeholder="你的昵称" autocomplete="nickname" />
            </TextField>
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
                placeholder="至少 8 位"
                autocomplete="new-password"
              />
            </TextField>
            <TextField value={confirm()} onChange={setConfirm}>
              <TextFieldLabel>确认密码</TextFieldLabel>
              <TextFieldInput
                type="password"
                placeholder="再输一遍"
                autocomplete="new-password"
              />
            </TextField>
          </CardContent>
          <CardFooter class="flex-col gap-3">
            <Button type="submit" class="w-full" disabled={submitting()}>
              {submitting() ? '注册中…' : '注册'}
            </Button>
            <div class="text-sm">
              已有账号？
              <Link to="/login" class="text-primary hover:underline">
                去登录
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
