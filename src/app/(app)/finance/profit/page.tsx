import { desc } from "drizzle-orm";
import { db } from "@/db";
import { profitRecords } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { SimpleTable } from "@/components/simple-table";
import { formatMoney } from "@/lib/utils";

export const instant = false;

export default async function ProfitPage() {
  const rows = await db
    .select()
    .from(profitRecords)
    .orderBy(desc(profitRecords.createdAt))
    .limit(100);

  return (
    <>
      <PageHeader
        title="利潤計算表"
        subtitle="顯示最近 100 筆 · 公司基本留 65% + 業務%（以利潤為基數）+ 剩餘回公司"
      />
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
        ]}
      />
    </>
  );
}
