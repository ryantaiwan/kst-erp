"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { customers, inventory, inventoryTransactions, products, suppliers } from "@/db/schema";

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}
function cents(formData: FormData, key: string) {
  return Math.round(Number(str(formData, key) || 0) * 100);
}

/* ---------- 客戶 ---------- */

export async function upsertCustomer(formData: FormData) {
  const name = str(formData, "name");
  if (!name) throw new Error("客戶名稱為必填");
  const values = {
    code: str(formData, "code") || null,
    name,
    taxId: str(formData, "taxId") || null,
    zipCode: str(formData, "zipCode") || null,
    address: str(formData, "address") || null,
    phone: str(formData, "phone") || null,
    fax: str(formData, "fax") || null,
    paymentTerm: str(formData, "paymentTerm") || null,
    status: str(formData, "status") || "active",
  };
  const id = str(formData, "id");
  if (id) {
    await db.update(customers).set(values).where(eq(customers.id, id));
  } else {
    await db.insert(customers).values(values).onConflictDoNothing();
  }
  revalidatePath("/sales/customers");
}

/* ---------- 供應商 ---------- */

export async function upsertSupplier(formData: FormData) {
  const name = str(formData, "name");
  if (!name) throw new Error("供應商名稱為必填");
  const values = {
    code: str(formData, "code") || null,
    name,
    branchName: str(formData, "branchName") || null,
    taxId: str(formData, "taxId") || null,
    zipCode: str(formData, "zipCode") || null,
    address: str(formData, "address") || null,
    paymentTerm: str(formData, "paymentTerm") || null,
    platformCode: str(formData, "platformCode") || null,
    status: str(formData, "status") || "active",
  };
  const id = str(formData, "id");
  if (id) {
    await db.update(suppliers).set(values).where(eq(suppliers.id, id));
  } else {
    await db.insert(suppliers).values(values).onConflictDoNothing();
  }
  revalidatePath("/master/suppliers");
}

/* ---------- 商品 ---------- */

export async function upsertProduct(formData: FormData) {
  const sku = str(formData, "sku");
  const name = str(formData, "name");
  if (!sku || !name) throw new Error("料號與名稱為必填");
  const values = {
    sku,
    name,
    spec: str(formData, "spec") || null,
    unit: str(formData, "unit") || "顆",
    costCents: cents(formData, "cost"),
    salePriceCents: cents(formData, "price"),
    status: str(formData, "status") || "active",
  };
  const id = str(formData, "id");
  if (id) {
    await db.update(products).set(values).where(eq(products.id, id));
  } else {
    await db.insert(products).values(values).onConflictDoNothing();
  }
  revalidatePath("/master/products");
}

/* ---------- 庫存調整 ---------- */

export async function adjustInventory(formData: FormData) {
  const productId = str(formData, "productId");
  const warehouseId = str(formData, "warehouseId");
  const delta = Number(str(formData, "delta"));
  const note = str(formData, "note");
  if (!productId || !warehouseId || !Number.isFinite(delta) || delta === 0) {
    throw new Error("請選擇商品與倉庫，並填寫不為零的調整數量");
  }

  await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(inventory)
      .where(and(eq(inventory.productId, productId), eq(inventory.warehouseId, warehouseId)));
    const nextQty = (current?.qty ?? 0) + delta;
    if (nextQty < 0) throw new Error("調整後庫存不可為負數");

    await tx.insert(inventory).values({
      productId, warehouseId, qty: nextQty, updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: [inventory.productId, inventory.warehouseId],
      set: { qty: nextQty, updatedAt: new Date() },
    });

    await tx.insert(inventoryTransactions).values({
      productId, warehouseId,
      type: "adjust",
      qty: delta,
      refType: "manual",
      refId: note || null,
    });
  });

  revalidatePath("/master/inventory");
}

export async function deleteCustomer(id: string) {
  await db.delete(customers).where(eq(customers.id, id));
  revalidatePath("/sales/customers");
}

export async function deleteSupplier(id: string) {
  await db.delete(suppliers).where(eq(suppliers.id, id));
  revalidatePath("/master/suppliers");
}

export async function deleteProduct(id: string) {
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/master/products");
}

export async function updateSupplierById(id: string, formData: FormData) {
  const name = str(formData, "name");
  if (!name) throw new Error("供應商名稱為必填");
  await db.update(suppliers).set({
    code: str(formData, "code") || null,
    name,
    branchName: str(formData, "branchName") || null,
    taxId: str(formData, "taxId") || null,
    zipCode: str(formData, "zipCode") || null,
    address: str(formData, "address") || null,
    paymentTerm: str(formData, "paymentTerm") || null,
    platformCode: str(formData, "platformCode") || null,
    status: str(formData, "status") || "active",
  }).where(eq(suppliers.id, id));
  revalidatePath("/master/suppliers");
}

export async function updateProductById(id: string, formData: FormData) {
  const sku = str(formData, "sku");
  const name = str(formData, "name");
  if (!sku || !name) throw new Error("料號與名稱為必填");
  await db.update(products).set({
    sku, name,
    spec: str(formData, "spec") || null,
    unit: str(formData, "unit") || "顆",
    costCents: cents(formData, "cost"),
    salePriceCents: cents(formData, "price"),
    status: str(formData, "status") || "active",
  }).where(eq(products.id, id));
  revalidatePath("/master/products");
}
