import {createFileRoute, Link} from '@tanstack/solid-router'
import BetterAuthHeader from "~/integrations/better-auth/header-user.tsx";
import {Route as LuckyRoute} from './lucky'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div class="p-8">
      <BetterAuthHeader/>
      <h1 class="text-4xl font-bold">Welcome to TanStack Start</h1>
      <p class="mt-4 text-lg">
          <Link to={LuckyRoute.fullPath}>Feel lucky</Link>
      </p>
    </div>
  )
}
