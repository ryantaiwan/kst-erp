import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { inventory, inventoryTransactions, products, warehouses } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { SimpleTable } from "@/components/simple-table";
import { formatDate } from "@/lib/utils";
import { InventoryForm } from "./inventory-form";

export const instant = false;

export default async function InventoryPage() {
  const [rows, productRows, warehouseRows, txRows] = await Promise.all([
    db.select().from(inventory).limit(500),
    db.select({ id: products.id, sku: products.sku, name: products.name, unit: products.unit }).from(products),
    db.select().from(warehouses),
    db.select().from(inventoryTransactions).orderBy(desc(inventoryTransactions.createdAt)).limit(100),
  ]);

  const productById = new Map(productRows.map((p) => [p.id, p]));
  const warehouseById = new Map(warehouseRows.map((w) => [w.id, w]));

  const totalQty = rows.reduce((s, r) => s + r.qty, 0);
  const lowStock = rows.filter((r) => r.qty > 0 && r.qty <= 5);

  return (
    <>
      <PageHeader
        title="庫存查詢"
        subtitle="各倉庫的現況存量與近期異動"
        right={
          <div className="flex gap-2">
            <Stat label="庫存紀錄" value={`${rows.length}`} tone="text-[#26223d]" />
            <Stat label="總數量" value={`${totalQty}`} tone="text-[#5538d6]" />
            <Stat label="低於 5 件" value={`${lowStock.length}`} tone="text-[#e05a5a]" />
          </div>
        }
      />

      <InventoryForm products={productRows} warehouses={warehouseRows} />
      <div className="mb-6">
        <div className="mb-3 text-sm font-semibold text-[#26223d]">現況庫存</div>
        <SimpleTable
          rows={rows}
          empty="尚無庫存紀錄，入庫後會自動產生"
          columns={[
            {
              key: "sku",
              label: "商品",
              render: (r) => {
                const p = productById.get(r.productId);
                return (
                  <span>
                    <span className="font-medium text-[#26223d]">{p?.name ?? "—"}</span>
                    {p?.sku ? <span className="ml-2 text-[10px] text-[#9b96b0]">{p.sku}</span> : null}
                  </span>
                );
              },
            },
            {
              key: "warehouse",
              label: "倉庫",
              render: (r) => {
                const w = warehouseById.get(r.warehouseId);
                return w ? `${w.code} ${w.name}` : "—";
              },
            },
            {
              key: "qty",
              label: "數量",
              render: (r) => (
                <span className={r.qty > 0 && r.qty <= 5 ? "font-medium text-[#e05a5a]" : "text-[#26223d]"}>
                  {r.qty}
                </span>
              ),
            },
            { key: "updated", label: "更新時間", render: (r) => formatDate(r.updatedAt) },
          ]}
        />
      </div>

      <div>
        <div className="mb-3 text-sm font-semibold text-[#26223d]">近期庫存異動</div>
        <SimpleTable
          rows={txRows}
          empty="尚無庫存異動"
          columns={[
            { key: "type", label: "類型", render: (r) => (r.type === "in" ? "入庫" : r.type === "out" ? "出庫" : "盤點調整") },
            {
              key: "product",
              label: "商品",
              render: (r) => {
                const p = productById.get(r.productId);
                return p ? `${p.name}${p.sku ? ` (${p.sku})` : ""}` : "—";
              },
            },
            {
              key: "warehouse",
              label: "倉庫",
              render: (r) => {
                const w = warehouseById.get(r.warehouseId);
                return w ? `${w.code} ${w.name}` : "—";
              },
            },
            {
              key: "qty",
              label: "數量",
              render: (r) => (
                <span className={r.qty >= 0 ? "text-[#06c755]" : "text-[#e05a5a]"}>
                  {r.qty >= 0 ? `+${r.qty}` : r.qty}
                </span>
              ),
            },
            { key: "ref", label: "來源", render: (r) => r.refType ?? "—" },
            { key: "date", label: "時間", render: (r) => formatDate(r.createdAt) },
          ]}
        />
      </div>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg border border-[#e9e6f3] bg-white px-3 py-2">
      <div className="text-[10px] text-[#9b96b0]">{label}</div>
      <div className={`text-sm font-semibold ${tone}`}>{value}</div>
    </div>
  );
}
