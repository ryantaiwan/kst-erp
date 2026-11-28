"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfitRecord } from "./actions";
import { formatDate, formatMoney } from "@/lib/utils";
import { notifyError, notifySuccess } from "@/lib/notify";

export type ProfitRow = {
  id: string; sourceId: string; sourceType: string;
  revenueCents: number; costCents: number; profitCents: number;
  companyBaseCents: number; salespersonPercent: number;
  salespersonCents: number; companyRemainderCents: number;
  taxRateSnapshot: number; settledAt: Date | null; createdAt: Date;
};

export function ProfitDetail({ row }: { row: ProfitRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-[11px] text-[#5538d6] hover:underline">查看</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#5538d6]">利潤紀錄 {row.sourceId}</h3>
              <button onClick={() => setOpen(false)} className="text-xs text-[#9b96b0]">關閉</button>
            </div>

            {!editing ? (
              <>
                <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                  <Info label="來源單號" value={row.sourceId} />
                  <Info label="來源類型" value={row.sourceType} />
                  <Info label="建立時間" value={formatDate(row.createdAt)} />
                  <Info label="未稅金額" value={formatMoney(row.revenueCents)} />
                  <Info label="成本" value={formatMoney(row.costCents)} />
                  <Info label="利潤" value={formatMoney(row.profitCents)} />
                  <Info label="公司基本留" value={formatMoney(row.companyBaseCents)} />
                  <Info label="業務分潤" value={`${row.salespersonPercent}% · ${formatMoney(row.salespersonCents)}`} />
                  <Info label="公司剩餘" value={formatMoney(row.companyRemainderCents)} />
                  <Info label="稅率快照" value={`${(row.taxRateSnapshot / 100).toFixed(0)}%`} />
                  <Info label="結算狀態" value={row.settledAt ? `已結算 ${formatDate(row.settledAt)}` : "未結算"} />
                </dl>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => setEditing(true)} className="h-9 rounded-lg bg-[#6d4aff] px-4 text-xs text-white">編輯業務%</button>
                </div>
              </>
            ) : (
              <form action={(fd) => {
                setMsg("");
                startTransition(async () => {
                  try { await updateProfitRecord(row.id, fd); notifySuccess("已儲存"); setEditing(false); setOpen(false); router.refresh(); }
                  catch (e) { setMsg(e instanceof Error ? e.message : "儲存失敗"); notifyError(e, "儲存失敗"); }
                });
              }} className="space-y-3">
                <label className="block text-xs text-[#8c88a6]">業務分潤比例 (%)
                  <input name="salespersonPercent" type="number" min="0" max="100" step="1" defaultValue={row.salespersonPercent}
                    className="mt-1 w-32 rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs" />
                </label>
                <p className="text-[11px] leading-5 text-[#9b96b0]">公司基本留 + 業務% 不得超過 100%；系統會依新的比例自動重算三份分配。</p>
                <div className="flex items-center gap-2">
                  <button type="submit" disabled={pending} className="h-9 rounded-lg bg-[#6d4aff] px-4 text-xs text-white disabled:opacity-50">{pending ? "儲存中…" : "儲存"}</button>
                  <button type="button" onClick={() => setEditing(false)} className="h-9 rounded-lg border border-[#e9e6f3] px-4 text-xs text-[#57536e]">取消</button>
                  {msg && <span className="text-xs text-[#e05a5a]">{msg}</span>}
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div><dt className="text-[#9b96b0]">{label}</dt><dd className="mt-0.5 break-words text-[#26223d]">{value}</dd></div>
  );
}
