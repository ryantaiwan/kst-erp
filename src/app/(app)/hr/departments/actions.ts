"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { departments } from "@/db/schema";

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createDepartment(formData: FormData) {
  const code = str(formData, "code");
  const name = str(formData, "name");
  if (!code || !name) throw new Error("部門代號與名稱為必填");

  await db.insert(departments).values({
    code,
    name,
    parentId: str(formData, "parentId") || null,
    note: str(formData, "note") || null,
  });

  revalidatePath("/hr/departments");
  revalidatePath("/hr/employees");
}

export async function updateDepartment(id: string, name: string, note: string) {
  if (!name.trim()) throw new Error("部門名稱不能為空");
  await db.update(departments).set({ name: name.trim(), note: note || null }).where(eq(departments.id, id));
  revalidatePath("/hr/departments");
  revalidatePath("/hr/employees");
}
