import Link from "next/link";
import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { profitRecords } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { SimpleTable } from "@/components/simple-table";
import { formatDate, formatMoney } from "@/lib/utils";
import { getProfitRecords, getProfitSummary, getUnsettledWithCommission, type ProfitFilter } from "@/lib/profit";
import { SettlementForm } from "./settlement-form";

export const instant = false;

export default async function ProfitPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: raw } = await searchParams;
  const filter: ProfitFilter =
    raw === "settled" || raw === "unsettled" ? raw : "all";

  const [rows, summary, unsettled] = await Promise.all([
    getProfitRecords(filter, 100),
    getProfitSummary(),
    getUnsettledWithCommission(500),
  ]);

  return (
    <>
      <PageHeader
        title="利潤計算表"
        subtitle="公司基本留 + 業務%（以利潤為基數）+ 剩餘回公司 · 金額一律未稅"
        right={
          <div className="flex gap-2">
            <Stat label="筆數" value={`${summary.count}`} tone="text-[#26223d]" />
            <Stat label="總利潤" value={formatMoney(summary.profitCents)} tone="text-[#0d8a45]" />
            <Stat label="業務分潤待結" value={formatMoney(summary.unsettledSalespersonCents)} tone="text-[#5538d6]" />
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatBox label="公司基本留" value={formatMoney(summary.companyBaseCents)} />
        <StatBox label="公司剩餘" value={formatMoney(summary.remainderCents)} />
        <StatBox label="業務分潤（累計）" value={formatMoney(summary.salespersonCents)} />
        <StatBox
          label="已結算 / 筆數"
          value={`${formatMoney(summary.settledSalespersonCents)} / ${summary.settledCount}`}
        />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-2 text-[12px]">
          <FilterLink href="/finance/profit?filter=all" active={filter === "all"}>全部</FilterLink>
          <FilterLink href="/finance/profit?filter=unsettled" active={filter === "unsettled"}>未結算</FilterLink>
          <FilterLink href="/finance/profit?filter=settled" active={filter === "settled"}>已結算</FilterLink>
        </div>
        <span className="text-[11px] text-[#9b96b0]">顯示最近 100 筆</span>
      </div>

      {filter !== "settled" && (
        <>
          <div className="mb-2 text-sm font-semibold text-[#26223d]">分潤結算作業</div>
          <SettlementForm rows={unsettled} mode="settle" />
        </>
      )}

      {filter === "settled" && <SettledList />}

      <div className="mb-3 mt-6 text-sm font-semibold text-[#26223d]">利潤明細</div>
      <SimpleTable
        rows={rows}
        empty="尚無利潤資料"
        columns={[
          { key: "id", label: "來源單號", render: (r) => <span className="font-medium text-[#5538d6]">{r.sourceId}</span> },
          { key: "revenue", label: "未稅金額", render: (r) => formatMoney(r.revenueCents) },
          { key: "cost", label: "成本", render: (r) => formatMoney(r.costCents) },
          { key: "profit", label: "利潤", render: (r) => <span className="text-[#0d8a45]">{formatMoney(r.profitCents)}</span> },
          { key: "base", label: "公司留", render: (r) => formatMoney(r.companyBaseCents) },
          { key: "pct", label: "業務%", render: (r) => `${r.salespersonPercent}%` },
          { key: "sp", label: "業務分潤", render: (r) => formatMoney(r.salespersonCents) },
          { key: "remain", label: "剩餘公司", render: (r) => formatMoney(r.companyRemainderCents) },
          {
            key: "settled",
            label: "結算狀態",
            render: (r) =>
              r.settledAt ? (
                <span className="text-[#0d8a45]">已結算 {formatDate(r.settledAt)}</span>
              ) : (
                <span className="text-[#9b96b0]">未結算</span>
              ),
          },
        ]}
      />
    </>
  );
}

/** 已結算且有分潤的紀錄（供誤操作撤銷） */
async function SettledList() {
  const rows = await db
    .select()
    .from(profitRecords)
    .where(sql`${profitRecords.settledAt} is not null and ${profitRecords.salespersonCents} > 0`)
    .orderBy(desc(profitRecords.settledAt))
    .limit(50);

  const mapped = rows.map((r) => ({
    id: r.id,
    sourceId: r.sourceId,
    profitCents: r.profitCents,
    salespersonPercent: r.salespersonPercent,
    salespersonCents: r.salespersonCents,
    settledAt: r.settledAt,
  }));

  return (
    <>
      <div className="mb-2 mt-6 text-sm font-semibold text-[#26223d]">已結算紀錄（撤銷用）</div>
      <SettlementForm rows={mapped} mode="unsettle" />
    </>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 ${
        active ? "bg-[#6d4aff] font-medium text-white" : "border border-[#e9e6f3] bg-white text-[#57536e] hover:bg-[#fbfaff]"
      }`}
    >
      {children}
    </Link>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg border border-[#e9e6f3] bg-white px-3 py-2">
      <div className="text-[10px] text-[#9b96b0]">{label}</div>
      <div className={`text-sm font-semibold ${tone}`}>{value}</div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#e9e6f3] bg-white p-4">
      <div className="text-[11px] text-[#9b96b0]">{label}</div>
      <div className="mt-1 text-lg font-semibold text-[#26223d]">{value}</div>
    </div>
  );
}
