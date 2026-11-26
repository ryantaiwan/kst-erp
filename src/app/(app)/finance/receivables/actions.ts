"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invoices, receivablePayments } from "@/db/schema";

/** 登錄收款（可部分收款） */
export async function recordPayment(invoiceId: string, amountCents: number) {
  if (amountCents <= 0) throw new Error("收款金額必須大於 0");

  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  if (!invoice) throw new Error("找不到發票");

  await db.transaction(async (tx) => {
    await tx.insert(receivablePayments).values({
      invoiceId,
      paidAt: new Date(),
      amountCents,
    });

    const paid = await tx
      .select({ amountCents: receivablePayments.amountCents })
      .from(receivablePayments)
      .where(eq(receivablePayments.invoiceId, invoiceId));
    const total = paid.reduce((s, p) => s + p.amountCents, 0);
    const settled = total >= invoice.amountCents;

    await tx
      .update(invoices)
      .set({ status: settled ? "已付款" : "部分付款", paidAt: settled ? new Date() : null })
      .where(eq(invoices.id, invoiceId));
  });

  revalidatePath("/finance/receivables");
  revalidatePath("/finance/invoices");
}
