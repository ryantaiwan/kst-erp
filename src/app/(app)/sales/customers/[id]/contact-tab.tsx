"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addContact, deleteContact, updateContact } from "@/actions/customers";
import { notifyError, notifySuccess } from "@/lib/notify";
import type { ContactData, DepartmentData } from "./customer-tabs";

const field = "mt-1 w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d] outline-none focus:border-[#6d4aff]";
const label = "text-xs text-[#8c88a6]";

export function ContactTab({ customerId, contacts, departments }: {
  customerId: string; contacts: ContactData[]; departments: DepartmentData[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const deptName = (id: string) => departments.find((d) => d.id === id)?.name ?? "—";

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
          <h2 className="text-sm font-semibold">聯絡人</h2>
          <button onClick={() => setAdding(!adding)} className="rounded-lg bg-[#6d4aff] px-3 py-2 text-xs text-white">
            {adding ? "收合" : "＋ 新增聯絡人"}
          </button>
        </div>
        {adding && (
          <form action={(fd) => submit(fd, () => addContact(customerId, fd), "聯絡人已新增")}
            className="mb-4 grid grid-cols-1 gap-3 rounded-lg bg-[#fbfaff] p-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className={label}>姓名 *<input name="name" required className={field} /></label>
            <label className={label}>部門<select name="departmentId" className={field}><option value="">—</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
            <label className={label}>手機<input name="mobile" className={field} /></label>
            <label className={label}>電話<input name="phone" className={field} /></label>
            <label className={label}>分機<input name="ext" className={field} /></label>
            <label className={label}>Email<input name="email" type="email" className={field} /></label>
            <label className={`${label} flex items-end gap-2`}>
              <input name="isPrimary" type="checkbox" value="true" className="mb-2" />
              主要聯絡人
            </label>
            <div className="flex items-end"><button type="submit" disabled={pending} className="h-9 rounded-lg bg-[#6d4aff] px-4 text-xs text-white disabled:opacity-50">儲存</button></div>
          </form>
        )}
        {contacts.length === 0 ? (
          <p className="text-xs text-[#9b96b0]">尚無聯絡人</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-xs">
              <thead><tr className="bg-[#fbfaff] text-left text-[#9b96b0]">
                <th className="px-3 py-2 font-medium">姓名</th><th className="px-3 py-2 font-medium">部門</th>
                <th className="px-3 py-2 font-medium">手機</th><th className="px-3 py-2 font-medium">電話</th>
                <th className="px-3 py-2 font-medium">分機</th><th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">主要</th><th className="px-3 py-2 font-medium">作業</th>
              </tr></thead>
              <tbody>{contacts.map((c) => (
                <tr key={c.id} className="border-t border-[#f1eff7]">
                  {editing === c.id ? (
                    <td colSpan={8} className="p-3">
                      <form action={(fd) => submit(fd, () => updateContact(c.id, customerId, fd), "已儲存")}
                        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <label className={label}>姓名 *<input name="name" required defaultValue={c.name} className={field} /></label>
                        <label className={label}>部門<select name="departmentId" defaultValue={c.departmentId} className={field}><option value="">—</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
                        <label className={label}>手機<input name="mobile" defaultValue={c.mobile} className={field} /></label>
                        <label className={label}>電話<input name="phone" defaultValue={c.phone} className={field} /></label>
                        <label className={label}>分機<input name="ext" defaultValue={c.ext} className={field} /></label>
                        <label className={label}>Email<input name="email" type="email" defaultValue={c.email} className={field} /></label>
                        <label className={`${label} flex items-end gap-2`}><input name="isPrimary" type="checkbox" value="true" defaultChecked={c.isPrimary} className="mb-2" />主要聯絡人</label>
                        <div className="flex items-end gap-2">
                          <button type="submit" disabled={pending} className="h-9 rounded-lg bg-[#6d4aff] px-4 text-xs text-white">存</button>
                          <button type="button" onClick={() => setEditing(null)} className="text-xs text-[#9b96b0]">取消</button>
                        </div>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td className="px-3 py-2 font-medium">{c.name}</td>
                      <td className="px-3 py-2">{deptName(c.departmentId)}</td>
                      <td className="px-3 py-2">{c.mobile || "—"}</td>
                      <td className="px-3 py-2">{c.phone || "—"}</td>
                      <td className="px-3 py-2">{c.ext || "—"}</td>
                      <td className="px-3 py-2">{c.email || "—"}</td>
                      <td className="px-3 py-2">{c.isPrimary ? "是" : "—"}</td>
                      <td className="px-3 py-2">
                        <button onClick={() => setEditing(c.id)} className="text-[11px] text-[#5538d6] hover:underline">編輯</button>
                        <button disabled={pending} onClick={() => {
                          if (!confirm(`刪除聯絡人「${c.name}」？`)) return;
                          startTransition(async () => { await deleteContact(c.id, customerId); notifySuccess("已刪除"); router.refresh(); });
                        }} className="ml-2 text-[11px] text-[#e05a5a] hover:underline">刪除</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
