import { For, Show } from 'solid-js'
import {
  createFileRoute,
  Link,
  notFound,
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
import { getCategory } from '~/lib/categories.functions'
import { listRecipesByCategory } from '~/lib/recipes.functions'
import { paginationSearchSchema } from '~/lib/schemas'
import type { PaginationSearch } from '~/lib/schemas'
import { Route as RecipeDetailRoute } from '../recipes/$id'

export const Route = createFileRoute('/_public/categories/$id')({
  validateSearch: (search: Record<string, unknown>): PaginationSearch =>
    paginationSearchSchema.parse(search),
  // 页码和页大小从 URL 读取，是分页状态的唯一来源；
  // 数据走 loader：渲染前必定完成，SSR 与客户端首帧一致，避免 hydration 不一致
  loader: async ({ params, location }) => {
    const id = Number(params.id)
    if (!Number.isInteger(id) || id <= 0) {
      throw notFound()
    }

    const category = await getCategory({ data: { id } })
    if (!category) {
      throw notFound()
    }

    const search = paginationSearchSchema.parse(location.search)
    const recipes = await listRecipesByCategory({
      data: { id, ...search },
    })

    return { category, recipes }
  },
  component: CategoryDetailPage,
})

function CategoryDetailPage() {
  const data = Route.useLoaderData()
  const navigate = useNavigate()
  const search = useSearch({ from: '/_public/categories/$id' })

  const category = () => data().category
  const page = () => search().page ?? 1
  const size = () => search().size ?? 12

  const setSearch = (next: { page?: number; size?: number }) => {
    void navigate({
      to: Route.fullPath,
      params: { id: `${category().id}` },
      search: { page: next.page ?? page(), size: next.size ?? size() },
    })
  }

  return (
    <div class="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 class="text-3xl font-bold">{category().name}</h1>
        <p class="mt-1 text-sm text-muted-foreground">
          共 {data().recipes.total} 道菜谱
        </p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Show
          when={data().recipes.items.length > 0}
          fallback={
            <p class="text-sm text-muted-foreground">该分类下暂无菜谱</p>
          }
        >
          <For each={data().recipes.items}>
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
                          {(c) => <Badge variant="secondary">{c.name}</Badge>}
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
        total={data().recipes.total}
        onPageChange={(p) => setSearch({ page: p })}
      />

      <div class="text-sm">
        <Link to="/categories" class="text-primary hover:underline">
          ← 返回全部分类
        </Link>
      </div>
    </div>
  )
}
