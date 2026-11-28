import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customerContacts, customerDepartments, customers } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { CustomerTabs } from "./customer-tabs";

export const instant = false;

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [customer] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  if (!customer) notFound();

  const [contacts, departments] = await Promise.all([
    db.select().from(customerContacts).where(eq(customerContacts.customerId, id)),
    db.select().from(customerDepartments).where(eq(customerDepartments.customerId, id)),
  ]);

  return (
    <>
      <PageHeader
        title={customer.name}
        subtitle={`客戶代號 ${customer.code ?? "—"} · 客戶基本資料與內部組織`}
        right={
          <Link href="/sales/customers" className="rounded-lg border border-[#e9e6f3] bg-white px-3 py-2 text-xs text-[#57536e] no-underline">
            返回列表
          </Link>
        }
      />
      <CustomerTabs
        customer={{
          id: customer.id, code: customer.code ?? "", name: customer.name,
          taxId: customer.taxId ?? "", zipCode: customer.zipCode ?? "",
          address: customer.address ?? "", phone: customer.phone ?? "",
          fax: customer.fax ?? "", paymentTerm: customer.paymentTerm ?? "",
          status: customer.status,
        }}
        contacts={contacts.map((c) => ({
          id: c.id, name: c.name, departmentId: c.departmentId ?? "",
          mobile: c.mobile ?? "", phone: c.phone ?? "", ext: c.ext ?? "",
          email: c.email ?? "", isPrimary: c.isPrimary,
        }))}
        departments={departments.map((d) => ({
          id: d.id, name: d.name, parentId: d.parentId ?? "",
          code: d.code ?? "", manager: d.manager ?? "", note: d.note ?? "",
        }))}
      />
    </>
  );
}
