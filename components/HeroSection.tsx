'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon } from '@phosphor-icons/react';

const STATS = [
  { value: '1.200+', label: 'Projekata' },
  { value: '20+',    label: 'Godina iskustva' },
  { value: '5 god.', label: 'Garancija na ugradnju' },
];

export default function HeroSection() {
  return (
    <section className="relative flex items-center overflow-hidden" style={{ minHeight: '100dvh' }}>

      {/* Background architectural photo */}
      <div className="absolute inset-0">
        <Image
          src="/hero.jpg"
          alt="Moderna staklena fasada"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#F7F6F2] dark:from-[#06080F] via-[#F7F6F2]/90 dark:via-[#06080F]/90 to-[#F7F6F2]/45 dark:to-[#06080F]/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F7F6F2] dark:from-[#06080F] via-transparent to-[#F7F6F2]/30 dark:to-[#06080F]/30" />
      </div>

      {/* Ambient glow orbs */}
      <div className="absolute top-1/3 right-1/4 w-[480px] h-[480px] rounded-full bg-[#C9A84C]/8 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 w-[320px] h-[320px] rounded-full bg-[#1A2744]/50 blur-[90px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-32 pb-20 w-full">
        <div className="max-w-[760px]">

          {/* Eyebrow badge — CSS animation, SSR-safe */}
          <div
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-10 animate-fade-up"
            style={{
              background: 'linear-gradient(135deg, rgba(201,168,76,0.16), rgba(201,168,76,0.06))',
              border: '1px solid rgba(201,168,76,0.28)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: 'inset 0 1px 0 rgba(201,168,76,0.2)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
            <span className="text-[11px] font-bold text-[#C9A84C] tracking-[0.16em] uppercase">
              Nemački profili · Domaći kvalitet
            </span>
          </div>

          {/* Headline */}
          <h1
            className="font-display text-[clamp(1.75rem,7.5vw,6.5rem)] font-bold leading-[0.96] tracking-[-0.02em] text-[var(--text)] mb-8 animate-fade-up delay-100"
          >
            Stolarija koja
            <br />
            <span className="text-[#C9A84C]">traje generacijama.</span>
          </h1>

          {/* Subtext */}
          <p className="text-[clamp(1rem,1.8vw,1.15rem)] text-[var(--text-muted)] max-w-[480px] leading-relaxed mb-11 animate-fade-up delay-200">
            PVC i ALU stolarija sa Schüco, Alphacan, Elvial i Profilco profilima.
            Od izrade do ugradnje, sve na jednom mestu.
          </p>

          {/* CTAs — button-in-button pattern */}
          <div className="flex flex-col sm:flex-row gap-3 animate-fade-up delay-300">
            <Link
              href="/kalkulator"
              className="group inline-flex items-center self-start pl-6 pr-2 py-2 rounded-full bg-[#C9A84C] text-[#06080F] font-bold text-[14px] hover:bg-[#E8C97A] hover:-translate-y-[3px] hover:shadow-[0_14px_44px_rgba(201,168,76,0.5)] active:translate-y-0 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.025] active:scale-[0.975] shadow-[0_8px_40px_rgba(201,168,76,0.35)]"
            >
              <span>Izračunajte cenu</span>
              <span className="ml-4 w-9 h-9 rounded-full bg-[#06080F]/14 flex items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-[2px] group-hover:-translate-y-[1px] group-hover:scale-105">
                <ArrowRightIcon size={14} weight="bold" />
              </span>
            </Link>

            <a
              href="#prednosti"
              className="inline-flex items-center justify-center self-start gap-2 px-7 py-3.5 rounded-full font-semibold text-[14px] text-[var(--text-muted)] hover:text-[var(--text)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              Saznajte više
            </a>
          </div>

          {/* Stats strip */}
          <div
            className="mt-16 pt-10 flex flex-wrap gap-x-12 gap-y-6 animate-fade-up delay-400"
            style={{ borderTop: '1px solid var(--glass-border)' }}
          >
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="font-display text-[2rem] font-bold text-[var(--text)] leading-none tabular-nums">{s.value}</div>
                <div className="text-[10px] text-[var(--text-faint)] mt-1.5 tracking-[0.14em] uppercase font-semibold">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
