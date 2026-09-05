import { For, Show } from 'solid-js'
import {
  createFileRoute,
  Link,
  useNavigate,
  useSearch,
} from '@tanstack/solid-router'
import { Badge } from '~/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { PaginationBar } from '~/components/pagination-bar'
import { listRecipes } from '~/lib/recipes.functions'
import { paginationSearchSchema } from '~/lib/schemas'
import type { PaginationSearch } from '~/lib/schemas'
import { Route as RecipeDetailRoute } from './$id'

export const Route = createFileRoute('/_public/recipes/')({
  // 页码和页大小从 URL 读取，是分页状态的唯一来源
  validateSearch: (search: Record<string, unknown>): PaginationSearch =>
    paginationSearchSchema.parse(search),
  // 数据走 loader：渲染前必定完成，SSR 与客户端首帧一致，避免 hydration 不一致
  loader: async ({ location }) => {
    const search = paginationSearchSchema.parse(location.search)
    return listRecipes({ data: search })
  },
  component: RecipesPage,
})

function RecipesPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/_public/recipes/' })
  const data = Route.useLoaderData()

  const page = () => search().page ?? 1
  const size = () => search().size ?? 12

  const setSearch = (next: { page?: number; size?: number }) => {
    void navigate({
      to: '/recipes',
      search: { page: next.page ?? page(), size: next.size ?? size() },
    })
  }

  return (
    <div class="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 class="text-3xl font-bold">全部菜谱</h1>
        <p class="mt-1 text-sm text-muted-foreground">
          不知道吃啥？看看大家的菜谱找灵感
        </p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Show
          when={data().items.length > 0}
          fallback={<p class="text-sm text-muted-foreground">暂无菜谱</p>}
        >
          <For each={data().items}>
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
        </Show>
      </div>

      <PaginationBar
        page={page()}
        size={size()}
        total={data().total}
        onPageChange={(p) => setSearch({ page: p })}
      />
    </div>
  )
}
