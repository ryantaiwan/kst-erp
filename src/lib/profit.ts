import { desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { profitRecords } from "@/db/schema";

/**
 * 利潤與分潤的唯讀資料層。
 * 不含 revalidatePath，供 server component 與 server action 共用。
 */

export async function getProfitSummary() {
  const [row] = await db
    .select({
      count: sql<number>`count(*)`,
      profitCents: sql<number>`coalesce(sum(${profitRecords.profitCents}), 0)`,
      companyBaseCents: sql<number>`coalesce(sum(${profitRecords.companyBaseCents}), 0)`,
      salespersonCents: sql<number>`coalesce(sum(${profitRecords.salespersonCents}), 0)`,
      remainderCents: sql<number>`coalesce(sum(${profitRecords.companyRemainderCents}), 0)`,
    })
    .from(profitRecords);

  const [settled] = await db
    .select({
      count: sql<number>`count(*)`,
      salespersonCents: sql<number>`coalesce(sum(${profitRecords.salespersonCents}), 0)`,
    })
    .from(profitRecords)
    .where(isNotNull(profitRecords.settledAt));

  return {
    count: row?.count ?? 0,
    profitCents: row?.profitCents ?? 0,
    companyBaseCents: row?.companyBaseCents ?? 0,
    salespersonCents: row?.salespersonCents ?? 0,
    remainderCents: row?.remainderCents ?? 0,
    settledCount: settled?.count ?? 0,
    settledSalespersonCents: settled?.salespersonCents ?? 0,
    unsettledSalespersonCents: (row?.salespersonCents ?? 0) - (settled?.salespersonCents ?? 0),
  };
}

export type ProfitFilter = "all" | "settled" | "unsettled";

export async function getProfitRecords(
  filter: ProfitFilter = "all",
  page = 1,
  pageSize = 20,
) {
  const where =
    filter === "settled"
      ? isNotNull(profitRecords.settledAt)
      : filter === "unsettled"
        ? isNull(profitRecords.settledAt)
        : undefined;

  return db.select().from(profitRecords).where(where)
    .orderBy(desc(profitRecords.createdAt))
    .limit(pageSize).offset((page - 1) * pageSize);
}

/** 依狀態取得利潤紀錄筆數（供分頁用） */
export async function getProfitRecordsCount(filter: ProfitFilter = "all"): Promise<number> {
  const where =
    filter === "settled"
      ? isNotNull(profitRecords.settledAt)
      : filter === "unsettled"
        ? isNull(profitRecords.settledAt)
        : undefined;
  const [row] = await db.select({ n: sql<number>`count(*)` }).from(profitRecords).where(where);
  return row?.n ?? 0;
}

/** 取得尚未結算且有業務分潤的紀錄（供結算作業使用） */
export async function getUnsettledWithCommission(limit = 500) {
  return db
    .select()
    .from(profitRecords)
    .where(sql`${profitRecords.settledAt} is null and ${profitRecords.salespersonCents} > 0`)
    .orderBy(desc(profitRecords.salespersonCents))
    .limit(limit);
}

export async function getProfitRecord(id: string) {
  const [row] = await db.select().from(profitRecords).where(eq(profitRecords.id, id)).limit(1);
  return row;
}
