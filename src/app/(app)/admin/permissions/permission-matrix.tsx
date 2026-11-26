"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setFeatureVisibility, setRolePermission } from "./actions";

export type ModuleDef = { key: string; label: string };
export type AccountTypeDef = { key: string; label: string };
export type LevelDef = { key: string; label: string };

export function PermissionMatrix({
  modules,
  accountTypes,
  levels,
  roles,
  permSet,
  visMap,
}: {
  modules: ModuleDef[];
  accountTypes: AccountTypeDef[];
  levels: LevelDef[];
  roles: { key: string; name: string }[];
  permSet: string[];
  visMap: Record<string, string>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const permLookup = new Set(permSet);

  const toggle = (roleKey: string, module: string, action: string, enabled: boolean) => {
    startTransition(async () => {
      await setRolePermission(roleKey, module, action, enabled);
      router.refresh();
    });
  };

  const changeLevel = (accountType: string, featureKey: string, level: string) => {
    startTransition(async () => {
      await setFeatureVisibility(accountType, featureKey, level);
      router.refresh();
    });
  };

  return (
    <>
      <section className="mb-6 rounded-xl border border-[#e9e6f3] bg-white p-5">
        <div className="mb-1 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[#26223d]">角色權限矩陣</h2>
          {pending ? <span className="text-[10px] text-[#9b96b0]">儲存中…</span> : null}
        </div>
        <p className="mb-4 text-[11px] text-[#9b96b0]">
          勾選代表該角色可讀（read）或可寫（write）該模組
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-left text-[#9b96b0]">
                <th className="w-40 py-2 font-medium">模組</th>
                {roles.map((r) => (
                  <th key={r.key} className="min-w-24 py-2 text-center font-medium">
                    {r.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map((m) => (
                <tr key={m.key} className="border-t border-[#f1eff7]">
                  <td className="py-2 text-[#26223d]">{m.label}</td>
                  {roles.map((r) => (
                    <td key={r.key} className="py-2">
                      <div className="flex items-center justify-center gap-2">
                        <label className="flex items-center gap-1 text-[10px] text-[#8c88a6]">
                          <input
                            type="checkbox"
                            checked={permLookup.has(`${r.key}|${m.key}|read`)}
                            onChange={(e) => toggle(r.key, m.key, "read", e.target.checked)}
                          />
                          讀
                        </label>
                        <label className="flex items-center gap-1 text-[10px] text-[#8c88a6]">
                          <input
                            type="checkbox"
                            checked={permLookup.has(`${r.key}|${m.key}|write`)}
                            onChange={(e) => toggle(r.key, m.key, "write", e.target.checked)}
                          />
                          寫
                        </label>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-[#e9e6f3] bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold text-[#26223d]">功能可見範圍</h2>
        <p className="mb-4 text-[11px] text-[#9b96b0]">
          依帳號類型（員工 / 客戶 / 廠商）設定功能可見程度 · 遮蔽者完全不顯示於選單
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-left text-[#9b96b0]">
                <th className="w-40 py-2 font-medium">功能</th>
                {accountTypes.map((t) => (
                  <th key={t.key} className="min-w-36 py-2 text-center font-medium">
                    {t.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map((m) => (
                <tr key={m.key} className="border-t border-[#f1eff7]">
                  <td className="py-2 text-[#26223d]">{m.label}</td>
                  {accountTypes.map((t) => (
                    <td key={t.key} className="py-2">
                      <select
                        value={visMap[`${t.key}|${m.key}`] ?? "hidden"}
                        onChange={(e) => changeLevel(t.key, m.key, e.target.value)}
                        className="w-full rounded-lg border border-[#e9e6f3] px-2 py-1.5 text-[11px] text-[#26223d]"
                      >
                        {levels.map((l) => (
                          <option key={l.key} value={l.key}>{l.label}</option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
