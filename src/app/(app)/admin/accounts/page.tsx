import { desc } from "drizzle-orm";
import { db } from "@/db";
import { accounts, roles, users } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { SimpleTable } from "@/components/simple-table";
import { formatDate } from "@/lib/utils";

export const instant = false;

const TYPE_LABEL: Record<string, string> = {
  employee: "員工",
  customer: "客戶",
  supplier: "廠商",
};

export default async function AccountsPage() {
  const [rows, accountRows, roleRows] = await Promise.all([
    db.select().from(users).orderBy(desc(users.createdAt)).limit(200),
    db.select().from(accounts),
    db.select().from(roles),
  ]);

  const providerByUser = new Map<string, string[]>();
  for (const a of accountRows) {
    const list = providerByUser.get(a.userId) ?? [];
    list.push(a.provider);
    providerByUser.set(a.userId, list);
  }

  const roleNameByKey = new Map(roleRows.map((r) => [r.key, r.name]));

  return (
    <>
      <PageHeader
        title="帳號管理"
        subtitle="所有登入皆建立一筆帳號資料 · 第一個登入的帳號自動為管理員"
      />

      <SimpleTable
        rows={rows}
        empty="尚無帳號，請先以 LINE 登入"
        columns={[
          {
            key: "name",
            label: "姓名 / 識別",
            render: (r) => (
              <span>
                <span className="font-medium text-[#26223d]">{r.name ?? "—"}</span>
                {r.email ? <span className="ml-2 text-[10px] text-[#9b96b0]">{r.email}</span> : null}
              </span>
            ),
          },
          {
            key: "id",
            label: "帳號 ID",
            render: (r) => <span className="text-[10px] text-[#9b96b0]">{r.id}</span>,
          },
          {
            key: "type",
            label: "類型",
            render: (r) => (
              <span className="rounded-md bg-[#f3f0fc] px-2 py-1 text-[11px] text-[#5538d6]">
                {TYPE_LABEL[r.accountType] ?? r.accountType}
              </span>
            ),
          },
          {
            key: "role",
            label: "角色",
            render: (r) => roleNameByKey.get(r.role) ?? r.role,
          },
          { key: "scope", label: "資料範圍", render: (r) => r.dataScope || "全部資料" },
          {
            key: "provider",
            label: "登入方式",
            render: (r) => (providerByUser.get(r.id) ?? []).join(" + ") || "—",
          },
          {
            key: "status",
            label: "狀態",
            render: (r) => (
              <span
                className={
                  r.status === "active"
                    ? "rounded-md bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700"
                    : "rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600"
                }
              >
                {r.status === "active" ? "啟用" : r.status}
              </span>
            ),
          },
          { key: "created", label: "建立時間", render: (r) => formatDate(r.createdAt) },
        ]}
      />
    </>
  );
}
