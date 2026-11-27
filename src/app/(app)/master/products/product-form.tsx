"use client";
import { MasterForm } from "@/components/master-form";
import { upsertProduct } from "@/actions/master";

export function ProductForm() {
  return <MasterForm title="新增商品" action={async (fd) => { await upsertProduct(fd); }} fields={[
    { name: "sku", label: "SKU / AU料號 *" },
    { name: "name", label: "品名 *" },
    { name: "spec", label: "規格" },
    { name: "unit", label: "單位", options: [{ value: "顆", label: "顆" }, { value: "件", label: "件" }, { value: "套", label: "套" }, { value: "小時", label: "小時" }] },
    { name: "cost", label: "成本", type: "number" },
    { name: "price", label: "售價", type: "number" },
    { name: "status", label: "狀態", options: [{ value: "active", label: "啟用" }, { value: "inactive", label: "停用" }] },
  ]} />;
}
