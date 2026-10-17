# my-blog

个人博客。Next.js 14（App Router）+ Prisma + PostgreSQL + Tailwind CSS。

文章、评论、标签、归档页、RSS，带一个基于路由组收口权限的后台。

> **登录方式已变更**：本站现在使用 **MemoVault（vault）统一账号 + OAuth 2.0** 登录，
> 不再提供密码登录与自助注册。原有的用户名密码账户会被**归档**（保留用户行与全部评论，
> 只是禁止登录）。详见下方「登录与账户」一节。

---

## 快速开始

```bash
npm install
cp .env.example .env      # 按下面「环境变量」逐项填写
npm run db:push           # 同步表结构
npm run db:seed           # 可选：创建示例文章
npm run dev
```

打开 http://localhost:3000 。

常用命令：

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 开发服务器 |
| `npm run build` / `npm start` | 生产构建 / 启动 |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm run db:push` | 同步 schema 到数据库 |
| `npm run db:seed` | 种子数据（只建示例文章，不建账号） |
| `npm run users:archive` | 归档旧密码账户（默认预演，加 `--apply` 执行） |

---

## 环境变量

| 变量名 | 必填 | 说明 |
| --- | --- | --- |
| `POSTGRES_URL_NON_POOLING` | ✅ | PostgreSQL 连接串。Vercel + Neon 会自动注入 |
| `JWT_SECRET` | ✅ | 会话签名密钥，**≥ 32 字符**。缺失或过短会让构建失败（有意为之） |
| `VAULT_ISSUER` | ✅ | MemoVault 对外地址，如 `https://vault.example.com`（不带结尾斜杠） |
| `OAUTH_CLIENT_ID` | ✅ | 与 vault 的 `OAUTH_CLIENTS` 里 `clientId` 一致 |
| `OAUTH_CLIENT_SECRET` | ✅ | 与 vault 的 `OAUTH_CLIENTS` 里 `clientSecret` 一致 |
| `OAUTH_REDIRECT_URI` | ✅ | 必须与 vault 登记的 `redirectUris` **完全一致** |
| `ADMIN_EMAILS` | ⬜ | 管理员邮箱白名单，逗号分隔。这些邮箱登录后自动获得后台权限 |
| `SITE_URL` | ⬜ | 站点对外地址。留空时自动读 Vercel 注入的域名 |
| `NEXT_PUBLIC_SITE_NAME` | ⬜ | 站点名称（客户端可见，必须用 `NEXT_PUBLIC_` 前缀） |

生成 `JWT_SECRET`：

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

---

## 登录与账户

### 为什么改成 OAuth

以前本站自己存用户名 + bcrypt 密码哈希。改由 MemoVault 统一认证后：

- 你只需要维护一套密码
- 本站不再保存任何密码（`User.password` 已改为可空且不再写入）
- 登录、改密、找回都在 vault 侧完成

### 登录流程

```
浏览器  →  /api/auth/oauth/start
            生成 state + PKCE(S256)，写临时 Cookie，302 到 vault
vault   →  /oauth/authorize
            未登录先让用户登录，然后展示「授权 我的博客」页面
            用户点「允许」→ 带 code 回跳
浏览器  →  /api/auth/oauth/callback
            校验 state → 用 code + verifier 换 access_token
            → 调 userinfo 拿 { sub, email, name }
            → 本地建档/绑定 → 签发本站会话 Cookie
```

只用 **授权码 + PKCE**，`client_secret` 只在服务端使用，不会出现在浏览器里。

### 账户匹配规则

`lib/oauth-account.ts` 按以下顺序处理：

1. **已绑定过** `oauthSubject` → 直接用，并同步最新的昵称与邮箱
2. **邮箱相同** → 绑定到已有账号；若该账号已归档，则凭 vault 已验证的邮箱**认领并恢复**
3. **都没有** → 新建账号（用户名由邮箱前缀生成，冲突时自动加后缀）

第 2 条是为了让「同一个人换了登录方式回来」时，历史评论的归属不断掉。

### 管理员权限

由 `ADMIN_EMAILS` 环境变量控制，**只授予、不回收**：

- 你的邮箱在列表里 → 登录后 `role = ADMIN`，能看到 `/admin`
- 从列表里删掉不会自动降级，需要在后台「用户管理」里手动改

> ⚠️ 如果 `ADMIN_EMAILS` 为空，**没有任何人能进入后台**。首次切换时务必先配好。

### 旧账户归档

旧密码账户需要显式归档。脚本**默认只预演**，看清楚再执行：

```bash
# 1. 先确认能用 MemoVault 登录，并且已经是管理员
#    （登录一次，然后访问 /admin 验证能进）

# 2. 预演：列出会被归档的账户、保留的评论数
npm run users:archive

# 3. 真正执行
node scripts/archive-legacy-users.mjs --apply
```

归档做什么：

- 给 `User.archivedAt` 写入时间戳
- 该用户**立即无法登录**（`getSession()` 把归档视为未登录，不等令牌过期）
- **用户行保留、所有评论保留**（评论外键指向 `User`，删除用户会连带删评论，所以只归档不删）
- 旧密码哈希留在库里但已无任何登录入口

归档之后：

- 旧评论仍然正常显示，作者名不变
- 如果这位用户日后用**同一邮箱**从 vault 登录，会认领回原账号（评论归属自动接上）

---

## 部署到 Vercel

本站是 OAuth **客户端**，需要配套的 vault 服务端（见 [vault 仓库](https://github.com/colorgithub/vault)）。

1. **先部署 vault**，按它的 README 配置数据库、`AUTH_SECRET`，以及：
   ```bash
   OAUTH_CLIENTS='[{"clientId":"my-blog","clientSecret":"<随机串>","name":"我的博客",
     "redirectUris":["https://blog.example.com/api/auth/oauth/callback"]}]'
   OAUTH_ISSUER="https://vault.example.com"
   ```
2. **再部署本站**，环境变量填上一步的 `clientId` / `clientSecret`：
   ```
   VAULT_ISSUER=https://vault.example.com
   OAUTH_CLIENT_ID=my-blog
   OAUTH_CLIENT_SECRET=<与 vault 里一致的随机串>
   OAUTH_REDIRECT_URI=https://blog.example.com/api/auth/oauth/callback
   ADMIN_EMAILS=you@example.com
   JWT_SECRET=<随机串，≥32 字符>
   ```
3. 用 MemoVault 账号登录一次，确认能进 `/admin`
4. 执行 `npm run users:archive` 预演，确认后加 `--apply` 归档旧账户

### 构建命令

`vercel.json` 里是 `prisma db push && next build`：

- 没有 `--accept-data-loss`，所以会造成数据丢失的 schema 变更会让构建**明确失败**，不会静默删列
- 不在构建期跑 seed（避免每次部署都重置数据）

---

## 目录结构

```
app/
├── (protected 后台) admin/
│   ├── layout.tsx              # 只放 metadata
│   ├── login/                  # OAuth 登录页（服务器组件 + 客户端按钮）
│   └── (protected)/            # 路由组：唯一授权入口 + 响应式外壳
│       ├── layout.tsx          # getSession + isAdmin + redirect
│       ├── page.tsx            # 概览
│       ├── posts/              # 文章管理
│       └── users/              # 用户管理
├── api/
│   ├── auth/oauth/{start,callback}/route.ts
│   ├── auth/{logout,me}/route.ts
│   ├── auth/{login,register}/route.ts   # 已停用，返回 410
│   ├── posts/                  # 文章 CRUD（写操作需 requireAdmin）
│   ├── files/                  # 上传（按文件头嗅探类型）
│   └── ...
├── posts/                      # 归档页 + 文章详情
├── feed.xml/ sitemap.ts robots.ts
└── icon.svg
components/
├── Header.tsx Footer.tsx ThemeProvider.tsx
├── PostCard.tsx ReadingProgress.tsx
├── Comments.tsx MarkdownRenderer.tsx
└── admin/ AdminShell.tsx PostEditor.tsx
lib/
├── auth.ts                     # 会话签发/校验，角色以数据库为准
├── auth-edge.ts                # Edge 可用的常量（middleware 用）
├── env.ts                      # 服务端环境变量（server-only）
├── site.ts                     # 客户端可安全导入的常量
├── oauth-client.ts             # OAuth 客户端：PKCE、换令牌、取用户
├── oauth-account.ts            # OAuth 身份 → 本地 User 的匹配规则
├── guard.ts                    # requireLogin / requireAdmin
├── rate-limit.ts               # 登录/评论/上传限流
├── file-type.ts                # 文件头魔数嗅探（排除 SVG）
├── api-error.ts                # 统一错误出口
└── ...
prisma/schema.prisma
scripts/archive-legacy-users.mjs
```

---

## 安全说明

- **评论渲染不允许原始 HTML**（`CommentMarkdown` 不启用 `rehypeRaw`），正文经 `rehype-sanitize` 白名单过滤
- 所有文章写操作走 `requireAdmin()`，不再只判断「是否登录」
- 草稿只有管理员可见，未登录访问按 404 处理
- **角色以数据库为准**：`getSession()` 每次回查，降权/归档立即生效
- `client_secret`、`code_verifier` 全程只在服务端流转；`state` 与 PKCE 双重防 CSRF/授权码拦截
- 登录、评论、上传均有限流；上传按文件头嗅探类型并排除 SVG
- 安全响应头：CSP、`nosniff`、`X-Frame-Options`、HSTS、`Permissions-Policy`
