"use client";
import { MasterForm } from "@/components/master-form";
import { upsertCustomer } from "@/actions/master";

export function CustomerForm() {
  return <MasterForm title="新增客戶" action={async (fd) => { await upsertCustomer(fd); }} fields={[
    { name: "code", label: "代號" },
    { name: "name", label: "公司名稱 *" },
    { name: "taxId", label: "統一編號" },
    { name: "phone", label: "電話" },
    { name: "fax", label: "傳真" },
    { name: "zipCode", label: "郵遞區號" },
    { name: "address", label: "地址" },
    { name: "paymentTerm", label: "付款條件" },
    { name: "status", label: "狀態", options: [{ value: "active", label: "啟用" }, { value: "inactive", label: "停用" }] },
  ]} />;
}
