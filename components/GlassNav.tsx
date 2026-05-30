'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightIcon } from '@phosphor-icons/react';
import ThemeToggle from '@/components/ThemeToggle';

const NAV_LINKS = [
  { href: '#prednosti', label: 'Prednosti' },
  { href: '#o-nama',    label: 'O nama'    },
  { href: '#utisci',   label: 'Utisci'    },
];

export default function GlassNav() {
  const [scrolled, setScrolled] = useState(false);
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

  return (
    <>
      <div ref={sentinelRef} className="absolute top-0 h-1 w-full pointer-events-none" aria-hidden />

      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 pointer-events-none">
        <nav
          className="pointer-events-auto flex items-center gap-1 px-2 py-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={scrolled ? {
            background: 'rgba(6,8,15,0.82)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(28px) saturate(200%)',
            WebkitBackdropFilter: 'blur(28px) saturate(200%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 16px 48px rgba(0,0,0,0.5)',
          } : {
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.10)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
          }}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/6 transition-colors duration-300">
            <Image src="/logo.png" alt="Jović Group" width={20} height={20} className="object-contain" />
            <span className="font-display text-[13px] font-bold text-white tracking-tight">
              Jović <span className="text-[#C9A84C]">Group</span>
            </span>
          </Link>

          <div className="w-px h-5 bg-white/10 mx-1" aria-hidden />

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3.5 py-1.5 rounded-full text-[12px] font-medium text-white/55 hover:text-white hover:bg-white/7 transition-all duration-300"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="w-px h-5 bg-white/10 mx-1 hidden md:block" aria-hidden />

          <div className="flex items-center gap-2 pl-1 pr-1">
            <ThemeToggle />
            <Link
              href="/kalkulator"
              className="group hidden md:inline-flex items-center pl-4 pr-1.5 py-1.5 rounded-full bg-[#C9A84C] text-[#06080F] font-bold text-[12px] hover:bg-[#E8C97A] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.03] active:scale-[0.97]"
            >
              Kalkulator
              <span className="ml-2.5 w-6 h-6 rounded-full bg-[#06080F]/12 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-[1px] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]">
                <ArrowRightIcon size={11} weight="bold" />
              </span>
            </Link>
          </div>
        </nav>
      </header>
    </>
  );
}
