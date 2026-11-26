import { revalidatePath } from "next/cache";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { customers, salesOrderItems, salesOrders, taxSettings } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { SimpleTable } from "@/components/simple-table";
import { calcTotals } from "@/lib/billing";
import { formatDate, formatMoney } from "@/lib/utils";

export const instant = false;

async function createSalesOrder(formData: FormData) {
  "use server";
  const customerId = String(formData.get("customerId") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const qty = Number(formData.get("qty") ?? 0);
  const price = Number(formData.get("price") ?? 0);
  if (!customerId || !description || qty <= 0 || price <= 0) return;

  const [tax] = await db.select().from(taxSettings).orderBy(desc(taxSettings.startDate)).limit(1);
  const rate = tax?.rateBasisPoints ?? 500;
  const subtotalCents = Math.round(qty * price * 100);
  const { taxCents, totalCents } = calcTotals(subtotalCents, rate);

  await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(salesOrders)
      .values({
        soNo: `SO-${Date.now()}`,
        customerId,
        expectedShipDate: null,
        taxRateSnapshot: rate,
        subtotalCents,
        taxCents,
        totalCents,
        status: "confirmed",
      })
      .returning();
    await tx.insert(salesOrderItems).values({
      orderId: order.id,
      lineNo: 1,
      description,
      qty,
      shippedQty: 0,
      priceCents: Math.round(price * 100),
      subtotalCents,
    });
  });

  revalidatePath("/sales/orders");
}

export default async function SalesOrdersPage() {
  const [rows, customerRows] = await Promise.all([
    db.select().from(salesOrders).orderBy(desc(salesOrders.createdAt)).limit(100),
    db.select().from(customers),
  ]);

  return (
    <>
      <PageHeader title="銷貨訂單" subtitle="新增訂單時自動抓取目前系統稅率，税金外加" />
      <form className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-[#e9e6f3] bg-white p-4">
        <label className="text-xs text-[#8c88a6]">
          客戶
          <select name="customerId" className="mt-1 block rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d]">
            {customerRows.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="min-w-64 flex-1 text-xs text-[#8c88a6]">
          品名
          <input name="description" required placeholder="品名 / 型號" className="mt-1 block w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d]" />
        </label>
        <label className="text-xs text-[#8c88a6]">
          數量
          <input name="qty" type="number" min="1" defaultValue="1" className="mt-1 block w-20 rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d]" />
        </label>
        <label className="text-xs text-[#8c88a6]">
          單價
          <input name="price" type="number" min="0" step="0.01" required className="mt-1 block w-28 rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d]" />
        </label>
        <button className="rounded-lg bg-[#6d4aff] px-4 py-2 text-xs text-white">新增訂單</button>
      </form>
      <SimpleTable
        rows={rows}
        empty="尚無銷貨訂單，請用上方表單新增"
        columns={[
          { key: "no", label: "訂單號", render: (r) => <span className="font-medium text-[#5538d6]">{r.soNo}</span> },
          { key: "customer", label: "客戶ID", render: (r) => r.customerId.slice(0, 8) },
          { key: "date", label: "建立日", render: (r) => formatDate(r.createdAt) },
          { key: "subtotal", label: "未稅", render: (r) => formatMoney(r.subtotalCents) },
          { key: "tax", label: "稅金", render: (r) => formatMoney(r.taxCents) },
          { key: "total", label: "總計", render: (r) => formatMoney(r.totalCents) },
          { key: "status", label: "狀態", render: (r) => r.status },
        ]}
      />
    </>
  );
}
