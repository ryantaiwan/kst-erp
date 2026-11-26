import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { SimpleTable } from "@/components/simple-table";
import { formatDate } from "@/lib/utils";
import { RfqForm } from "./rfq-form";
import { RfqActions } from "./rfq-actions";
import { getRfqList } from "./actions";

export const instant = false;

const STATUS_LABEL: Record<string, string> = {
  draft: "草稿",
  sent: "已詢價",
  converted: "已轉採購單",
  closed: "已結案",
};

export default async function RfqPage() {
  const rows = await getRfqList();
  const supplierRows = await db.select({ id: suppliers.id, name: suppliers.name }).from(suppliers);

  const supplierNameById = new Map(supplierRows.map((s) => [s.id, s.name]));

  return (
    <>
      <PageHeader
        title="詢價單"
        subtitle="進貨流程起點 · 詢價確認後可轉為採購訂單"
      />

      <RfqForm suppliers={supplierRows} />

      <div className="mb-3 mt-6 text-sm font-semibold text-[#26223d]">詢價紀錄</div>
      <SimpleTable
        rows={rows}
        empty="尚無詢價單，請用上方表單建立"
        columns={[
          { key: "no", label: "詢價單號", render: (r) => <span className="font-medium text-[#5538d6]">{r.rfqNo}</span> },
          { key: "supplier", label: "供應商", render: (r) => (r.supplierId ? supplierNameById.get(r.supplierId) ?? "—" : "—") },
          { key: "deadline", label: "報價截止", render: (r) => formatDate(r.deadline) },
          { key: "expected", label: "期望到貨", render: (r) => formatDate(r.expectedDate) },
          { key: "created", label: "建立日", render: (r) => formatDate(r.createdAt) },
          { key: "items", label: "品項數", render: (r) => `${r.itemCount} 項` },
          {
            key: "status",
            label: "狀態",
            render: (r) => (
              <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                {STATUS_LABEL[r.status] ?? r.status}
              </span>
            ),
          },
          {
            key: "action",
            label: "操作",
            render: (r) => <RfqActions rfqId={r.id} status={r.status} />,
          },
        ]}
      />
    </>
  );
}
