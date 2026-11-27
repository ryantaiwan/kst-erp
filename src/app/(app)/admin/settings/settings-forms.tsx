"use client";

import { useTransition, useState } from "react";
import { createTaxSetting, updateTaxSetting, saveProfitRule, updateCompanySettings, updateLoginSettings } from "./actions";

const field = "w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d] outline-none focus:border-[#6d4aff]";
const label = "text-xs text-[#8c88a6]";
const btn = "rounded-lg bg-[#6d4aff] px-4 py-2 text-xs font-medium text-white hover:bg-[#5a36e0] disabled:opacity-50";

type Tax = { id: string; percent: number; startDate: string; note: string | null };

function useAction() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  function run(fn: () => Promise<void>, ok = "已儲存") {
    setMessage("");
    startTransition(async () => {
      try { await fn(); setMessage(ok); } catch (e) { setMessage(e instanceof Error ? e.message : "失敗"); }
    });
  }
  return { pending, message, run };
}

export function TaxSettingsForm({ taxes }: { taxes: Tax[] }) {
  const { pending, message, run } = useAction();
  return (
    <div className="rounded-xl border border-[#e9e6f3] bg-white p-5">
      <h2 className="text-sm font-semibold">稅率設定</h2>
      <p className="mt-1 text-[11px] text-[#9b96b0]">可指定開始日期，變更不回溯；既有單據維持原稅率快照</p>

      <div className="mt-4 space-y-2">
        {taxes.map((t) => (
          <form key={t.id} action={(fd) => run(() => updateTaxSetting(t.id, fd))} className="flex flex-wrap items-end gap-2 rounded-lg bg-[#fbfaff] p-3">
            <label className={label}>稅率 (%)<input name="percent" type="number" step="0.01" defaultValue={t.percent} className={`mt-1 w-20 ${field}`} /></label>
            <label className={label}>開始日期<input name="startDate" type="date" defaultValue={t.startDate} className={`mt-1 ${field}`} /></label>
            <label className={`${label} flex-1`}>備註<input name="note" defaultValue={t.note ?? ""} className={`mt-1 ${field}`} /></label>
            <button type="submit" disabled={pending} className={btn}>更新</button>
          </form>
        ))}
      </div>

      <form action={(fd) => run(() => createTaxSetting(fd), "已新增稅率")} className="mt-4 grid grid-cols-1 gap-2 border-t border-[#f1eff7] pt-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className={label}>新稅率 (%)<input name="percent" type="number" step="0.01" placeholder="5" className={`mt-1 ${field}`} /></label>
        <label className={label}>開始日期<input name="startDate" type="date" className={`mt-1 ${field}`} /></label>
        <label className={label}>備註<input name="note" className={`mt-1 ${field}`} /></label>
        <div className="flex items-end"><button type="submit" disabled={pending} className={btn}>＋ 新增</button></div>
      </form>
      {message && <p className="mt-2 text-[11px] text-[#5538d6]">{message}</p>}
    </div>
  );
}

export function ProfitRuleForm({ percent, effectiveDate }: { percent: number; effectiveDate: string }) {
  const { pending, message, run } = useAction();
  return (
    <div className="rounded-xl border border-[#e9e6f3] bg-white p-5">
      <h2 className="text-sm font-semibold">分潤規則</h2>
      <p className="mt-1 text-[11px] text-[#9b96b0]">公司基本留 · 業務% 每筆輸入（以利潤為基數）· 剩餘回公司</p>
      <form action={(fd) => run(() => saveProfitRule(fd))} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className={label}>公司基本留 (%)<input name="companyBasePercent" type="number" min="0" max="100" defaultValue={percent} className={`mt-1 ${field}`} /></label>
        <label className={label}>生效日期<input name="effectiveDate" type="date" defaultValue={effectiveDate} className={`mt-1 ${field}`} /></label>
        <label className={`${label} col-span-2`}>備註<input name="note" className={`mt-1 ${field}`} /></label>
        <div className="flex items-end gap-2 col-span-2">
          <button type="submit" disabled={pending} className={btn}>{pending ? "儲存中…" : "儲存規則"}</button>
          {message && <span className="text-[11px] text-[#5538d6]">{message}</span>}
        </div>
      </form>
    </div>
  );
}

export function CompanySettingsForm({ settings }: { settings: Record<string, string> }) {
  const { pending, message, run } = useAction();
  const keys = [
    ["companyNameZh", "公司名稱（中）"], ["companyNameEn", "公司名稱（英）"],
    ["abbr", "簡稱"], ["website", "網站"],
    ["address", "地址"], ["email", "Email"],
    ["tel", "電話"], ["fax", "傳真"], ["handler", "承辦人"],
  ];
  return (
    <div className="rounded-xl border border-[#e9e6f3] bg-white p-5">
      <h2 className="text-sm font-semibold">公司資料</h2>
      <p className="mt-1 text-[11px] text-[#9b96b0]">用於報價單 PDF 抬頭與頁尾</p>
      <form action={(fd) => run(() => updateCompanySettings(fd))} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {keys.map(([key, name]) => (
          <label key={key} className={label}>{name}<input name={key} defaultValue={settings[key] ?? ""} className={`mt-1 ${field}`} /></label>
        ))}
        <div className="flex items-end gap-2 col-span-2 md:col-span-3">
          <button type="submit" disabled={pending} className={btn}>{pending ? "儲存中…" : "儲存公司資料"}</button>
          {message && <span className="text-[11px] text-[#5538d6]">{message}</span>}
        </div>
      </form>
    </div>
  );
}

export function LoginSettingsForm({ enabled }: { enabled: boolean }) {
  const { pending, message, run } = useAction();
  return (
    <div className="rounded-xl border border-[#e9e6f3] bg-white p-5">
      <h2 className="text-sm font-semibold">登入方式</h2>
      <p className="mt-1 text-[11px] text-[#9b96b0]">LINE 始終啟用；Google 需同時在 Vercel 設定 AUTH_ENABLE_GOOGLE=true 並填寫金鑰才會生效</p>
      <form action={(fd) => run(() => updateLoginSettings(fd))} className="mt-4 flex items-end gap-3">
        <label className={label}>
          Google 登入
          <select name="enableGoogle" defaultValue={enabled ? "true" : "false"} className={`mt-1 ${field}`}>
            <option value="false">關閉</option><option value="true">啟用</option>
          </select>
        </label>
        <button type="submit" disabled={pending} className={btn}>{pending ? "儲存中…" : "儲存"}</button>
        {message && <span className="text-[11px] text-[#5538d6]">{message}</span>}
      </form>
    </div>
  );
}
