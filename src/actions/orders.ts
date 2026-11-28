"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  customers,
  products,
  purchaseOrderItems,
  purchaseOrders,
  salesOrderItems,
  salesOrders,
  suppliers,
  taxSettings,
} from "@/db/schema";
import { calcTotals } from "@/lib/billing";
import { nextPoNo, nextSoNo } from "@/lib/numbering";

function str(fd: FormData, key: string) { return String(fd.get(key) ?? "").trim(); }

/* ---------- 銷貨訂單 ---------- */

export async function createSalesOrderAction(formData: FormData) {
  const customerId = str(formData, "customerId");
  const description = str(formData, "description");
  const qty = Number(str(formData, "qty"));
  const price = Number(str(formData, "price"));
  if (!customerId || !description || qty <= 0 || price <= 0) {
    throw new Error("請填寫客戶、品名、數量與單價");
  }

  const [tax] = await db.select().from(taxSettings).orderBy(taxSettings.startDate).limit(1);
  const rate = tax?.rateBasisPoints ?? 500;
  const subtotalCents = Math.round(qty * price * 100);
  const { taxCents, totalCents } = calcTotals(subtotalCents, rate);

  const existing = await db.select({ soNo: salesOrders.soNo }).from(salesOrders);
  const soNo = nextSoNo(new Date(), existing.map((r) => r.soNo));
  const productId = str(formData, "productId") || null;

  await db.transaction(async (tx) => {
    const [order] = await tx.insert(salesOrders).values({
      soNo, customerId,
      expectedShipDate: str(formData, "expectedShipDate") ? new Date(`${str(formData, "expectedShipDate")}T00:00:00Z`) : null,
      taxRateSnapshot: rate, subtotalCents, taxCents, totalCents, status: "confirmed",
    }).returning();
    await tx.insert(salesOrderItems).values({
      orderId: order.id, lineNo: 1, productId,
      description, qty, shippedQty: 0,
      priceCents: Math.round(price * 100), subtotalCents,
    });
  });

  revalidatePath("/sales/orders");
  revalidatePath("/sales/shipments");
  return soNo;
}

export async function getSalesOrderDetail(id: string) {
  const [order] = await db.select().from(salesOrders).where(eq(salesOrders.id, id)).limit(1);
  if (!order) return null;
  const [customer] = await db.select().from(customers).where(eq(customers.id, order.customerId)).limit(1);
  const items = await db.select().from(salesOrderItems).where(eq(salesOrderItems.orderId, id));
  const productRows = await db.select({ id: products.id, sku: products.sku, name: products.name }).from(products);
  return { order, customer, items, products: productRows };
}

export async function updateSalesOrder(id: string, formData: FormData) {
  const customerId = str(formData, "customerId");
  const status = str(formData, "status");
  const expectedShipDate = str(formData, "expectedShipDate");
  if (!customerId) throw new Error("請選擇客戶");

  await db.transaction(async (tx) => {
    await tx.update(salesOrders).set({
      customerId, status,
      expectedShipDate: expectedShipDate ? new Date(`${expectedShipDate}T00:00:00Z`) : null,
    }).where(eq(salesOrders.id, id));

    // 更新品項
    const itemIds = str(formData, "itemIds").split(",").filter(Boolean);
    for (const itemId of itemIds) {
      const desc = str(formData, `item_${itemId}_description`);
      const qty = Number(str(formData, `item_${itemId}_qty`));
      const price = Number(str(formData, `item_${itemId}_price`));
      if (!desc || qty <= 0 || price <= 0) continue;
      await tx.update(salesOrderItems).set({
        description: desc, qty,
        priceCents: Math.round(price * 100),
        subtotalCents: Math.round(qty * price * 100),
      }).where(eq(salesOrderItems.id, itemId));
    }
  });

  revalidatePath("/sales/orders");
  revalidatePath(`/sales/orders/${id}`);
  revalidatePath("/sales/shipments");
}

/* ---------- 採購訂單 ---------- */

export async function createPurchaseOrderAction(formData: FormData) {
  const supplierId = str(formData, "supplierId");
  const description = str(formData, "description");
  const qty = Number(str(formData, "qty"));
  const price = Number(str(formData, "price"));
  if (!supplierId || !description || qty <= 0 || price <= 0) {
    throw new Error("請填寫供應商、品名、數量與單價");
  }

  const totalCents = Math.round(qty * price * 100);
  const existing = await db.select({ poNo: purchaseOrders.poNo }).from(purchaseOrders);
  const poNo = nextPoNo(new Date(), existing.map((r) => r.poNo));
  const productId = str(formData, "productId") || null;

  await db.transaction(async (tx) => {
    const [order] = await tx.insert(purchaseOrders).values({
      poNo, supplierId,
      expectedDate: str(formData, "expectedDate") ? new Date(`${str(formData, "expectedDate")}T00:00:00Z`) : null,
      totalCents, status: "confirmed",
    }).returning();
    await tx.insert(purchaseOrderItems).values({
      orderId: order.id, lineNo: 1, productId,
      description, qty, receivedQty: 0,
      unitPriceCents: Math.round(price * 100),
    });
  });

  revalidatePath("/purchasing/orders");
  revalidatePath("/purchasing/receiving");
  return poNo;
}

export async function getPurchaseOrderDetail(id: string) {
  const [order] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).limit(1);
  if (!order) return null;
  const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, order.supplierId)).limit(1);
  const items = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.orderId, id));
  const productRows = await db.select({ id: products.id, sku: products.sku, name: products.name }).from(products);
  return { order, supplier, items, products: productRows };
}

export async function updatePurchaseOrder(id: string, formData: FormData) {
  const supplierId = str(formData, "supplierId");
  const status = str(formData, "status");
  const expectedDate = str(formData, "expectedDate");
  if (!supplierId) throw new Error("請選擇供應商");

  await db.transaction(async (tx) => {
    await tx.update(purchaseOrders).set({
      supplierId, status,
      expectedDate: expectedDate ? new Date(`${expectedDate}T00:00:00Z`) : null,
    }).where(eq(purchaseOrders.id, id));

    const itemIds = str(formData, "itemIds").split(",").filter(Boolean);
    for (const itemId of itemIds) {
      const desc = str(formData, `item_${itemId}_description`);
      const qty = Number(str(formData, `item_${itemId}_qty`));
      const price = Number(str(formData, `item_${itemId}_price`));
      if (!desc || qty <= 0 || price <= 0) continue;
      await tx.update(purchaseOrderItems).set({
        description: desc, qty,
        unitPriceCents: Math.round(price * 100),
      }).where(eq(purchaseOrderItems.id, itemId));
    }
    // 重算總額
    const all = await tx.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.orderId, id));
    const total = all.reduce((s, i) => s + i.qty * i.unitPriceCents, 0);
    await tx.update(purchaseOrders).set({ totalCents: total }).where(eq(purchaseOrders.id, id));
  });

  revalidatePath("/purchasing/orders");
  revalidatePath(`/purchasing/orders/${id}`);
  revalidatePath("/purchasing/receiving");
}

export async function deleteSalesOrder(id: string) {
  await db.delete(salesOrders).where(eq(salesOrders.id, id));
  revalidatePath("/sales/orders");
  revalidatePath("/sales/shipments");
}

export async function deletePurchaseOrder(id: string) {
  await db.delete(purchaseOrders).where(eq(purchaseOrders.id, id));
  revalidatePath("/purchasing/orders");
  revalidatePath("/purchasing/receiving");
}
