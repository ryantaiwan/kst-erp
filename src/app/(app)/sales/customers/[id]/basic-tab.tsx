"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { updateCustomer } from "@/actions/customers";
import { notifyError, notifySuccess } from "@/lib/notify";
import type { CustomerData } from "./customer-tabs";

const field = "mt-1 w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d] outline-none focus:border-[#6d4aff]";
const label = "text-xs text-[#8c88a6]";

export function BasicTab({ customer }: { customer: CustomerData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit } = useForm<CustomerData>({ defaultValues: customer });

  return (
    <form onSubmit={handleSubmit((data) => {
      startTransition(async () => {
        try {
          const fd = new FormData();
          Object.entries(data).forEach(([k, v]) => fd.set(k, String(v ?? "")));
          await updateCustomer(customer.id, fd);
          notifySuccess("基本資料已儲存");
          router.refresh();
        } catch (e) { notifyError(e, "儲存失敗"); }
      });
    })} className="rounded-xl border border-[#e9e6f3] bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold">客戶基本資料</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className={label}>客戶代號<input {...register("code")} className={field} /></label>
        <label className={label}>公司名稱 *<input {...register("name", { required: true })} className={field} /></label>
        <label className={label}>統一編號<input {...register("taxId")} className={field} /></label>
        <label className={label}>電話<input {...register("phone")} className={field} /></label>
        <label className={label}>傳真<input {...register("fax")} className={field} /></label>
        <label className={label}>付款條件<input {...register("paymentTerm")} className={field} /></label>
        <label className={label}>郵遞區號<input {...register("zipCode")} className={field} /></label>
        <label className={`${label} sm:col-span-2 lg:col-span-2`}>地址<input {...register("address")} className={field} /></label>
        <label className={label}>狀態
          <select {...register("status")} className={field}>
            <option value="active">啟用</option>
            <option value="inactive">停用</option>
          </select>
        </label>
      </div>
      <div className="mt-4 flex justify-end">
        <button type="submit" disabled={pending} className="h-9 rounded-lg bg-[#6d4aff] px-4 text-xs font-medium text-white disabled:opacity-50">
          {pending ? "儲存中…" : "儲存基本資料"}
        </button>
      </div>
    </form>
  );
}
