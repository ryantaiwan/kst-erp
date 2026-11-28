"use client";

/**
 * 統一的成功 / 失敗通知。
 *
 * 不用 toast（RootLayout 的 Toaster 在 Next.js 16 未正確 hydration），
 * 改寫入 sessionStorage，由 <FlashMessage /> 在頁面讀取並顯示。
 * 這樣即使 router.refresh() 導致 component 重新掛載，訊息仍會保留。
 */

const KEY = "kst-flash-message";

export function notifySuccess(message: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify({ type: "success", message }));
  window.dispatchEvent(new CustomEvent("kst-flash", { detail: { type: "success", message } }));
}

export function notifyError(error: unknown, fallback = "操作失敗") {
  const message = error instanceof Error ? error.message : fallback;
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify({ type: "error", message }));
  window.dispatchEvent(new CustomEvent("kst-flash", { detail: { type: "error", message } }));
}

export type Flash = { type: "success" | "error"; message: string };

export function readFlash(): Flash | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Flash;
    sessionStorage.removeItem(KEY);
    return parsed;
  } catch {
    sessionStorage.removeItem(KEY);
    return null;
  }
}
