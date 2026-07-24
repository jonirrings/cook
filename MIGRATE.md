# Cook 项目迁移计划：TanStack + Solid + Cloudflare

> **目标**：将 `cook/`（vanilla JS + Dexie + SW 的静态 PWA）重构为 TanStack Start + SolidJS + D1 + Better Auth 的全栈应用，部署到 Cloudflare Workers，具备 PWA 可安装性与离线能力。

---

## 一、现状分析

### 现有架构 (`cook/`)

| 层次 | 技术选型 | 说明 |
|------|----------|------|
| 框架 | 无（vanilla JS） | `static/app.mjs` 直写 DOM |
| 路由 | 无 | 单页面，无路由 |
| 状态 | Dexie (IndexedDB) | 客户端数据库，存分类、菜名、关联关系 |
| 样式 | 纯 CSS | `static/style.css` 不到 10 行 |
| 数据源 | `/static/recipe.json` | JSON 按分类组织菜谱，首次启动时填充 DB |
| 构建 | 无 | 裸 HTML + JS，无打包 |
| 部署 | 任意静态托管 | 当前无部署配置 |
| PWA | Service Worker | `sw.js` 缓存所有静态资源 |
| 工具库 | lodash, dexie | 两个 vendor 文件（minified） |

### 痛点

1. **无类型安全** — 菜谱数据结构没有任何类型约束，运行时才能发现错误
2. **本地数据库耦合** — 数据藏在 IndexedDB 中，用户清浏览器即丢；且存在首次启动的填充延迟
3. **单页面限制** — 无法扩展（没有搜索、按分类筛选、详情页等能力）
4. **零构建** — ES modules 裸跑，没有 HMR、Tree Shaking、代码拆分
5. **Service Worker 手动维护** — 缓存列表硬编码在 `sw.js` 中
6. **UI 体验简陋** — 只有按钮 + 文字，无动画、无加载态、无错误处理
7. **无后端** — 无法持久化用户添加的菜谱，所有数据在客户端，换设备就丢了

---

## 二、目标架构

```
cook/
├── drizzle/
│   ├── schema.ts             # D1 数据库 schema（auth 表 + 业务表）
│   └── migrations/           # drizzle-kit 生成的迁移文件
├── src/
│   ├── routes/
│   │   ├── __root.tsx            # 根布局 (header + outlet + manifest link)
│   │   ├── index.tsx             # 首页：随机出菜 + 全部分类浏览
│   │   ├── recipes/
│   │   │   ├── index.tsx         # 菜谱列表/管理页（登录后可见）
│   │   │   ├── $recipeId.tsx     # 菜谱详情页（做法、用料，可选）
│   │   │   └── new.tsx           # 新增菜谱（登录后可见）
│   │   └── auth.tsx              # 登录/注册页
│   │   └── api/
│   │       └── auth/             # Better Auth 自动处理
│   ├── components/
│   │   ├── RecipeDisplay.tsx     # 随机出菜展示组件
│   │   ├── TagGrid.tsx           # 分类卡片网格组件
│   │   ├── RecipeCard.tsx        # 单个菜谱卡片
│   │   ├── RecipeForm.tsx        # 新增/编辑菜谱表单
│   │   └── InstallPrompt.tsx     # PWA 安装提示横幅
│   ├── data/
│   │   ├── recipes.json          # 种子菜谱数据（从原 recipe.json 转换）
│   │   ├── types.ts              # 菜谱相关类型定义
│   │   └── utils.ts              # 数据查询工具函数
│   ├── db/
│   │   ├── index.ts              # D1 数据库客户端（Server-side）
│   │   ├── local.ts              # IndexedDB 本地缓存客户端
│   │   └── sync.ts               # D1 ↔ IndexedDB 双向同步逻辑
│   ├── lib/
│   │   ├── auth.ts               # Better Auth 服务端配置
│   │   └── auth-client.ts        # Better Auth 客户端配置
│   │   └── utils.ts              # 通用工具函数
│   ├── router.tsx                # 路由创建
│   ├── routeTree.gen.ts          # 自动生成
│   └── styles.css                # Tailwind 入口 + 自定义样式
├── public/
│   ├── manifest.json             # PWA manifest
│   ├── dinner-*.png              # PWA 图标
│   ├── sw.js                     # Service Worker（或由 vite-plugin-pwa 自动生成）
│   └── robots.txt
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tsr.config.json
├── wrangler.jsonc                # Cloudflare Workers + D1 绑定配置
├── drizzle.config.ts             # Drizzle Kit 配置
└── ui.config.json                # Solid-UI 配置（可选）
```

---

## 三、技术选型详解

### 全栈技术栈

| 项目 | 选择 | 版本约束 / 理由 |
|------|------|-----------------|
| **前端框架** | SolidJS + TanStack Start | 响应式、SSR、文件路由，demo 已验证 |
| **SSR 框架** | TanStack Start | Cloudflare Workers 原生支持 |
| **路由** | TanStack Router | 类型安全路由、loader、预加载 |
| **样式** | Tailwind CSS v4 | 零运行时、原子化样式 |
| **后端数据库** | Cloudflare D1 | SQLite 兼容的关系型数据库，免费额度充足 |
| **ORM** | Drizzle ORM | 类型安全、轻量、支持 D1、支持迁移 |
| **认证** | Better Auth | 已集成在 demo 中，有 Solid 客户端 + D1 适配器 |
| **PWA** | vite-plugin-pwa | Workbox 自动管理 Service Worker 和缓存策略 |
| **本地缓存** | Dexie (IndexedDB) | 保留现有方案，作为离线缓存层 |
| **表单** | TanStack Form（可选） | demo 中已有，用于菜谱新增/编辑 |
| **构建** | Vite+ | 继承 demo 配置（Oxlint、格式化、测试） |
| **部署** | Cloudflare Workers + D1 | `wrangler deploy` 一键部署 |

### 关键依赖

```jsonc
// package.json（核心依赖）
{
  "dependencies": {
    // TanStack + Solid 核心
    "@tanstack/solid-router": "latest",
    "@tanstack/solid-start": "latest",
    "@tanstack/solid-form": "latest",
    "solid-js": "^1.9",

    // Better Auth
    "better-auth": "^1.6",
    "@better-auth/d1": "^1.6",          // D1 适配器

    // Drizzle
    "drizzle-orm": "^0.38",

    // Tailwind
    "@tailwindcss/vite": "^4.3",
    "tailwindcss": "^4.3",

    // PWA
    "vite-plugin-pwa": "^0.21",

    // 本地缓存
    "dexie": "^4",

    // Cloudflare
    "@cloudflare/vite-plugin": "^1.46",
    "@tanstack/solid-start": "latest",
    "@tanstack/solid-start-ssr-query": "latest"
  },
  "devDependencies": {
    "drizzle-kit": "^0.30",
    "wrangler": "^4",
    "vite": "catalog:",
    "vite-plugin-solid": "^2"
  }
}
```

---

## 四、数据架构设计

### 4.1 D1 数据库 Schema（Drizzle ORM）

```typescript
// drizzle/schema.ts

// --- Better Auth 内置表（用 better-auth/d1 管理）---
// users, sessions, accounts, verifications
// 这些表由 Better Auth 在运行时自动创建，不需要手写 schema

// --- 业务表 ---

// 分类表
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`CURRENT_TIMESTAMP`),
})

// 菜谱表
export const recipes = sqliteTable('recipes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),       // 简介（可选）
  ingredients: text('ingredients'),        // 用料（JSON 数组，可选）
  steps: text('steps'),                    // 步骤（JSON 数组，可选）
  imageUrl: text('image_url'),             // 图片 URL（可选）
  createdBy: text('created_by'),           // 创建者 user id（关联 Better Auth）
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .default(sql`CURRENT_TIMESTAMP`),
})

// 菜谱-分类 关联表（多对多）
export const recipeCategories = sqliteTable('recipe_categories', {
  recipeId: integer('recipe_id').references(() => recipes.id).notNull(),
  categoryId: integer('category_id').references(() => categories.id).notNull(),
})
```

### 4.2 IndexedDB 本地 Schema（Dexie）

```typescript
// src/db/local.ts

const localDb = new Dexie('cook_cache')

localDb.version(1).stores({
  recipes: '++id, name, slug, createdBy',
  categories: '++id, name, slug',
  recipeCategories: '++id, recipeId, categoryId',
  syncMeta: 'key',       // 同步元数据：{ key: 'lastSyncAt', value: timestamp }
})
```

本地 IndexedDB 结构刻意**镜像** D1 的 SQL 表结构，使得离线/在线切换时数据模型一致，同步逻辑简单。

### 4.3 离线-在线数据流

```
                       ┌──────────────────┐
                       │  Cloudflare D1    │  ← 源数据（SSR 时 Server Function 查询）
                       │  (source of truth) │
                       └────────┬─────────┘
                                │ Server Functions / API Routes
                                ▼
        ┌─────────────────────────────────────────────┐
        │            TanStack Start SSR                │
        │  首屏 SSR 直出 HTML（数据由 D1 loader 提供）  │
        └────────────────────┬────────────────────────┘
                             │ Hydration
                             ▼
             ┌──────────────────────────────┐
             │     客户端运行时                │
             │  ┌──────┐   ┌─────────────┐  │
             │  │ 内存  │   │ IndexedDB   │  │
             │  │信号/  │←──│ (Dexie 缓存) │  │
             │  │Store  │   └─────────────┘  │
             │  └──┬───┘        │            │
             │     │            │ 后台同步     │
             │     ▼            ▼             │
             │  ┌────────────────────────┐    │
             │  │    UI 组件             │    │
             │  └────────────────────────┘    │
             └──────────────────────────────┘
```

**读请求路径（优先 IndexedDB → 后台更新 D1）：**

```
1. 用户打开页面
2. SSR 返回首屏 HTML（含种子数据 + 用户自定义菜谱）
3. 客户端 Hydration 后，同时调用 IndexedDB 查询
4. 如果 IndexedDB 有数据 → 立即渲染（< 1ms）
5. 后台异步从 D1 拉取最新数据 → 更新 IndexedDB → 触发 Solid 信号更新 UI
6. 如果 IndexedDB 无数据 → 先用 SSR 数据填充 IndexedDB → 再渲染
7. 如果离线 → IndexedDB 就是唯一数据源
```

**写请求路径（乐观更新 IndexedDB → 后台同步 D1）：**

```
1. 用户新增/编辑菜谱
2. 立即写入 IndexedDB（乐观更新，用户即时看到结果）
3. 标记该操作为"待同步"（sync queue）
4. 后台异步：发送 Server Function 请求到 D1
5. D1 写入成功 → 清除 sync queue 条目
6. D1 写入失败 → sync queue 中的条目保留，下次联网重试
7. 如果离线 → sync queue 持续积累，Service Worker 注册 sync 事件
8. 联机后 → Service Worker sync 事件触发，批量同步
```

### 4.4 种子数据策略

```
首次部署 / 新用户
       │
       ▼
Server Function: seedDefaultRecipes()
       │
       ├── D1 中的 recipes 和 categories 是否为空？
       │      │
       │      ├── 是 → 从 src/data/recipes.json 插入种子数据到 D1
       │      └── 否 → 跳过（已有自定义数据）
       │
       ▼
返回给客户端 → 写入 IndexedDB → 渲染
```

种子 JSON 保留在代码中（`src/data/recipes.json`），新用户首次访问时由 Server Function 负责写入 D1。后续用户添加的自定义菜谱则直接读写 D1。

---

## 五、PWA 详细方案

### 5.1 配置清单

```jsonc
// public/manifest.json
{
  "name": "今晚吃什么",
  "short_name": "吃啥",
  "description": "从已有菜谱中随机选出一个菜名，避免每天被吃什么的问题烦恼",
  "start_url": "/",
  "display": "standalone",        // standalone 才能隐藏浏览器 chrome
  "orientation": "portrait",
  "theme_color": "#B12A34",
  "background_color": "#B12A34",
  "categories": ["food", "lifestyle"],
  "icons": [
    { "src": "/dinner-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/dinner-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 5.2 Service Worker 策略

使用 `vite-plugin-pwa` 的 Workbox 集成：

| 资源类型 | 策略 | 说明 |
|----------|------|------|
| 静态资源（JS/CSS/图片） | CacheFirst | 构建产物的 hash 版本化，永久缓存 |
| 页面路由（SSR） | NetworkFirst | 优先拉最新版本，失败走缓存 |
| D1 API 请求 | NetworkOnly | API 请求不缓存，由 IndexedDB 管理 |

```typescript
// vite.config.ts - PWA 插件配置
import { VitePWA } from 'vite-plugin-pwa'

VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    // ... 上述 manifest 内容
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg}'],
    runtimeCaching: [
      {
        urlPattern: /^https?:\/\/.*\/$/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages-cache',
          expiration: { maxEntries: 50 },
        },
      },
    ],
  },
})
```

### 5.3 安装提示

```
┌──────────────────────────────┐
│ 🍳 安装「今晚吃什么」到桌面    │
│ 随时随地摇一摇，随机出菜       │
│ [ 稍后再说 ]   [ 安装 ]       │
└──────────────────────────────┘
```

- 监听 `beforeinstallprompt` 事件
- 仅在用户访问过 2 次以上或使用超过 30 秒后显示
- 使用 Solid 组件 `InstallPrompt.tsx` 控制显示逻辑
- 用户关闭后 7 天内不再提示

---

## 六、认证方案（Better Auth + D1）

### 6.1 服务端配置

继承 demo 中的 Better Auth 模式，加入 D1 作为数据库适配器：

```typescript
// src/lib/auth.ts
import { betterAuth } from 'better-auth'
import { d1Adapter } from 'better-auth/d1'
import { getDb } from '../db/index'

export const auth = betterAuth({
  database: d1Adapter(getDb()),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [tanstackStartCookies()],
})
```

### 6.2 权限边界

| 操作 | 未登录 | 已登录 |
|------|--------|--------|
| 浏览菜谱 + 随机出菜 | ✅ | ✅ |
| 新增菜谱 | ❌ | ✅ |
| 编辑/删除自己创建的菜谱 | ❌ | ✅ |
| 编辑/删除他人创建的菜谱 | ❌ | ❌ |
| 管理种子菜谱 | ❌ | ❌（仅管理员） |

### 6.3 用户与菜谱的关系

在 D1 的 `recipes` 表中，通过 `createdBy` 字段关联到 Better Auth 的 `user.id`：

```
recipes.createdBy ──→ users.id
     │
     ├── 种子菜谱：createdBy = null（系统创建）
     └── 用户菜谱：createdBy = <user_id>（用户创建）
```

### 6.4 客户端认证

借鉴 demo 的 `auth-client.ts` 和 `header-user.tsx`：

```typescript
// src/lib/auth-client.ts
import { createAuthClient } from 'better-auth/solid'
export const authClient = createAuthClient()
```

页面中使用 `authClient.useSession()` 获取当前会话，用 `Show` 控制显示登录/登出状态。

### 6.5 注册/登录页面

```
src/routes/auth.tsx
├── email + password 登录表单
├── 注册表单（含昵称）
└── 切换登录/注册模式
```

---

## 七、D1 + Drizzle 详细设置

### 7.1 wrangler.jsonc

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "cook",
  "compatibility_date": "2025-09-02",
  "compatibility_flags": ["nodejs_compat"],
  "main": "@tanstack/solid-start/server-entry",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "cook-db",
      "database_id": "<your-database-id>"
    }
  ]
}
```

### 7.2 创建 D1 数据库

```bash
npx wrangler d1 create cook-db
```

命令输出会给出 database_id，填入 `wrangler.jsonc`。

### 7.3 Drizzle 配置

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: 'sqlite',
  driver: 'd1-http',        // D1 HTTP 驱动
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
    token: process.env.CLOUDFLARE_API_TOKEN!,
  },
})
```

### 7.4 生成并执行迁移

```bash
# 生成迁移文件
npx drizzle-kit generate

# 应用到 D1 远程库
npx wrangler d1 migrations apply cook-db --remote

# 应用到 D1 本地开发库
npx wrangler d1 migrations apply cook-db --local
```

### 7.5 服务端数据库客户端

```typescript
// src/db/index.ts
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../../drizzle/schema'

export function getDb(env?: { DB: D1Database }) {
  // TanStack Start 的 createServerFn 中可以通过 context 获取 env
  return drizzle(env!.DB, { schema })
}

export type Db = ReturnType<typeof getDb>
```

### 7.6 索引设计

| 表 | 索引 | 用途 |
|----|------|------|
| recipes | `(slug)` | 按 slug 查询单个菜谱 |
| recipes | `(created_by)` | 按用户查询自定义菜谱 |
| categories | `(slug)` | 按 slug 查询分类 |
| recipe_categories | `(recipe_id, category_id)` | 联合主键 + 去重 |

---

## 八、逐步迁移计划

### 阶段 0：项目脚手架 (预计 1.5 小时)

- [ ] 从 `tanstack-solid-demo` 复制基础设施文件并裁剪
  - `package.json` → 去掉 better-auth-demo 相关，保留核心 + 新增依赖
  - `tsconfig.json` → 适配 cook 项目名
  - `vite.config.ts` → 保留核心插件 + 加入 vite-plugin-pwa
  - `tsr.config.json` → 不变
  - `wrangler.jsonc` → 改 name + 加入 D1 binding
  - `.gitignore` → 不变
- [ ] 创建 `drizzle/` 目录、`src/db/` 目录
- [ ] 确认 `pnpm-workspace.yaml` 包含 cook
- [ ] `pnpm install`
- [ ] 创建 D1 数据库：`npx wrangler d1 create cook-db`

### 阶段 1：数据库 + ORM (预计 1 小时)

- [ ] 编写 `drizzle/schema.ts`（auth 表 + 业务表）
- [ ] 编写 `src/db/index.ts`（D1 drizzle 客户端）
- [ ] 编写 `drizzle.config.ts`
- [ ] 生成迁移：`npx drizzle-kit generate`
- [ ] 初始化种子数据 Server Function：`src/data/recipes.json` → D1

### 阶段 2：Better Auth (预计 1 小时)

- [ ] 编写 `src/lib/auth.ts`（服务端配置 + D1 适配器）
- [ ] 编写 `src/lib/auth-client.ts`（客户端）
- [ ] 生成并设置 `BETTER_AUTH_SECRET`
- [ ] 创建 `src/routes/auth.tsx`（登录/注册页）
- [ ] 编写 `src/components/AuthHeader.tsx`（头部登录状态）
- [ ] 配置路由 `api/auth` 端点

### 阶段 3：核心页面与组件 (预计 2-3 小时)

- [ ] **`src/routes/__root.tsx`** — 布局（header + manifest link + outlet）
- [ ] **`src/routes/index.tsx`** — 首页
  - 随机出菜按钮 + 结果展示
  - 全部分类卡片网格
  - 搜索框（v1 基础版）
- [ ] **`src/components/RecipeDisplay.tsx`** — 随机出菜组件
- [ ] **`src/components/TagGrid.tsx`** — 分类网格组件
- [ ] **`src/components/RecipeCard.tsx`** — 菜谱卡片组件
- [ ] **`src/data/types.ts`** + **`src/data/utils.ts`** — 类型与查询函数
- [ ] **`src/db/local.ts`** — IndexedDB 客户端（Dexie）

### 阶段 4：离线缓存 + 同步 (预计 2 小时)

- [ ] 编写 `src/db/local.ts`（完成 IndexedDB CRUD）
- [ ] 编写 `src/db/sync.ts` 同步逻辑
  - `syncFromD1()`：拉取 D1 最新数据 → 写入 IndexedDB
  - `isOnline()` + `queueSync()`：离线队列管理
- [ ] 启动时同步：SSR Hydration 后自动触发一次后台同步
- [ ] 写操作的双写策略：IndexedDB 先写 → 乐观更新 → 后台写 D1

### 阶段 5：PWA (预计 1 小时)

- [ ] 配置 `public/manifest.json`
- [ ] 配置 `vite-plugin-pwa`（Workbox 策略）
- [ ] 编写 `InstallPrompt.tsx` 安装提示组件
- [ ] 注册 SW 自动更新逻辑
- [ ] 测试离线可用性

### 阶段 6：菜谱管理（认证后功能）(预计 2 小时)

- [ ] **`src/routes/recipes/index.tsx`** — 我的菜谱列表（仅登录可见）
- [ ] **`src/routes/recipes/new.tsx`** — 新增菜谱表单
  - 使用 TanStack Form 进行表单验证
  - 选择分类（多选）
  - 可选：用料、步骤、图片
- [ ] **`src/routes/recipes/$recipeId.tsx`** — 菜谱详情（编辑入口）
- [ ] **`src/components/RecipeForm.tsx`** — 表单组件
- [ ] Server Function：`createRecipe`, `updateRecipe`, `deleteRecipe`, `listMyRecipes`
- [ ] 权限校验：只有菜谱创建者可以编辑/删除

### 阶段 7：部署与验证 (预计 0.5 小时)

- [ ] `pnpm run build`（本地验证构建成功）
- [ ] `npx wrangler d1 migrations apply cook-db --remote`
- [ ] `pnpm wrangler deploy`
- [ ] 验证：
  - [ ] 首次访问 → 种子数据写入 D1 → SSR 渲染
  - [ ] 注册/登录功能
  - [ ] 新增菜谱 → D1 持久化 → IndexedDB 缓存
  - [ ] 离线访问 → IndexedDB 提供数据
  - [ ] PWA 安装提示 → 桌面图标 → standalone 启动
  - [ ] 第二次访问 → IndexedDB 缓存加速

---

## 九、数据流场景详解

### 场景 A：首次访问（新用户 + 在线）

```
1. 浏览器请求 /
2. Cloudflare Workers SSR
   ├── Server Function: getRecipes()
   │   └── D1 查询 → 发现 recipes 表为空
   │       └── seedDefaultRecipes() → 从 recipes.json 写入种子数据
   └── 返回 SSR HTML（含数据）
3. 浏览器渲染首屏（立即看到随机出菜按钮和分类列表）
4. Hydration 完成
5. 客户端 `syncFromD1()` → 将 D1 数据写入 IndexedDB
6. 下次刷新时，SSR 走 D1 查询（已有数据），客户端从 IndexedDB 读取
```

### 场景 B：老用户（在线）

```
1. SSR 返回 HTML（含最新 D1 数据）
2. 客户端 Hydration
3. 同时从 IndexedDB 读取缓存 → 立即渲染（无需等待网络）
4. 后台 `syncFromD1()` → 对比 D1 最新数据 → 更新 IndexedDB
5. 如果 IndexedDB 数据已最新 → 跳过更新（无闪烁）
```

### 场景 C：老用户（离线）

```
1. Service Worker 拦截请求，返回离线缓存页面（或 NetworkFirst 超时回退）
2. 客户端启动，网络请求失败
3. 从 IndexedDB 读取数据 → 所有功能正常使用
4. 随机出菜 ✅ / 浏览分类 ✅ / 浏览菜谱 ✅
5. 新增菜谱 → 写入 IndexedDB（标记待同步）
6. 网络恢复 → Service Worker `sync` 事件 → 批量同步到 D1
```

### 场景 D：添加菜谱

```
用户（已登录）→ 填写表单 → 提交
                                   │
                    ┌──────────────┼──────────────┐
                    ▼                             ▼
             IndexedDB 写入                Server Function: createRecipe()
             （乐观更新，即时看到）               │
                                               ▼
                                           D1 写入
                                               │
                        等待确认 ───────────────┘
                               │
                        失败？← 网络断开？
                               │
                          IndexedDB               IndexedDB
                          sync queue        ← 保留，标记待同步
                          解除标记
```

---

## 十、种子数据 vs 用户数据

| | 种子数据 | 用户自定义数据 |
|--|---------|---------------|
| 来源 | `src/data/recipes.json`（构建时） | 用户通过表单创建 |
| 存储 | D1 + IndexedDB | D1 + IndexedDB |
| createdBy | `null` | `<user_id>` |
| 可编辑 | 否（仅管理员） | 是（仅创建者） |
| 部署更新 | `recipes.json` 更新后重新部署即可 | 不受影响，保留在 D1 |
| 删除 | 同版本不可删除（可标记隐藏） | 创建者可删除 |

**初次部署流程**：
1. `recipes.json` 包含当前所有分类和菜谱
2. 新用户首次访问时，Server Function 检测到 `recipes` 表为空
3. 自动执行 `seedDefaultRecipes()`，将种子数据插入 D1
4. 插入后 `createdBy = null`（表示为系统数据）
5. 用户后续添加的菜谱 `createdBy = currentUserId`

**种子数据更新流程**：
1. 修改 `src/data/recipes.json`（新增分类或菜谱）
2. 部署新版本
3. Server Function 比对种子数据 hash → 对新增的做 upsert
4. 已有用户自定义数据不受影响

---

## 十一、目录文件映射（从当前到目标）

| 当前文件 | 目标文件 | 说明 |
|----------|---------|------|
| `cook/webmanifest` | `cook/public/manifest.json` | 改名 + 扩展字段 |
| `cook/sw.js` | 由 `vite-plugin-pwa` 自动生成 | 不再手动维护 |
| `cook/vendor/dexie.min.js` | `cook/src/db/local.ts` (npm dexie) | 从 vendor 变成 npm 依赖 |
| `cook/vendor/lodash.min.js` | 移除 | 随机操作用原生 JS 或 `Math.random` |
| `cook/static/recipe.json` | `cook/src/data/recipes.json` | 迁移到 src，便于 import |
| `cook/static/app.mjs` | `cook/src/routes/index.tsx` + 组件 | 拆分到组件 + 路由 |
| `cook/static/db.mjs` | `cook/src/db/local.ts` | 重写为 Dexie v4 + TypeScript |
| `cook/static/style.css` | `cook/src/styles.css` (Tailwind) | 全部用 Tailwind 替代 |
| `cook/static/dinner-*.png` | `cook/public/dinner-*.png` | 保持不变 |
| `cook/index.html` | 由 SSR 自动生成 | 不再需要 |
| — | `cook/drizzle/schema.ts` | 新增 |
| — | `cook/src/db/index.ts` | 新增（D1 drizzle client） |
| — | `cook/src/db/sync.ts` | 新增 |
| — | `cook/src/lib/auth.ts` | 新增 |
| — | `cook/src/lib/auth-client.ts` | 新增 |
| — | `cook/src/routes/auth.tsx` | 新增 |
| — | `cook/src/routes/recipes/*.tsx` | 新增 |

---

## 十二、风险与注意事项

### 同步一致性问题
- **乐观更新写入 IndexedDB 后，D1 同步失败** → sync queue 保留，下次重试
- **两个设备同时编辑同一条菜谱** → 最后写入的覆盖（简单方案），或引入版本号冲突检测（v2）
- **D1 和 IndexedDB 数据不一致** → 以 D1 为权威，定期全量同步

### 离线写冲突
- 用户离线添加菜谱，联机后 `slug` 与已有的冲突 → 自动加后缀（`青椒肉丝-2`）
- 用户离线编辑的菜谱在联机前被其他用户在 D1 删除 → 写操作被拒绝，清除本地缓存

### D1 配额
- 免费计划：5GB 存储 / 1000 万行读取 / 100 万行写入每月
- 500 道菜的种子数据 + 500 道用户数据 ≈ 1000 行，绰绰有余
- 写入操作为核心瓶颈（每条菜谱写入 = 3 行：recipes + categories + recipeCategories）

### Wrangler 本地开发
- `npx wrangler dev` 自动使用本地模拟的 D1
- 配合 TanStack Start 的 dev 模式：`pnpm dev`

### PWA 调试
- Chrome DevTools → Application → Manifest / Service Workers
- 测试离线：DevTools → Network → Offline
- `beforeinstallprompt` 在 Chrome 中需触发过用户交互才可用

---

## 十三、后续扩展路线（v2+）

1. **菜谱详情页**（`/recipes/:slug`）：展示用料清单、步骤说明、图片
2. **收藏功能**：用户收藏种子菜谱（用 D1 的 favorites 表）
3. **多种随机策略**：按分类随机、排除最近 N 天吃过的、智能搭配（一荤一素一汤）
4. **购物清单**：从选中的多道菜谱自动汇总购物清单
5. **分享功能**：生成分享卡片（OGP + 图片）
6. **黑暗模式**：Tailwind 原生 `dark:` 支持
7. **i18n**：菜谱名/分类名的多语言支持

---

## 十四、实施路线图总览

```
阶段 0 (1.5h) ─── 脚手架搭建
      │
      ▼
阶段 1 (1h) ───── D1 + Drizzle 数据库 + 种子数据
      │
      ▼
阶段 2 (1h) ───── Better Auth 认证
      │
      ▼
阶段 3 (2-3h) ─── 核心页面与组件
      │
      ▼
阶段 4 (2h) ───── IndexedDB 离线缓存 + 同步机制
      │
      ▼
阶段 5 (1h) ───── PWA 可安装 + 离线能力
      │
      ▼
阶段 6 (2h) ───── 菜谱管理（认证后 CRUD）
      │
      ▼
阶段 7 (0.5h) ─── 部署与全链路验证
```

**总计预计：10-11 小时**（分散在多个工作时段）

---

*最后更新：2026-07-24*
