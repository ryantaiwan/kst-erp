"use client";

import { useState, useTransition } from "react";
import { createAttendance } from "./actions";

type Emp = { id: string; name: string; employeeNo: string };

const field = "w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d] outline-none focus:border-[#6d4aff]";
const label = "text-xs text-[#8c88a6]";

export function AttendanceForm({ employees }: { employees: Emp[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  return (
    <div className="rounded-xl border border-[#e9e6f3] bg-white p-4">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg bg-[#6d4aff] px-4 py-2 text-xs font-medium text-white hover:bg-[#5a36e0]"
      >
        {open ? "收合表單" : "＋ 新增出勤紀錄"}
      </button>
      {open && (
        <form
          action={(formData) => {
            if (employees.length === 0) { setMessage("請先新增員工"); return; }
            setMessage("");
            startTransition(async () => {
              try {
                await createAttendance(formData);
                setOpen(false);
              } catch (e) {
                setMessage(e instanceof Error ? e.message : "新增失敗");
              }
            });
          }}
          className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <label className={label}>
            員工 *
            <select name="employeeId" required className={`mt-1 ${field}`}>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.employeeNo} {e.name}</option>)}
            </select>
          </label>
          <label className={label}>日期 *<input name="date" type="date" required className={`mt-1 ${field}`} /></label>
          <label className={label}>
            狀態
            <select name="type" className={`mt-1 ${field}`}>
              <option value="normal">正常</option>
              <option value="late">遲到</option>
              <option value="early_leave">早退</option>
              <option value="absent">曠職</option>
              <option value="business_trip">出差</option>
              <option value="holiday_work">假日加班</option>
            </select>
          </label>
          <label className={label}>上班時間<input name="checkIn" placeholder="08:30" className={`mt-1 ${field}`} /></label>
          <label className={label}>下班時間<input name="checkOut" placeholder="17:30" className={`mt-1 ${field}`} /></label>
          <label className={label}>工作時數<input name="hours" type="number" step="0.5" defaultValue="8" className={`mt-1 ${field}`} /></label>
          <label className={label}>加班時數<input name="overtimeHours" type="number" step="0.5" defaultValue="0" className={`mt-1 ${field}`} /></label>
          <label className={label}>備註<input name="note" className={`mt-1 ${field}`} /></label>
          <div className="flex items-end gap-2">
            <button type="submit" disabled={pending} className="rounded-lg bg-[#6d4aff] px-4 py-2 text-xs font-medium text-white hover:bg-[#5a36e0] disabled:opacity-50">
              {pending ? "儲存中…" : "儲存"}
            </button>
            {message && <span className="text-xs text-[#e05a5a]">{message}</span>}
          </div>
        </form>
      )}
    </div>
  );
}
