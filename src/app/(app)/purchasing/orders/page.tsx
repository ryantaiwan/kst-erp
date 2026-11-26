import { revalidatePath } from "next/cache";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { purchaseOrderItems, purchaseOrders, suppliers } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { SimpleTable } from "@/components/simple-table";
import { formatDate, formatMoney } from "@/lib/utils";

export const instant = false;

async function createPurchaseOrder(formData: FormData) {
  "use server";
  const supplierId = String(formData.get("supplierId") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const qty = Number(formData.get("qty") ?? 0);
  const price = Number(formData.get("price") ?? 0);
  if (!supplierId || !description || qty <= 0 || price <= 0) return;

  const totalCents = Math.round(qty * price * 100);
  await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(purchaseOrders)
      .values({
        poNo: `PO-${Date.now()}`,
        supplierId,
        expectedDate: null,
        totalCents,
        status: "confirmed",
      })
      .returning();
    await tx.insert(purchaseOrderItems).values({
      orderId: order.id,
      lineNo: 1,
      description,
      qty,
      receivedQty: 0,
      unitPriceCents: Math.round(price * 100),
    });
  });

  revalidatePath("/purchasing/orders");
}

export default async function PurchaseOrdersPage() {
  const [rows, supplierRows] = await Promise.all([
    db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.createdAt)).limit(100),
    db.select().from(suppliers),
  ]);

  return (
    <>
      <PageHeader title="採購訂單" subtitle="進貨流程起點 · 後續可轉入庫與進項發票對帳" />
      <form className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-[#e9e6f3] bg-white p-4">
        <label className="text-xs text-[#8c88a6]">
          供應商
          <select name="supplierId" className="mt-1 block max-w-64 rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d]">
            {supplierRows.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
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
        <button className="rounded-lg bg-[#6d4aff] px-4 py-2 text-xs text-white">新增採購單</button>
      </form>
      <SimpleTable
        rows={rows}
        empty="尚無採購訂單，請用上方表單新增"
        columns={[
          { key: "no", label: "採購單號", render: (r) => <span className="font-medium text-[#5538d6]">{r.poNo}</span> },
          { key: "supplier", label: "供應商ID", render: (r) => r.supplierId.slice(0, 8) },
          { key: "date", label: "建立日", render: (r) => formatDate(r.createdAt) },
          { key: "total", label: "金額", render: (r) => formatMoney(r.totalCents) },
          { key: "status", label: "狀態", render: (r) => r.status },
        ]}
      />
    </>
  );
}
