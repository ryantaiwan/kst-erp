import { and, asc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { invoices } from "@/db/schema";

/**
 * 稅務彙總報表資料層（唯讀）。
 * 歷史資料的 tax_cents 多為 0（稅額內含於金額），故同時提供「已紀錄稅額」
 * 與「依税率快照推估稅額」兩種數字。
 */

export type InvoiceType = "output" | "input";

export type TaxSummaryRow = {
  type: InvoiceType;
  status: string;
  count: number;
  amountCents: number;
  taxCents: number;
};

export type TaxSummaryParams = {
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD（不含當日）
};

function dateBounds(params: TaxSummaryParams) {
  const conditions = [];
  if (params.from) {
    const d = new Date(`${params.from}T00:00:00Z`);
    if (!Number.isNaN(d.getTime())) conditions.push(gte(invoices.invoiceDate, d));
  }
  if (params.to) {
    const d = new Date(`${params.to}T00:00:00Z`);
    if (!Number.isNaN(d.getTime())) conditions.push(lt(invoices.invoiceDate, d));
  }
  return conditions;
}

export async function getTaxSummary(params: TaxSummaryParams = {}): Promise<TaxSummaryRow[]> {
  const conditions = dateBounds(params);
  const where = conditions.length ? and(...conditions) : undefined;

  return db
    .select({
      type: invoices.type,
      status: invoices.status,
      count: sql<number>`count(*)`,
      amountCents: sql<number>`coalesce(sum(${invoices.amountCents}), 0)`,
      taxCents: sql<number>`coalesce(sum(${invoices.taxCents}), 0)`,
    })
    .from(invoices)
    .where(where)
    .groupBy(invoices.type, invoices.status)
    .orderBy(asc(invoices.type), asc(invoices.status)) as Promise<TaxSummaryRow[]>;
}

export type MonthlyTaxRow = {
  month: string;
  outputCount: number;
  outputAmountCents: number;
  outputTaxCents: number;
  inputCount: number;
  inputAmountCents: number;
  inputTaxCents: number;
};

/**
 * 依月份彙總銷項 / 進項。
 * SQLite 的 strftime 直接對 timestamp（秒）做格式化，需搭配 'unixepoch'。
 */
export async function getMonthlyTax(params: TaxSummaryParams = {}): Promise<MonthlyTaxRow[]> {
  const conditions = dateBounds(params);
  const where = conditions.length ? and(...conditions) : undefined;

  const rows = await db
    .select({
      month: sql<string>`strftime('%Y-%m', ${invoices.invoiceDate}, 'unixepoch')`,
      type: invoices.type,
      count: sql<number>`count(*)`,
      amountCents: sql<number>`coalesce(sum(${invoices.amountCents}), 0)`,
      taxCents: sql<number>`coalesce(sum(${invoices.taxCents}), 0)`,
    })
    .from(invoices)
    .where(and(where, sql`${invoices.status} not in ('void', '作廢')`))
    .groupBy(sql`strftime('%Y-%m', ${invoices.invoiceDate}, 'unixepoch')`, invoices.type)
    .orderBy(sql`strftime('%Y-%m', ${invoices.invoiceDate}, 'unixepoch')`);

  const map = new Map<string, MonthlyTaxRow>();
  for (const r of rows) {
    const row = map.get(r.month) ?? {
      month: r.month,
      outputCount: 0,
      outputAmountCents: 0,
      outputTaxCents: 0,
      inputCount: 0,
      inputAmountCents: 0,
      inputTaxCents: 0,
    };
    if (r.type === "output") {
      row.outputCount = r.count;
      row.outputAmountCents = r.amountCents;
      row.outputTaxCents = r.taxCents;
    } else {
      row.inputCount = r.count;
      row.inputAmountCents = r.amountCents;
      row.inputTaxCents = r.taxCents;
    }
    map.set(r.month, row);
  }
  return [...map.values()];
}

/** 取得可用來篩選的日期範圍 */
export async function getInvoiceDateRange() {
  const [row] = await db
    .select({
      min: sql<number>`min(${invoices.invoiceDate})`,
      max: sql<number>`max(${invoices.invoiceDate})`,
    })
    .from(invoices);
  const iso = (n: number | null) => (n ? new Date(n * 1000).toISOString().slice(0, 10) : "");
  return { min: iso(row?.min ?? null), max: iso(row?.max ?? null) };
}
