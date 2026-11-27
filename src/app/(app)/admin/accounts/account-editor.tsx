"use client";
import { useState, useTransition } from "react";
import { updateAccount } from "@/actions/accounts";

type Row = { id: string; role: string; accountType: string; dataScope: string | null; status: string };
const field = "w-full rounded-lg border border-[#e9e6f3] px-2 py-1 text-[11px] outline-none focus:border-[#6d4aff]";

export function AccountEditor({ row, roles }: { row: Row; roles: { key: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");

  if (!open) return <button onClick={() => setOpen(true)} className="text-[11px] text-[#5538d6] hover:underline">編輯</button>;

  return (
    <form action={(fd) => { setMsg(""); startTransition(async () => { try { await updateAccount(row.id, fd); setOpen(false); } catch (e) { setMsg(e instanceof Error ? e.message : "失敗"); } }); }} className="flex flex-wrap items-center gap-1">
      <select name="role" defaultValue={row.role} className={field}>
        {roles.map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
        {!roles.some((r) => r.key === row.role) && <option value={row.role}>{row.role}</option>}
      </select>
      <select name="accountType" defaultValue={row.accountType} className={field}>
        <option value="employee">員工</option><option value="customer">客戶</option><option value="supplier">廠商</option>
      </select>
      <input name="dataScope" defaultValue={row.dataScope ?? ""} placeholder="資料範圍" className={`${field} w-24`} />
      <select name="status" defaultValue={row.status} className={field}>
        <option value="active">啟用</option><option value="disabled">停用</option>
      </select>
      <button type="submit" disabled={pending} className="rounded bg-[#6d4aff] px-2 py-1 text-[11px] text-white disabled:opacity-50">存</button>
      <button type="button" onClick={() => setOpen(false)} className="text-[11px] text-[#9b96b0]">×</button>
      {msg && <span className="text-[10px] text-[#e05a5a]">{msg}</span>}
    </form>
  );
}
