import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compress responses
  compress: true,
  // Optimize images
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Reduce bundle size — tree-shake server-only code
  serverExternalPackages: ["bcryptjs", "sharp"],
  // Performance headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
      {
        source: "/uploads/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
