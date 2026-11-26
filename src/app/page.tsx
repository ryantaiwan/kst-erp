const modules = [
  { name: "報價單", path: "/sales/quotes", desc: "未稅報價、稅金外加、轉銷貨訂單", tone: "bg-purple-50 text-purple-700" },
  { name: "進貨流程", path: "/purchasing/rfq", desc: "詢價 → 採購 → 入庫 → 發票對帳", tone: "bg-blue-50 text-blue-700" },
  { name: "銷貨流程", path: "/sales/orders", desc: "客戶 → 銷貨訂單 → 出貨 → 應收", tone: "bg-emerald-50 text-emerald-700" },
  { name: "帳務與發票", path: "/finance/profit", desc: "65% + 業務% 分潤、發票稅務彙總", tone: "bg-amber-50 text-amber-700" },
  { name: "管理介面", path: "/admin/accounts", desc: "帳號、權限、功能可見範圍、系統設定", tone: "bg-rose-50 text-rose-700" },
  { name: "人資模組", path: "/hr/employees", desc: "第二階段：員工 / 部門 / 出勤 / 請假", tone: "bg-slate-100 text-slate-600" },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="rounded-2xl border border-[#e9e6f3] bg-white p-8 shadow-sm">
        <p className="text-xs tracking-widest text-[#8c88a6]">KEENNESS TECHNOLOGY CO., LTD. · K.S.T</p>
        <h1 className="mt-2 text-3xl font-semibold">KST ERP 開發骨架</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#6f6a89]">
          Vercel + Turso + Next.js 的 Phase 1 基礎已建立：Drizzle schema、Auth.js（LINE / Google）、
          Zod 驗證與共用計費規則已就位。下列路徑將依 DEV-SPEC.md 逐步實作。
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => (
          <div key={m.path} className="rounded-xl border border-[#e9e6f3] bg-white p-5">
            <span className={`inline-block rounded-md px-2 py-1 text-[11px] ${m.tone}`}>{m.path}</span>
            <h2 className="mt-3 text-base font-medium">{m.name}</h2>
            <p className="mt-1 text-xs leading-6 text-[#8c88a6]">{m.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
