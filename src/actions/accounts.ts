"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { employees, users } from "@/db/schema";

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

/* ---------- 人資：員工 ---------- */

export async function updateEmployee(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("姓名為必填");
  const d = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    if (!v) return null;
    const date = new Date(`${v}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) throw new Error(`${k} 日期無效`);
    return date;
  };
  await db.update(employees).set({
    employeeNo: String(formData.get("employeeNo") ?? "").trim(),
    name,
    departmentId: String(formData.get("departmentId") ?? "").trim() || null,
    title: String(formData.get("title") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    nationalId: String(formData.get("nationalId") ?? "").trim() || null,
    birthDate: d("birthDate"),
    hireDate: d("hireDate") ?? new Date(),
    salaryCents: Math.round(Number(String(formData.get("salary") ?? "0")) * 100),
    status: String(formData.get("status") ?? "active"),
    note: String(formData.get("note") ?? "").trim() || null,
  }).where(eq(employees.id, id));
  revalidatePath("/hr/employees");
}

export async function deleteEmployee(id: string) {
  await db.delete(employees).where(eq(employees.id, id));
  revalidatePath("/hr/employees");
}
