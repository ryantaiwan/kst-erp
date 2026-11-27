"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profitRules, systemSettings, taxSettings } from "@/db/schema";

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function toDate(value: string) {
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) throw new Error("日期格式無效");
  return d;
}

/** 新增稅率設定（含開始日期，不回溯既有單據） */
export async function createTaxSetting(formData: FormData) {
  const percent = Number(str(formData, "percent"));
  const startDate = str(formData, "startDate");
  if (!Number.isFinite(percent) || percent <= 0 || percent > 100) throw new Error("稅率須在 0–100 之間");
  if (!startDate) throw new Error("請填寫開始日期");

  await db.insert(taxSettings).values({
    rateBasisPoints: Math.round(percent * 100),
    startDate: toDate(startDate),
    note: str(formData, "note") || null,
    createdBy: "admin",
  });
  revalidatePath("/admin/settings");
}

/** 修改稅率設定（含生效日與備註） */
export async function updateTaxSetting(id: string, formData: FormData) {
  const percent = Number(str(formData, "percent"));
  const startDate = str(formData, "startDate");
  if (!Number.isFinite(percent) || percent <= 0 || percent > 100) throw new Error("稅率須在 0–100 之間");
  if (!startDate) throw new Error("請填寫開始日期");

  await db.update(taxSettings).set({
    rateBasisPoints: Math.round(percent * 100),
    startDate: toDate(startDate),
    note: str(formData, "note") || null,
  }).where(eq(taxSettings.id, id));
  revalidatePath("/admin/settings");
}

/** 新增/修改公司基本留規則 */
export async function saveProfitRule(formData: FormData) {
  const percent = Number(str(formData, "companyBasePercent"));
  const effectiveDate = str(formData, "effectiveDate");
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) throw new Error("公司基本留須在 0–100 之間");
  if (!effectiveDate) throw new Error("請填寫生效日期");

  const [latest] = await db.select().from(profitRules).orderBy(profitRules.effectiveDate).limit(1);
  const values = {
    companyBasePercent: Math.round(percent),
    effectiveDate: toDate(effectiveDate),
    note: str(formData, "note") || null,
  };

  if (latest) {
    await db.update(profitRules).set(values).where(eq(profitRules.id, latest.id));
  } else {
    await db.insert(profitRules).values(values);
  }
  revalidatePath("/admin/settings");
  revalidatePath("/finance/profit");
}

/** 更新公司資料（system_setting 的 key-value） */
export async function updateCompanySettings(formData: FormData) {
  const keys = ["companyNameZh", "companyNameEn", "abbr", "address", "tel", "fax", "email", "website", "handler"];
  for (const key of keys) {
    const value = str(formData, key);
    if (!value) continue;
    await db.insert(systemSettings).values({ key, value }).onConflictDoUpdate({
      target: systemSettings.key,
      set: { value },
    });
  }
  revalidatePath("/admin/settings");
}

/** 更新登入方式開關（AUTH_ENABLE_GOOGLE 的字面值僅供顯示，實際啟用需环境变量） */
export async function updateLoginSettings(formData: FormData) {
  const google = formData.get("enableGoogle") === "true";
  await db.insert(systemSettings).values({ key: "enableGoogle", value: google ? "true" : "false" }).onConflictDoUpdate({
    target: systemSettings.key,
    set: { value: google ? "true" : "false" },
  });
  revalidatePath("/admin/settings");
}
