import { createFileRoute } from '@tanstack/solid-router'

// todo：page and size params required
export const Route = createFileRoute('/api/categories/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return new Response('Hello, World!')
      },
    },
  },
})
