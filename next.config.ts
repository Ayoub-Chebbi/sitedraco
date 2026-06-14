import type { NextConfig } from "next";

// Vercel injects its toolbar/feedback script on preview deployments only.
// VERCEL_ENV is "preview" on preview, "production" on prod, undefined locally.
const isPreview = process.env.VERCEL_ENV === "preview";
const isDev = process.env.NODE_ENV === "development";

const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${isPreview ? " https://vercel.live https://*.vercel.app" : ""} https://connect.facebook.net https://static.cloudflareinsights.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://usy4zczaubjlufi6.public.blob.vercel-storage.com https://www.facebook.com https:",
      "font-src 'self' https://fonts.gstatic.com",
      `connect-src 'self' https://loot.tn https://developers.flouci.com https://www.facebook.com https://connect.facebook.net https://cloudflareinsights.com${isPreview ? " https://vercel.live wss://ws-us3.pusher.com https://sockjs-us3.pusher.com" : ""}`,
      `frame-src${isPreview ? " https://vercel.live" : " 'none'"}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/api/favicon" }];
  },
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
  images: {
    dangerouslyAllowSVG: false,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "usy4zczaubjlufi6.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
