import { createSignal, For, Show } from 'solid-js'
import {
  createFileRoute,
  useNavigate,
  useRouter,
  useSearch,
} from '@tanstack/solid-router'
import { toast } from 'solid-sonner'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { Button } from '~/components/ui/button'
import { PaginationBar } from '~/components/pagination-bar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import {
  TextField,
  TextFieldInput,
  TextFieldLabel,
} from '~/components/ui/text-field'
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '~/lib/categories.functions'
import type { CategoryRow } from '~/lib/categories.server'
import { categoryCreateSchema, paginationSearchSchema } from '~/lib/schemas'
import type { PaginationSearch } from '~/lib/schemas'

export const Route = createFileRoute('/_authenticated/dashboard/categories')({
  // 页码和页大小从 URL 读取，是分页状态的唯一来源
  validateSearch: (search: Record<string, unknown>): PaginationSearch =>
    paginationSearchSchema.parse(search),
  // 数据走 loader：渲染前必定完成，SSR 与客户端首帧一致，避免 hydration 不一致
  loader: async ({ location }) => {
    const search = paginationSearchSchema.parse(location.search)
    return listCategories({ data: search })
  },
  component: CategoriesAdminPage,
})

function CategoriesAdminPage() {
  const navigate = useNavigate()
  const router = useRouter()
  const search = useSearch({ from: '/_authenticated/dashboard/categories' })
  const data = Route.useLoaderData()

  const page = () => search().page ?? 1
  const size = () => search().size ?? 12

  // 弹窗状态：null 关闭 / 'create' 新建 / category 对象编辑
  const [dialogState, setDialogState] = createSignal<
    null | 'create' | CategoryRow
  >(null)
  const [name, setName] = createSignal('')
  const [formError, setFormError] = createSignal<string | null>(null)
  const [saving, setSaving] = createSignal(false)
  const [deleteTarget, setDeleteTarget] = createSignal<null | CategoryRow>(null)

  const setSearch = (next: { page?: number; size?: number }) => {
    void navigate({
      to: Route.fullPath,
      search: { page: next.page ?? page(), size: next.size ?? size() },
    })
  }

  // 增删改后重新跑 loader 刷新列表
  const refresh = () => router.invalidate()

  function openCreate() {
    setName('')
    setFormError(null)
    setDialogState('create')
  }

  function openEdit(category: CategoryRow) {
    setName(category.name)
    setFormError(null)
    setDialogState(category)
  }

  async function onSave() {
    setFormError(null)

    const parsed = categoryCreateSchema.safeParse({ name: name() })
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? '输入不合法')
      return
    }

    const state = dialogState()
    const editing = state !== 'create' ? state : null
    setSaving(true)
    try {
      if (editing) {
        await updateCategory({
          data: { id: editing.id, name: parsed.data.name },
        })
        toast.success('分类已更新')
      } else {
        await createCategory({ data: parsed.data })
        toast.success('分类已创建')
      }
      setDialogState(null)
      await refresh()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '保存失败，请稍后再试')
    } finally {
      setSaving(false)
    }
  }

  async function onDelete() {
    const target = deleteTarget()
    if (!target) return
    try {
      await deleteCategory({ data: { id: target.id } })
      toast.success(`已删除分类「${target.name}」`)
      setDeleteTarget(null)
      await refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  return (
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">分类管理</h1>
          <p class="text-sm text-muted-foreground">
            增删改查分类；列表分页参数（page / size）跟随 URL
          </p>
        </div>
        <Button onClick={openCreate}>新建分类</Button>
      </div>

      <div class="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-14">ID</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead class="w-28 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <Show
              when={data().items.length > 0}
              fallback={
                <TableRow>
                  <TableCell
                    colSpan={5}
                    class="py-8 text-center text-muted-foreground"
                  >
                    暂无分类，点击右上角「新建分类」
                  </TableCell>
                </TableRow>
              }
            >
              <For each={data().items}>
                {(category) => (
                  <TableRow>
                    <TableCell>{category.id}</TableCell>
                    <TableCell class="font-medium">{category.name}</TableCell>
                    <TableCell class="text-muted-foreground">
                      {category.slug}
                    </TableCell>
                    <TableCell class="text-muted-foreground">
                      {category.createdAt?.toLocaleString('zh-CN') ?? '—'}
                    </TableCell>
                    <TableCell class="text-right">
                      <div class="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(category)}
                        >
                          编辑
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteTarget(category)}
                        >
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </For>
            </Show>
          </TableBody>
        </Table>
      </div>

      <PaginationBar
        page={page()}
        size={size()}
        total={data().total}
        onPageChange={(p) => setSearch({ page: p })}
      />

      {/* 新建 / 编辑弹窗 */}
      <Dialog
        open={dialogState() !== null}
        onOpenChange={(open) => {
          if (!open) setDialogState(null)
        }}
      >
        <DialogContent class="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {dialogState() === 'create' ? '新建分类' : '编辑分类'}
            </DialogTitle>
            <DialogDescription>slug 会自动生成，无需填写</DialogDescription>
          </DialogHeader>
          <div class="space-y-4">
            <Show when={formError()}>
              <p class="text-sm text-destructive">{formError()}</p>
            </Show>
            <TextField value={name()} onChange={setName}>
              <TextFieldLabel>名称</TextFieldLabel>
              <TextFieldInput placeholder="例如：家常菜" />
            </TextField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogState(null)}>
              取消
            </Button>
            <Button disabled={saving()} onClick={() => void onSave()}>
              {saving() ? '保存中…' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog
        open={deleteTarget() !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent class="max-w-sm">
          <AlertDialogTitle>确认删除分类？</AlertDialogTitle>
          <AlertDialogDescription>
            即将删除「{deleteTarget()?.name}
            」，分类与菜谱的关联也会一并移除（菜谱本身不受影响）。
          </AlertDialogDescription>
          <div class="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={() => void onDelete()}>
              确认删除
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
