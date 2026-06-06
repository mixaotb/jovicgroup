'use client';

import { useRef, useState, useCallback } from 'react';
import { StarIcon } from '@phosphor-icons/react';
import LiquidGlassCard from '@/components/LiquidGlassCard';

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

function Avatar({ name }: { name: string }) {
  return (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-[14px] text-[#C9A84C] flex-shrink-0"
      style={{
        background: 'rgba(201,168,76,0.12)',
        border: '1px solid rgba(201,168,76,0.2)',
      }}
    >
      {name[0]}
    </div>
  );
}

export default function TestimonialsSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const hasDragged = useRef(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!trackRef.current) return;
    isDragging.current = true;
    hasDragged.current = false;
    dragStartX.current = e.clientX;
    dragScrollLeft.current = trackRef.current.scrollLeft;
    trackRef.current.setPointerCapture(e.pointerId);
    trackRef.current.style.cursor = 'grabbing';
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !trackRef.current) return;
    const dx = e.clientX - dragStartX.current;
    if (Math.abs(dx) > 4) hasDragged.current = true;
    trackRef.current.scrollLeft = dragScrollLeft.current - dx;
  }, []);

  const onPointerUp = useCallback(() => {
    if (!trackRef.current) return;
    isDragging.current = false;
    trackRef.current.style.cursor = '';
  }, []);

  const onScroll = useCallback(() => {
    if (!trackRef.current) return;
    const cardWidth = trackRef.current.offsetWidth * 0.85 + 12; // ~85vw + gap
    const idx = Math.round(trackRef.current.scrollLeft / cardWidth);
    setActiveIdx(Math.min(testimonials.length - 1, Math.max(0, idx)));
  }, []);

  const scrollTo = useCallback((idx: number) => {
    if (!trackRef.current) return;
    const cardWidth = trackRef.current.offsetWidth * 0.85 + 12;
    trackRef.current.scrollTo({ left: idx * cardWidth, behavior: 'smooth' });
  }, []);

  return (
    <>
      {/* ── Mobile swipe carousel ─────────────────────────────────── */}
      <div className="md:hidden -mx-5 sm:-mx-8">
        <div
          ref={trackRef}
          className="flex gap-3 overflow-x-auto select-none"
          style={{
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            paddingLeft: '20px',
            paddingRight: '20px',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onScroll={onScroll}
        >
          {testimonials.map((t, i) => (
            <div
              key={t.author}
              className="flex-shrink-0"
              style={{
                width: '85vw',
                maxWidth: '380px',
                scrollSnapAlign: 'start',
              }}
            >
              <LiquidGlassCard
                className="h-full p-6 rounded-[1.5rem]"
                style={{ border: '1px solid var(--glass-border)' }}
              >
                <Stars count={t.rating} />
                {i === 0 && (
                  <div
                    className="absolute top-0 right-0 font-display font-black text-[#C9A84C]/10 leading-none select-none pointer-events-none"
                    style={{ fontSize: '5rem' }}
                    aria-hidden
                  >&ldquo;</div>
                )}
                <p className="text-[var(--text-muted)] text-[14px] leading-relaxed mt-4 mb-5">
                  {t.text}
                </p>
                <div
                  className="flex items-center gap-3 pt-4"
                  style={{ borderTop: '1px solid var(--glass-border)' }}
                >
                  <Avatar name={t.author} />
                  <div>
                    <div className="font-display font-bold text-[var(--text)] text-[13px]">{t.author}</div>
                    <div className="text-[var(--text-faint)] text-[11px] mt-0.5">{t.location}</div>
                  </div>
                </div>
              </LiquidGlassCard>
            </div>
          ))}
          {/* Right padding sentinel */}
          <div className="flex-shrink-0 w-5" aria-hidden />
        </div>

        {/* Scroll dots */}
        <div className="flex justify-center gap-2 mt-6">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              aria-label={`Utisak ${i + 1}`}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === activeIdx ? '22px' : '6px',
                height: '6px',
                background: i === activeIdx ? '#C9A84C' : 'var(--glass-border)',
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Desktop asymmetric grid ───────────────────────────────── */}
      <div className="hidden md:grid md:grid-cols-3 gap-4">

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
              <Avatar name={testimonials[0].author} />
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
                <div className="flex items-center gap-3">
                  <Avatar name={t.author} />
                  <div>
                    <div className="font-display font-bold text-[var(--text)] text-[12px]">{t.author}</div>
                    <div className="text-[var(--text-faint)] text-[11px] mt-0.5">{t.location}</div>
                  </div>
                </div>
              </div>
            </LiquidGlassCard>
          ))}
        </div>

      </div>
    </>
  );
}
