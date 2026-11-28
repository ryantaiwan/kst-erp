/**
 * 年度 / 期別篩選共用工具。
 * 期別採台灣營業稅雙月申報慣例：1-2 月為第 1 期，…，11-12 月為第 6 期。
 */

export const PERIODS = [
  { value: 1, label: "1-2 月", startMonth: 1, endMonth: 3 },
  { value: 2, label: "3-4 月", startMonth: 3, endMonth: 5 },
  { value: 3, label: "5-6 月", startMonth: 5, endMonth: 7 },
  { value: 4, label: "7-8 月", startMonth: 7, endMonth: 9 },
  { value: 5, label: "9-10 月", startMonth: 9, endMonth: 11 },
  { value: 6, label: "11-12 月", startMonth: 11, endMonth: 13 },
];

export const PAGE_SIZE = 20;

/** 目前日期所屬的雙月期別（1-2 月為第 1 期） */
export function currentPeriod(date = new Date()) {
  return Math.floor(date.getUTCMonth() / 2) + 1;
}

/** 前期別：第 1 期的前一期是去年的第 6 期 */
export function previousPeriod(date = new Date()) {
  const p = currentPeriod(date);
  return p === 1 ? { year: date.getUTCFullYear() - 1, period: 6 } : { year: date.getUTCFullYear(), period: p - 1 };
}

export type PeriodParams = {
  year?: string;
  period?: string;
  page?: string;
};

/** 解析篩選參數，回傳 UTC 期間邊界與分頁資訊 */
export function parsePeriod(params: PeriodParams) {
  const year = params.year && /^\d{4}$/.test(params.year) ? Number(params.year) : null;
  const periodValue = params.period ? Number(params.period) : null;
  const period = PERIODS.find((p) => p.value === periodValue) ?? null;
  const page = Math.max(1, Number(params.page) || 1);

  let from: Date | undefined;
  let to: Date | undefined;
  if (year && period) {
    from = new Date(Date.UTC(year, period.startMonth - 1, 1));
    to = new Date(Date.UTC(year, period.endMonth - 1, 1));
  } else if (year) {
    from = new Date(Date.UTC(year, 0, 1));
    to = new Date(Date.UTC(year + 1, 0, 1));
  }

  return { year, period, page, from, to, pageSize: PAGE_SIZE };
}

/** 產生分頁連結時保留既有篩選條件 */
export function periodQuery(params: PeriodParams, overrides: Partial<PeriodParams> = {}) {
  const merged = { ...params, ...overrides };
  const q = new URLSearchParams();
  if (merged.year) q.set("year", merged.year);
  if (merged.period && merged.period !== "0") q.set("period", merged.period);
  if (merged.page && merged.page !== "1") q.set("page", merged.page);
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** 由頁碼與總筆數計算顯示範圍 */
export function pageInfo(page: number, total: number, pageSize = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * pageSize + 1;
  const end = Math.min(current * pageSize, total);
  return { totalPages, current, start, end, hasPrev: current > 1, hasNext: current < totalPages };
}

import { sql, type SQL } from "drizzle-orm";
import { db } from "@/db";

/**
 * 取得指定資料表的年度清單。
 * 需注意 SQLite timestamp 以秒儲存，strftime 要加 'unixepoch'。
 */
export async function getYearsFrom(table: string, dateColumn: string): Promise<number[]> {
  const rows = await db.all<{ year: number }>(sql`
    select cast(strftime('%Y', ${sql.raw(dateColumn)}, 'unixepoch') as integer) as year
    from ${sql.raw(table)}
    where ${sql.raw(dateColumn)} is not null
    group by year
    order by year desc
  ` satisfies SQL);
  return rows.map((r) => r.year).filter((y) => Number.isFinite(y));
}
