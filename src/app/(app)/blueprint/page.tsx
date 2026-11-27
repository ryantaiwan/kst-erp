import { PageHeader } from "@/components/page-header";

export const instant = false;

const STACK = [
  ["框架", "Next.js 16 App Router + TypeScript + Tailwind CSS 4 + Turbopack"],
  ["資料庫", "Turso（libSQL / SQLite）+ Drizzle ORM + @libsql/client"],
  ["登入", "Auth.js v5 + LINE OIDC（Google 可選）+ JWT session（30 天）"],
  ["路由保護", "src/proxy.ts（Next.js 16 已棄用 middleware.ts）"],
  ["表單", "React Hook Form + Zod + Server Actions"],
  ["PDF", "pdf-lib + fontkit 手動裁字 + Noto Sans CJK TC"],
  ["報表", "Recharts 圖表 + 純表格"],
  ["監控", "Sentry（有 DSN 時啟用）"],
  ["檔案", "Vercel Blob（報價單 PDF 私存）"],
  ["通知", "Resend（應收帳款提醒信）"],
  ["部署", "GitHub → Vercel（kst-erp / scope kst18）"],
];

const PHASES = [
  ["Phase 1", "完成", "登入、帳號/角色/權限、稅率與分潤設定、客戶/商品/供應商、報價單 PDF"],
  ["Phase 2", "完成", "進貨→入庫→進項對帳；銷貨→出貨→應收；庫存與庫存異動"],
  ["Phase 3", "完成", "分潤結算與撤銷、稅務彙總報表、Excel 公式儲存格修復"],
  ["Phase 4", "完成", "員工/部門/出勤/請假四模組；行動版與大量匯入工具未做"],
];

export default function BlueprintPage() {
  return (
    <>
      <PageHeader title="技術組合與開發階段" subtitle="KST ERP 目前的架構與四個階段的完成狀態" />
      <section className="mb-6 rounded-xl border border-[#e9e6f3] bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold">技術組合</h2>
        <dl className="grid gap-3 md:grid-cols-2">
          {STACK.map(([k, v]) => (
            <div key={k} className="rounded-lg bg-[#fbfaff] px-3 py-2">
              <dt className="text-[11px] text-[#9b96b0]">{k}</dt>
              <dd className="mt-1 text-xs text-[#26223d]">{v}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="rounded-xl border border-[#e9e6f3] bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold">開發階段</h2>
        <div className="space-y-3">
          {PHASES.map(([phase, status, desc]) => (
            <div key={phase} className="flex gap-3 rounded-lg border border-[#f1eff7] p-3">
              <span className="w-20 shrink-0 text-xs font-semibold text-[#5538d6]">{phase}</span>
              <span className="w-14 shrink-0 rounded bg-emerald-50 px-2 py-0.5 text-center text-[11px] text-emerald-700">{status}</span>
              <span className="text-xs text-[#57536e]">{desc}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
