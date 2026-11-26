# KST ERP

鋒冠科技有限公司（Keenness Technology Co., Ltd. / K.S.T）进销存、帐务、发票与报价管理系统。

## 技术栈

- Next.js App Router + TypeScript + Tailwind CSS
- Turso（libSQL / SQLite）+ Drizzle ORM
- Auth.js v5（LINE + Google 登录）+ `@auth/drizzle-adapter`
- React Hook Form + Zod
- Vercel Blob / Vercel Cron / Resend / Sentry

详细规格见同工作区的 `kst-erp-preview/DEV-SPEC.md`。

## 本机开发

```bash
npm install
cp .env.example .env.local
# 填入 .env.local 内的环境变量
npm run dev
```

打开 http://localhost:3000

## 常用指令

```bash
npm run dev          # 开发服务器
npm run build        # 正式构建
npm run db:generate  # 产生 Drizzle migration
npm run db:migrate   # 套用 migration 到 Turso
npm run db:seed      # 写入初始设定
npm run db:import    # 汇入历史 Excel
npm run admin:list   # 列出账号
npm run admin:promote -- <email>  # 手动提升管理员
```

第一个登入的账号会自动成为管理员。

## 环境变量

复制 `.env.example` 为 `.env.local` 并填入：

- `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN`
- `AUTH_SECRET`
- `AUTH_LINE_ID` / `AUTH_LINE_SECRET`
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
- `AUTH_URL`（部署站的正式网址）
- `AUTH_TRUST_HOST=true`
- `BLOB_READ_WRITE_TOKEN`、`RESEND_API_KEY`、`SENTRY_DSN`（可选）

`.env.local` 已被 `.gitignore` 排除，不会提交到版本控制。

## Vercel 部署

1. 在 Vercel 导入此仓库
2. Root Directory 设为 `kst-erp`（若仓库根目录就是本项目则可留空）
3. Framework Preset 选择 Next.js
4. 在 Vercel 后台填入上述环境变量
5. 在 LINE / Google 后台加入正式回调网址

## 资料汇入

`npm run db:import` 会读取：

- `C:/Users/profe/Desktop/進銷存開發/鋒冠科技 - 客戶部品處理表 匯入用.xlsx`
- `C:/Users/profe/Desktop/進銷存開發/鋒冠科技 - 發票記錄表 參考用.xlsx`

并输出 `IMPORT-REPORT.md`。
