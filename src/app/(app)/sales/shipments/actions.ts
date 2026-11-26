"use server";

import { revalidatePath } from "next/cache";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  customers,
  salesOrderItems,
  salesOrders,
  shipmentItems,
  shipments,
} from "@/db/schema";
import { nextShipNo } from "@/lib/numbering";

/** 依銷貨訂單建立出貨單，並回寫 shippedQty */
export async function createShipment(soId: string, note?: string) {
  const [order] = await db.select().from(salesOrders).where(eq(salesOrders.id, soId)).limit(1);
  if (!order) throw new Error("找不到銷貨訂單");

  const items = await db.select().from(salesOrderItems).where(eq(salesOrderItems.orderId, soId));
  const pending = items.filter((i) => i.shippedQty < i.qty);
  if (pending.length === 0) throw new Error("此訂單品項皆已出貨完畢");

  const now = new Date();
  const existing = await db.select({ shipNo: shipments.shipNo }).from(shipments);
  const shipNo = nextShipNo(now, existing.map((s) => s.shipNo));

  await db.transaction(async (tx) => {
    const [ship] = await tx
      .insert(shipments)
      .values({ shipNo, soId, shippedAt: now, note: note || null })
      .returning();

    await tx.insert(shipmentItems).values(
      pending.map((i) => ({
        shipmentId: ship.id,
        orderItemId: i.id,
        description: i.description,
        qty: i.qty - i.shippedQty,
      })),
    );

    for (const i of pending) {
      await tx
        .update(salesOrderItems)
        .set({ shippedQty: i.qty })
        .where(eq(salesOrderItems.id, i.id));
    }

    const totalShipped = items.reduce((s, i) => s + i.shippedQty, 0);
    const totalQty = items.reduce((s, i) => s + i.qty, 0);
    await tx
      .update(salesOrders)
      .set({ status: totalShipped >= totalQty ? "shipped" : "partial_shipped" })
      .where(eq(salesOrders.id, soId));
  });

  revalidatePath("/sales/shipments");
  revalidatePath("/sales/orders");
  return shipNo;
}

/** 取得可出貨的銷貨訂單（有未出貨品項者） */
export async function getShippableOrders() {
  const orders = await db
    .select()
    .from(salesOrders)
    .orderBy(desc(salesOrders.createdAt))
    .limit(200);

  if (orders.length === 0) return [];

  const items = await db
    .select()
    .from(salesOrderItems)
    .where(inArray(salesOrderItems.orderId, orders.map((o) => o.id)));

  const itemsByOrder = new Map<string, typeof items>();
  for (const it of items) {
    const list = itemsByOrder.get(it.orderId) ?? [];
    list.push(it);
    itemsByOrder.set(it.orderId, list);
  }

  const customerIds = Array.from(new Set(orders.map((o) => o.customerId)));
  const customerRows = await db.select().from(customers).where(inArray(customers.id, customerIds));
  const customerNameById = new Map(customerRows.map((c) => [c.id, c.name]));

  return orders
    .map((o) => {
      const list = itemsByOrder.get(o.id) ?? [];
      const pendingQty = list.reduce((s, i) => s + (i.qty - i.shippedQty), 0);
      return {
        order: o,
        customerName: customerNameById.get(o.customerId) ?? "—",
        pendingQty,
        shippable: pendingQty > 0,
      };
    })
    .filter((o) => o.shippable);
}

/** 取得出貨紀錄 */
export async function getShipments() {
  const rows = await db.select().from(shipments).orderBy(desc(shipments.shippedAt)).limit(200);
  if (rows.length === 0) return [];

  const soIds = Array.from(new Set(rows.map((r) => r.soId)));
  const orders = await db.select().from(salesOrders).where(inArray(salesOrders.id, soIds));
  const orderById = new Map(orders.map((o) => [o.id, o]));

  const items = await db
    .select()
    .from(shipmentItems)
    .where(inArray(shipmentItems.shipmentId, rows.map((r) => r.id)));

  const itemsByShipment = new Map<string, typeof items>();
  for (const it of items) {
    const list = itemsByShipment.get(it.shipmentId) ?? [];
    list.push(it);
    itemsByShipment.set(it.shipmentId, list);
  }

  const customerIds = Array.from(
    new Set(orders.map((o) => o.customerId)),
  ) as string[];
  const customerRows = customerIds.length
    ? await db.select().from(customers).where(inArray(customers.id, customerIds))
    : [];
  const customerNameById = new Map(customerRows.map((c) => [c.id, c.name]));

  return rows.map((r) => {
    const order = orderById.get(r.soId);
    return {
      shipment: r,
      soNo: order?.soNo ?? "—",
      customerName: order ? customerNameById.get(order.customerId) ?? "—" : "—",
      itemCount: (itemsByShipment.get(r.id) ?? []).length,
      totalQty: (itemsByShipment.get(r.id) ?? []).reduce((s, i) => s + i.qty, 0),
    };
  });
}

export async function getOverdueInvoices() {
  const { getReceivables } = await import("@/lib/receivables");
  const receivables = await getReceivables();
  return receivables.filter((r) => r.overdue);
}
