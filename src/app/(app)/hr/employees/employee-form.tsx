"use client";

import { useState, useTransition } from "react";
import { createEmployee } from "./actions";

type Dept = { id: string; code: string; name: string };

const field = "w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d] outline-none focus:border-[#6d4aff]";
const label = "text-xs text-[#8c88a6]";

export function EmployeeForm({ departments }: { departments: Dept[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  return (
    <div className="rounded-xl border border-[#e9e6f3] bg-white p-4">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg bg-[#6d4aff] px-4 py-2 text-xs font-medium text-white hover:bg-[#5a36e0]"
      >
        {open ? "收合表單" : "＋ 新增員工"}
      </button>

      {open && (
        <form
          action={(formData) => {
            setMessage("");
            startTransition(async () => {
              try {
                await createEmployee(formData);
                setOpen(false);
              } catch (e) {
                setMessage(e instanceof Error ? e.message : "新增失敗");
              }
            });
          }}
          className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <label className={label}>員工編號 *<input name="employeeNo" required className={`mt-1 ${field}`} /></label>
          <label className={label}>姓名 *<input name="name" required className={`mt-1 ${field}`} /></label>
          <label className={label}>
            部門
            <select name="departmentId" className={`mt-1 ${field}`}>
              <option value="">—</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
          <label className={label}>職稱<input name="title" className={`mt-1 ${field}`} /></label>
          <label className={label}>到職日 *<input name="hireDate" type="date" required className={`mt-1 ${field}`} /></label>
          <label className={label}>生日<input name="birthDate" type="date" className={`mt-1 ${field}`} /></label>
          <label className={label}>身分證號<input name="nationalId" className={`mt-1 ${field}`} /></label>
          <label className={label}>月薪<input name="salary" type="number" step="1" defaultValue="0" className={`mt-1 ${field}`} /></label>
          <label className={label}>Email<input name="email" type="email" className={`mt-1 ${field}`} /></label>
          <label className={label}>電話<input name="phone" className={`mt-1 ${field}`} /></label>
          <label className={label}>備註<input name="note" className={`mt-1 ${field}`} /></label>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-[#6d4aff] px-4 py-2 text-xs font-medium text-white hover:bg-[#5a36e0] disabled:opacity-50"
            >
              {pending ? "儲存中…" : "儲存"}
            </button>
            {message && <span className="text-xs text-[#e05a5a]">{message}</span>}
          </div>
        </form>
      )}
    </div>
  );
}
