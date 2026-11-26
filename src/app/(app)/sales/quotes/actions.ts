"use server";

import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  customerContacts,
  customers,
  quoteItems,
  quotes,
  salesOrderItems,
  salesOrders,
  taxSettings,
} from "@/db/schema";
import { calcTotals } from "@/lib/billing";
import { nextQuoteNo } from "@/lib/numbering";

/** 取目前適用的稅率（以開始日期最新者為準） */
export async function currentTaxRate() {
  const [tax] = await db
    .select()
    .from(taxSettings)
    .orderBy(desc(taxSettings.startDate))
    .limit(1);
  return tax?.rateBasisPoints ?? 500;
}

type QuoteForm = {
  customerId: string;
  contactId?: string;
  quoteNo?: string;
  validDays?: number;
  handler?: string;
  note?: string;
  items: Array<{ description: string; qty: number; unit: string; priceCents: number }>;
};

/** 新增報價單：金額未稅，稅金依系統設定外加，並快照當下稅率 */
export async function createQuote(input: QuoteForm) {
  const items = input.items.filter((i) => i.description.trim() && i.qty > 0);
  if (!input.customerId || items.length === 0) {
    throw new Error("請選擇客戶並至少填寫一個品項");
  }

  const rate = await currentTaxRate();
  const now = new Date();
  const existing = await db.select({ quoteNo: quotes.quoteNo }).from(quotes);
  const quoteNo = input.quoteNo?.trim() || nextQuoteNo(now, existing.map((q) => q.quoteNo));

  const subtotalCents = items.reduce((sum, i) => sum + i.priceCents * i.qty, 0);
  const { taxCents, totalCents } = calcTotals(subtotalCents, rate);
  const validUntil = new Date(now.getTime() + (input.validDays ?? 30) * 86_400_000);

  await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(quotes)
      .values({
        quoteNo,
        customerId: input.customerId,
        contactId: input.contactId || null,
        quoteDate: now,
        validUntil,
        taxRateSnapshot: rate,
        subtotalCents,
        taxCents,
        totalCents,
        status: "draft",
        handler: input.handler || null,
        note: input.note || null,
      })
      .returning();

    await tx.insert(quoteItems).values(
      items.map((i, idx) => ({
        quoteId: row.id,
        lineNo: idx + 1,
        description: i.description.trim(),
        qty: i.qty,
        unit: i.unit || "顆",
        priceCents: i.priceCents,
        subtotalCents: i.priceCents * i.qty,
      })),
    );
  });

  revalidatePath("/sales/quotes");
  return quoteNo;
}

/** 確認報價單（凍結內容與稅率） */
export async function confirmQuote(quoteId: string) {
  await db.update(quotes).set({ status: "confirmed" }).where(eq(quotes.id, quoteId));
  revalidatePath("/sales/quotes");
  revalidatePath(`/sales/quotes/${quoteId}`);
}

/** 報價單轉銷貨訂單：沿用報價單的稅率快照，不重新抓當下稅率 */
export async function convertQuoteToSalesOrder(quoteId: string) {
  const [quote] = await db.select().from(quotes).where(eq(quotes.id, quoteId)).limit(1);
  if (!quote) throw new Error("找不到報價單");
  if (quote.status === "converted") throw new Error("此報價單已轉為銷貨訂單");

  const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId));
  if (items.length === 0) throw new Error("報價單沒有品項");

  const now = new Date();
  const existing = await db.select({ soNo: salesOrders.soNo }).from(salesOrders);
  const soNo = `SO${quote.quoteNo.replace(/^Q/, "")}`;

  await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(salesOrders)
      .values({
        soNo,
        customerId: quote.customerId,
        quoteId: quote.id,
        expectedShipDate: null,
        taxRateSnapshot: quote.taxRateSnapshot,
        subtotalCents: quote.subtotalCents,
        taxCents: quote.taxCents,
        totalCents: quote.totalCents,
        status: "confirmed",
      })
      .returning();

    await tx.insert(salesOrderItems).values(
      items.map((i) => ({
        orderId: order.id,
        lineNo: i.lineNo,
        description: i.description,
        qty: i.qty,
        shippedQty: 0,
        priceCents: i.priceCents,
        subtotalCents: i.subtotalCents,
      })),
    );

    await tx.update(quotes).set({ status: "converted" }).where(eq(quotes.id, quoteId));
  });

  void existing;
  void now;
  revalidatePath("/sales/quotes");
  revalidatePath("/sales/orders");
  return soNo;
}

/** 取得報價單完整資料（含客戶、聯絡人、品項） */
export async function getQuoteDetail(quoteId: string) {
  const [quote] = await db.select().from(quotes).where(eq(quotes.id, quoteId)).limit(1);
  if (!quote) return null;

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, quote.customerId))
    .limit(1);

  const contact = quote.contactId
    ? (await db.select().from(customerContacts).where(eq(customerContacts.id, quote.contactId)).limit(1))[0]
    : undefined;

  const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId));

  return { quote, customer, contact, items };
}
