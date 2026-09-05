import { createFileRoute } from '@tanstack/solid-router'
import { getServerCategoryPage } from '~/lib/categories.server'
import { paginationSchema } from '~/lib/schemas'

// 列表接口：page / size 从 URL query 读取（?page=1&size=10）
export const Route = createFileRoute('/api/categories/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const parsed = paginationSchema.safeParse({
          page: url.searchParams.get('page') ?? undefined,
          size: url.searchParams.get('size') ?? undefined,
        })

        if (!parsed.success) {
          return Response.json(
            { error: parsed.error.issues[0]?.message ?? '参数不合法' },
            { status: 400 },
          )
        }

        const result = await getServerCategoryPage(
          parsed.data.page,
          parsed.data.size,
        )
        return Response.json(result)
      },
    },
  },
})
