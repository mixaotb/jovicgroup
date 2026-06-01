'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightIcon, CalculatorIcon } from '@phosphor-icons/react';
import ThemeToggle from '@/components/ThemeToggle';

const NAV_LINKS = [
  { href: '#prednosti', label: 'Prednosti' },
  { href: '#o-nama',    label: 'O nama'    },
  { href: '#utisci',   label: 'Utisci'    },
];

export default function GlassNav() {
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-72px 0px 0px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const sync = () => setDark(document.documentElement.classList.contains('dark'));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);

  // Theme + scroll aware overlay opacity
  const overlayBg = dark
    ? (scrolled ? 'rgba(0,0,0,0.32)' : 'rgba(0,0,0,0.18)')
    : (scrolled ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.28)');

  // Specular — brighter in light mode
  const specular = dark
    ? 'inset 1px 1px 1px rgba(255,255,255,0.15)'
    : 'inset 1px 1px 1px rgba(255,255,255,0.85)';

  return (
    <>
      {/* Exact filter from the reference — hidden from layout */}
      <svg style={{ display: 'none' }} aria-hidden>
        <filter id="glass-distortion">
          <feTurbulence type="turbulence" baseFrequency="0.008" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="77" />
        </filter>
      </svg>

      <div ref={sentinelRef} className="absolute top-0 h-1 w-full pointer-events-none" aria-hidden />

      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-3 sm:pt-4 pointer-events-none">
        <nav
          className="relative pointer-events-auto rounded-full overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{
            boxShadow: scrolled
              ? (dark ? '0 16px 48px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.13)')
              : 'none',
          }}
        >
          {/* Layer 1 — blur + liquid distortion (matches .glass-filter) */}
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            borderRadius: 'inherit',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            filter: 'url(#glass-distortion) saturate(120%) brightness(1.15)',
          }} />

          {/* Layer 2 — color tint (matches .glass-overlay) */}
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            borderRadius: 'inherit',
            background: overlayBg,
            transition: 'background 0.5s ease',
          }} />

          {/* Layer 3 — specular highlight edge (matches .glass-specular) */}
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 3,
            borderRadius: 'inherit',
            boxShadow: specular,
            transition: 'box-shadow 0.5s ease',
          }} />

          {/* Layer 4 — actual nav content (matches .glass-content) */}
          <div className="relative flex items-center gap-1 px-2 py-2" style={{ zIndex: 4 }}>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/10 dark:hover:bg-white/6 transition-colors duration-300">
              <Image src="/logo.png" alt="Jović Group" width={20} height={20} className="object-contain" />
              <span className="font-display text-[13px] font-bold tracking-tight text-[var(--text)]">
                Jović <span className="text-[#C9A84C]">Group</span>
              </span>
            </Link>

            <div className="w-px h-5 bg-black/15 dark:bg-white/10 mx-1" aria-hidden />

            {/* Nav links — desktop only */}
            <div className="hidden md:flex items-center gap-0.5">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-3.5 py-1.5 rounded-full text-[12px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/10 dark:hover:bg-white/7 transition-all duration-300"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="w-px h-5 bg-black/15 dark:bg-white/10 mx-1 hidden md:block" aria-hidden />

            <div className="flex items-center gap-2 pl-1 pr-1">
              <ThemeToggle />

              {/* Desktop Kalkulator */}
              <Link
                href="/kalkulator"
                className="group hidden md:inline-flex items-center pl-4 pr-1.5 py-1.5 rounded-full bg-[#C9A84C] text-[#06080F] font-bold text-[12px] hover:bg-[#E8C97A] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.03] active:scale-[0.97]"
              >
                Kalkulator
                <span className="ml-2.5 w-6 h-6 rounded-full bg-[#06080F]/12 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-[1px] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]">
                  <ArrowRightIcon size={11} weight="bold" />
                </span>
              </Link>

              {/* Mobile Kalkulator — icon only */}
              <Link
                href="/kalkulator"
                aria-label="Kalkulator"
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-full bg-[#C9A84C] text-[#06080F] hover:bg-[#E8C97A] transition-all duration-300 active:scale-[0.95]"
              >
                <CalculatorIcon size={17} weight="bold" />
              </Link>
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}
