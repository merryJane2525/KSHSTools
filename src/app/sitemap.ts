import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kshstools.co.kr";

  // 정적 페이지
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/community`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/equipments`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  // 동적 페이지: 기자재 상세
  try {
    const equipments = await prisma.equipment.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });

    const equipmentPages: MetadataRoute.Sitemap = equipments.map((eq: { slug: string; updatedAt: Date }) => ({
      url: `${baseUrl}/equipments/${eq.slug}`,
      lastModified: eq.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...staticPages, ...equipmentPages];
  } catch {
    // DB 연결 실패 시 정적 페이지만 반환
    return staticPages;
  }
}
