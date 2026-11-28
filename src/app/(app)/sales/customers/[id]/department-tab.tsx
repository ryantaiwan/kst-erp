"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addCustomerDepartment, deleteCustomerDepartment, updateCustomerDepartment } from "@/actions/customers";
import { notifyError, notifySuccess } from "@/lib/notify";
import type { DepartmentData } from "./customer-tabs";

const field = "mt-1 w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d] outline-none focus:border-[#6d4aff]";
const label = "text-xs text-[#8c88a6]";

export function DepartmentTab({ customerId, departments }: {
  customerId: string; departments: DepartmentData[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // 兩層：頂層（無 parent）與其子層
  const roots = departments.filter((d) => !d.parentId);
  const childrenOf = (id: string) => departments.filter((d) => d.parentId === id);
  const nameOf = (id: string) => departments.find((d) => d.id === id)?.name ?? "—";

  const submit = (fd: FormData, action: () => Promise<void>, ok: string) => {
    startTransition(async () => {
      try { await action(); notifySuccess(ok); setEditing(null); setAdding(false); router.refresh(); }
      catch (e) { notifyError(e, "失敗"); }
    });
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[#e9e6f3] bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">客戶內部部門</h2>
            <p className="mt-1 text-[11px] text-[#9b96b0]">兩層結構：上層部門 → 下級部門 · 可供聯絡人歸屬</p>
          </div>
          <button onClick={() => setAdding(!adding)} className="rounded-lg bg-[#6d4aff] px-3 py-2 text-xs text-white">
            {adding ? "收合" : "＋ 新增部門"}
          </button>
        </div>

        {adding && (
          <form action={(fd) => submit(fd, () => addCustomerDepartment(customerId, fd), "部門已新增")}
            className="mb-4 grid grid-cols-1 gap-3 rounded-lg bg-[#fbfaff] p-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className={label}>部門名稱 *<input name="name" required placeholder="例：採購課" className={field} /></label>
            <label className={label}>上級部門<select name="parentId" className={field}><option value="">（頂層部門）</option>{roots.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
            <label className={label}>代號<input name="code" placeholder="例：PUR" className={field} /></label>
            <label className={label}>主管<input name="manager" className={field} /></label>
            <label className={`${label} sm:col-span-2`}>備註<input name="note" className={field} /></label>
            <div className="flex items-end"><button type="submit" disabled={pending} className="h-9 rounded-lg bg-[#6d4aff] px-4 text-xs text-white disabled:opacity-50">儲存</button></div>
          </form>
        )}

        {departments.length === 0 ? (
          <p className="text-xs text-[#9b96b0]">尚無部門，先建立頂層部門（如「管理處」），再建立其下級部門（如「採購課」）。</p>
        ) : (
          <div className="space-y-2">
            {roots.map((root) => (
              <div key={root.id} className="rounded-lg border border-[#f1eff7]">
                {editing === root.id ? (
                  <DeptForm d={root} roots={roots} onCancel={() => setEditing(null)}
                    onSubmit={(fd) => submit(fd, () => updateCustomerDepartment(root.id, customerId, fd), "已儲存")} pending={pending} />
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-[#fbfaff] px-3 py-2">
                    <span className="flex items-center gap-2 text-xs font-semibold text-[#5538d6]">
                      <span className="rounded bg-[#e9e3fb] px-2 py-0.5 text-[10px]">上層</span>
                      {root.name} <span className="text-[10px] font-normal text-[#9b96b0]">{root.code}</span>
                    </span>
                    <DeptActions onEdit={() => setEditing(root.id)} onDelete={() => {
                      if (!confirm(`刪除部門「${root.name}」？下級部門會提升到上一層。`)) return;
                      startTransition(async () => { await deleteCustomerDepartment(root.id, customerId); notifySuccess("已刪除"); router.refresh(); });
                    }} pending={pending} />
                  </div>
                )}
                {childrenOf(root.id).map((child) => (
                  <div key={child.id} className="border-t border-[#f8f7fc] pl-6">
                    {editing === child.id ? (
                      <DeptForm d={child} roots={roots} onCancel={() => setEditing(null)}
                        onSubmit={(fd) => submit(fd, () => updateCustomerDepartment(child.id, customerId, fd), "已儲存")} pending={pending} />
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                        <span className="flex items-center gap-2 text-xs text-[#57536e]">
                          <span className="text-[#c3bfd4]">└</span>
                          <span className="rounded bg-[#f3f0fc] px-2 py-0.5 text-[10px]">下級</span>
                          {child.name} <span className="text-[10px] text-[#9b96b0]">{child.code}</span>
                          {child.manager && <span className="text-[10px] text-[#9b96b0]">主管：{child.manager}</span>}
                        </span>
                        <DeptActions onEdit={() => setEditing(child.id)} onDelete={() => {
                          if (!confirm(`刪除部門「${child.name}」？`)) return;
                          startTransition(async () => { await deleteCustomerDepartment(child.id, customerId); notifySuccess("已刪除"); router.refresh(); });
                        }} pending={pending} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function DeptForm({ d, roots, onSubmit, onCancel, pending }: {
  d: DepartmentData; roots: DepartmentData[];
  onSubmit: (fd: FormData) => void; onCancel: () => void; pending: boolean;
}) {
  return (
    <form action={onSubmit} className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 lg:grid-cols-4">
      <label className={label}>部門名稱 *<input name="name" required defaultValue={d.name} className={field} /></label>
      <label className={label}>上級部門<select name="parentId" defaultValue={d.parentId} className={field}><option value="">（頂層）</option>{roots.filter((r) => r.id !== d.id).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
      <label className={label}>代號<input name="code" defaultValue={d.code} className={field} /></label>
      <label className={label}>主管<input name="manager" defaultValue={d.manager} className={field} /></label>
      <label className={`${label} sm:col-span-2 lg:col-span-3`}>備註<input name="note" defaultValue={d.note} className={field} /></label>
      <div className="flex items-end gap-2">
        <button type="submit" disabled={pending} className="h-9 rounded-lg bg-[#6d4aff] px-4 text-xs text-white">存</button>
        <button type="button" onClick={onCancel} className="text-xs text-[#9b96b0]">取消</button>
      </div>
    </form>
  );
}

function DeptActions({ onEdit, onDelete, pending }: { onEdit: () => void; onDelete: () => void; pending: boolean }) {
  return (
    <span className="flex gap-2">
      <button onClick={onEdit} className="text-[11px] text-[#5538d6] hover:underline">編輯</button>
      <button onClick={onDelete} disabled={pending} className="text-[11px] text-[#e05a5a] hover:underline">刪除</button>
    </span>
  );
}
