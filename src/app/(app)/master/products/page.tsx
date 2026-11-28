import { like, or } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { SimpleTable } from "@/components/simple-table";
import { formatMoney } from "@/lib/utils";
import { ProductForm } from "./product-form";
import { ProductEdit } from "./product-edit";

export const instant = false;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const rows = await db
    .select()
    .from(products)
    .where(q ? or(like(products.sku, `%${q}%`), like(products.name, `%${q}%`)) : undefined);

  return (
    <>
      <PageHeader
        title="商品管理"
        subtitle={`共 ${rows.length} 筆 · AU料號 / 部品型號`}
        right={
          <form className="flex gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="搜尋 SKU / 品名"
              className="rounded-lg border border-[#e9e6f3] bg-white px-3 py-2 text-xs outline-none focus:border-[#6d4aff]"
            />
            <button className="rounded-lg bg-[#6d4aff] px-3 py-2 text-xs text-white">搜尋</button>
          </form>
        }
      />
      <div className="mb-5"><ProductForm /></div>
      <SimpleTable
        rows={rows}
        empty="尚無商品資料"
        columns={[
          { key: "sku", label: "SKU / AU料號", render: (r) => <span className="font-medium text-[#5538d6]">{r.sku}</span> },
          { key: "name", label: "品名 / 規格", render: (r) => r.name },
          { key: "unit", label: "單位", render: (r) => r.unit },
          { key: "cost", label: "成本", render: (r) => formatMoney(r.costCents) },
          { key: "price", label: "售價", render: (r) => formatMoney(r.salePriceCents) },
          { key: "status", label: "狀態", render: (r) => r.status },
          { key: "edit", label: "作業", render: (r) => <ProductEdit row={r as never} /> },
        ]}
      />
    </>
  );
}
