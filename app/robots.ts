import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/', '/profile/', '/stats/'], // Protect private routes from crawling
    },
    sitemap: 'https://code--vault.vercel.app/sitemap.xml',
  };
}
