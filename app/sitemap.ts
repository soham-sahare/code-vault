import { MetadataRoute } from 'next';
import { db } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://code-vault.vercel.app';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  try {
    const publicProblems = await db.problem.findMany({
      where: { isPublic: true },
      select: { id: true, updatedAt: true },
      take: 500,
    });

    const problemRoutes: MetadataRoute.Sitemap = publicProblems.map((prob) => ({
      url: `${baseUrl}/problem/${prob.id}`,
      lastModified: prob.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.9,
    }));

    const publicSheets = await db.sheet.findMany({
      where: { isPublic: true },
      select: { id: true, shareSlug: true, updatedAt: true },
      take: 200,
    });

    const sheetRoutes: MetadataRoute.Sitemap = publicSheets.map((sheet) => ({
      url: `${baseUrl}/sheet/${sheet.shareSlug || sheet.id}`,
      lastModified: sheet.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.85,
    }));

    return [...staticRoutes, ...problemRoutes, ...sheetRoutes];
  } catch {
    return staticRoutes;
  }
}
