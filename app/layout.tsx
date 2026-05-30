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
  title: {
    default: 'Jović Group | Premium PVC & ALU Stolarija',
    template: '%s | Jović Group',
  },
  description:
    'Jović Group — Nemački profili, vrhunska izrada, profesionalna ugradnja. PVC i ALU stolarija za zahtevne klijente u Srbiji i inostranstvu.',
  keywords: [
    'PVC stolarija', 'ALU stolarija', 'prozori', 'vrata', 'Srbija',
    'nemački profili', 'ugradnja prozora', 'Jović Group',
  ],
  openGraph: {
    type: 'website',
    locale: 'sr_RS',
    url: 'https://jovicgroup.rs',
    siteName: 'Jović Group',
    title: 'Jović Group | Premium PVC & ALU Stolarija',
    description: 'Nemački profili. Precizna izrada. Profesionalna ugradnja.',
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
