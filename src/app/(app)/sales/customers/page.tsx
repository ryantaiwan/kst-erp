import { and, eq, like, or } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { SimpleTable } from "@/components/simple-table";
import { CustomerForm } from "./customer-form";
import { getCurrentScope } from "@/lib/scope";

export const instant = false;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const scope = await getCurrentScope();
  const rows = await db
    .select()
    .from(customers)
    .where(
      and(
        scope.filtered ? eq(customers.id, scope.scopeId!) : undefined,
        q ? or(like(customers.name, `%${q}%`), like(customers.code, `%${q}%`), like(customers.taxId, `%${q}%`)) : undefined,
      ),
    );

  return (
    <>
      <PageHeader
        title="客戶管理"
        subtitle={`共 ${rows.length} 筆 · 來自「廠客資料表 / 客戶部品處理表」`}
        right={
          <form className="flex gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="搜尋代號 / 名稱 / 統編"
              className="rounded-lg border border-[#e9e6f3] bg-white px-3 py-2 text-xs outline-none focus:border-[#6d4aff]"
            />
            <button className="rounded-lg bg-[#6d4aff] px-3 py-2 text-xs text-white">搜尋</button>
          </form>
        }
      />
      {!scope.filtered && <div className="mb-5"><CustomerForm /></div>}
      <SimpleTable
        rows={rows}
        empty="尚無客戶資料"
        columns={[
          { key: "code", label: "代號", render: (r) => <span className="font-medium text-[#5538d6]">{r.code}</span> },
          { key: "name", label: "公司名稱", render: (r) => r.name },
          { key: "taxId", label: "統編", render: (r) => r.taxId ?? "—" },
          { key: "phone", label: "電話", render: (r) => r.phone ?? "—" },
          { key: "address", label: "地址", render: (r) => r.address ?? "—" },
          { key: "status", label: "狀態", render: (r) => r.status },
        ]}
      />
    </>
  );
}
