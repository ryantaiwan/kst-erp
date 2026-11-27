import { like, or } from "drizzle-orm";
import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { SimpleTable } from "@/components/simple-table";
import { SupplierForm } from "./supplier-form";
import { getCurrentScope } from "@/lib/scope";
import { and, eq } from "drizzle-orm";

export const instant = false;

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const scope = await getCurrentScope();
  const rows = await db
    .select()
    .from(suppliers)
    .where(
      and(
        scope.filtered ? eq(suppliers.id, scope.scopeId!) : undefined,
        q ? or(like(suppliers.name, `%${q}%`), like(suppliers.code, `%${q}%`), like(suppliers.platformCode, `%${q}%`)) : undefined,
      ),
    );

  return (
    <>
      <PageHeader
        title="供應商管理"
        subtitle={`共 ${rows.length} 筆 · 來自「發票記錄表進項 / 廠商資料」`}
        right={
          <form className="flex gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="搜尋編號 / 廠商 / 平台"
              className="rounded-lg border border-[#e9e6f3] bg-white px-3 py-2 text-xs outline-none focus:border-[#6d4aff]"
            />
            <button className="rounded-lg bg-[#6d4aff] px-3 py-2 text-xs text-white">搜尋</button>
          </form>
        }
      />
      {!scope.filtered && <div className="mb-5"><SupplierForm /></div>}
      <SimpleTable
        rows={rows}
        empty="尚無供應商資料"
        columns={[
          { key: "code", label: "編號", render: (r) => <span className="font-medium text-[#5538d6]">{r.code}</span> },
          { key: "name", label: "廠商", render: (r) => r.name },
          { key: "branch", label: "分支", render: (r) => r.branchName ?? "—" },
          { key: "taxId", label: "統編", render: (r) => r.taxId ?? "—" },
          { key: "term", label: "付款條件", render: (r) => r.paymentTerm ?? "—" },
          { key: "platform", label: "平台代號", render: (r) => r.platformCode ?? "—" },
        ]}
      />
    </>
  );
}
