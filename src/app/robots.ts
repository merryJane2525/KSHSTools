import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kshstools.co.kr";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/operator/"],
      },
      // 네이버 검색 로봇(Yeti) 명시 허용
      {
        userAgent: "Yeti",
        allow: "/",
        disallow: ["/api/", "/admin/", "/operator/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
