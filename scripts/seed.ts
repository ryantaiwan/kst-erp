import { config } from "dotenv";
import { db } from "../src/db";

config({ path: ".env.local" });
import {
  featureVisibility,
  profitRules,
  roles,
  systemSettings,
  taxSettings,
} from "../src/db/schema";

async function main() {
  await db
    .insert(roles)
    .values([
      { key: "admin", name: "管理員" },
      { key: "sales", name: "業務" },
      { key: "warehouse", name: "倉管" },
      { key: "accounting", name: "會計" },
      { key: "customer", name: "客戶使用者" },
      { key: "supplier", name: "廠商使用者" },
    ])
    .onConflictDoNothing();

  const existingTax = await db.select().from(taxSettings);
  if (existingTax.length === 0) {
    await db.insert(taxSettings).values({
      rateBasisPoints: 500,
      startDate: new Date("2026-01-01T00:00:00Z"),
      note: "基本營業稅率 5%，可指定開始日期，變更不回溯",
      createdBy: "system",
    });
  }

  const existingProfit = await db.select().from(profitRules);
  if (existingProfit.length === 0) {
    await db.insert(profitRules).values({
      companyBasePercent: 65,
      effectiveDate: new Date("2026-01-01T00:00:00Z"),
      note: "公司基本留 65%，業務% 以利益為基數，剩餘回公司",
    });
  }

  await db
    .insert(systemSettings)
    .values([
      { key: "companyNameZh", value: "鋒冠科技有限公司" },
      { key: "companyNameEn", value: "Keenness Technology Co., Ltd." },
      { key: "abbr", value: "K.S.T" },
      { key: "address", value: "台中市 41152 太平區大興十三街43巷15號1F" },
      { key: "tel", value: "(04)2278-8884" },
      { key: "fax", value: "(04)2278-6009" },
      { key: "email", value: "eason@keenness.com.tw" },
    ])
    .onConflictDoNothing();

  await db
    .insert(featureVisibility)
    .values([
      { accountType: "customer", featureKey: "dashboard", level: "self" },
      { accountType: "customer", featureKey: "quote", level: "self" },
      { accountType: "customer", featureKey: "salesOrder", level: "self" },
      { accountType: "customer", featureKey: "shipment", level: "self" },
      { accountType: "customer", featureKey: "receivable", level: "self" },
      { accountType: "supplier", featureKey: "dashboard", level: "self" },
      { accountType: "supplier", featureKey: "purchaseOrder", level: "self" },
      { accountType: "supplier", featureKey: "receiving", level: "self" },
      { accountType: "supplier", featureKey: "invoice", level: "self" },
    ])
    .onConflictDoNothing();

  console.log("Seed completed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
