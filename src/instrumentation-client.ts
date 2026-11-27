// Sentry 客户端初始化：仅在有 DSN 时启用（本机无 DSN 时不动作）
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({ dsn, tracesSampleRate: 0.1, debug: false });
  }).catch(() => { /* Sentry 初始化失败不应影响应用 */ });
}
