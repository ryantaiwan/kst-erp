import { desc } from "drizzle-orm";
import { db } from "@/db";
import { PageHeader } from "@/components/page-header";
import { SimpleTable } from "@/components/simple-table";
import { formatDate, formatMoney } from "@/lib/utils";
import { getShippableOrders, getShipments } from "./actions";
import { ShipmentForm } from "./shipment-form";

export const instant = false;

export default async function ShipmentsPage() {
  const [shippable, shipments] = await Promise.all([getShippableOrders(), getShipments()]);

  return (
    <>
      <PageHeader title="出貨作業" subtitle="由銷貨訂單產生出貨單，出貨數量回寫訂單" />

      <ShipmentForm orders={shippable.map((s) => ({ id: s.order.id, soNo: s.order.soNo, customerName: s.customerName, pendingQty: s.pendingQty }))} />

      <div className="mb-3 mt-6 text-sm font-semibold text-[#26223d]">出貨紀錄</div>
      <SimpleTable
        rows={shipments}
        empty="尚無出貨紀錄"
        columns={[
          { key: "no", label: "出貨單號", render: (r) => <span className="font-medium text-[#5538d6]">{r.shipment.shipNo}</span> },
          { key: "so", label: "銷貨訂單", render: (r) => r.soNo },
          { key: "customer", label: "客戶", render: (r) => r.customerName },
          { key: "date", label: "出貨日", render: (r) => formatDate(r.shipment.shippedAt) },
          { key: "items", label: "品項數", render: (r) => `${r.itemCount} 項 / ${r.totalQty} 單位` },
          { key: "note", label: "備註", render: (r) => r.shipment.note || "—" },
        ]}
      />
    </>
  );
}
