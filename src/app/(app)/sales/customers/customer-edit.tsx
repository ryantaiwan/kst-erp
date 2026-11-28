"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MasterForm, type Field } from "@/components/master-form";
import { upsertCustomer, deleteCustomer } from "@/actions/master";

type Row = { id: string; code: string | null; name: string; taxId: string | null; phone: string | null; fax: string | null; zipCode: string | null; address: string | null; paymentTerm: string | null; status: string };

const FIELDS: Field[] = [
  { name: "code", label: "代號" }, { name: "name", label: "公司名稱 *" },
  { name: "taxId", label: "統一編號" }, { name: "phone", label: "電話" },
  { name: "fax", label: "傳真" }, { name: "zipCode", label: "郵遞區號" },
  { name: "address", label: "地址" }, { name: "paymentTerm", label: "付款條件" },
  { name: "status", label: "狀態", options: [{ value: "active", label: "啟用" }, { value: "inactive", label: "停用" }] },
];

export function CustomerEdit({ row }: { row: Row }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");

  if (!open) return <button onClick={() => setOpen(true)} className="text-[11px] text-[#5538d6] hover:underline">編輯</button>;

  const record: Record<string, string> = Object.fromEntries(
    FIELDS.map((f) => [f.name, (row as Record<string, unknown>)[f.name]?.toString() ?? ""]),
  );
  record.id = row.id;

  return (
    <div className="min-w-72">
      <MasterForm
        title="編輯客戶"
        fields={FIELDS}
        record={record}
        action={async (fd) => { await upsertCustomer(fd); setOpen(false); router.refresh(); }}
      />
      <div className="mt-1 flex items-center gap-2">
        <button onClick={() => setOpen(false)} className="text-[11px] text-[#9b96b0]">取消</button>
        <button disabled={pending} onClick={() => {
          if (!confirm(`確定刪除「${row.name}」？`)) return;
          startTransition(async () => { await deleteCustomer(row.id); setOpen(false); router.refresh(); });
        }} className="text-[11px] text-[#e05a5a] hover:underline disabled:opacity-50">{pending ? "處理中…" : "刪除"}</button>
        {msg && <span className="text-[10px] text-[#e05a5a]">{msg}</span>}
      </div>
    </div>
  );
}
