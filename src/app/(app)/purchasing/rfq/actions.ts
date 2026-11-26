"use server";

import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  purchaseOrderItems,
  purchaseOrders,
  purchaseRequestItems,
  purchaseRequests,
} from "@/db/schema";
import { nextPoNo, nextRfqNo } from "@/lib/numbering";

/** 建立詢價單（RFQ） */
export async function createRfq(input: {
  supplierId?: string;
  deadline?: string;
  expectedDate?: string;
  items: Array<{ productId?: string; description: string; qty: number; unitPriceCents: number }>;
}) {
  const items = input.items.filter((i) => i.description.trim() && i.qty > 0);
  if (items.length === 0) throw new Error("請至少填寫一個品項");

  const now = new Date();
  const existing = await db.select({ rfqNo: purchaseRequests.rfqNo }).from(purchaseRequests);
  const rfqNo = nextRfqNo(now, existing.map((r) => r.rfqNo));

  await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(purchaseRequests)
      .values({
        rfqNo,
        supplierId: input.supplierId || null,
        deadline: input.deadline ? new Date(input.deadline) : null,
        expectedDate: input.expectedDate ? new Date(input.expectedDate) : null,
        status: "draft",
      })
      .returning();

    await tx.insert(purchaseRequestItems).values(
      items.map((i) => ({
        requestId: row.id,
        productId: i.productId || null,
        description: i.description.trim(),
        qty: i.qty,
        unitPriceCents: i.unitPriceCents,
      })),
    );
  });

  revalidatePath("/purchasing/rfq");
  return rfqNo;
}

/** 詢價單轉採購訂單 */
export async function convertRfqToPo(rfqId: string, supplierId: string, expectedDate?: string) {
  const [rfq] = await db.select().from(purchaseRequests).where(eq(purchaseRequests.id, rfqId)).limit(1);
  if (!rfq) throw new Error("找不到詢價單");

  const items = await db.select().from(purchaseRequestItems).where(eq(purchaseRequestItems.requestId, rfqId));
  if (items.length === 0) throw new Error("詢價單沒有品項");

  const targetSupplier = supplierId || rfq.supplierId;
  if (!targetSupplier) throw new Error("請先指定供應商");

  const now = new Date();
  const existing = await db.select({ poNo: purchaseOrders.poNo }).from(purchaseOrders);
  const poNo = nextPoNo(now, existing.map((p) => p.poNo));

  const totalCents = items.reduce((s, i) => s + i.qty * i.unitPriceCents, 0);

  await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(purchaseOrders)
      .values({
        poNo,
        supplierId: targetSupplier,
        requestId: rfq.id,
        expectedDate: expectedDate ? new Date(expectedDate) : rfq.expectedDate,
        totalCents,
        status: "confirmed",
      })
      .returning();

    await tx.insert(purchaseOrderItems).values(
      items.map((i, idx) => ({
        orderId: order.id,
        lineNo: idx + 1,
        productId: i.productId,
        description: i.description,
        qty: i.qty,
        receivedQty: 0,
        unitPriceCents: i.unitPriceCents,
      })),
    );

    await tx.update(purchaseRequests).set({ status: "converted" }).where(eq(purchaseRequests.id, rfqId));
  });

  revalidatePath("/purchasing/rfq");
  revalidatePath("/purchasing/orders");
  return poNo;
}

/** 關閉詢價單 */
export async function closeRfq(rfqId: string) {
  await db.update(purchaseRequests).set({ status: "closed" }).where(eq(purchaseRequests.id, rfqId));
  revalidatePath("/purchasing/rfq");
}

/** 詢價單列表（含品項數） */
export async function getRfqList() {
  const rows = await db.select().from(purchaseRequests).orderBy(desc(purchaseRequests.createdAt)).limit(200);
  if (rows.length === 0) return [];

  const items = await db
    .select()
    .from(purchaseRequestItems)
    .where(eq(purchaseRequestItems.requestId, rows[0].id));

  const counts = new Map<string, number>();
  for (const it of items) {
    counts.set(it.requestId, (counts.get(it.requestId) ?? 0) + 1);
  }

  return rows.map((r) => ({ ...r, itemCount: counts.get(r.id) ?? 0 }));
}
