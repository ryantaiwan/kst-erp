import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // 可透過 NEXT_DIST_DIR 切換建置輸出目錄，便於在 .next 被鎖定時另建新目錄。
  distDir: process.env.NEXT_DIST_DIR || ".next",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

// Sentry：僅在 Vercel 上設定了 SENTRY_AUTH_TOKEN 與 SENTRY_ORG 時做 source map 上傳。
// 本機沒有這些值時維持原設定，不影響開發。
const sentryConfigured = Boolean(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG);
export default sentryConfigured
  ? require("@sentry/nextjs").withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT || "kst-erp",
      silent: true,
      widenClientFileUpload: true,
      disableLogger: true,
    })
  : nextConfig;
