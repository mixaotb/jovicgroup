import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/crm/', '/api/'],
      },
    ],
    sitemap: 'https://jovicgroup.com/sitemap.xml',
    host: 'https://jovicgroup.com',
  };
}
