import { createFileRoute } from '@tanstack/solid-router'
import { getServerCategory } from '~/lib/categories.server'
import { categoryIdSchema } from '~/lib/schemas'

export const Route = createFileRoute('/api/categories/$id')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const parsed = categoryIdSchema.safeParse({ id: params.id })
        if (!parsed.success) {
          return Response.json({ error: 'id 不合法' }, { status: 400 })
        }

        const category = await getServerCategory(parsed.data.id)
        if (!category) {
          return Response.json({ error: '分类不存在' }, { status: 404 })
        }

        return Response.json(category)
      },
    },
  },
})
