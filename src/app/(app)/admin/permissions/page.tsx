import { PageHeader } from "@/components/page-header";
import { ACCOUNT_TYPES, LEVELS, MODULES } from "@/lib/permissions";
import { getPermissionMatrix } from "./actions";
import { PermissionMatrix } from "./permission-matrix";
import { PermissionGuide } from "./permission-guide";

export const instant = false;

export default async function PermissionsPage() {
  const { roles, permSet, visMap } = await getPermissionMatrix();

  return (
    <>
      <PageHeader
        title="權限設定"
        subtitle="角色權限矩陣與各帳號類型的功能可見範圍 · 未授權功能不會顯示於選單"
      />

      <PermissionGuide />
      <PermissionMatrix
        modules={MODULES}
        accountTypes={ACCOUNT_TYPES}
        levels={LEVELS}
        roles={roles.map((r) => ({ key: r.key, name: r.name }))}
        permSet={[...permSet]}
        visMap={Object.fromEntries(visMap.entries())}
      />
    </>
  );
}
