import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { customers, invoices, receivablePayments } from "@/db/schema";
import { getCurrentScope } from "@/lib/scope";

/**
 * 應收帳款的純資料查詢層（不含 Server Action API）。
 * Server Action 放在同目錄的 actions.ts，避免被 client component 誤用而引入 revalidatePath。
 */

export type ReceivableRow = {
  invoice: typeof invoices.$inferSelect;
  partyName: string;
  paidCents: number;
  dueCents: number;
  delayDays: number;
  overdue: boolean;
};

/** 取得應收帳款明細：銷項發票 + 已收款金額 + 逾期天數 */
export async function getReceivables(options?: {
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
}): Promise<ReceivableRow[]> {
  const { from, to, page = 1, pageSize = 20 } = options ?? {};
  const scope = await getCurrentScope();
  const outputInvoices = await db
    .select()
    .from(invoices)
    .where(and(
      inArray(invoices.type, ["output"]),
      scope.filtered ? eq(invoices.partyId, scope.scopeId!) : undefined,
      from ? gte(invoices.invoiceDate, from) : undefined,
      to ? lt(invoices.invoiceDate, to) : undefined,
    ))
    .orderBy(desc(invoices.invoiceDate))
    .limit(pageSize).offset((page - 1) * pageSize);

  if (outputInvoices.length === 0) return [];

  const ids = outputInvoices.map((i) => i.id);
  const payments = await db
    .select()
    .from(receivablePayments)
    .where(inArray(receivablePayments.invoiceId, ids));

  const paidByInvoice = new Map<string, number>();
  for (const p of payments) {
    paidByInvoice.set(p.invoiceId, (paidByInvoice.get(p.invoiceId) ?? 0) + p.amountCents);
  }

  const partyIds = Array.from(new Set(outputInvoices.map((i) => i.partyId).filter(Boolean))) as string[];
  const customerRows = partyIds.length
    ? await db.select().from(customers).where(inArray(customers.id, partyIds))
    : [];
  const customerNameById = new Map(customerRows.map((c) => [c.id, c.name]));

  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  return outputInvoices.map((inv) => {
    const paid = paidByInvoice.get(inv.id) ?? 0;
    const due = inv.amountCents - paid;
    const delayDays = due > 0 ? Math.max(0, Math.round((todayUtc - inv.invoiceDate.getTime()) / 86_400_000)) : 0;
    return {
      invoice: inv,
      partyName: inv.partyId ? customerNameById.get(inv.partyId) ?? "—" : "—",
      paidCents: paid,
      dueCents: due,
      delayDays,
      overdue: due > 0 && delayDays > 30,
    };
  });
}

/** 取得應收帳款總筆數（供分頁用） */
export async function getReceivablesCount(options?: { from?: Date; to?: Date }): Promise<number> {
  const { from, to } = options ?? {};
  const scope = await getCurrentScope();
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(invoices)
    .where(and(
      inArray(invoices.type, ["output"]),
      scope.filtered ? eq(invoices.partyId, scope.scopeId!) : undefined,
      from ? gte(invoices.invoiceDate, from) : undefined,
      to ? lt(invoices.invoiceDate, to) : undefined,
    ));
  return row?.n ?? 0;
}
