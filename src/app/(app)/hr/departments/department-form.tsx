"use client";

import { useState, useTransition } from "react";
import { createDepartment } from "./actions";

const field = "w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d] outline-none focus:border-[#6d4aff]";
const label = "text-xs text-[#8c88a6]";

export function DepartmentForm() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  return (
    <div className="rounded-xl border border-[#e9e6f3] bg-white p-4">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg bg-[#6d4aff] px-4 py-2 text-xs font-medium text-white hover:bg-[#5a36e0]"
      >
        {open ? "收合表單" : "＋ 新增部門"}
      </button>
      {open && (
        <form
          action={(formData) => {
            setMessage("");
            startTransition(async () => {
              try {
                await createDepartment(formData);
                setOpen(false);
              } catch (e) {
                setMessage(e instanceof Error ? e.message : "新增失敗");
              }
            });
          }}
          className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <label className={label}>代號 *<input name="code" required className={`mt-1 ${field}`} /></label>
          <label className={label}>部門名稱 *<input name="name" required className={`mt-1 ${field}`} /></label>
          <label className={label}>
            上級部門
            <input name="parentId" placeholder="上級部門 ID（可留空）" className={`mt-1 ${field}`} />
          </label>
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
