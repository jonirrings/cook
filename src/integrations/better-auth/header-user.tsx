import { Show } from 'solid-js'
import { Link } from '@tanstack/solid-router'
import { toast } from 'solid-sonner'
import { Button } from '~/components/ui/button'
import { signOut } from '~/lib/auth.functions'
import { useInvalidateSession, useSession } from './session'

export default function BetterAuthHeader() {
  const session = useSession()
  const invalidateSession = useInvalidateSession()

  return (
    <Show
      when={!session.isPending}
      fallback={
        <div class="h-8 w-8 bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
      }
    >
      <Show
        when={session.data?.user}
        fallback={
          <div class="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                登录
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm">注册</Button>
            </Link>
          </div>
        }
      >
        {(user) => (
          <div class="flex items-center gap-2">
            <Show
              when={user().image}
              fallback={
                <div class="h-8 w-8 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <span class="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    {user().name.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              }
            >
              {(image) => <img src={image()} alt="" class="h-8 w-8" />}
            </Show>
            <span class="text-sm font-medium">{user().name}</span>
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                我的账户
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void signOut()
                  .then(() => invalidateSession())
                  .catch((err: Error) => toast.error(err.message))
              }}
            >
              登出
            </Button>
          </div>
        )}
      </Show>
    </Show>
  )
}
