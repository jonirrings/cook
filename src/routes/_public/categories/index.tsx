import { For, Show } from 'solid-js'
import { createQuery } from '@tanstack/solid-query'
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
  component: CategoriesPage,
})

function CategoriesPage() {
  const categoriesQuery = createQuery(() => ({
    queryKey: ['categories-all'],
    queryFn: () => listAllCategories(),
  }))

  return (
    <div class="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 class="text-3xl font-bold">分类</h1>
        <p class="mt-1 text-sm text-muted-foreground">按分类浏览菜谱</p>
      </div>

      <Show when={categoriesQuery.isError}>
        <p class="text-sm text-destructive">
          加载失败：{categoriesQuery.error?.message}
        </p>
      </Show>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Show
          when={!categoriesQuery.isPending}
          fallback={<p class="text-sm text-muted-foreground">加载中…</p>}
        >
          <Show
            when={(categoriesQuery.data ?? []).length > 0}
            fallback={<p class="text-sm text-muted-foreground">暂无分类</p>}
          >
            <For each={categoriesQuery.data ?? []}>
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
        </Show>
      </div>
    </div>
  )
}
