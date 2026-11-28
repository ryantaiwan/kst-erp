"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  invoices,
  invoiceItems,
  profitRecords,
  purchaseOrders,
  purchaseOrderItems,
  purchaseRequests,
  quoteItems,
  quotes,
  salesOrderItems,
  salesOrders,
  shipmentItems,
} from "@/db/schema";
import { calcTotals } from "@/lib/billing";
import { currentTaxRate } from "@/app/(app)/sales/quotes/actions";

function str(fd: FormData, key: string) { return String(fd.get(key) ?? "").trim(); }
function d(fd: FormData, key: string) {
  const v = str(fd, key);
  if (!v) return null;
  const date = new Date(`${v}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) throw new Error(`${key} 日期無效`);
  return date;
}

/* ---------- 報價單更新 ---------- */

export async function updateQuote(quoteId: string, formData: FormData) {
  const customerId = str(formData, "customerId");
  const handler = str(formData, "handler") || null;
  const note = str(formData, "note") || null;
  const validUntil = d(formData, "validUntil");
  const rate = await currentTaxRate();

  const items: { description: string; qty: number; priceCents: number }[] = [];
  for (const [key, value] of formData.entries()) {
    const m = key.match(/^item_(\d+)_(description|qty|price)$/);
    if (!m) continue;
    const idx = Number(m[1]);
    items[idx] ??= { description: "", qty: 1, priceCents: 0 };
    if (m[2] === "description") items[idx].description = String(value);
    if (m[2] === "qty") items[idx].qty = Number(value) || 1;
    if (m[2] === "price") items[idx].priceCents = Math.round(Number(value) * 100);
  }
  const valid = items.filter((i) => i.description && i.priceCents > 0);
  if (!customerId || valid.length === 0) throw new Error("客戶與至少一筆品項為必填");

  const subtotalCents = valid.reduce((s, i) => s + i.priceCents * i.qty, 0);
  const { taxCents, totalCents } = calcTotals(subtotalCents, rate);

  await db.transaction(async (tx) => {
    await tx.update(quotes).set({
      customerId, handler, note, validUntil,
      taxRateSnapshot: rate, subtotalCents, taxCents, totalCents,
    }).where(eq(quotes.id, quoteId));
    await tx.delete(quoteItems).where(eq(quoteItems.quoteId, quoteId));
    await tx.insert(quoteItems).values(valid.map((i, index) => ({
      quoteId, lineNo: index + 1, description: i.description, qty: i.qty,
      unit: "顆", priceCents: i.priceCents, subtotalCents: i.priceCents * i.qty,
    })));
  });
  revalidatePath("/sales/quotes");
  revalidatePath(`/sales/quotes/${quoteId}`);
}

/* ---------- 銷貨訂單 ---------- */

export async function updateSalesOrderStatus(orderId: string, status: string) {
  const allowed = ["draft", "confirmed", "shipped", "partial_shipped", "done", "cancelled"];
  if (!allowed.includes(status)) throw new Error("無效的訂單狀態");
  await db.update(salesOrders).set({ status }).where(eq(salesOrders.id, orderId));
  revalidatePath("/sales/orders");
  revalidatePath("/sales/shipments");
}

export async function splitOrderItem(itemId: string, newLineNo: number) {
  const [item] = await db.select().from(salesOrderItems).where(eq(salesOrderItems.id, itemId));
  if (!item) throw new Error("找不到訂單品項");
  if (item.qty < 2) throw new Error("數量小於 2 無法拆分");

  await db.transaction(async (tx) => {
    await tx.update(salesOrderItems).set({ qty: 1, subtotalCents: item.priceCents })
      .where(eq(salesOrderItems.id, itemId));
    await tx.insert(salesOrderItems).values({
      orderId: item.orderId,
      lineNo: newLineNo,
      productId: item.productId,
      description: item.description,
      qty: item.qty - 1,
      shippedQty: 0,
      priceCents: item.priceCents,
      subtotalCents: item.priceCents * (item.qty - 1),
    });
  });
  revalidatePath("/sales/orders");
}

/* ---------- 出貨 ---------- */

export async function linkReleaseNo(shipmentItemId: string, releaseNo: string, serialNo: string) {
  await db.update(shipmentItems).set({
    releaseNo: releaseNo || null,
    serialNo: serialNo || null,
  }).where(eq(shipmentItems.id, shipmentItemId));
  revalidatePath("/sales/shipments");
}

/* ---------- 採購 ---------- */

export async function sendRfq(rfqId: string) {
  await db.update(purchaseRequests).set({ status: "sent" }).where(eq(purchaseRequests.id, rfqId));
  revalidatePath("/purchasing/rfq");
}

export async function receivePartial(orderId: string, itemId: string, qty: number) {
  if (qty <= 0) throw new Error("入庫數量必須大於 0");
  await db.transaction(async (tx) => {
    const [item] = await tx.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.id, itemId));
    if (!item || item.orderId !== orderId) throw new Error("找不到採購品項");
    const next = item.receivedQty + qty;
    if (next > item.qty) throw new Error("累計入庫不可超過訂購數量");
    await tx.update(purchaseOrderItems).set({ receivedQty: next }).where(eq(purchaseOrderItems.id, itemId));

    const pending = await tx.select().from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.orderId, orderId));
    const done = pending.every((i) => i.receivedQty >= i.qty);
    await tx.update(purchaseOrders).set({ status: done ? "received" : "partial_received" })
      .where(eq(purchaseOrders.id, orderId));
  });
  revalidatePath("/purchasing/orders");
}

/* ---------- 發票 ---------- */

export async function createInvoice(formData: FormData) {
  const invoiceNo = str(formData, "invoiceNo");
  const type = str(formData, "type");
  const date = d(formData, "invoiceDate");
  const amount = Math.round(Number(str(formData, "amount")) * 100);
  if (!invoiceNo || !["output", "input"].includes(type) || !date || amount <= 0) {
    throw new Error("發票號碼、類型、日期與金額為必填");
  }
  const taxCents = Math.round(amount * 0.05);

  await db.transaction(async (tx) => {
    await tx.insert(invoices).values({
      invoiceNo, type, partyId: str(formData, "partyId") || null,
      invoiceDate: date, amountCents: amount, taxCents,
      status: str(formData, "status") || "已開立",
    });
    const description = str(formData, "description");
    if (description) {
      const [created] = await tx.select().from(invoices).where(eq(invoices.invoiceNo, invoiceNo));
      await tx.insert(invoiceItems).values({
        invoiceId: created.id, description, amountCents: amount, taxCents,
      });
    }
  });
  revalidatePath("/finance/invoices");
  revalidatePath("/finance/ap");
  revalidatePath("/finance/receivables");
  revalidatePath("/finance/tax-summary");
}

export async function voidInvoice(invoiceId: string) {
  await db.update(invoices).set({ status: "void" }).where(eq(invoices.id, invoiceId));
  revalidatePath("/finance/invoices");
  revalidatePath("/finance/tax-summary");
}

export async function linkInvoiceToOrder(invoiceId: string, orderId: string) {
  await db.insert(invoiceItems).values({
    invoiceId, refType: "sales_order", refId: orderId,
    description: "銷貨订单", amountCents: 0, taxCents: 0,
  });
  revalidatePath("/finance/invoices");
}

/* ---------- 利潤鎖定 ---------- */

/** 鎖定利潤紀錄：以 settledAt 標記，鎖定後不得再調整業務% */
export async function lockProfitRecord(ids: string[]) {
  if (ids.length === 0) throw new Error("請選擇至少一筆");
  await db.update(profitRecords).set({ settledAt: new Date() }).where(inArray(profitRecords.id, ids));
  revalidatePath("/finance/profit");
}

/* ---------- 到期提醒（Resend） ---------- */

export async function sendReminder(invoiceId: string, to: string) {
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
  if (!invoice) throw new Error("找不到發票");
  if (!to.includes("@")) throw new Error("無效的 Email");
  if (!process.env.RESEND_API_KEY) throw new Error("尚未設定 RESEND_API_KEY");

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: "KST ERP <onboarding@resend.dev>",
    to,
    subject: `[KST ERP] 應收帳款提醒 - ${invoice.invoiceNo}`,
    text: `發票號碼：${invoice.invoiceNo}\n發票金額：${(invoice.amountCents / 100).toLocaleString("zh-TW")} 元\n\n請盡速處理，謝謝。`,
  });
  if (error) throw new Error(error.message ?? "寄送失敗");
}

/* ---------- 報價單 PDF 存档至 Vercel Blob ---------- */

export async function archiveQuotePdf(quoteId: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { archived: false, reason: "BLOB_READ_WRITE_TOKEN 未設定" };
  }
  const { getQuoteDetail } = await import("@/app/(app)/sales/quotes/actions");
  const { generateQuotePdf } = await import("@/lib/quote-pdf");
  const { put } = await import("@vercel/blob");
  const { attachments } = await import("@/db/schema");

  const detail = await getQuoteDetail(quoteId);
  if (!detail) throw new Error("找不到報價單");

  const pdf = await generateQuotePdf({
    quoteNo: detail.quote.quoteNo,
    quoteDate: detail.quote.quoteDate,
    validUntil: detail.quote.validUntil,
    customerName: detail.customer?.name ?? "",
    contactName: detail.contact?.name ?? null,
    contactPhone: detail.contact?.mobile ?? detail.contact?.phone ?? null,
    customerTaxId: detail.customer?.taxId ?? null,
    customerAddress: detail.customer?.address ?? null,
    handler: detail.quote.handler,
    taxRateBasisPoints: detail.quote.taxRateSnapshot,
    subtotalCents: detail.quote.subtotalCents,
    taxCents: detail.quote.taxCents,
    totalCents: detail.quote.totalCents,
    note: detail.quote.note,
    items: detail.items.map((i) => ({
      lineNo: i.lineNo, description: i.description, qty: i.qty,
      unit: i.unit, priceCents: i.priceCents, subtotalCents: i.subtotalCents,
    })),
  });

  const pathname = `quotes/${detail.quote.quoteNo}.pdf`;
  const blob = await put(pathname, Buffer.from(pdf), {
    access: "private",
    contentType: "application/pdf",
    addRandomSuffix: false,
  });

  await db.insert(attachments).values({
    blobUrl: blob.url,
    pathname,
    mime: "application/pdf",
    ownerType: "quote",
    ownerId: quoteId,
    uploadedBy: "system",
  });

  revalidatePath(`/sales/quotes/${quoteId}`);
  return { archived: true, url: blob.url };
}

/* ---------- 進項發票編輯 ---------- */

export async function updateInputInvoice(formData: FormData) {
  const id = str(formData, "id");
  if (!id) throw new Error("缺少發票 ID");
  const amount = Math.round(Number(str(formData, "amount")) * 100);
  const date = d(formData, "invoiceDate");
  if (amount <= 0 || !date) throw new Error("金額與日期為必填");

  await db.update(invoices).set({
    invoiceNo: str(formData, "invoiceNo"),
    invoiceDate: date,
    amountCents: amount,
    taxCents: Math.round(amount * 0.05),
    status: str(formData, "status") || "待付款",
    paidAt: str(formData, "paidAt") ? new Date(`${str(formData, "paidAt")}T00:00:00Z`) : null,
  }).where(eq(invoices.id, id));

  revalidatePath("/finance/ap");
  revalidatePath("/finance/invoices");
  revalidatePath("/finance/tax-summary");
}

export async function deleteInvoice(id: string) {
  await db.delete(invoices).where(eq(invoices.id, id));
  revalidatePath("/finance/ap");
  revalidatePath("/finance/invoices");
  revalidatePath("/finance/tax-summary");
  revalidatePath("/finance/receivables");
}
