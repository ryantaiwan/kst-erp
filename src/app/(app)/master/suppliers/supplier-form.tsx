"use client";
import { MasterForm } from "@/components/master-form";
import { upsertSupplier } from "@/actions/master";

export function SupplierForm() {
  return <MasterForm title="新增供應商" action={async (fd) => { await upsertSupplier(fd); }} fields={[
    { name: "code", label: "代號" },
    { name: "name", label: "公司名稱 *" },
    { name: "branchName", label: "分公司" },
    { name: "taxId", label: "統一編號" },
    { name: "zipCode", label: "郵遞區號" },
    { name: "address", label: "地址" },
    { name: "phone", label: "電話" },
    { name: "paymentTerm", label: "付款條件" },
    { name: "platformCode", label: "平台代號" },
    { name: "status", label: "狀態", options: [{ value: "active", label: "啟用" }, { value: "inactive", label: "停用" }] },
  ]} />;
}
