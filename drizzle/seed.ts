// 从 old/static/recipe.json 生成 seed 数据，灌入本地 D1。
// 与 `wrangler dev --local` 共用持久化存储（.wrangler/state/v3），
// 跑完后本地 dev 环境即可直接看到数据。
//
// 用法：pnpm db:seed
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPlatformProxy } from 'wrangler'
import { drizzle } from 'drizzle-orm/d1'
import { categories, recipes, recipeCategories } from '~/db/cook.schema.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// 通过 wrangler 的 miniflare 代理拿到本地 D1 binding（无需起 dev server）
const { env, dispose } = await getPlatformProxy({
  configPath: resolve(root, 'wrangler.jsonc'),
  persist: true,
})

const db = drizzle(env.DB)

try {
  // 幂等：先清空再插入（仅涉及食谱三张表，不影响用户/会话数据）
  await db.delete(recipeCategories)
  await db.delete(recipes)
  await db.delete(categories)

  const data = JSON.parse(
    await readFile(resolve(root, 'old/static/recipe.json'), 'utf-8'),
  ) as Record<string, string[]>

  let dishCount = 0
  const categoryNames = Object.keys(data)

  for (const [i, name] of categoryNames.entries()) {
    // 中文名无法可靠转拼音，slug 用稳定编号
    const [cat] = await db
      .insert(categories)
      .values({ name, slug: `cat-${String(i + 1).padStart(2, '0')}` })
      .returning({ id: categories.id })

    if (!cat) throw new Error(`插入分类失败: ${name}`)

    const dishes = data[name].map((dishName, j) => ({
      name: dishName,
      slug: `dish-${String(dishCount + j + 1).padStart(3, '0')}`,
    }))

    const inserted = await db
      .insert(recipes)
      .values(dishes)
      .returning({ id: recipes.id })

    await db
      .insert(recipeCategories)
      .values(inserted.map((r) => ({ recipeId: r.id, categoryId: cat.id })))

    dishCount += dishes.length
  }

  console.log(
    `✅ seed 完成：${categoryNames.length} 个分类、${dishCount} 道菜已写入本地 D1`,
  )
} finally {
  await dispose()
}
