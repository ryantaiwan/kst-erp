"use server";

import { revalidatePath } from "next/cache";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { invoices, suppliers } from "@/db/schema";

/** 進項發票對帳：登錄或更新發票的付款狀態 */
export async function reconcileInputInvoice(input: {
  invoiceNo: string;
  partyId?: string;
  amountCents: number;
  taxCents: number;
  invoiceDate: string;
  status?: string;
}) {
  const invoiceNo = input.invoiceNo.trim().toUpperCase();
  if (!invoiceNo) throw new Error("請填寫發票號碼");

  const now = new Date(input.invoiceDate);
  const status = input.status ?? "未開";

  const [existing] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.invoiceNo, invoiceNo))
    .limit(1);

  if (existing) {
    await db
      .update(invoices)
      .set({
        amountCents: input.amountCents,
        taxCents: input.taxCents,
        invoiceDate: now,
        status,
        partyId: input.partyId || existing.partyId,
      })
      .where(eq(invoices.id, existing.id));
  } else {
    await db.insert(invoices).values({
      invoiceNo,
      type: "input",
      partyId: input.partyId || null,
      invoiceDate: now,
      amountCents: input.amountCents,
      taxCents: input.taxCents,
      status,
    });
  }

  revalidatePath("/finance/ap");
  revalidatePath("/finance/invoices");
}

export type InputInvoiceRow = {
  invoice: typeof invoices.$inferSelect;
  partyName: string;
};

export type InputInvoiceSummary = {
  rows: InputInvoiceRow[];
  totalCents: number;
  paidCents: number;
  unpaidCents: number;
};

/** 取得進項發票對帳明細 */
export async function getInputInvoices(): Promise<InputInvoiceSummary> {
  const rows = await db
    .select()
    .from(invoices)
    .where(eq(invoices.type, "input"))
    .orderBy(desc(invoices.invoiceDate))
    .limit(500);

  if (rows.length === 0) {
    return { rows: [], totalCents: 0, paidCents: 0, unpaidCents: 0 };
  }

  const partyIds = Array.from(new Set(rows.map((r) => r.partyId).filter(Boolean))) as string[];
  const supplierRows = partyIds.length
    ? await db.select().from(suppliers).where(inArray(suppliers.id, partyIds))
    : [];
  const supplierNameById = new Map(supplierRows.map((s) => [s.id, s.name]));

  const total = rows.reduce((s, r) => s + r.amountCents, 0);
  const paid = rows.filter((r) => r.status === "已付款").reduce((s, r) => s + r.amountCents, 0);

  return {
    rows: rows.map((r) => ({
      invoice: r,
      partyName: r.partyId ? supplierNameById.get(r.partyId) ?? "—" : "—",
    })),
    totalCents: total,
    paidCents: paid,
    unpaidCents: total - paid,
  };
}
