import { createFileRoute, redirect } from '@tanstack/solid-router'
import { getSession } from '~/lib/auth.functions'

export const Route = createFileRoute('/_authenticated/dashboard')({
  beforeLoad: async () => {
    const session = await getSession()

    if (!session) {
      throw redirect({ to: '/login' })
    }

    return { user: session.user }
  },
  component: Dashboard,
})

function Dashboard() {
  const { user } = Route.useRouteContext()

  return <div>Welcome, {user.name}!</div>
}
