import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  GlobeIcon,
  CheckCircleIcon,
  HouseIcon,
  LightningIcon,
  SwatchesIcon,
  ShieldCheckIcon,
  StarIcon,
  ArrowRightIcon,
} from '@phosphor-icons/react/dist/ssr';
import GlassNav from '@/components/GlassNav';
import HeroSection from '@/components/HeroSection';
import RevealUp from '@/components/RevealUp';
import LiquidGlassCard from '@/components/LiquidGlassCard';

export const metadata: Metadata = {
  title: 'Jović Group | PVC & ALU Stolarija',
  description:
    'PVC i ALU prozori i vrata po meri i evropskim standardima. Precizna izrada i profesionalna ugradnja širom Srbije. Besplatna kalkulacija online.',
  alternates: { canonical: 'https://jovicgroup.com' },
  openGraph: {
    title: 'Jović Group | PVC & ALU Stolarija',
    description: 'Prozori i vrata po meri i evropskim standardima. Precizna izrada i profesionalna ugradnja širom Srbije.',
    type: 'website',
    locale: 'sr_RS',
    url: 'https://jovicgroup.com',
  },
};

const testimonials = [
  {
    text: 'Zamenili smo sve prozore u kući za jedan dan. Ekipa tačna i uredna, bez nereda. Kuća je od tada potpuno drugačija.',
    author: 'Dajana Nikolić',
    location: 'Stara Pazova',
    rating: 5,
  },
  {
    text: 'Koristio sam kalkulator i finalna cena bila skoro ista. Bez skrivenih troškova, sve ugrađeno besprekorno. Preporučujem svima.',
    author: 'Aleksa Batoćanin',
    location: 'Bele Vode, Beograd',
    rating: 5,
  },
  {
    text: 'Balkonska vrata i prozori ugrađeni za jedan dan, sve čisto i uredno. Odavno ih poznajem kao komšije, ali posao su odradili potpuno profesionalno.',
    author: 'Dragana Preradović',
    location: 'Stari Banovci',
    rating: 5,
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <StarIcon key={i} size={13} weight="fill" className="text-[#C9A84C]" />
      ))}
    </div>
  );
}

// Reusable glass icon wrapper
function GlassIcon({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-11 h-11 rounded-2xl flex items-center justify-center text-[#C9A84C] flex-shrink-0"
      style={{
        background: 'rgba(201,168,76,0.12)',
        border: '1px solid rgba(201,168,76,0.22)',
        boxShadow: 'inset 0 1px 0 rgba(201,168,76,0.18)',
      }}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="relative bg-theme text-theme overflow-x-hidden">
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#C9A84C] focus:text-[#06080F] focus:font-bold focus:rounded-full"
      >
        Preskoči na sadržaj
      </a>

      <GlassNav />

      <main id="main-content">
        {/* ─── Hero ─────────────────────────────────────── */}
        <HeroSection />

        {/* ─── Features ─────────────────────────────────── */}
        <section id="prednosti" className="relative py-32">
          {/* Background glow orbs — colorful so the liquid glass distortion is visible */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[#C9A84C]/10 dark:bg-[#C9A84C]/8 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-[#1A2744]/30 dark:bg-[#1A2744]/50 blur-[100px] pointer-events-none" />
          {/* Colorful accent orbs */}
          <div className="absolute top-[8%] right-[6%] w-[420px] h-[420px] rounded-full bg-blue-400/20 dark:bg-blue-500/20 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[8%] left-[4%] w-[360px] h-[360px] rounded-full bg-purple-400/18 dark:bg-purple-500/18 blur-[110px] pointer-events-none" />
          <div className="absolute top-[45%] left-[55%] w-[280px] h-[280px] rounded-full bg-teal-400/18 dark:bg-teal-400/15 blur-[90px] pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
            <RevealUp className="mb-14">
              <div className="gold-rule mb-5" />
              <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-tight text-[var(--text)]">
                Šta nas<br />
                <span className="text-[#C9A84C]">izdvaja</span>
              </h2>
            </RevealUp>

            {/* Bento glass grid — 6 cells, no 3-equal-column pattern */}
            <RevealUp delay={0.05}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Cell 1: Featured — col-span-2, real photo background */}
                <div
                  className="md:col-span-2 relative overflow-hidden rounded-[1.5rem] group cursor-default"
                  style={{ minHeight: '260px' }}
                >
                  {/* Photo background */}
                  <Image
                    src="/features.jpg"
                    alt="Moderna zgrada sa evropskim prozorima"
                    fill
                    className="object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 100vw, 66vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-[#06080F]/80 via-[#06080F]/50 to-transparent" />
                  {/* Double-bezel glass overlay */}
                  <div className="absolute inset-0 flex flex-col justify-end p-7"
                    style={{
                      background: 'linear-gradient(to top, rgba(6,8,15,0.85) 30%, transparent)',
                    }}
                  >
                    <GlassIcon><GlobeIcon size={22} weight="light" /></GlassIcon>
                    <h3 className="font-display font-bold text-[1.35rem] text-white mt-4 mb-2">Evropski profili</h3>
                    <p className="text-white/70 text-[13.5px] leading-relaxed mb-5 max-w-sm">
                      Alphacan & Schüco (PVC) · Elvial & Profilco (ALU), profili koji važe decenijama širom Evrope. Okov: AGB (Italija) i Schüco.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {['Alphacan', 'Schüco', 'Elvial', 'Profilco', 'AGB'].map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wide text-[#C9A84C]"
                          style={{
                            background: 'rgba(201,168,76,0.12)',
                            border: '1px solid rgba(201,168,76,0.25)',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Cell 2: Garancija — gold glass */}
                <div
                  className="relative overflow-hidden rounded-[1.5rem] p-7 flex flex-col justify-between group hover:scale-[1.01] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  style={{
                    background: 'linear-gradient(135deg, rgba(201,168,76,0.16), rgba(201,168,76,0.06))',
                    border: '1px solid rgba(201,168,76,0.24)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    boxShadow: 'inset 0 1px 0 rgba(201,168,76,0.22)',
                    minHeight: '260px',
                  }}
                >
                  <div
                    className="absolute top-4 right-5 font-display font-black text-[#C9A84C]/10 leading-none select-none pointer-events-none"
                    style={{ fontSize: '7rem' }}
                    aria-hidden
                  >5</div>
                  <GlassIcon><ShieldCheckIcon size={22} weight="light" /></GlassIcon>
                  <div>
                    <h3 className="font-display font-bold text-[1.3rem] text-[var(--text)] mb-2">Garancija 5 godina</h3>
                    <p className="text-[var(--text-muted)] text-[13.5px] leading-relaxed">
                      Servisni tim dostupan u roku od 48 sati za sve intervencije.
                    </p>
                  </div>
                </div>

                {/* Cells 3, 4, 5 — liquid glass cards */}
                {[
                  {
                    icon: <CheckCircleIcon size={22} weight="light" />,
                    title: 'Precizna izrada',
                    body: 'Tačnost do milimetra. Bez kompromisa, samo savršen spoj.',
                  },
                  {
                    icon: <HouseIcon size={22} weight="light" />,
                    title: 'Profesionalna ugradnja',
                    body: 'Iskusni tim koji svaki ugradnju završava precizno i uredno.',
                  },
                  {
                    icon: <SwatchesIcon size={22} weight="light" />,
                    title: 'Individualni dizajn',
                    body: 'Više od 200 boja RAL skale, mat ili sjaj, lučni oblici.',
                  },
                ].map((f) => (
                  <LiquidGlassCard
                    key={f.title}
                    className="rounded-[1.5rem] p-6 flex flex-col gap-5 hover:scale-[1.01] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                    style={{ border: '1px solid var(--glass-border)' }}
                  >
                    <GlassIcon>{f.icon}</GlassIcon>
                    <div>
                      <h3 className="font-display font-bold text-[1.05rem] text-[var(--text)] mb-2">{f.title}</h3>
                      <p className="text-[var(--text-muted)] text-[13.5px] leading-relaxed">{f.body}</p>
                    </div>
                  </LiquidGlassCard>
                ))}

                {/* Cell 6: Energetska efikasnost — full width horizontal liquid glass */}
                <LiquidGlassCard
                  className="md:col-span-3 rounded-[1.5rem] p-7 flex flex-col md:flex-row items-start md:items-center gap-6 hover:scale-[1.005] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  style={{ border: '1px solid var(--glass-border)' }}
                >
                  <GlassIcon><LightningIcon size={22} weight="light" /></GlassIcon>
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-[1.05rem] text-[var(--text)] mb-1.5">Energetska efikasnost</h3>
                    <p className="text-[var(--text-muted)] text-[13.5px] leading-relaxed max-w-xl">
                      Trojni staklopaketi smanjuju gubitke toplote za do 40%. Investicija koja se isplati već prve zime.
                    </p>
                  </div>
                  <div
                    className="flex-shrink-0 text-right md:pl-8 md:border-l"
                    style={{ borderColor: 'var(--glass-border)' }}
                  >
                    <div className="font-display font-black text-[2.8rem] text-[#C9A84C] leading-none tabular-nums">-40%</div>
                    <div className="text-[var(--text-faint)] text-[10px] mt-1 uppercase tracking-[0.12em] font-semibold">Gubici toplote</div>
                  </div>
                </LiquidGlassCard>

              </div>
            </RevealUp>
          </div>
        </section>

        {/* ─── About ────────────────────────────────────── */}
        <section id="o-nama" className="relative py-32">
          <div className="absolute top-1/2 right-0 w-[600px] h-[600px] rounded-full bg-[#1A2744]/40 blur-[120px] pointer-events-none -translate-y-1/2" />

          <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

              <RevealUp>
                <div className="gold-rule mb-6" />
                <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-tight text-[var(--text)] mb-7">
                  Domaći majstori,<br />
                  <span className="text-[#C9A84C]">evropski standardi.</span>
                </h2>
                <div className="space-y-4 text-[var(--text-muted)] text-[15px] leading-relaxed">
                  <p>
                    Jović Group je porodična kompanija osnovana 2005. godine s jednim ciljem: doneti nivo preciznosti koji
                    poznajemo iz Nemačke direktno u srpske domove. Naši majstori školovani su prema evropskim
                    protokolima ugradnje.
                  </p>
                  <p>
                    Skoro dve decenije kasnije, naš najveći marketing i dalje su preporuke, od komšije do komšije,
                    od porodice do porodice. Na tome smo gradili reputaciju i na tome ostajemo.
                  </p>
                  <p>
                    Radimo i sa dijasporom, uglavnom srpskim porodicama iz Austrije koje žele da opreme
                    stanove u Srbiji uz istu garanciju kvaliteta.
                  </p>
                </div>

                <div className="mt-10 grid grid-cols-3 gap-3">
                  {/* Combined location card */}
                  <div
                    className="col-span-3 p-4 rounded-2xl hover:scale-[1.005] transition-transform duration-300 flex items-center justify-between gap-4"
                    style={{
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                    }}
                  >
                    <div>
                      <div className="font-display font-bold text-[var(--text)] text-[15px]">Gde radimo</div>
                      <div className="text-[var(--text-faint)] text-xs mt-0.5">Srbija i dijaspora</div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {['RS', 'AT'].map((code) => (
                        <span
                          key={code}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-widest text-[var(--text-faint)]"
                          style={{ background: 'var(--glass-bg-strong)', border: '1px solid var(--glass-border)' }}
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Material & hardware cards */}
                  {[
                    { label: 'PVC',  desc: 'Alphacan & Schüco profili' },
                    { label: 'ALU',  desc: 'Elvial & Profilco profili' },
                    { label: 'Okov', desc: 'AGB (Italija) i Schüco' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="p-4 rounded-2xl hover:scale-[1.02] transition-transform duration-300"
                      style={{
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                      }}
                    >
                      <div className="font-display font-bold text-[var(--text)] text-[15px]">{item.label}</div>
                      <div className="text-[var(--text-faint)] text-xs mt-0.5">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </RevealUp>

              <RevealUp delay={0.12}>
                {/* Double-bezel spec card */}
                <div
                  className="p-[6px] rounded-[2rem]"
                  style={{
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                  }}
                >
                  <div
                    className="rounded-[calc(2rem-6px)] p-7"
                    style={{
                      background: 'var(--glass-bg-strong)',
                      backdropFilter: 'blur(32px) saturate(200%)',
                      WebkitBackdropFilter: 'blur(32px) saturate(200%)',
                      border: '1px solid var(--glass-border)',
                      boxShadow: 'inset 0 1px 0 var(--glass-shine), 0 32px 64px rgba(0,0,0,0.2)',
                    }}
                  >
                    <div className="flex items-center gap-3 mb-8">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{
                          background: 'rgba(201,168,76,0.15)',
                          border: '1px solid rgba(201,168,76,0.28)',
                        }}
                      >
                        <ShieldCheckIcon size={18} weight="light" className="text-[#C9A84C]" />
                      </div>
                      <div>
                        <div className="font-display font-bold text-[var(--text)] text-[14px]">Evropski standardi</div>
                        <div className="text-[var(--text-faint)] text-xs mt-0.5">Schüco · Alphacan · Elvial profili</div>
                      </div>
                    </div>

                    <div className="space-y-5">
                      {[
                        { label: 'Zvučna izolacija',   value: 'do 45 dB',     pct: 78 },
                        { label: 'Klasa zaptivenosti', value: 'Klasa 4 (max)', pct: 95 },
                      ].map((spec) => (
                        <div key={spec.label}>
                          <div className="flex justify-between text-[12px] mb-2">
                            <span className="text-[var(--text-muted)] font-medium">{spec.label}</span>
                            <span className="text-[#C9A84C] font-mono font-bold tabular-nums">{spec.value}</span>
                          </div>
                          <div
                            className="h-[3px] rounded-full overflow-hidden"
                            style={{ background: 'var(--glass-border)' }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${spec.pct}%`,
                                background: 'linear-gradient(90deg, #C9A84C, #E8C97A)',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div
                      className="mt-7 pt-6 grid grid-cols-2 gap-2 text-center"
                      style={{ borderTop: '1px solid var(--glass-border)' }}
                    >
                      {['RS', 'AT'].map((code) => (
                        <div
                          key={code}
                          className="py-2 rounded-xl text-[var(--text-faint)] text-[11px] font-bold tracking-widest"
                          style={{
                            background: 'var(--glass-bg)',
                            border: '1px solid var(--glass-border)',
                          }}
                        >
                          {code}
                        </div>
                      ))}
                    </div>
                    <p className="text-center text-[var(--text-faint)] text-[11px] mt-2">Srbija i dijaspora</p>

                    <div
                      className="mt-5 flex items-center gap-2.5 px-4 py-3 rounded-2xl"
                      style={{
                        background: 'rgba(52,211,153,0.08)',
                        border: '1px solid rgba(52,211,153,0.2)',
                      }}
                    >
                      <CheckCircleIcon size={16} weight="fill" className="text-emerald-400 flex-shrink-0" />
                      <span className="text-[13px] font-semibold text-emerald-400">Garancija 5 godina na sve ugradnje</span>
                    </div>
                  </div>
                </div>
              </RevealUp>
            </div>
          </div>
        </section>

        {/* ─── Testimonials ─────────────────────────────── */}
        <section id="utisci" className="relative py-32">
          <div className="absolute top-1/4 left-1/6 w-[400px] h-[400px] rounded-full bg-[#C9A84C]/8 dark:bg-[#C9A84C]/5 blur-[100px] pointer-events-none" />
          {/* Colorful accent orbs */}
          <div className="absolute top-[10%] right-[8%] w-[380px] h-[380px] rounded-full bg-blue-400/20 dark:bg-blue-500/18 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[5%] right-[30%] w-[320px] h-[320px] rounded-full bg-purple-400/18 dark:bg-purple-500/15 blur-[100px] pointer-events-none" />
          <div className="absolute top-[50%] left-[10%] w-[260px] h-[260px] rounded-full bg-teal-400/15 dark:bg-teal-400/12 blur-[90px] pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
            <RevealUp className="mb-14">
              <div className="gold-rule mb-5" />
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-bold text-[var(--text)]">
                  Šta kažu klijenti
                </h2>
                <p className="text-[var(--text-muted)] text-[14px] max-w-xs sm:text-right leading-relaxed">
                  Reči naših klijenata govore same za sebe.
                </p>
              </div>
            </RevealUp>

            {/* Asymmetric: featured large left + two stacked right */}
            <RevealUp delay={0.05}>
              <div className="grid md:grid-cols-3 gap-4">

                <LiquidGlassCard
                  className="md:col-span-2 p-8 rounded-[1.5rem]"
                  style={{ border: '1px solid var(--glass-border)' }}
                >
                  <div className="relative">
                    <div
                      className="absolute top-0 right-0 font-display font-black text-[#C9A84C]/10 leading-none select-none pointer-events-none"
                      style={{ fontSize: '6rem' }}
                      aria-hidden
                    >&ldquo;</div>
                    <Stars count={testimonials[0].rating} />
                    <p className="text-[var(--text)] text-[1.08rem] leading-relaxed mt-5 mb-7 max-w-lg relative z-10 font-medium">
                      {testimonials[0].text}
                    </p>
                    <div
                      className="flex items-center gap-3 pt-6"
                      style={{ borderTop: '1px solid var(--glass-border)' }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-[14px] text-[#C9A84C]"
                        style={{
                          background: 'rgba(201,168,76,0.12)',
                          border: '1px solid rgba(201,168,76,0.2)',
                        }}
                      >
                        {testimonials[0].author[0]}
                      </div>
                      <div>
                        <div className="font-display font-bold text-[var(--text)] text-[13px]">{testimonials[0].author}</div>
                        <div className="text-[var(--text-faint)] text-[11px] mt-0.5">{testimonials[0].location}</div>
                      </div>
                    </div>
                  </div>
                </LiquidGlassCard>

                <div className="flex flex-col gap-4">
                  {testimonials.slice(1).map((t) => (
                    <LiquidGlassCard
                      key={t.author}
                      className="flex-1 p-6 rounded-[1.5rem]"
                      style={{ border: '1px solid var(--glass-border)' }}
                    >
                      <Stars count={t.rating} />
                      <p className="text-[var(--text-muted)] text-[13.5px] leading-relaxed mt-4 mb-5">
                        {t.text}
                      </p>
                      <div style={{ borderTop: '1px solid var(--glass-border)' }} className="pt-4">
                        <div className="font-display font-bold text-[var(--text)] text-[12px]">{t.author}</div>
                        <div className="text-[var(--text-faint)] text-[11px] mt-0.5">{t.location}</div>
                      </div>
                    </LiquidGlassCard>
                  ))}
                </div>
              </div>
            </RevealUp>
          </div>
        </section>

        {/* ─── CTA Banner ───────────────────────────────── */}
        <section className="relative py-32 bg-theme">
          {/* Central gold glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-[#C9A84C]/8 blur-[100px] pointer-events-none" />
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)' }}
          />

          <div className="relative max-w-3xl mx-auto px-5 sm:px-8 text-center">
            <RevealUp>
              {/* Double-bezel CTA card */}
              <div
                className="p-[6px] rounded-[2rem]"
                style={{
                  background: 'rgba(201,168,76,0.06)',
                  border: '1px solid rgba(201,168,76,0.15)',
                }}
              >
                <div
                  className="rounded-[calc(2rem-6px)] px-8 py-14"
                  style={{
                    background: 'var(--glass-bg-strong)',
                    backdropFilter: 'blur(32px)',
                    WebkitBackdropFilter: 'blur(32px)',
                    border: '1px solid var(--glass-border)',
                    boxShadow: 'inset 0 1px 0 var(--glass-shine)',
                  }}
                >
                  <div className="flex justify-center mb-7">
                    <div className="gold-rule" />
                  </div>
                  <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-bold leading-tight text-[var(--text)] mb-5">
                    Vaš projekat zaslužuje<br />
                    <span className="text-[#C9A84C]">tačnu cenu.</span>
                  </h2>
                  <p className="text-[var(--text-muted)] text-[15px] max-w-md mx-auto mb-10 leading-relaxed">
                    Unesite dimenzije, izaberite materijal i lokaciju.
                    Realan trošak odmah, bez čekanja na poziv.
                  </p>
                  <Link
                    href="/kalkulator"
                    className="group inline-flex items-center pl-7 pr-2 py-2 rounded-full bg-[#C9A84C] text-[#06080F] font-bold text-[15px] hover:bg-[#E8C97A] hover:-translate-y-[3px] hover:shadow-[0_14px_44px_rgba(201,168,76,0.5)] active:translate-y-0 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.025] active:scale-[0.975] shadow-[0_8px_40px_rgba(201,168,76,0.35)]"
                  >
                    <span>Pokrenite kalkulator</span>
                    <span
                      className="ml-4 w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-[2px] group-hover:-translate-y-[1px] group-hover:scale-105"
                      style={{ background: 'rgba(6,8,15,0.15)' }}
                    >
                      <ArrowRightIcon size={15} weight="bold" />
                    </span>
                  </Link>
                  <p className="text-[var(--text-faint)] text-[11px] mt-5 tracking-wide">
                    Besplatno · Bez obaveza · Online ili telefonom
                  </p>
                </div>
              </div>
            </RevealUp>
          </div>
        </section>

        {/* ─── Footer ───────────────────────────────────── */}
        <footer
          className="py-12"
          style={{
            borderTop: '1px solid var(--glass-border)',
            background: 'var(--glass-bg)',
          }}
        >
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
              <div className="sm:col-span-2">
                <div className="flex items-center gap-2.5 mb-4">
                  <Image src="/logo.png" alt="Jović Group" width={22} height={22} className="object-contain" />
                  <span className="font-display text-[14px] font-bold text-[var(--text)]">
                    Jović <span className="text-[#C9A84C]">Group</span>
                  </span>
                </div>
                <p className="text-[var(--text-faint)] text-[13px] leading-relaxed max-w-[240px]">
                  PVC i ALU stolarija po evropskim standardima. Srbija i inostranstvo.
                </p>
              </div>

              <div>
                <div className="text-[var(--text-muted)] font-semibold text-[12px] mb-4 tracking-wide uppercase">Kontakt</div>
                <address className="not-italic space-y-2 text-[var(--text-faint)] text-[13px]">
                  <div><a href="mailto:info@jovicgroup.com" className="hover:text-[#C9A84C] transition-colors duration-300">info@jovicgroup.com</a></div>
                  <div><a href="tel:+381693999555" className="hover:text-[#C9A84C] transition-colors duration-300">+381 69 3 999 555</a></div>
                  <div>Stevana Tišme 112, Stari Banovci</div>
                  <div>22305, Srbija</div>
                </address>
              </div>

              <div>
                <div className="text-[var(--text-muted)] font-semibold text-[12px] mb-4 tracking-wide uppercase">Linkovi</div>
                <div className="space-y-2 text-[13px]">
                  <div><Link href="/kalkulator"            className="text-[var(--text-faint)] hover:text-[#C9A84C] transition-colors duration-300">Kalkulator</Link></div>
                  <div><a href="#prednosti"                className="text-[var(--text-faint)] hover:text-[#C9A84C] transition-colors duration-300">Prednosti</a></div>
                  <div><a href="#utisci"                   className="text-[var(--text-faint)] hover:text-[#C9A84C] transition-colors duration-300">Utisci</a></div>
                  <div><Link href="/crm/login"             className="text-[var(--text-faint)] hover:text-[#C9A84C] transition-colors duration-300">CRM Login</Link></div>
                </div>
              </div>
            </div>

            <div
              className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-[var(--text-faint)] text-[11px]"
              style={{ borderTop: '1px solid var(--glass-border)' }}
            >
              <span>© {new Date().getFullYear()} Jović Group. Sva prava zadržana.</span>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link href="/politika-privatnosti" className="hover:text-[#C9A84C] transition-colors duration-300">Politika privatnosti</Link>
                <Link href="/uslovi-koriscenja"    className="hover:text-[#C9A84C] transition-colors duration-300">Uslovi korišćenja</Link>
                <span>Izrađeno u Srbiji</span>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
