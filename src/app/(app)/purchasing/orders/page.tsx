import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, purchaseOrders, suppliers } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { SimpleTable } from "@/components/simple-table";
import { SimplePagination } from "@/components/simple-pagination";
import { formatDate, formatMoney } from "@/lib/utils";
import { getCurrentScope } from "@/lib/scope";
import { ReceivePartial } from "./receive-partial";
import { PurchaseOrderForm } from "./po-form";

export const instant = false;

export default async function PurchaseOrdersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const scope = await getCurrentScope();
  const where = scope.filtered ? eq(purchaseOrders.supplierId, scope.scopeId!) : undefined;

  const [rows, countRows, supplierRows, productRows] = await Promise.all([
    db.select().from(purchaseOrders).where(where)
      .orderBy(desc(purchaseOrders.createdAt)).limit(20).offset((page - 1) * 20),
    db.select({ n: sql<number>`count(*)` }).from(purchaseOrders).where(where),
    db.select().from(suppliers),
    db.select({ id: products.id, sku: products.sku, name: products.name }).from(products),
  ]);
  const supplierNameById = new Map(supplierRows.map((s) => [s.id, s.name]));

  return (
    <>
      <PageHeader title="採購訂單" subtitle="進貨流程起點 · 可轉入庫與進項發票對帳 · 點擊單號查看與編輯" />
      <PurchaseOrderForm suppliers={supplierRows.map((s) => ({ id: s.id, name: s.name }))} products={productRows} />

      <SimplePagination page={page} total={countRows[0]?.n ?? 0} basePath="/purchasing/orders" />
      <SimpleTable
        rows={rows}
        empty="尚無採購訂單，請用上方表單新增"
        columns={[
          {
            key: "no",
            label: "採購單號",
            render: (r) => (
              <Link href={`/purchasing/orders/${r.id}`} className="font-medium text-[#5538d6] no-underline hover:underline">
                {r.poNo}
              </Link>
            ),
          },
          { key: "supplier", label: "供應商", render: (r) => supplierNameById.get(r.supplierId) ?? r.supplierId.slice(0, 8) },
          { key: "date", label: "建立日", render: (r) => formatDate(r.createdAt) },
          { key: "total", label: "金額", render: (r) => formatMoney(r.totalCents) },
          { key: "status", label: "狀態", render: (r) => r.status },
          { key: "recv", label: "入庫", render: (r) => <ReceivePartial orderId={r.id} /> },
        ]}
      />
    </>
  );
}
