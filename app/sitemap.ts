import { MetadataRoute } from 'next';
import { CALCULATOR_ENABLED } from '@/lib/features';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://jovicgroup.com';
  const now = new Date();

  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    ...(CALCULATOR_ENABLED
      ? [{
          url: `${base}/kalkulator`,
          lastModified: now,
          changeFrequency: 'weekly' as const,
          priority: 0.9,
        }]
      : []),
    {
      url: `${base}/politika-privatnosti`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${base}/uslovi-koriscenja`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];
}
