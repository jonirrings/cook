import { For } from 'solid-js'
import { createFileRoute, Link } from '@tanstack/solid-router'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { listAllCategories } from '~/lib/categories.functions'
import { listRecipes } from '~/lib/recipes.functions'
import { Route as LuckyRoute } from './lucky'
import { Route as RecipeDetailRoute } from './recipes/$id'
import { Route as CategoryDetailRoute } from './categories/$id'

export const Route = createFileRoute('/_public/')({
  // 首页数据在 loader 里取，SSR 直接渲染出完整内容
  loader: async () => {
    const [categories, recipes] = await Promise.all([
      listAllCategories(),
      listRecipes({ data: { page: 1, size: 6 } }),
    ])
    return { categories, recipes: recipes.items }
  },
  component: Home,
})

function Home() {
  const { categories, recipes } = Route.useLoaderData()()

  return (
    <div class="space-y-16 pb-4">
      {/* Hero */}
      <section class="relative overflow-hidden border-b">
        <div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div class="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-20 text-center">
          <img src="/dinner-192.png" alt="" class="size-16 drop-shadow-sm" />
          <div class="space-y-3">
            <h1 class="text-4xl font-bold tracking-tight sm:text-5xl">
              今晚吃什么？
            </h1>
            <p class="text-lg text-muted-foreground">
              解决每天三大烦恼之一：早上吃什么、中午吃什么、晚上吃什么
            </p>
          </div>
          <div class="flex flex-wrap items-center justify-center gap-3">
            <Link to={LuckyRoute.fullPath}>
              <Button size="lg" class="min-w-36">
                🎲 随便看看
              </Button>
            </Link>
            <Link to="/recipes">
              <Button size="lg" variant="outline" class="min-w-36">
                浏览全部菜谱
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 分类入口 */}
      <section class="mx-auto max-w-5xl space-y-4 px-4">
        <div class="flex items-end justify-between">
          <h2 class="text-2xl font-bold">按分类找菜</h2>
          <Link
            to="/categories"
            class="text-sm text-muted-foreground hover:text-foreground"
          >
            全部分类 →
          </Link>
        </div>
        <div class="flex flex-wrap gap-2">
          <For each={categories}>
            {(category) => (
              <Link
                to={CategoryDetailRoute.fullPath}
                params={{ id: `${category.id}` }}
                class="inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
              >
                {category.name}
                <span class="text-xs text-muted-foreground">
                  {category.total}
                </span>
              </Link>
            )}
          </For>
        </div>
      </section>

      {/* 最新菜谱 */}
      <section class="mx-auto max-w-5xl space-y-4 px-4">
        <div class="flex items-end justify-between">
          <h2 class="text-2xl font-bold">最新菜谱</h2>
          <Link
            to="/recipes"
            class="text-sm text-muted-foreground hover:text-foreground"
          >
            查看全部 →
          </Link>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <For each={recipes}>
            {(recipe) => (
              <Link
                to={RecipeDetailRoute.fullPath}
                params={{ id: `${recipe.id}` }}
                class="block"
              >
                <Card class="h-full transition-colors hover:border-primary">
                  <CardHeader>
                    <div class="flex items-start justify-between gap-2">
                      <CardTitle>{recipe.name}</CardTitle>
                      <div class="flex flex-wrap justify-end gap-1">
                        <For each={recipe.categories}>
                          {(category) => (
                            <Badge variant="secondary">{category.name}</Badge>
                          )}
                        </For>
                      </div>
                    </div>
                    <CardDescription class="line-clamp-2">
                      {recipe.description || '暂无简介'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent class="text-xs text-muted-foreground">
                    用料 {recipe.ingredients?.length ?? 0} 项 · 步骤{' '}
                    {recipe.steps?.length ?? 0} 步
                  </CardContent>
                </Card>
              </Link>
            )}
          </For>
        </div>
      </section>
    </div>
  )
}
