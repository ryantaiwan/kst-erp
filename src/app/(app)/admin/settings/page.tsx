import { desc } from "drizzle-orm";
import { db } from "@/db";
import { profitRules, systemSettings, taxSettings } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { CompanySettingsForm, LoginSettingsForm, ProfitRuleForm, TaxSettingsForm } from "./settings-forms";

export const instant = false;

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export default async function SettingsPage() {
  const [taxes, rules, settings] = await Promise.all([
    db.select().from(taxSettings).orderBy(desc(taxSettings.startDate)).limit(10),
    db.select().from(profitRules).orderBy(desc(profitRules.effectiveDate)).limit(10),
    db.select().from(systemSettings),
  ]);

  const settingMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const latestTax = taxes[0];
  const latestRule = rules[0];

  return (
    <>
      <PageHeader title="系統設定" subtitle="稅率可指定開始日期且不回溯 · 分潤公司基本留可調整 · 公司資料用於報價單" />
      <div className="grid gap-4">
        <TaxSettingsForm
          taxes={taxes.map((t) => ({
            id: t.id,
            percent: t.rateBasisPoints / 100,
            startDate: isoDate(t.startDate),
            note: t.note,
          }))}
        />
        <ProfitRuleForm
          percent={latestRule?.companyBasePercent ?? 65}
          effectiveDate={latestRule ? isoDate(latestRule.effectiveDate) : ""}
        />
        <CompanySettingsForm settings={settingMap} />
        <LoginSettingsForm enabled={settingMap.enableGoogle === "true"} />
      </div>
    </>
  );
}
