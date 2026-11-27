"use client";

import { useState, useTransition } from "react";

export type Field = {
  name: string;
  label: string;
  type?: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
};

const inputCls = "w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d] outline-none focus:border-[#6d4aff]";
const labelCls = "text-xs text-[#8c88a6]";

/** 主資料通用的新增/編輯表單 */
export function MasterForm({
  title,
  fields,
  action,
  record,
  onDone,
}: {
  title: string;
  fields: Field[];
  action: (fd: FormData) => Promise<void>;
  record?: Record<string, string>;
  onDone?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  return (
    <div className="rounded-xl border border-[#e9e6f3] bg-white p-4">
      <button
        onClick={() => { setOpen(!open); setMessage(""); }}
        className="rounded-lg bg-[#6d4aff] px-4 py-2 text-xs font-medium text-white hover:bg-[#5a36e0]"
      >
        {open ? "收合表單" : `＋ ${title}`}
      </button>
      {open && (
        <form
          action={(fd) => {
            setMessage("");
            startTransition(async () => {
              try {
                await action(fd);
                setOpen(false);
                onDone?.();
              } catch (e) {
                setMessage(e instanceof Error ? e.message : "儲存失敗");
              }
            });
          }}
          className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4"
        >
          {record?.id && <input type="hidden" name="id" value={record.id} />}
          {fields.map((f) => (
            <label key={f.name} className={labelCls}>
              {f.label}
              {f.options ? (
                <select name={f.name} defaultValue={record?.[f.name] ?? f.options[0]?.value} className={`mt-1 ${inputCls}`}>
                  {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input
                  name={f.name}
                  type={f.type ?? "text"}
                  step={f.type === "number" ? (f.name.includes("cost") || f.name.includes("price") || f.name === "delta" ? "1" : undefined) : undefined}
                  defaultValue={record?.[f.name] ?? (f.type === "number" ? "0" : "")}
                  placeholder={f.placeholder}
                  className={`mt-1 ${inputCls}`}
                />
              )}
            </label>
          ))}
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
