import { desc } from "drizzle-orm";
import { db } from "@/db";
import { profitRules, taxSettings } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { formatDate } from "@/lib/utils";

export const instant = false;

export default async function SettingsPage() {
  const [taxes, rules] = await Promise.all([
    db.select().from(taxSettings).orderBy(desc(taxSettings.startDate)).limit(10),
    db.select().from(profitRules).orderBy(desc(profitRules.effectiveDate)).limit(10),
  ]);

  return (
    <>
      <PageHeader title="系統設定" subtitle="稅率可指定開始日期，變更不回溯；分潤公司基本留可調整" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[#e9e6f3] bg-white p-5">
          <h2 className="text-sm font-semibold">目前稅率</h2>
          <div className="mt-3 text-3xl font-semibold text-[#5538d6]">
            {taxes[0] ? `${taxes[0].rateBasisPoints / 100}%` : "—"}
          </div>
          <p className="mt-2 text-xs text-[#8c88a6]">
            稅率開始日期：{taxes[0] ? formatDate(taxes[0].startDate) : "—"}
          </p>
          <p className="mt-1 text-xs text-[#8c88a6]">{taxes[0]?.note}</p>
        </div>
        <div className="rounded-xl border border-[#e9e6f3] bg-white p-5">
          <h2 className="text-sm font-semibold">分潤規則</h2>
          <div className="mt-3 text-3xl font-semibold text-[#5538d6]">
            {rules[0] ? `${rules[0].companyBasePercent}%` : "—"}
          </div>
          <p className="mt-2 text-xs text-[#8c88a6]">公司基本留 · 剩餘回公司</p>
          <p className="mt-1 text-xs text-[#8c88a6]">業務% 每筆輸入，以利潤為基數</p>
        </div>
      </div>
    </>
  );
}
