"use client";

import { useState, useTransition } from "react";
import { createLeaveRequest } from "./actions";

type Emp = { id: string; name: string; employeeNo: string };

const field = "w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d] outline-none focus:border-[#6d4aff]";
const label = "text-xs text-[#8c88a6]";

const LEAVE_TYPES = ["特休", "事假", "病假", "婚假", "喪假", "產假", "陪產假", "補休"];

export function LeaveForm({ employees }: { employees: Emp[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  return (
    <div className="rounded-xl border border-[#e9e6f3] bg-white p-4">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg bg-[#6d4aff] px-4 py-2 text-xs font-medium text-white hover:bg-[#5a36e0]"
      >
        {open ? "收合表單" : "＋ 新增請假申請"}
      </button>
      {open && (
        <form
          action={(formData) => {
            if (employees.length === 0) { setMessage("請先新增員工"); return; }
            setMessage("");
            startTransition(async () => {
              try {
                await createLeaveRequest(formData);
                setOpen(false);
              } catch (e) {
                setMessage(e instanceof Error ? e.message : "新增失敗");
              }
            });
          }}
          className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4"
        >
          <label className={label}>
            員工 *
            <select name="employeeId" required className={`mt-1 ${field}`}>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.employeeNo} {e.name}</option>)}
            </select>
          </label>
          <label className={label}>
            假別 *
            <select name="type" required className={`mt-1 ${field}`}>
              {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className={label}>起日 *<input name="startDate" type="date" required className={`mt-1 ${field}`} /></label>
          <label className={label}>迄日 *<input name="endDate" type="date" required className={`mt-1 ${field}`} /></label>
          <label className={label}>時數<input name="hours" type="number" step="0.5" defaultValue="8" className={`mt-1 ${field}`} /></label>
          <label className={label}>事由<input name="reason" className={`mt-1 ${field}`} /></label>
          <div className="flex items-end gap-2">
            <button type="submit" disabled={pending} className="rounded-lg bg-[#6d4aff] px-4 py-2 text-xs font-medium text-white hover:bg-[#5a36e0] disabled:opacity-50">
              {pending ? "儲存中…" : "送出申請"}
            </button>
            {message && <span className="text-xs text-[#e05a5a]">{message}</span>}
          </div>
        </form>
      )}
    </div>
  );
}
