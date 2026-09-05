import { For, Show } from 'solid-js'
import { createFileRoute, Link, notFound } from '@tanstack/solid-router'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { getRecipe } from '~/lib/recipes.functions'
import { recipeIdSchema } from '~/lib/schemas'

export const Route = createFileRoute('/_public/recipes/$id')({
  loader: async ({ params }) => {
    const parsed = recipeIdSchema.safeParse({ id: params.id })
    if (!parsed.success) {
      throw notFound()
    }

    const recipe = await getRecipe({ data: { id: parsed.data.id } })
    if (!recipe) {
      throw notFound()
    }

    return recipe
  },
  component: RecipeDetailPage,
})

function RecipeDetailPage() {
  const recipe = Route.useLoaderData()

  return (
    <div class="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <Show when={recipe().imageUrl}>
        {(imageUrl) => (
          <img
            src={imageUrl()}
            alt={recipe().name}
            class="aspect-video w-full rounded-lg object-cover"
          />
        )}
      </Show>

      <div class="space-y-2">
        <h1 class="text-3xl font-bold">{recipe().name}</h1>
        <div class="flex flex-wrap gap-1">
          <For each={recipe().categories}>
            {(category) => <Badge variant="secondary">{category.name}</Badge>}
          </For>
        </div>
        <Show when={recipe().description}>
          <p class="text-muted-foreground">{recipe().description}</p>
        </Show>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>用料</CardTitle>
        </CardHeader>
        <CardContent>
          <Show
            when={(recipe().ingredients ?? []).length > 0}
            fallback={<p class="text-sm text-muted-foreground">暂无用料信息</p>}
          >
            <ul class="list-inside list-disc space-y-1 text-sm">
              <For each={recipe().ingredients ?? []}>
                {(item) => <li>{item}</li>}
              </For>
            </ul>
          </Show>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>步骤</CardTitle>
        </CardHeader>
        <CardContent>
          <Show
            when={(recipe().steps ?? []).length > 0}
            fallback={<p class="text-sm text-muted-foreground">暂无步骤信息</p>}
          >
            <ol class="list-inside list-decimal space-y-2 text-sm">
              <For each={recipe().steps ?? []}>
                {(step, index) => (
                  <li>
                    <span class="mr-2 font-medium text-muted-foreground">
                      {index() + 1}.
                    </span>
                    {step}
                  </li>
                )}
              </For>
            </ol>
          </Show>
        </CardContent>
      </Card>

      <div class="text-sm">
        <Link to="/recipes" class="text-primary hover:underline">
          ← 返回全部菜谱
        </Link>
      </div>
    </div>
  )
}
