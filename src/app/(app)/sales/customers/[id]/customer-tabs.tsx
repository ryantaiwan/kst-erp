"use client";

import { useState } from "react";
import { BasicTab } from "./basic-tab";
import { ContactTab } from "./contact-tab";
import { DepartmentTab } from "./department-tab";

export type CustomerData = {
  id: string; code: string; name: string; taxId: string; zipCode: string;
  address: string; phone: string; fax: string; paymentTerm: string; status: string;
};
export type ContactData = {
  id: string; name: string; departmentId: string; mobile: string;
  phone: string; ext: string; email: string; isPrimary: boolean;
};
export type DepartmentData = {
  id: string; name: string; parentId: string; code: string; manager: string; note: string;
};

const TABS = [
  { key: "basic", label: "基本資料" },
  { key: "contact", label: "聯絡人" },
  { key: "department", label: "部門組織" },
] as const;

export function CustomerTabs({
  customer, contacts, departments,
}: {
  customer: CustomerData;
  contacts: ContactData[];
  departments: DepartmentData[];
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("basic");

  return (
    <>
      <div className="mb-4 flex gap-1 border-b border-[#e9e6f3]">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-4 py-2 text-xs font-medium transition ${
              tab === t.key
                ? "border-[#6d4aff] text-[#5538d6]"
                : "border-transparent text-[#8c88a6] hover:text-[#57536e]"
            }`}
          >
            {t.label}
            <span className="ml-1 text-[10px] text-[#aaa5bd]">
              {t.key === "contact" ? contacts.length : t.key === "department" ? departments.length : ""}
            </span>
          </button>
        ))}
      </div>

      {tab === "basic" && <BasicTab customer={customer} />}
      {tab === "contact" && <ContactTab customerId={customer.id} contacts={contacts} departments={departments} />}
      {tab === "department" && <DepartmentTab customerId={customer.id} departments={departments} />}
    </>
  );
}
