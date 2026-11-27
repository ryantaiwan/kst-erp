import { auth } from "@/auth";

/**
 * 資料範圍過濾（Phase 1 承諾：客戶/廠商只能看到自己的資料）。
 *
 * - employee：回传 null，查询不过滤（看全部）
 * - customer / supplier：回传 dataScope 所绑定的对象 ID；
 *   dataScope 为空时回传 "__none__"（哨兵值，查不到任何资料），避免fail-open。
 */
export async function getCurrentScope() {
  const session = await auth();
  const accountType = (session?.user as { accountType?: string } | undefined)?.accountType ?? "employee";
  const dataScope = (session?.user as { dataScope?: string | null } | undefined)?.dataScope;

  if (accountType === "employee") {
    return { accountType, scopeId: null as string | null, filtered: false };
  }
  return {
    accountType,
    scopeId: dataScope || "__none__",
    filtered: true,
  };
}
