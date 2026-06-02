import type { Metadata } from 'next';
import Link from 'next/link';
import GlassNav from '@/components/GlassNav';

export const metadata: Metadata = {
  title: 'Politika privatnosti',
  description: 'Politika privatnosti Jović Group — kako prikupljamo, koristimo i štitimo vaše podatke o ličnosti.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://jovicgroup.com/politika-privatnosti' },
};

const SECTIONS = [
  {
    title: '1. Rukovalac podataka',
    body: `Rukovalac vaših podataka o ličnosti je:

Jović Group
Stevana Tišme 112, 22305 Stari Banovci, Republika Srbija
E-pošta: info@jovicgroup.com
Telefon: +381 69 3 999 555

Za sva pitanja u vezi sa obradom podataka možete nas kontaktirati na gorenavedenu e-adresu.`,
  },
  {
    title: '2. Koje podatke prikupljamo',
    body: `Prikupljamo isključivo podatke koje nam vi direktno dostavite putem naše online forme za narudžbinu ili kalkulatora cena:

— Ime i prezime
— Broj telefona
— E-mail adresa (opciono)
— Adresa isporuke (grad, ulica)
— Detalji narudžbine (vrsta, dimenzije i materijal stolarije)

Tehnički podaci (IP adresa, tip pregledača) mogu biti privremeno zabeleženi u serverskim logovima radi bezbednosti i otklanjanja grešaka, ali se ne koriste za profilisanje.`,
  },
  {
    title: '3. Svrha i pravni osnov obrade',
    body: `Vaše podatke obrađujemo u sledeće svrhe:

— Priprema i obrada vaše narudžbine ili upita (pravni osnov: izvršenje ugovora, čl. 12 st. 1 tač. 2 ZZPL)
— Komunikacija u vezi sa narudžbinom — potvrda, dostava, reklamacije (pravni osnov: izvršenje ugovora)
— Slanje e-mail potvrde narudžbine, ako ste naznačili e-mail adresu (pravni osnov: legitimni interes / izvršenje ugovora)
— Ispunjavanje zakonskih obaveza — računovodstvo, arhivska građa (pravni osnov: pravna obaveza, čl. 12 st. 1 tač. 3 ZZPL)

Ne koristimo vaše podatke u svrhe direktnog marketinga bez vašeg izričitog pristanka.`,
  },
  {
    title: '4. Rok čuvanja podataka',
    body: `Podatke o narudžbini čuvamo onoliko dugo koliko je potrebno za ispunjenje ugovora i rešavanje eventualnih reklamacija, ali ne duže od 5 godina od dana isporuke, u skladu sa zakonskim obavezama u oblasti računovodstva i zaštite potrošača.

Podaci koji nisu rezultirali narudžbinom (upiti bez konverzije) brišu se najkasnije u roku od 12 meseci.`,
  },
  {
    title: '5. Primaoci podataka',
    body: `Vaši podaci se ne prodaju trećim licima. Možemo ih deliti isključivo sa:

— Supabase Inc. — naša infrastruktura baze podataka (procesor podataka, ugovor o obradi potpisan)
— Resend Inc. — servis za slanje transakcione e-pošte
— Nadležnim državnim organima, isključivo na osnovu zakonske obaveze

Svi navedeni procesori podataka posluju u skladu sa GDPR / ekvivalentnim standardima zaštite.`,
  },
  {
    title: '6. Vaša prava',
    body: `U skladu sa Zakonom o zaštiti podataka o ličnosti (ZZPL, "Sl. glasnik RS" br. 87/2018) imate pravo da:

— Pristupite podacima koji se o vama obrađuju
— Zahtevate ispravku netačnih podataka
— Zahtevate brisanje podataka ("pravo na zaborav") kada više ne postoji osnov za obradu
— Zahtevate ograničenje obrade u spornim situacijama
— Prigovorite obradi zasnovanoj na legitimnom interesu
— Dobijete podatke u prenosivom formatu

Zahteve možete uputiti na info@jovicgroup.com. Odgovorićemo najkasnije u roku od 30 dana.

Imate i pravo na pritužbu Povereniku za informacije od javnog značaja i zaštitu podataka o ličnosti (www.poverenik.rs).`,
  },
  {
    title: '7. Bezbednost podataka',
    body: `Primenjujemo tehničke i organizacione mere zaštite primerene riziku obrade: šifrovana veza (HTTPS/TLS), kontrola pristupa zasnovana na ulogama, autentifikacija servera i redovne sigurnosne provere.

Naša infrastruktura baze podataka koristi Row Level Security (RLS) politike koje osiguravaju da podaci o narudžbinama budu dostupni isključivo ovlašćenim zaposlenima.`,
  },
  {
    title: '8. Kolačići (cookies)',
    body: `Naša web stranica koristi isključivo tehničke kolačiće neophodne za funkcionisanje sajta (npr. čuvanje teme prikaza — svetla/tamna). Ne koristimo analitičke, marketinške ni kolačiće trećih strana. Saglasnost za kolačiće nije potrebna jer se radi isključivo o nužnim kolačićima.`,
  },
  {
    title: '9. Izmene politike',
    body: `Zadržavamo pravo da izmenimo ovu Politiku privatnosti. O svim značajnim izmenama obavestićemo vas objavom na ovoj stranici uz ažuriran datum poslednje izmene. Preporučujemo da povremeno proverite ovu stranicu.`,
  },
];

export default function PolitikaPrivatnostiPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <GlassNav />

      {/* Page header */}
      <div className="pt-32 pb-14 px-6 text-center">
        <div className="inline-flex items-center gap-2 mb-5">
          <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Jović Group</span>
          <span style={{ color: 'var(--text-faint)', opacity: 0.4 }}>/</span>
          <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#C9A84C' }}>Pravni dokumenti</span>
        </div>
        <h1 className="font-display text-4xl sm:text-[52px] font-bold leading-tight mb-4" style={{ color: 'var(--text)' }}>
          Politika privatnosti
        </h1>
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
          Poslednja izmena: 1. jun 2026. · Primenljiv zakon: ZZPL (Republika Srbija)
        </p>
      </div>

      {/* Intro callout */}
      <div className="max-w-3xl mx-auto px-6 mb-10">
        <div
          className="rounded-2xl p-5 sm:p-6 text-[14px] leading-relaxed"
          style={{
            background: 'linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.03))',
            border: '1px solid rgba(201,168,76,0.2)',
            color: 'var(--text-muted)',
          }}
        >
          Jović Group poštuje vašu privatnost. Ova politika objašnjava koje podatke prikupljamo putem našeg sajta i kalkulatora, kako ih koristimo i koja prava imate kao lice čiji se podaci obrađuju, u skladu sa Zakonom o zaštiti podataka o ličnosti Srbije (ZZPL) i GDPR standardima.
        </div>
      </div>

      {/* Sections */}
      <article className="max-w-3xl mx-auto px-6 pb-24 space-y-10">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2
              className="font-display text-[22px] font-bold mb-3"
              style={{ color: 'var(--text)' }}
            >
              {section.title}
            </h2>
            <div
              className="rounded-xl p-5 sm:p-6 text-[14px] leading-[1.8] whitespace-pre-line"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
              }}
            >
              {section.body}
            </div>
          </section>
        ))}
      </article>

      {/* Footer bar */}
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <div
          className="max-w-3xl mx-auto px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[12px]"
          style={{ color: 'var(--text-faint)' }}
        >
          <Link
            href="/"
            className="flex items-center gap-1.5 transition-colors duration-200 hover:text-[#C9A84C]"
          >
            ← Nazad na početnu
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/uslovi-koriscenja"
              className="transition-colors duration-200 hover:text-[#C9A84C]"
            >
              Uslovi korišćenja
            </Link>
            <span>© {new Date().getFullYear()} Jović Group</span>
          </div>
        </div>
      </div>
    </div>
  );
}
