import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@libsql/client";
import { randomUUID } from "node:crypto";
import { encode } from "next-auth/jwt";

/**
 * 產生本機測試用的 session token（僅供開發驗證）。
 * 直接沿用 next-auth 官方的 encode，確保簽章格式與中介層一致。
 */

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const secret = process.env.AUTH_SECRET;
  if (!url || !secret) throw new Error("缺少 TURSO_DATABASE_URL 或 AUTH_SECRET");

  const client = createClient({ url, authToken });
  const userId = "test-admin-001";
  const now = Math.floor(Date.now() / 1000);

  const existing = await client.execute({
    sql: "select id from user where id = ?",
    args: [userId],
  });

  if (existing.rows.length === 0) {
    await client.batch(
      [
        {
          sql: "insert into user (id, name, email, account_type, role, data_scope, status, created_at) values (?,?,?,?,?,?,?,?)",
          args: [userId, "測試管理員", "admin@example.com", "employee", "admin", "all", "active", now],
        },
        {
          sql: "insert into account (user_id, type, provider, provider_account_id) values (?,?,?,?)",
          args: [userId, "credentials", "line", `dev-${randomUUID()}`],
        },
      ],
      "write",
    );
  }

  const token = await encode({
    token: {
      sub: userId,
      userId,
      accountType: "employee",
      role: "admin",
      dataScope: "all",
      name: "測試管理員",
      email: "admin@example.com",
    },
    secret,
    salt: "authjs.session-token",
    maxAge: 30 * 24 * 60 * 60,
  });

  console.log(token);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
