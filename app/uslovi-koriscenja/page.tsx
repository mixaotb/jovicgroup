import type { Metadata } from 'next';
import Link from 'next/link';
import GlassNav from '@/components/GlassNav';

export const metadata: Metadata = {
  title: 'Uslovi korišćenja',
  description: 'Uslovi korišćenja sajta i usluga Jović Group — narudžbine, cene, garancija i reklamacije.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://jovicgroup.com/uslovi-koriscenja' },
};

const SECTIONS = [
  {
    title: '1. Opšte odredbe',
    body: `Ovi Uslovi korišćenja uređuju odnos između privrednog subjekta Jović Group (u daljem tekstu: "Jović Group", "mi") sa sedištem na adresi Stevana Tišme 112, 22305 Stari Banovci, i korisnika veb sajta jovicgroup.com (u daljem tekstu: "korisnik", "vi").

Korišćenjem ovog sajta i slanjem narudžbine ili upita potvrđujete da ste pročitali i razumeli ove Uslove i da se sa njima slažete. Ako se ne slažete sa ovim Uslovima, molimo vas da ne koristite naš sajt.`,
  },
  {
    title: '2. Predmet usluga',
    body: `Jović Group se bavi izradom i ugradnjom PVC i ALU stolarije za fizička i pravna lica na teritoriji Srbije i za klijente iz dijaspore.

Sajt jovicgroup.com pruža:
— Informativne stranice o proizvodima i profil sistemima
— Online kalkulator za okvirnu procenu cene
— Formu za slanje upita / narudžbine

Sajt nema funkciju e-commerce platforme u smislu Zakona o elektronskoj trgovini — svaka narudžbina podleže potvrdi od strane Jović Group pre zaključenja ugovora.`,
  },
  {
    title: '3. Kalkulator i cene',
    body: `Online kalkulator daje okvirnu procenu troškova na osnovu unetih dimenzija, materijala i opcija. Prikazana cena je informativna i ne predstavlja konačnu ponudu niti obavezujući ugovor.

Konačna cena utvrđuje se nakon:
— Potvrde tehničkih detalja i dimenzija od strane našeg tima
— Provere dostupnosti profila i materijala
— Dogovora o roku i načinu isporuke

Cene su izražene u srpskim dinarima (RSD) i uključuju PDV tamo gde je primenjljivo. Jović Group zadržava pravo izmene cenovnika bez prethodne najave, pri čemu izmena ne utiče na već potvrđene narudžbine.`,
  },
  {
    title: '4. Proces narudžbine',
    body: `Slanjem forme na sajtu šaljete nam upit koji naš tim obrađuje u roku od jednog radnog dana. Narudžbina se smatra potvrđenom tek nakon što naš zaposleni kontaktira vas (telefonom ili e-mailom) i potvrdi tehničke detalje i cenu.

Nakon potvrde, ugovor o izradi i ugradnji stolarije se zaključuje i Jović Group pristupa realizaciji. Otkaz potvrđene narudžbine moguć je bez naknade najkasnije 48 sati od pisane potvrde. Nakon tog roka, eventualni troškovi materijala koji je već nabavljen mogu biti naplaćeni.`,
  },
  {
    title: '5. Isporuka i ugradnja',
    body: `Rokovi izrade i ugradnje dogovaraju se individualno u zavisnosti od obima narudžbine, dostupnosti materijala i rasporeda ekipe. Okvirni rok se navodi u potvrdi narudžbine i tretira se kao procena, a ne kao garantovani datum.

Isporuka na teritoriji Srbije se naplaćuje po važećem cenovniku (videti kalkulator). Za narudžbine iz inostranstva (dijaspora) cena isporuke se utvrđuje posebno. Ugradnja se vrši isključivo na teritoriji Srbije.`,
  },
  {
    title: '6. Garancija i reklamacije',
    body: `Jović Group garantuje ispravnost ugrađene stolarije u roku od 5 (pet) godina od dana ugradnje, za defekte koji su posledica greške u materijalu ili izrade.

Garancija ne pokriva:
— Oštećenja nastala nepravilnim korišćenjem ili mehaničkim udarima
— Normalno habanje tokom eksploatacije
— Oštećenja nastala delovanjem više sile (grad, poplava, i sl.)

Reklamaciju možete prijaviti na info@jovicgroup.com ili telefonom. Reklamacije rešavamo u skladu sa Zakonom o zaštiti potrošača Srbije, a odgovor dostavljamo najkasnije u roku od 8 dana.`,
  },
  {
    title: '7. Ograničenje odgovornosti',
    body: `Jović Group ne snosi odgovornost za:
— Štetu nastalu zbog privremene nedostupnosti sajta ili kalkulatora
— Netačne procene nastale unosom pogrešnih dimenzija u kalkulator
— Indirektnu ili posledičnu štetu

Ukupna odgovornost Jović Group prema korisniku ograničena je na vrednost konkretne narudžbine u slučaju spora.

Sadržaj sajta pruža se "kakav jeste" u informativne svrhe. Fotografije prikazanih proizvoda mogu se razlikovati od finalnog izgleda u zavisnosti od odabranih opcija i dimenzija.`,
  },
  {
    title: '8. Intelektualna svojina',
    body: `Sav sadržaj ovog sajta — tekstovi, fotografije, logotipi, grafički elementi i softver — vlasništvo su Jović Group ili se koriste uz odgovarajuće licence. Nije dozvoljeno kopiranje, distribucija ni reprodukovanje sadržaja bez prethodnog pisanog odobrenja.`,
  },
  {
    title: '9. Primenjivo pravo i nadležnost',
    body: `Na ove Uslove primenjuje se pravo Republike Srbije. Za sporove koji proisteknu iz korišćenja sajta ili usluga Jović Group, nadležan je sud u Beogradu, uz prethodnu obavezu pokušaja mirnog rešavanja spora.

Potrošači imaju pravo da sporove rešavaju pred nadležnim telom za alternativno rešavanje potrošačkih sporova u skladu sa Zakonom o zaštiti potrošača.`,
  },
  {
    title: '10. Izmene Uslova',
    body: `Jović Group zadržava pravo da izmeni ove Uslove korišćenja u bilo kom trenutku. Izmene stupaju na snagu objavom na ovoj stranici. Nastavak korišćenja sajta nakon objave izmena smatra se prihvatanjem novih Uslova. Preporučujemo da povremeno proverite ovu stranicu.`,
  },
];

export default function UsloviKoriscenjaPage() {
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
          Uslovi korišćenja
        </h1>
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
          Poslednja izmena: 1. jun 2026. · Primenljivo pravo: Republika Srbija
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
          Ovi Uslovi korišćenja važe za sve posetioce i korisnike sajta jovicgroup.com, kao i za svakoga ko putem sajta kontaktira Jović Group ili uputi narudžbinu. Molimo vas da ih pažljivo pročitate pre korišćenja naših usluga.
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
              href="/politika-privatnosti"
              className="transition-colors duration-200 hover:text-[#C9A84C]"
            >
              Politika privatnosti
            </Link>
            <span>© {new Date().getFullYear()} Jović Group</span>
          </div>
        </div>
      </div>
    </div>
  );
}
