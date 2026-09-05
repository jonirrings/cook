import { createFileRoute } from '@tanstack/solid-router'
import { getServerRecipe } from '~/lib/recipes.server'
import { recipeIdSchema } from '~/lib/schemas'

export const Route = createFileRoute('/api/recipes/$id')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const parsed = recipeIdSchema.safeParse({ id: params.id })
        if (!parsed.success) {
          return Response.json({ error: 'id 不合法' }, { status: 400 })
        }

        const recipe = await getServerRecipe(parsed.data.id)
        if (!recipe) {
          return Response.json({ error: '菜谱不存在' }, { status: 404 })
        }

        return Response.json(recipe)
      },
    },
  },
})
