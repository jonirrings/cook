import {
  ClientOnly,
  createFileRoute,
  Link,
  Outlet,
} from '@tanstack/solid-router'
import BetterAuthHeader from '~/integrations/better-auth/header-user'

export const Route = createFileRoute('/_public')({
  component: PublicLayout,
})

const navLinks = [
  { to: '/', label: '首页' },
  { to: '/recipes', label: '菜谱' },
  { to: '/categories', label: '分类' },
  { to: '/lucky', label: '随便看看' },
] as const

function PublicLayout() {
  return (
    <div class="flex min-h-screen flex-col">
      <header class="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div class="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
          <div class="flex items-center gap-6">
            <Link
              to="/"
              class="flex items-center gap-2 text-base font-bold tracking-tight"
            >
              <img src="/dinner-192.png" alt="" class="size-7" />
              今晚吃啥
            </Link>
            <nav class="hidden items-center gap-1 sm:flex">
              {navLinks.map((link) => (
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
          </div>
          <ClientOnly>
            <BetterAuthHeader />
          </ClientOnly>
        </div>
      </header>

      <main class="flex-1">
        <Outlet />
      </main>

      <footer class="border-t">
        <div class="mx-auto flex max-w-5xl flex-col items-center gap-1 px-4 py-6 text-sm text-muted-foreground">
          <p>🍽️ 今晚吃啥 · 解决每天三大烦恼之一</p>
          <p class="text-xs">© {new Date().getFullYear()} Jonir Rings</p>
        </div>
      </footer>
    </div>
  )
}
