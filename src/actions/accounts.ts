"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function updateAccount(id: string, formData: FormData) {
  const role = String(formData.get("role") ?? "").trim();
  const accountType = String(formData.get("accountType") ?? "").trim();
  const dataScope = String(formData.get("dataScope") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!["admin", "manager", "sales", "accounting", "warehouse", "viewer", "customer", "supplier"].includes(role)) {
    throw new Error("無效的角色");
  }
  if (!["employee", "customer", "supplier"].includes(accountType)) {
    throw new Error("無效的帳號類型");
  }
  if (!["active", "disabled"].includes(status)) {
    throw new Error("無效的狀態");
  }

  await db.update(users).set({
    role,
    accountType,
    dataScope: dataScope || null,
    status,
  }).where(eq(users.id, id));

  revalidatePath("/admin/accounts");
}
