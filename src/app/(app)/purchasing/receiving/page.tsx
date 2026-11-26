import { PageHeader } from "@/components/page-header";
import { SimpleTable } from "@/components/simple-table";
import { formatDate } from "@/lib/utils";
import { getPendingReceipts, getReceivingRecords, getWarehouseList } from "./actions";
import { ReceivingForm } from "./receiving-form";

export const instant = false;

export default async function ReceivingPage() {
  const [pending, records, warehouseRows] = await Promise.all([
    getPendingReceipts(),
    getReceivingRecords(),
    getWarehouseList(),
  ]);

  return (
    <>
      <PageHeader
        title="入庫作業"
        subtitle="採購訂單收貨入庫 · 自動回寫收貨數量並異動庫存"
      />

      <ReceivingForm
        orders={pending.map((p) => ({
          id: p.order.id,
          poNo: p.order.poNo,
          supplierName: p.supplierName,
          items: p.pendingItems,
        }))}
        warehouses={warehouseRows.map((w) => ({ id: w.id, name: `${w.code} ${w.name}` }))}
      />

      <div className="mb-3 mt-6 text-sm font-semibold text-[#26223d]">入庫紀錄</div>
      <SimpleTable
        rows={records}
        empty="尚無入庫紀錄"
        columns={[
          { key: "no", label: "入庫單號", render: (r) => <span className="font-medium text-[#5538d6]">{r.receiving.receiveNo}</span> },
          { key: "po", label: "採購單號", render: (r) => r.poNo },
          { key: "supplier", label: "供應商", render: (r) => r.supplierName },
          { key: "date", label: "入庫日", render: (r) => formatDate(r.receiving.receivedAt) },
          { key: "lines", label: "品項", render: (r) => `${r.lineCount} 項 / ${r.totalQty} 單位` },
          { key: "note", label: "備註", render: (r) => r.receiving.note || "—" },
        ]}
      />
    </>
  );
}
