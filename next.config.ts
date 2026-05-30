import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/api/favicon" }];
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
