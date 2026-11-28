"use server";

import { revalidatePath } from "next/cache";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { profitRecords } from "@/db/schema";
import { calcProfit } from "@/lib/billing";

/** 調整單筆紀錄的業務分潤百分比（以利潤為基數） */
export async function updateSalespersonPercent(id: string, percent: number) {
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new Error("業務分潤比例必須在 0–100 之間");
  }

  const [row] = await db.select().from(profitRecords).where(inArray(profitRecords.id, [id])).limit(1);
  if (!row) throw new Error("找不到利潤紀錄");

  // 取目前的公司基本留比例（以該筆利潤反推，四捨五入至整數）
  const companyBasePercent = row.profitCents > 0
    ? Math.round((row.companyBaseCents / row.profitCents) * 100)
    : 65;

  const result = calcProfit({
    revenueCents: row.revenueCents,
    costCents: row.costCents,
    companyBasePercent,
    salespersonPercent: percent,
  });

  await db
    .update(profitRecords)
    .set({
      salespersonPercent: percent,
      salespersonCents: result.salespersonCents,
      companyBaseCents: result.companyBaseCents,
      companyRemainderCents: result.companyRemainderCents,
    })
    .where(inArray(profitRecords.id, [id]));

  revalidatePath("/finance/profit");
}

/** 將選取的紀錄標記為已結算 */
export async function settleProfit(ids: string[]) {
  if (ids.length === 0) throw new Error("請選擇至少一筆紀錄");
  if (ids.length > 500) throw new Error("單次最多結算 500 筆");

  await db
    .update(profitRecords)
    .set({ settledAt: new Date() })
    .where(inArray(profitRecords.id, ids));

  revalidatePath("/finance/profit");
}

/** 撤銷結算（主要用于誤操作修正） */
export async function unSettleProfit(ids: string[]) {
  if (ids.length === 0) throw new Error("請選擇至少一筆紀錄");
  if (ids.length > 500) throw new Error("單次最多處理 500 筆");

  await db
    .update(profitRecords)
    .set({ settledAt: null })
    .where(inArray(profitRecords.id, ids));

  revalidatePath("/finance/profit");
}

/** 更新利潤紀錄的來源單號與備註等基本資料（透過利潤重算維持公式一致） */
export async function updateProfitRecord(id: string, formData: FormData) {
  const percent = Number(formData.get("salespersonPercent"));
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new Error("業務分潤比例必須在 0–100 之間");
  }
  const [row] = await db.select().from(profitRecords).where(inArray(profitRecords.id, [id])).limit(1);
  if (!row) throw new Error("找不到利潤紀錄");

  const companyBasePercent = row.profitCents > 0
    ? Math.round((row.companyBaseCents / row.profitCents) * 100)
    : 65;
  const result = calcProfit({
    revenueCents: row.revenueCents,
    costCents: row.costCents,
    companyBasePercent,
    salespersonPercent: percent,
  });

  await db.update(profitRecords).set({
    salespersonPercent: percent,
    salespersonCents: result.salespersonCents,
    companyBaseCents: result.companyBaseCents,
    companyRemainderCents: result.companyRemainderCents,
  }).where(inArray(profitRecords.id, [id]));

  revalidatePath("/finance/profit");
}
