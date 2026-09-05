import { For, Show } from 'solid-js'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

export type PaginationBarProps = {
  page: number
  size: number
  total: number
  // URL 是分页状态唯一来源：页码/页大小变化由外部通过 navigate 更新 URL
  onPageChange: (page: number) => void
}

// 当前页附近的页码（最多 5 个）
function pageWindow(page: number, totalPages: number): number[] {
  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
  const end = Math.min(totalPages, start + 4)
  const result: number[] = []
  for (let i = start; i <= end; i++) result.push(i)
  return result
}

export function PaginationBar(props: PaginationBarProps) {
  const totalPages = () => Math.max(1, Math.ceil(props.total / props.size))

  return (
    <Show when={props.total > 0}>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-muted-foreground">
          共 {props.total} 条 · 第 {props.page} / {totalPages()} 页
        </p>
        <div class="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={props.page <= 1}
            onClick={() => props.onPageChange(props.page - 1)}
          >
            上一页
          </Button>
          <For each={pageWindow(props.page, totalPages())}>
            {(p) => (
              <Button
                variant={p === props.page ? 'default' : 'outline'}
                size="sm"
                class={cn('min-w-9', p === props.page && 'pointer-events-none')}
                onClick={() => props.onPageChange(p)}
              >
                {p}
              </Button>
            )}
          </For>
          <Button
            variant="outline"
            size="sm"
            disabled={props.page >= totalPages()}
            onClick={() => props.onPageChange(props.page + 1)}
          >
            下一页
          </Button>
        </div>
      </div>
    </Show>
  )
}
