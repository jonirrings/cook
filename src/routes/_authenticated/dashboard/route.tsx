import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
} from '@tanstack/solid-router'
import { toast } from 'solid-sonner'
import { Button } from '~/components/ui/button'
import { getSession, signOut } from '~/lib/auth.functions'
import { useInvalidateSession } from '~/integrations/better-auth/session'

export const Route = createFileRoute('/_authenticated/dashboard')({
  beforeLoad: async () => {
    const session = await getSession()

    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: '/dashboard' },
      })
    }

    return { user: session.user }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { user } = Route.useRouteContext()()
  const invalidateSession = useInvalidateSession()

  const links = [
    { to: '/', label: '主页' },
    { to: '/dashboard', label: '账户' },
    { to: '/dashboard/recipes', label: '菜谱管理' },
    { to: '/dashboard/categories', label: '分类管理' },
  ] as const

  return (
    <div class="min-h-screen">
      <header class="border-b">
        <div class="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <nav class="flex items-center gap-1">
            {links.map((link) => (
              <Link
                to={link.to}
                activeOptions={{ exact: true }}
                inactiveProps={{
                  class: 'text-muted-foreground hover:text-foreground',
                }}
                class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div class="flex items-center gap-3">
            <span class="text-sm text-muted-foreground">{user.name}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void signOut()
                  .then(() => invalidateSession())
                  .then(() => navigate({ to: '/' }))
                  .catch((err: Error) => toast.error(err.message))
              }}
            >
              登出
            </Button>
          </div>
        </div>
      </header>
      <main class="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
