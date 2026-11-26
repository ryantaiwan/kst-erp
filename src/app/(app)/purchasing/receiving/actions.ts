"use server";

import { revalidatePath } from "next/cache";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  inventory,
  inventoryTransactions,
  purchaseOrderItems,
  purchaseOrders,
  receivingItems,
  receivingOrders,
  suppliers,
  warehouses,
} from "@/db/schema";

/** 建立入庫單：回寫採購訂單 receivedQty 並異動庫存 */
export async function createReceiving(input: {
  poId: string;
  warehouseId: string;
  note?: string;
  items: Array<{ orderItemId: string; productId?: string; releaseNo?: string; auSku?: string; serialNo?: string; qty: number }>;
}) {
  const items = input.items.filter((i) => i.qty > 0);
  if (items.length === 0) throw new Error("請至少填寫一筆入庫數量");

  const [order] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, input.poId)).limit(1);
  if (!order) throw new Error("找不到採購訂單");

  const now = new Date();
  const existing = await db.select({ receiveNo: receivingOrders.receiveNo }).from(receivingOrders);
  const prefix = `RC${now.getUTCFullYear() - 1911}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}`;
  let seq = 1;
  while (existing.some((r) => r.receiveNo === `${prefix}${String(seq).padStart(3, "0")}`)) seq += 1;
  const receiveNo = `${prefix}${String(seq).padStart(3, "0")}`;

  await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(receivingOrders)
      .values({
        receiveNo,
        poId: input.poId,
        receivedAt: now,
        note: input.note || null,
      })
      .returning();

    await tx.insert(receivingItems).values(
      items.map((i) => ({
        receiveId: row.id,
        productId: i.productId || null,
        releaseNo: i.releaseNo || null,
        auSku: i.auSku || null,
        serialNo: i.serialNo || null,
        qty: i.qty,
      })),
    );

    for (const i of items) {
      const [oi] = await tx
        .select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.id, i.orderItemId))
        .limit(1);
      if (!oi) continue;

      await tx
        .update(purchaseOrderItems)
        .set({ receivedQty: oi.receivedQty + i.qty })
        .where(eq(purchaseOrderItems.id, i.orderItemId));

      if (i.productId) {
        await tx
          .insert(inventoryTransactions)
          .values({
            productId: i.productId,
            warehouseId: input.warehouseId,
            type: "in",
            qty: i.qty,
            refType: "receiving_order",
            refId: row.id,
          });

        const [inv] = await tx
          .select()
          .from(inventory)
          .where(eq(inventory.productId, i.productId))
          .limit(1);

        if (inv) {
          await tx
            .update(inventory)
            .set({ qty: inv.qty + i.qty, updatedAt: new Date() })
            .where(eq(inventory.productId, i.productId));
        } else {
          await tx.insert(inventory).values({
            productId: i.productId,
            warehouseId: input.warehouseId,
            qty: i.qty,
          });
        }
      }
    }

    const allItems = await tx
      .select()
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.orderId, input.poId));
    const fullyReceived = allItems.every((i) => i.receivedQty >= i.qty);
    await tx
      .update(purchaseOrders)
      .set({ status: fullyReceived ? "received" : "partial_received" })
      .where(eq(purchaseOrders.id, input.poId));
  });

  revalidatePath("/purchasing/receiving");
  revalidatePath("/purchasing/orders");
  revalidatePath("/master/inventory");
  return receiveNo;
}

/** 取得待入庫的採購訂單與其未收品項 */
export async function getPendingReceipts() {
  const orders = await db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.createdAt)).limit(200);
  if (orders.length === 0) return [];

  const items = await db
    .select()
    .from(purchaseOrderItems)
    .where(inArray(purchaseOrderItems.orderId, orders.map((o) => o.id)));

  const itemsByOrder = new Map<string, typeof items>();
  for (const it of items) {
    const list = itemsByOrder.get(it.orderId) ?? [];
    list.push(it);
    itemsByOrder.set(it.orderId, list);
  }

  const supplierIds = Array.from(new Set(orders.map((o) => o.supplierId)));
  const supplierRows = await db.select().from(suppliers).where(inArray(suppliers.id, supplierIds));
  const supplierNameById = new Map(supplierRows.map((s) => [s.id, s.name]));

  return orders
    .map((o) => {
      const list = itemsByOrder.get(o.id) ?? [];
      const pending = list.filter((i) => i.receivedQty < i.qty);
      return {
        order: o,
        supplierName: supplierNameById.get(o.supplierId) ?? "—",
        pendingItems: pending.map((i) => ({
          id: i.id,
          productId: i.productId,
          description: i.description,
          qty: i.qty,
          receivedQty: i.receivedQty,
          pendingQty: i.qty - i.receivedQty,
        })),
      };
    })
    .filter((o) => o.pendingItems.length > 0);
}

/** 取得入庫紀錄 */
export async function getReceivingRecords() {
  const rows = await db.select().from(receivingOrders).orderBy(desc(receivingOrders.receivedAt)).limit(200);
  if (rows.length === 0) return [];

  const poIds = Array.from(new Set(rows.map((r) => r.poId)));
  const orders = await db.select().from(purchaseOrders).where(inArray(purchaseOrders.id, poIds));
  const orderById = new Map(orders.map((o) => [o.id, o]));

  const supplierIds = Array.from(new Set(orders.map((o) => o.supplierId)));
  const supplierRows = supplierIds.length
    ? await db.select().from(suppliers).where(inArray(suppliers.id, supplierIds))
    : [];
  const supplierNameById = new Map(supplierRows.map((s) => [s.id, s.name]));

  const items = await db
    .select()
    .from(receivingItems)
    .where(inArray(receivingItems.receiveId, rows.map((r) => r.id)));

  const itemsByReceive = new Map<string, typeof items>();
  for (const it of items) {
    const list = itemsByReceive.get(it.receiveId) ?? [];
    list.push(it);
    itemsByReceive.set(it.receiveId, list);
  }

  return rows.map((r) => {
    const order = orderById.get(r.poId);
    const list = itemsByReceive.get(r.id) ?? [];
    return {
      receiving: r,
      poNo: order?.poNo ?? "—",
      supplierName: order ? supplierNameById.get(order.supplierId) ?? "—" : "—",
      lineCount: list.length,
      totalQty: list.reduce((s, i) => s + i.qty, 0),
    };
  });
}

export async function getWarehouseList() {
  return db.select().from(warehouses);
}
