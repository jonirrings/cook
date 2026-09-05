import { createSignal, For, Show } from 'solid-js'
import * as CheckboxPrimitive from '@kobalte/core/checkbox'
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
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Checkbox } from '~/components/ui/checkbox'
import { PaginationBar } from '~/components/pagination-bar'
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
  TextFieldTextArea,
} from '~/components/ui/text-field'
import { listAllCategories } from '~/lib/categories.functions'
import {
  createRecipe,
  deleteRecipe,
  listRecipes,
  updateRecipe,
} from '~/lib/recipes.functions'
import type { RecipeRow } from '~/lib/recipes.server'
import { paginationSearchSchema, recipeInputSchema } from '~/lib/schemas'
import type { PaginationSearch } from '~/lib/schemas'

export const Route = createFileRoute('/_authenticated/dashboard/recipes')({
  // 页码和页大小从 URL 读取，是分页状态的唯一来源
  validateSearch: (search: Record<string, unknown>): PaginationSearch =>
    paginationSearchSchema.parse(search),
  // 数据走 loader：渲染前必定完成，SSR 与客户端首帧一致，避免 hydration 不一致
  loader: async ({ location }) => {
    const search = paginationSearchSchema.parse(location.search)
    const [recipes, categories] = await Promise.all([
      listRecipes({ data: search }),
      listAllCategories(),
    ])
    return { recipes, categories }
  },
  component: RecipesAdminPage,
})

type RecipeForm = {
  name: string
  description: string
  imageUrl: string
  ingredientsText: string
  stepsText: string
  categoryIds: number[]
}

const emptyForm = (): RecipeForm => ({
  name: '',
  description: '',
  imageUrl: '',
  ingredientsText: '',
  stepsText: '',
  categoryIds: [],
})

function RecipesAdminPage() {
  const navigate = useNavigate()
  const router = useRouter()
  const search = useSearch({ from: '/_authenticated/dashboard/recipes' })
  const data = Route.useLoaderData()

  const page = () => search().page ?? 1
  const size = () => search().size ?? 12

  // 弹窗状态：null 关闭 / 'create' 新建 / recipe 对象编辑
  const [dialogState, setDialogState] = createSignal<
    null | 'create' | RecipeRow
  >(null)
  const [form, setForm] = createSignal<RecipeForm>(emptyForm())
  const [formError, setFormError] = createSignal<string | null>(null)
  const [saving, setSaving] = createSignal(false)
  const [deleteTarget, setDeleteTarget] = createSignal<null | {
    id: number
    name: string
  }>(null)

  const setSearch = (next: { page?: number; size?: number }) => {
    void navigate({
      to: Route.fullPath,
      search: { page: next.page ?? page(), size: next.size ?? size() },
    })
  }

  // 增删改后重新跑 loader 刷新列表
  const refresh = () => router.invalidate()

  function openCreate() {
    setForm(emptyForm())
    setFormError(null)
    setDialogState('create')
  }

  function openEdit(recipe: RecipeRow) {
    setForm({
      name: recipe.name,
      description: recipe.description ?? '',
      imageUrl: recipe.imageUrl ?? '',
      ingredientsText: (recipe.ingredients ?? []).join('\n'),
      stepsText: (recipe.steps ?? []).join('\n'),
      categoryIds: recipe.categories.map((c) => c.id),
    })
    setFormError(null)
    setDialogState(recipe)
  }

  async function onSave() {
    setFormError(null)

    const parsed = recipeInputSchema.safeParse({
      name: form().name,
      description: form().description || undefined,
      imageUrl: form().imageUrl || undefined,
      ingredients: form()
        .ingredientsText.split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      steps: form()
        .stepsText.split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      categoryIds: form().categoryIds,
    })
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? '输入不合法')
      return
    }

    const state = dialogState()
    const editing = state !== 'create' ? state : null
    setSaving(true)
    try {
      if (editing) {
        await updateRecipe({ data: { ...parsed.data, id: editing.id } })
        toast.success('菜谱已更新')
      } else {
        await createRecipe({ data: parsed.data })
        toast.success('菜谱已创建')
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
      await deleteRecipe({ data: { id: target.id } })
      toast.success(`已删除「${target.name}」`)
      setDeleteTarget(null)
      await refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const recipes = () => data().recipes.items

  return (
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">菜谱管理</h1>
          <p class="text-sm text-muted-foreground">
            增删改查菜谱；列表分页参数（page / size）跟随 URL
          </p>
        </div>
        <Button onClick={openCreate}>新建菜谱</Button>
      </div>

      <div class="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-14">ID</TableHead>
              <TableHead>菜名</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>简介</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead class="w-28 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <Show
              when={recipes().length > 0}
              fallback={
                <TableRow>
                  <TableCell
                    colSpan={6}
                    class="py-8 text-center text-muted-foreground"
                  >
                    暂无菜谱，点击右上角「新建菜谱」
                  </TableCell>
                </TableRow>
              }
            >
              <For each={recipes()}>
                {(recipe) => (
                  <TableRow>
                    <TableCell>{recipe.id}</TableCell>
                    <TableCell class="font-medium">{recipe.name}</TableCell>
                    <TableCell>
                      <div class="flex flex-wrap gap-1">
                        <For each={recipe.categories}>
                          {(category) => (
                            <Badge variant="secondary">{category.name}</Badge>
                          )}
                        </For>
                      </div>
                    </TableCell>
                    <TableCell class="max-w-64 truncate text-muted-foreground">
                      {recipe.description || '—'}
                    </TableCell>
                    <TableCell class="text-muted-foreground">
                      {recipe.createdAt.toLocaleString('zh-CN')}
                    </TableCell>
                    <TableCell class="text-right">
                      <div class="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(recipe)}
                        >
                          编辑
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            setDeleteTarget({
                              id: recipe.id,
                              name: recipe.name,
                            })
                          }
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
        total={data().recipes.total}
        onPageChange={(p) => setSearch({ page: p })}
      />

      {/* 新建 / 编辑弹窗 */}
      <Dialog
        open={dialogState() !== null}
        onOpenChange={(open) => {
          if (!open) setDialogState(null)
        }}
      >
        <DialogContent class="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogState() === 'create' ? '新建菜谱' : '编辑菜谱'}
            </DialogTitle>
            <DialogDescription>用料和步骤每行一条</DialogDescription>
          </DialogHeader>
          <div class="space-y-4">
            <Show when={formError()}>
              <p class="text-sm text-destructive">{formError()}</p>
            </Show>
            <TextField
              value={form().name}
              onChange={(v) => setForm({ ...form(), name: v })}
            >
              <TextFieldLabel>菜名</TextFieldLabel>
              <TextFieldInput placeholder="例如：番茄炒蛋" />
            </TextField>
            <TextField
              value={form().description}
              onChange={(v) => setForm({ ...form(), description: v })}
            >
              <TextFieldLabel>简介</TextFieldLabel>
              <TextFieldTextArea placeholder="一句话介绍这道菜" rows={2} />
            </TextField>
            <TextField
              value={form().imageUrl}
              onChange={(v) => setForm({ ...form(), imageUrl: v })}
            >
              <TextFieldLabel>图片 URL</TextFieldLabel>
              <TextFieldInput placeholder="https://…（可选）" />
            </TextField>
            <TextField
              value={form().ingredientsText}
              onChange={(v) => setForm({ ...form(), ingredientsText: v })}
            >
              <TextFieldLabel>用料（每行一条）</TextFieldLabel>
              <TextFieldTextArea
                placeholder={'鸡蛋 3 个\n番茄 2 个'}
                rows={4}
              />
            </TextField>
            <TextField
              value={form().stepsText}
              onChange={(v) => setForm({ ...form(), stepsText: v })}
            >
              <TextFieldLabel>步骤（每行一条）</TextFieldLabel>
              <TextFieldTextArea
                placeholder={
                  '鸡蛋打散炒熟盛出\n番茄下锅炒出汁\n倒入鸡蛋翻炒均匀'
                }
                rows={5}
              />
            </TextField>
            <div class="space-y-2">
              <span class="text-sm font-medium">分类</span>
              <div class="flex flex-wrap gap-x-4 gap-y-2">
                <For each={data().categories}>
                  {(category) => (
                    <Checkbox
                      checked={form().categoryIds.includes(category.id)}
                      onChange={(checked) =>
                        setForm({
                          ...form(),
                          categoryIds: checked
                            ? [...form().categoryIds, category.id]
                            : form().categoryIds.filter(
                                (id) => id !== category.id,
                              ),
                        })
                      }
                    >
                      <CheckboxPrimitive.Label class="text-sm">
                        {category.name}
                      </CheckboxPrimitive.Label>
                    </Checkbox>
                  )}
                </For>
              </div>
            </div>
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
          <AlertDialogTitle>确认删除菜谱？</AlertDialogTitle>
          <AlertDialogDescription>
            即将删除「{deleteTarget()?.name}」，此操作不可撤销。
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
