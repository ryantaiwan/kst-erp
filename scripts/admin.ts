import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { users } from "../src/db/schema";

config({ path: ".env.local" });

async function main() {
  const command = process.argv[2];

  if (command === "list") {
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        accountType: users.accountType,
        role: users.role,
        status: users.status,
      })
      .from(users);
    console.table(rows);
    return;
  }

  if (command === "promote") {
    const key = process.argv[3];
    if (!key) {
      console.error("用法：npm run admin:promote -- <email或user-id>");
      process.exit(1);
    }
    const condition = key.includes("@") ? eq(users.email, key) : eq(users.id, key);
    await db
      .update(users)
      .set({ role: "admin", accountType: "employee", status: "active" })
      .where(condition);
    console.log(`已将 ${key} 设为管理员`);
    return;
  }

  console.log("用法：npm run admin:list | npm run admin:promote -- <email>");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
