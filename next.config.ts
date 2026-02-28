/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["web-push"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // Base64 인코딩된 이미지를 고려하여 10MB로 설정
    },
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
