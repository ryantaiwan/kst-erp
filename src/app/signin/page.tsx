import { signIn } from "@/auth";

export default function SignInPage() {
  async function lineSignIn() {
    "use server";
    await signIn("line", { redirectTo: "/sales/customers" });
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f6fd] px-6">
      <div className="w-full max-w-sm rounded-2xl border border-[#e9e6f3] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#6d4aff] text-sm font-semibold text-white">
          KST
        </div>
        <h1 className="mt-4 text-xl font-semibold">KST ERP 登入</h1>
        <p className="mt-2 text-xs leading-6 text-[#8c88a6]">
          鋒冠科技有限公司 · Keenness Technology Co., Ltd.
        </p>
        <form action={lineSignIn} className="mt-6">
          <button
            type="submit"
            className="w-full rounded-lg bg-[#06c755] px-4 py-3 text-sm font-medium text-white hover:bg-[#05a845]"
          >
            使用 LINE 登入
          </button>
        </form>
        <p className="mt-4 text-[11px] text-[#aaa5bd]">
          第一個登入的帳號會自動成為系統管理員
        </p>
      </div>
    </main>
  );
}
