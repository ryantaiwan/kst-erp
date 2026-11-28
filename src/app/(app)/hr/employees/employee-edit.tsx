"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EditModal } from "@/components/edit-modal";
import { notifyError, notifySuccess } from "@/lib/notify";
import { deleteEmployee, updateEmployee } from "@/actions/accounts";

type Row = {
  id: string; employeeNo: string; name: string; departmentId: string | null;
  title: string | null; email: string | null; phone: string | null;
  nationalId: string | null; birthDate: Date | null; hireDate: Date;
  salaryCents: number; status: string; note: string | null;
};
const field = "mt-1 w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d] outline-none focus:border-[#6d4aff]";
const label = "text-xs text-[#8c88a6]";
const iso = (d: Date | null) => d ? d.toISOString().slice(0, 10) : "";

export function EmployeeEdit({ row, departments }: { row: Row; departments: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-[11px] text-[#5538d6] hover:underline">編輯</button>
      {open && (
        <EditModal title={`編輯員工 ${row.employeeNo}`} onClose={() => setOpen(false)}>
          <form action={(fd) => {
            startTransition(async () => {
              try { await updateEmployee(row.id, fd); notifySuccess("已儲存"); setOpen(false); router.refresh(); }
              catch (e) { notifyError(e, "儲存失敗"); }
            });
          }} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className={label}>員工編號 *<input name="employeeNo" required defaultValue={row.employeeNo} className={field} /></label>
            <label className={label}>姓名 *<input name="name" required defaultValue={row.name} className={field} /></label>
            <label className={label}>部門<select name="departmentId" defaultValue={row.departmentId ?? ""} className={field}><option value="">—</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
            <label className={label}>職稱<input name="title" defaultValue={row.title ?? ""} className={field} /></label>
            <label className={label}>到職日<input name="hireDate" type="date" defaultValue={iso(row.hireDate)} className={field} /></label>
            <label className={label}>生日<input name="birthDate" type="date" defaultValue={iso(row.birthDate)} className={field} /></label>
            <label className={label}>身分證號<input name="nationalId" defaultValue={row.nationalId ?? ""} className={field} /></label>
            <label className={label}>月薪<input name="salary" type="number" step="1" defaultValue={row.salaryCents / 100} className={field} /></label>
            <label className={label}>Email<input name="email" type="email" defaultValue={row.email ?? ""} className={field} /></label>
            <label className={label}>電話<input name="phone" defaultValue={row.phone ?? ""} className={field} /></label>
            <label className={label}>狀態<select name="status" defaultValue={row.status} className={field}><option value="active">在職</option><option value="on_leave">留職停薪</option><option value="resigned">離職</option></select></label>
            <label className={label}>備註<input name="note" defaultValue={row.note ?? ""} className={field} /></label>
            <div className="flex items-end gap-2 sm:col-span-2">
              <button type="submit" disabled={pending} className="h-9 rounded-lg bg-[#6d4aff] px-4 text-xs text-white disabled:opacity-50">{pending ? "儲存中…" : "儲存"}</button>
              <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-lg border border-[#e9e6f3] px-4 text-xs text-[#57536e]">取消</button>
              <button type="button" disabled={pending} onClick={() => {
                if (!confirm(`確定刪除員工「${row.name}」？`)) return;
                startTransition(async () => { await deleteEmployee(row.id); notifySuccess("已刪除"); setOpen(false); router.refresh(); });
              }} className="ml-auto h-9 rounded-lg border border-[#f0caca] px-4 text-xs text-[#e05a5a]">刪除</button>
            </div>
          </form>
        </EditModal>
      )}
    </>
  );
}
