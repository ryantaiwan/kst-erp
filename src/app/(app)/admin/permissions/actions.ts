"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { featureVisibility, rolePermissions, roles } from "@/db/schema";

/** 更新功能可見範圍 */
export async function setFeatureVisibility(accountType: string, featureKey: string, level: string) {
  const exists = await db
    .select()
    .from(featureVisibility)
    .where(
      and(
        eq(featureVisibility.accountType, accountType),
        eq(featureVisibility.featureKey, featureKey),
      ),
    )
    .limit(1);

  if (exists.length > 0) {
    await db
      .update(featureVisibility)
      .set({ level })
      .where(
        and(
          eq(featureVisibility.accountType, accountType),
          eq(featureVisibility.featureKey, featureKey),
        ),
      );
  } else {
    await db.insert(featureVisibility).values({ accountType, featureKey, level });
  }

  revalidatePath("/admin/permissions");
}

/** 更新角色權限（模組 × read/write） */
export async function setRolePermission(roleKey: string, module: string, action: string, enabled: boolean) {
  const exists = await db
    .select()
    .from(rolePermissions)
    .where(
      and(
        eq(rolePermissions.roleKey, roleKey),
        eq(rolePermissions.module, module),
        eq(rolePermissions.action, action),
      ),
    )
    .limit(1);

  if (enabled && exists.length === 0) {
    await db.insert(rolePermissions).values({ roleKey, module, action });
  } else if (!enabled && exists.length > 0) {
    await db
      .delete(rolePermissions)
      .where(
        and(
          eq(rolePermissions.roleKey, roleKey),
          eq(rolePermissions.module, module),
          eq(rolePermissions.action, action),
        ),
      );
  }

  revalidatePath("/admin/permissions");
}

/** 取得權限矩陣 */
export async function getPermissionMatrix() {
  const [roleRows, permRows, visRows] = await Promise.all([
    db.select().from(roles).orderBy(asc(roles.key)),
    db.select().from(rolePermissions),
    db.select().from(featureVisibility),
  ]);

  const permSet = new Set(permRows.map((p) => `${p.roleKey}|${p.module}|${p.action}`));
  const visMap = new Map(visRows.map((v) => [`${v.accountType}|${v.featureKey}`, v.level]));

  return { roles: roleRows, permSet, visMap };
}
