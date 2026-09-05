import { For, Show } from 'solid-js'
import { createFileRoute, Link } from '@tanstack/solid-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { listAllCategories } from '~/lib/categories.functions'
import { Route as CategoryDetailRoute } from './$id'

export const Route = createFileRoute('/_public/categories/')({
  // 数据走 loader：渲染前必定完成，SSR 与客户端首帧一致，避免 hydration 不一致
  loader: async () => {
    return listAllCategories()
  },
  component: CategoriesPage,
})

function CategoriesPage() {
  const categories = Route.useLoaderData()

  return (
    <div class="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 class="text-3xl font-bold">分类</h1>
        <p class="mt-1 text-sm text-muted-foreground">按分类浏览菜谱</p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Show
          when={categories().length > 0}
          fallback={<p class="text-sm text-muted-foreground">暂无分类</p>}
        >
          <For each={categories()}>
            {(category) => (
              <Link
                to={CategoryDetailRoute.fullPath}
                params={{ id: `${category.id}` }}
                class="block"
              >
                <Card class="h-full transition-colors hover:border-primary">
                  <CardHeader>
                    <CardTitle>{category.name}</CardTitle>
                    <CardDescription>{category.slug}</CardDescription>
                  </CardHeader>
                  <CardContent class="text-sm text-muted-foreground">
                    {category.total} 道菜谱
                  </CardContent>
                </Card>
              </Link>
            )}
          </For>
        </Show>
      </div>
    </div>
  )
}
