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
    const email = process.argv[3];
    if (!email) {
      console.error("用法：npm run admin:promote -- <email>");
      process.exit(1);
    }
    await db
      .update(users)
      .set({ role: "admin", accountType: "employee", status: "active" })
      .where(eq(users.email, email));
    console.log(`已将 ${email} 设为管理员`);
    return;
  }

  console.log("用法：npm run admin:list | npm run admin:promote -- <email>");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
