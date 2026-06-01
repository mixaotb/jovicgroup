import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kalkulator Cene Stolarije — PVC i ALU Prozori i Vrata',
  description:
    'Izračunajte cenu PVC ili ALU prozora i vrata online. Unesite dimenzije, izaberite materijal i lokaciju — realna cena za Srbiju i inostranstvo. Jović Group, Stari Banovci.',
  alternates: { canonical: 'https://jovicgroup.com/kalkulator' },
  openGraph: {
    title: 'Kalkulator Cene Stolarije | Jović Group',
    description:
      'Besplatna online kalkulacija cene PVC i ALU prozora i vrata. Bez čekanja, bez obaveza.',
    url: 'https://jovicgroup.com/kalkulator',
    type: 'website',
    locale: 'sr_RS',
  },
};

export default function KalkulatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
