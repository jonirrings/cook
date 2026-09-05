import { createSignal, Show } from 'solid-js'
import { createFileRoute, useNavigate } from '@tanstack/solid-router'
import { toast } from 'solid-sonner'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import {
  TextField,
  TextFieldInput,
  TextFieldLabel,
} from '~/components/ui/text-field'
import { useInvalidateSession } from '~/integrations/better-auth/session'
import { deleteAccount, signOut } from '~/lib/auth.functions'
import { deleteAccountSchema } from '~/lib/schemas'

export const Route = createFileRoute('/_authenticated/dashboard/')({
  component: Dashboard,
})

function Dashboard() {
  const navigate = useNavigate()
  const { user } = Route.useRouteContext()()
  const invalidateSession = useInvalidateSession()

  const [password, setPassword] = createSignal('')
  const [dialogOpen, setDialogOpen] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)
  const [deleting, setDeleting] = createSignal(false)

  async function onDeleteAccount() {
    setError(null)

    const parsed = deleteAccountSchema.safeParse({ password: password() })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? '输入不合法')
      return
    }

    setDeleting(true)
    try {
      await deleteAccount({ data: parsed.data })
      setDialogOpen(false)
      await invalidateSession()
      toast.success('账号已注销')
      navigate({ to: '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : '注销失败，请稍后再试')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div class="mx-auto flex max-w-xl flex-col gap-6 p-8">
      <Card>
        <CardHeader>
          <CardTitle>账户信息</CardTitle>
          <CardDescription>你的基本信息</CardDescription>
        </CardHeader>
        <CardContent class="space-y-2 text-sm">
          <div class="flex justify-between gap-4">
            <span class="text-muted-foreground">昵称</span>
            <span class="font-medium">{user.name}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-muted-foreground">邮箱</span>
            <span class="font-medium">{user.email}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-muted-foreground">注册时间</span>
            <span class="font-medium">
              {user.createdAt.toLocaleDateString('zh-CN')}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>危险区域</CardTitle>
          <CardDescription>
            注销账号会删除账户及所有关联数据，且不可恢复
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <AlertDialog open={dialogOpen()} onOpenChange={setDialogOpen}>
            <Button variant="destructive" onClick={() => setDialogOpen(true)}>
              注销账号
            </Button>
            <AlertDialogContent class="max-w-sm">
              <AlertDialogTitle>确认注销账号？</AlertDialogTitle>
              <AlertDialogDescription>
                此操作不可撤销。请输入当前密码确认：
              </AlertDialogDescription>
              <div class="mt-4 space-y-4">
                <Show when={error()} fallback={null}>
                  <p class="text-sm text-destructive">{error()}</p>
                </Show>
                <TextField value={password()} onChange={setPassword}>
                  <TextFieldLabel>当前密码</TextFieldLabel>
                  <TextFieldInput
                    type="password"
                    autocomplete="current-password"
                  />
                </TextField>
                <div class="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    取消
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={deleting()}
                    onClick={() => void onDeleteAccount()}
                  >
                    {deleting() ? '注销中…' : '确认注销'}
                  </Button>
                </div>
              </div>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            variant="outline"
            onClick={() => {
              void signOut()
                .then(() => invalidateSession())
                .then(() => navigate({ to: '/' }))
                .catch((err: Error) => toast.error(err.message))
            }}
          >
            登出
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
