/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["web-push"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // Base64 인코딩된 이미지를 고려하여 10MB로 설정
    },
    // 번들 크기 감소: 지정한 패키지는 트리쉐이킹된 named import만 로드
    optimizePackageImports: ["@prisma/client", "jose", "zod"],
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
