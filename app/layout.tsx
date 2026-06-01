// app/layout.tsx
import type { Metadata } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://jovicgroup.com'),
  title: {
    default: 'Jović Group | PVC i ALU Stolarija',
    template: '%s | Jović Group',
  },
  description:
    'PVC i ALU prozori i vrata po evropskim standardima. Jović Group — precizna izrada i profesionalna ugradnja širom Srbije. Besplatna kalkulacija online.',
  keywords: [
    'PVC stolarija Stari Banovci', 'ALU stolarija Beograd', 'prozori Zemun',
    'vrata Stari Banovci', 'PVC prozori Srbija', 'ALU prozori Srbija',
    'ugradnja prozora Beograd', 'stolarija Stari Banovci', 'Schuco prozori',
    'Alphacan PVC', 'Elvial ALU', 'Profilco stolarija', 'nemački profili Srbija',
    'komarnici Beograd', 'balkonska vrata Srbija', 'klizna vrata',
    'Jović Group', 'PVC stolarija', 'ALU stolarija',
  ],
  authors: [{ name: 'Jović Group', url: 'https://jovicgroup.com' }],
  creator: 'Jović Group',
  publisher: 'Jović Group',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  alternates: { canonical: 'https://jovicgroup.com' },
  openGraph: {
    type: 'website',
    locale: 'sr_RS',
    url: 'https://jovicgroup.com',
    siteName: 'Jović Group',
    title: 'Jović Group | PVC i ALU Stolarija',
    description: 'Prozori i vrata po evropskim standardima. Precizna izrada i profesionalna ugradnja širom Srbije.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Jović Group — PVC i ALU stolarija' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jović Group | PVC i ALU Stolarija',
    description: 'Prozori i vrata po evropskim standardima. Ugradnja u Srbiji.',
    images: ['/og-image.png'],
  },
};

const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://jovicgroup.com/#business',
  name: 'Jović Group',
  description:
    'Premium PVC i ALU stolarija — prozori, vrata i komarnici po evropskim standardima. Profesionalna izrada i ugradnja u Srbiji.',
  url: 'https://jovicgroup.com',
  telephone: '+381693999555',
  email: 'info@jovicgroup.com',
  image: 'https://jovicgroup.com/logo.png',
  priceRange: '$$',
  currenciesAccepted: 'RSD',
  paymentAccepted: 'Cash, Invoice',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Stari Banovci 112',
    addressLocality: 'Stari Banovci',
    postalCode: '22305',
    addressRegion: 'Beograd',
    addressCountry: 'RS',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 44.9258,
    longitude: 20.3312,
  },
  areaServed: [
    { '@type': 'Country', name: 'Srbija' },
    { '@type': 'City', name: 'Beograd' },
    { '@type': 'City', name: 'Zemun' },
    { '@type': 'City', name: 'Novi Sad' },
    { '@type': 'Country', name: 'Germany' },
    { '@type': 'Country', name: 'Austria' },
    { '@type': 'Country', name: 'Switzerland' },
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'PVC i ALU stolarija',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'PVC prozori' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'ALU prozori' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'PVC vrata' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'ALU vrata' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Balkonska vrata' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Klizna vrata' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Plisirani komarnici' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Ugradnja stolarije' } },
    ],
  },
};

const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  } catch(e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr" className={`${playfair.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </head>
      <body className="bg-theme text-theme font-body antialiased">
        {/* Fixed grain — pointer-events-none, sits above content at z-60 */}
        <div
          className="fixed inset-0 z-[60] pointer-events-none opacity-[0.016] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
          }}
          aria-hidden
        />
        {children}
      </body>
    </html>
  );
}
