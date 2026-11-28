"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customerContacts, customerDepartments, customers } from "@/db/schema";

function str(fd: FormData, key: string) { return String(fd.get(key) ?? "").trim(); }

/* ---------- 客戶基本資料 ---------- */

export async function updateCustomer(id: string, formData: FormData) {
  const name = str(formData, "name");
  if (!name) throw new Error("公司名稱為必填");
  await db.update(customers).set({
    code: str(formData, "code") || null,
    name,
    taxId: str(formData, "taxId") || null,
    zipCode: str(formData, "zipCode") || null,
    address: str(formData, "address") || null,
    phone: str(formData, "phone") || null,
    fax: str(formData, "fax") || null,
    paymentTerm: str(formData, "paymentTerm") || null,
    status: str(formData, "status") || "active",
  }).where(eq(customers.id, id));
  revalidatePath("/sales/customers");
  revalidatePath(`/sales/customers/${id}`);
}

/* ---------- 聯絡人 ---------- */

export async function addContact(customerId: string, formData: FormData) {
  const name = str(formData, "name");
  if (!name) throw new Error("聯絡人姓名為必填");
  await db.insert(customerContacts).values({
    customerId,
    name,
    departmentId: str(formData, "departmentId") || null,
    mobile: str(formData, "mobile") || null,
    phone: str(formData, "phone") || null,
    ext: str(formData, "ext") || null,
    email: str(formData, "email") || null,
    isPrimary: formData.get("isPrimary") === "true",
  });
  revalidatePath(`/sales/customers/${customerId}`);
}

export async function updateContact(id: string, customerId: string, formData: FormData) {
  const name = str(formData, "name");
  if (!name) throw new Error("聯絡人姓名為必填");
  await db.update(customerContacts).set({
    name,
    departmentId: str(formData, "departmentId") || null,
    mobile: str(formData, "mobile") || null,
    phone: str(formData, "phone") || null,
    ext: str(formData, "ext") || null,
    email: str(formData, "email") || null,
    isPrimary: formData.get("isPrimary") === "true",
  }).where(eq(customerContacts.id, id));
  revalidatePath(`/sales/customers/${customerId}`);
}

export async function deleteContact(id: string, customerId: string) {
  await db.delete(customerContacts).where(eq(customerContacts.id, id));
  revalidatePath(`/sales/customers/${customerId}`);
}

/* ---------- 客戶部門（兩層） ---------- */

export async function addCustomerDepartment(customerId: string, formData: FormData) {
  const name = str(formData, "name");
  if (!name) throw new Error("部門名稱為必填");
  await db.insert(customerDepartments).values({
    customerId,
    parentId: str(formData, "parentId") || null,
    name,
    code: str(formData, "code") || null,
    manager: str(formData, "manager") || null,
    note: str(formData, "note") || null,
  });
  revalidatePath(`/sales/customers/${customerId}`);
}

export async function updateCustomerDepartment(id: string, customerId: string, formData: FormData) {
  const name = str(formData, "name");
  if (!name) throw new Error("部門名稱為必填");
  const parentId = str(formData, "parentId") || null;
  if (parentId === id) throw new Error("上級部門不可為自己");
  await db.update(customerDepartments).set({
    parentId, name,
    code: str(formData, "code") || null,
    manager: str(formData, "manager") || null,
    note: str(formData, "note") || null,
  }).where(eq(customerDepartments.id, id));
  revalidatePath(`/sales/customers/${customerId}`);
}

export async function deleteCustomerDepartment(id: string, customerId: string) {
  // 先將下級部門提升到上一層，避免孤兒
  const [dept] = await db.select().from(customerDepartments).where(eq(customerDepartments.id, id)).limit(1);
  if (dept) {
    await db.update(customerDepartments).set({ parentId: dept.parentId })
      .where(eq(customerDepartments.parentId, id));
  }
  await db.update(customerContacts).set({ departmentId: null })
    .where(eq(customerContacts.departmentId, id));
  await db.delete(customerDepartments).where(eq(customerDepartments.id, id));
  revalidatePath(`/sales/customers/${customerId}`);
}
