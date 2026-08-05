# TanStack Start + Wrangler 环境变量完整指南
## 一、三个核心文件分工、区别、加载优先级
项目根目录存在三类环境配置，**作用域完全隔离**：
1. `.env`：TanStack Start/Vite 构建/客户端/本地 Node 开发用
2. `.dev.vars`：仅 `wrangler dev` 本地 Worker 运行时用（Cloudflare 本地模拟器）
3. `wrangler.jsonc` → `vars`：线上 Worker 全局静态明文变量，可提交 Git

### 1. wrangler.jsonc 中 `vars` 字段
```jsonc
// wrangler.jsonc
{
  "vars": {
    "PUBLIC_API_DOMAIN": "https://api.example.com",
    "APP_ENV": "production"
  }
}
```
#### 特点
- **线上生效**：`wrangler deploy` 打包上传，变量明文写入 Worker 部署配置
- **可提交 Git**：只能放**非敏感公开配置**（域名、环境标识、静态开关）
- 读取方式：服务端 `import { env } from "cloudflare:workers"; env.PUBLIC_API_DOMAIN`
- 本地 `wrangler dev` 会被 `.dev.vars` 同名 key 覆盖
- 风险：值明文存在 Cloudflare 后台，任何人能在控制台查看，**严禁密钥、密码**

### 2. `.dev.vars`（Wrangler 本地开发专用）
```ini
# .dev.vars
SESSION_SECRET=dev-only-secret-123
STRIPE_SK=sk_test_xxxx
PUBLIC_API_DOMAIN=http://localhost:8788
```
#### 特点
- **仅 wrangler dev 生效**：Cloudflare Worker 本地模拟器运行时注入，TanStack `tanstack start` 默认**不读取**
- 语法标准 `.env`，**必须加入 .gitignore**，绝不提交仓库
- 同时兼容普通 vars 和 secret，本地统一在这里填测试值
- 优先级高于 `wrangler.jsonc` 的 vars，本地调试覆盖线上默认值
- 线上部署完全不读取此文件，线上密钥靠 `wrangler secret put`

### 3. 根目录 `.env`（TanStack Start/Vite 构建、客户端、SSR 构建期）
```ini
# .env
VITE_APP_TITLE=我的应用 # 前端客户端可访问（VITE_前缀）
DATABASE_LOCAL_URL=postgres://localhost:5432/db
```
#### 特点
- **归 TanStack/Vite 管**：`tanstack start`、`vite dev/build` 自动加载
- 两类变量：
    - `VITE_*`：打包后注入浏览器前端代码，所有人可见
    - 无前缀变量：仅**构建阶段、Node 服务预渲染**可用；Worker 运行时读不到，Worker 运行时只能读 wrangler vars/secrets
- 本地多环境支持：`.env.development` / `.env.production`
- 敏感密钥不要放这里：前端打包会泄露，且 Worker 运行环境不识别

### 加载优先级（同名 key 覆盖规则）
1. 运行时命令行传入（最高，`wrangler dev --env API_URL=xxx`）
2. `.dev.vars`（仅 wrangler dev）
3. `wrangler.jsonc` `vars`（线上兜底、本地兜底）
4. `.env`（仅 TanStack 构建/Node，Worker 运行时不读取）

### 场景区分（什么时候用哪个）
| 场景 | 文件选择 | 示例变量 |
|------|---------|---------|
| 前端页面、浏览器读取 | `.env` `VITE_*` | VITE_SENTRY_DSN |
| Worker 线上公开静态配置 | wrangler.jsonc vars | API_BASE_DOMAIN |
| Worker 本地调试密钥/地址 | .dev.vars | DB_DEV_PWD、测试 API Key |
| Worker 线上加密密钥 | wrangler secret put | 支付密钥、数据库密码、Session 签名密钥 |

## 二、Vars（普通变量） vs Secrets（加密密钥）核心区别
### 1. Vars（wrangler.jsonc vars / .dev.vars 普通键值）
- **存储**：明文存储
    - 线上：存在 Cloudflare Worker 配置，后台可直接查看
    - 本地：`.dev.vars` 明文文件
- **用途**：无安全风险的静态配置
  域名、版本号、功能开关、环境标识、公开接口地址
- **限制**：不能存任何密钥、token、凭证
- 设置方式：
  线上：写 `wrangler.jsonc`
  本地：写 `.dev.vars`

### 2. Secrets（加密机密）
- **存储**：全程加密
    - 线上：Cloudflare 加密密钥库，后台**看不到明文**，只能覆盖/删除，无法查看原始值
    - 本地：`.dev.vars` 仅本地模拟器模拟 secret，本地仍是明文，仅用于开发
- **用途**：所有敏感数据
  DB 连接密码、JWT 签名密钥、第三方 API Key、Stripe/OpenAI Token、Cookie 加密密钥
- **线上设置方式（CLI，不能写进配置文件）**
```bash
# 交互式输入
wrangler secret put SESSION_SECRET

# 管道传值（CI/CD）
echo "secure-prod-secret" | wrangler secret put SESSION_SECRET
```
- 删除/查看列表
```bash
wrangler secret list
wrangler secret delete SESSION_SECRET
```

### 关键对比表
| 维度 | Vars 普通变量 | Secrets 加密密钥 |
|------|-------------|----------------|
| 线上存储 | 明文，后台可见 | 加密存储，后台不可读 |
| 写入位置 | wrangler.jsonc（可提交Git） | 仅 CLI wrangler secret put，不写入任何配置文件 |
| 本地开发 | .dev.vars 可覆盖 | .dev.vars 提供本地模拟值 |
| 前端泄露风险 | VITE_前缀 vars 会打包进前端 | 永远不会暴露给客户端代码 |
| 适用数据 | 公开配置、域名、开关 | 密码、密钥、第三方凭证 |

## 三、分环境最佳存储方案（TanStack Start + Cloudflare Pages/Workers）
### 1. 本地开发（npm run dev / wrangler dev）
1. **前端浏览器、Vite 构建变量** → `.env` / `.env.development`
   ```ini
   # .env.development
   VITE_APP_ENV=dev
   VITE_DEV_BACKEND=http://localhost:8787
   ```
2. **Cloudflare Worker 运行时（Server Function）** → `.dev.vars`（全部本地变量统一放这，gitignore）
   ```ini
   # .dev.vars
   # 模拟线上secret
   SESSION_SECRET=local-test-key
   OPENAI_API_KEY=sk_test_xxx
   # 覆盖 wrangler.jsonc 线上默认vars
   API_BASE_URL=http://localhost:8788
   ```
3. `.gitignore` 必须添加两行
   ```
   .dev.vars
   .env
   .env.*.local
   ```

### 2. 线上生产环境（wrangler deploy）
1. **公开无敏感配置**：写 `wrangler.jsonc` `vars`，提交 Git
2. **所有密钥、密码**：只用 `wrangler secret put`，绝不写任何文件
3. **前端公开变量 VITE_***：CI/CD 流水线配置 Cloudflare Pages 构建变量，或写入 wrangler vars 供 SSR 读取

### 3. 代码读取规范（避免踩坑）
#### ① Worker 服务端代码（Server Function、API 路由）
使用 Cloudflare 标准 env 绑定（**不要用 process.env 读密钥**，边缘运行时不稳定）
```ts
import { env } from "cloudflare:workers";

// 普通vars
const apiDomain = env.API_BASE_URL;
// 加密secret
const secretKey = env.SESSION_SECRET;
```

#### ② TanStack 前端客户端代码
仅能读取 `.env` 中 `VITE_` 前缀变量
```ts
const appTitle = import.meta.env.VITE_APP_TITLE;
```

#### ③ 构建/预渲染阶段（Vite）
可用 `process.env` 读取 `.env` 变量，但**不含 Worker secrets**

## 四、常见踩坑点
1. **混淆 .env 和 .dev.vars**
   `tanstack start` 读 `.env`；`wrangler dev` Worker 运行代码读 `.dev.vars`，两边不互通。前端地址放 `.env`，后端密钥放 `.dev.vars`。
2. **把 Secret 写入 wrangler.jsonc vars**
   线上明文泄露，任何人登录 Cloudflare 后台可查看密钥。
3. **前端读取无前缀 Secret**
   无 VITE_ 前缀变量不会注入浏览器，前端拿不到；密钥永远不能加 VITE_。
4. **提交 .dev.vars / .env 到 Git**
   本地测试密钥直接泄露，必须加入 gitignore。
5. **模块顶层读取 env**
   Cloudflare 边缘 runtime 启动时 env 未注入，必须在请求 handler、server function 内部读取 `env.xxx`。

## 五、极简目录示例
```
your-tanstack-app/
├── wrangler.jsonc       # 线上公开vars，提交Git
├── .dev.vars            # wrangler dev本地密钥，gitignore
├── .env                 # Vite/前端构建变量，gitignore
├── .env.production      # 生产构建前端变量，可选
├── .gitignore
└── src/
```
.gitignore 补充：
```
# env files
.dev.vars
.env
.env.*
```