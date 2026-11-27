# KST ERP

鋒冠科技有限公司（Keenness Technology Co., Ltd. / K.S.T）进销存、帐务、发票与报价管理系统。

## 技术栈

- Next.js 16 App Router（`proxy.ts` 路由保护）+ TypeScript + Tailwind CSS 4
- Turso（libSQL / SQLite）+ Drizzle ORM
- Auth.js v5（LINE + Google 登录）+ `@auth/drizzle-adapter`（JWT session 策略）
- React Hook Form + Zod
- pdf-lib + `@pdf-lib/fontkit`（报价单 PDF，中文字型见下文）
- Vercel Blob / Vercel Cron / Resend / Sentry

详细规格见同工作区的 `kst-erp-preview/DEV-SPEC.md`。

## 已完成模组

| 区域 | 路径 | 说明 |
|---|---|---|
| 总览 | `/` | 客户 / 供应商 / 商品 / 发票 / 应收未收 KPI、最近报价单、待办提醒 |
| 业务 | `/sales/quotes` `/sales/orders` `/sales/shipments` `/sales/customers` | 报价单（+PDF 下载）、销货订单、出货作业、客户管理 |
| 采购 | `/purchasing/rfq` `/purchasing/orders` `/purchasing/receiving` | 询价单、采购订单、入库作业（回写库存） |
| 财务 | `/finance/invoices` `/finance/ap` `/finance/receivables` `/finance/profit` `/finance/tax-summary` | 销项/进项发票、进项发票对帐、应收帐款与收款登记、利润计算与分润结算、税务汇总报表 |
| 主数据 | `/master/products` `/master/suppliers` `/master/inventory` | 商品、供应商、库存查询与异动纪录 |
| 人资 | `/hr` `/hr/employees` `/hr/departments` `/hr/attendance` `/hr/leaves` | 员工主档、部门组织、出勤纪录、请假申请与核准 |
| 管理 | `/admin/accounts` `/admin/permissions` `/admin/settings` | 帐号管理、角色权限矩阵与功能可见范围、税率/分润设定 |

业务流已端对端实测：报价单 → 销货订单 → 出货单 → 销项发票 → 部分收款。

### Phase 3 财务功能

- **分润结算**（`/finance/profit`）：统计卡（总利润 / 公司基本留 / 公司剩余 / 业务分润），依状态筛选（全部 / 未结算 / 已结算），勾选多笔标记已结算，业务% 可在列表中即时调整（走 `calcProfit` 重新计算三份分配），已结算可撤销。
- **税务汇总**（`/finance/tax-summary`）：依期间筛选销项/进项发票，按状态统计、税额摘要、月度趋势。
  > 历史汇入资料的 `taxCents` 多为 0（税额内含于金额），报表同时显示「已纪录税额」与「含税金额 × 5% 推估税额」，实际申报请依发票记载为准。
- **Excel 公式储存格修复**：汇入脚本的 `money()` 读不到 ExcelJS 公式物件 `{ formula, result }`，导致利润表的公司留 / USER 等栏位被当成 0；已新增 `moneyFromCell()` 处理。历史资料中真正有业务分润的笔数本就极少，故不做回填。

## 关键业务规则

- **税率**：基本 5%，系统设定可改；报价单金额**未税**、税金外加并抓系统设定；税率变更**不回溯**（单据存 `taxRateSnapshot`，可指定开始日期）。
- **分润**：公司基本留 65%（可改）+ 业务每笔输入%（**以利润为基数**），剩余回公司；须满足 `公司% + 业务% ≤ 100%`。
- **单号**：`Q` + 民国年 3 码 + 月 2 码 + 日 2 码 + 流水 3 码（例：`Q1151028001`）。前缀另有 `PO` `SH` `RC` `RFQ`。
- **金额**：一律以整数「分」储存（`*Cents`），显示时才除以 100。
- **权限**：账号类型（客户/厂商/员工）+ 角色 + 功能可见范围（write/read/self/hidden）；未授权功能**不显示在菜单**，不是渲染后隐藏。

## PDF 中文字型

pdf-lib 内建的 `subset: true` 与 Noto CJK 不相容（会缺字）。本项目的解法：

1. Noto Sans CJK TC（OTF）→ `otf2ttf` 转 TrueType → fontTools 静态子集化 → `public/fonts/NotoSansTC-Regular-subset.ttf`（3 MB）。
2. 载入时用 fontkit **手动动态裁字**，只内嵌该次 PDF 实际出现的文字，并以 `embedFont(..., { subset: false })` 关闭 pdf-lib 自身子集化。

PDF 由 4.4 MB 降至 1.9 MB，中文完整无缺字。详见 `src/lib/quote-pdf.ts` 与 DEV-SPEC 第 7.2 节。

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
npm run db:sync      # 把本机 local.db 同步到远端 Turso
npm run admin:list   # 列出账号
npm run admin:promote -- <email>  # 手动提升管理员
```

第一个登入的账号会自动成为管理员。

### Session 策略

采用 **JWT session**（30 天）而非 Auth.js 预设的 database session。原因：`proxy.ts` 在资料库连线之前执行，必须能独立验证登入状态。`auth.config.ts`（proxy 用）与 `auth.ts`（主组态）必须保持一致的 `session.strategy`，否则登入成功后仍会被弹回登入页。

### 本机产生测试登入 token

```bash
npx tsx scripts/dev-token.ts   # 输出 JWT，可直接设成 authjs.session-token cookie
```

## 环境变量

复制 `.env.example` 为 `.env.local` 并填入：

- `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN`
- `AUTH_SECRET`
- `AUTH_LINE_ID` / `AUTH_LINE_SECRET`
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
- `AUTH_ENABLE_GOOGLE`（`false` 时关闭 Google 登入，只留 LINE）
- `AUTH_URL`（部署站的正式网址）
- `AUTH_TRUST_HOST=true`
- `BLOB_READ_WRITE_TOKEN`、`RESEND_API_KEY`、`SENTRY_DSN`（可选）

`.env.local` 已被 `.gitignore` 排除，不会提交到版本控制。

> **LINE 登入注意**：`AUTH_LINE_ID` 与 `AUTH_LINE_SECRET` 必须来自**同一个** LINE Login 频道。
> 若两者不同频道，LINE 会回 `invalid_client / invalid client_secret`，Auth.js 表现为 `Configuration` 错误。

## Vercel 部署

1. 在 Vercel 导入此仓库
2. Root Directory 设为 `kst-erp`（若仓库根目录就是本项目则可留空）
3. Framework Preset 选择 Next.js
4. 在 Vercel 后台填入上述环境变量
5. 在 LINE / Google 后台加入正式回调网址

### 正式站

`https://kst-erp.vercel.app`（别名 `kst-erp` → 专案 `kst-erp`，scope `kst18`）

LINE Login 回调网址须设为：`https://kst-erp.vercel.app/api/auth/callback/line`

### 依赖安全

`package.json` 的 `overrides` 将间接依赖提升至安全版本（`esbuild >= 0.25.12`、`uuid ^11.1.1`、`zod ^4.6.7`），`npm audit` 为 **0 vulnerabilities**。

## 资料汇入

## 人资模组（Phase 4）

四张新表：`department`、`employee`、`attendance_record`、`leave_request`，由 `drizzle/0001_hr_module.sql` 建立（已套用至远端 Turso）。

- 员工主档与登入账号 `users` 可选配关联（`userId`），薪资等敏感栏位独立于账号表。
- 员工状态：`active`（在职）/ `on_leave`（留职停薪）/ `resigned`（离职）；设为离职时自动写入 `leaveDate`。
- 出勤类型：正常 / 迟到 / 早退 / 旷职 / 出差 / 假日加班，可记工作与加班时数。
- 请假类型：特休 / 事假 / 病假 / 婚假 / 丧假 / 产假 / 陪产假 / 补休；待审核 → 核准/驳回/取消，核准后时数计入统计。
- `/hr/*` 已加入 `proxy.ts` 保护清单，未登入一律 307 导 `/signin`；菜单 feature key 为 `hr`。

`npm run db:import` 会读取：

- `C:/Users/profe/Desktop/進銷存開發/鋒冠科技 - 客戶部品處理表 匯入用.xlsx`
- `C:/Users/profe/Desktop/進銷存開發/鋒冠科技 - 發票記錄表 參考用.xlsx`

并输出 `IMPORT-REPORT.md`。
