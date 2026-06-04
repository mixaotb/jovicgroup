'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback, useRef } from 'react';
import { XIcon, ArrowLeftIcon, ArrowRightIcon } from '@phosphor-icons/react';

const touchDist = (t: React.TouchList) =>
  Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

const PORTFOLIO = [
  { src: '/portfolioimage6.jpeg', sizes: '(max-width: 768px) 100vw, 33vw', className: 'min-h-[380px] md:row-span-2' },
  { src: '/portfolioimage7.jpg',  sizes: '(max-width: 768px) 100vw, 33vw', className: 'min-h-[380px] md:row-span-2' },
  { src: '/portfolioimage1.jpg',  sizes: '(max-width: 768px) 100vw, 33vw', className: 'min-h-[180px]' },
  { src: '/portfolioimage2.jpg',  sizes: '(max-width: 768px) 100vw, 33vw', className: 'min-h-[180px]' },
  { src: '/portfolioimage8.jpeg', sizes: '(max-width: 768px) 100vw, 66vw', className: 'min-h-[240px] md:col-span-2' },
  { src: '/portfolioimage9.jpeg', sizes: '(max-width: 768px) 100vw, 33vw', className: 'min-h-[240px]' },
  { src: '/portfolioimage3.jpg',  sizes: '(max-width: 768px) 100vw, 33vw', className: 'min-h-[160px]' },
  { src: '/portfolioimage4.jpg',  sizes: '(max-width: 768px) 100vw, 33vw', className: 'min-h-[160px]' },
  { src: '/portfolioimage5.jpg',  sizes: '(max-width: 768px) 100vw, 33vw', className: 'min-h-[160px]' },
];

export default function PortfolioGallery() {
  const [openIdx, setOpenIdx]     = useState<number | null>(null);
  const [slideDir, setSlideDir]   = useState<'next' | 'prev'>('next');
  const [slideKey, setSlideKey]   = useState(0);
  const [visible, setVisible]     = useState(false);
  // Counters: incrementing the key re-mounts the animated child, re-triggering the CSS animation
  const [pressLeft, setPressLeft]   = useState(0);
  const [pressRight, setPressRight] = useState(0);

  // Touch gestures: swipe to navigate, pinch / double-tap to zoom, drag to pan
  const [zoom, setZoom]         = useState(1);
  const [tx, setTx]             = useState(0);
  const [ty, setTy]             = useState(0);
  const [dragging, setDragging] = useState(false);
  const gesture = useRef({
    mode: 'none' as 'none' | 'pan' | 'pinch' | 'swipe',
    startX: 0, startY: 0, lastX: 0, lastY: 0,
    startDist: 0, startZoom: 1, baseTx: 0, baseTy: 0, lastTap: 0,
  });

  const isOpen = openIdx !== null;

  function openAt(idx: number) {
    setOpenIdx(idx);
    setSlideDir('next');
    setSlideKey(0);
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }

  const close = useCallback(() => {
    setVisible(false);
    setTimeout(() => setOpenIdx(null), 280);
  }, []);

  const goNext = useCallback(() => {
    setSlideDir('next');
    setSlideKey(k => k + 1);
    setOpenIdx(i => (i! + 1) % PORTFOLIO.length);
    setPressRight(n => n + 1);
  }, []);

  const goPrev = useCallback(() => {
    setSlideDir('prev');
    setSlideKey(k => k + 1);
    setOpenIdx(i => (i! - 1 + PORTFOLIO.length) % PORTFOLIO.length);
    setPressLeft(n => n + 1);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, goNext, goPrev, close]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Reset zoom/pan whenever the active image changes (incl. close)
  useEffect(() => { setZoom(1); setTx(0); setTy(0); }, [openIdx]);

  function onTouchStart(e: React.TouchEvent) {
    const g = gesture.current;
    if (e.touches.length === 2) {
      g.mode = 'pinch';
      g.startDist = touchDist(e.touches);
      g.startZoom = zoom;
      g.baseTx = tx; g.baseTy = ty;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - g.lastTap < 280) {                 // double-tap → toggle zoom
        if (zoom > 1) { setZoom(1); setTx(0); setTy(0); } else setZoom(2.4);
        g.lastTap = 0; g.mode = 'none';
        return;
      }
      g.lastTap = now;
      g.mode = zoom > 1 ? 'pan' : 'swipe';
      g.startX = g.lastX = e.touches[0].clientX;
      g.startY = g.lastY = e.touches[0].clientY;
      g.baseTx = tx; g.baseTy = ty;
      setDragging(true);
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    const g = gesture.current;
    if (g.mode === 'pinch' && e.touches.length >= 2) {
      const z = Math.min(4, Math.max(1, g.startZoom * (touchDist(e.touches) / g.startDist)));
      setZoom(z);
      if (z <= 1.02) { setTx(0); setTy(0); }
    } else if (g.mode === 'pan' && e.touches.length === 1) {
      setTx(g.baseTx + (e.touches[0].clientX - g.startX));
      setTy(g.baseTy + (e.touches[0].clientY - g.startY));
    } else if (g.mode === 'swipe' && e.touches.length === 1) {
      g.lastX = e.touches[0].clientX;
      g.lastY = e.touches[0].clientY;
    }
  }

  function onTouchEnd(e: React.TouchEvent) {
    const g = gesture.current;
    if (g.mode === 'swipe') {
      const dx = g.lastX - g.startX;
      const dy = g.lastY - g.startY;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (dx < 0) goNext(); else goPrev();
      }
    }
    if (g.mode === 'pinch' && zoom <= 1.05) { setZoom(1); setTx(0); setTy(0); }
    setDragging(false);
    if (e.touches.length === 0) g.mode = 'none';
  }

  return (
    <>
      <style>{`
        /* ── Image slide animations ───────────────────── */
        @keyframes lbSlideRight {
          from { opacity: 0; transform: translateX(56px) scale(0.97); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes lbSlideLeft {
          from { opacity: 0; transform: translateX(-56px) scale(0.97); }
          to   { opacity: 1; transform: none; }
        }
        .lb-next { animation: lbSlideRight 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .lb-prev { animation: lbSlideLeft  0.4s cubic-bezier(0.22,1,0.36,1) both; }

        /* ── Nav button base ──────────────────────────── */
        .lb-nav-btn {
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          background: rgba(255,255,255,0.09);
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.22), 0 8px 32px rgba(0,0,0,0.45);
          color: rgba(255,255,255,0.75);
          transition:
            background 0.28s ease,
            border-color 0.28s ease,
            box-shadow 0.28s ease,
            color 0.2s ease;
        }
        .lb-nav-btn:hover {
          background: rgba(201,168,76,0.12);
          border-color: rgba(201,168,76,0.4);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.28),
            0 0 28px rgba(201,168,76,0.35),
            0 8px 32px rgba(0,0,0,0.45);
          color: white;
        }
        /* Scale only the icon — button hit-area stays fixed */
        .lb-nav-icon {
          display: flex;
          transition: transform 0.28s cubic-bezier(0.22,1,0.36,1);
        }
        .lb-nav-btn:hover .lb-nav-icon { transform: scale(1.3); }
        .lb-nav-btn:active .lb-nav-icon { transform: scale(0.7); }

        /* ── Spring bounce on press ───────────────────── */
        @keyframes btnBounce {
          0%   { transform: scale(1); }
          18%  { transform: scale(0.74); }
          48%  { transform: scale(1.28); }
          68%  { transform: scale(0.91); }
          84%  { transform: scale(1.07); }
          100% { transform: scale(1); }
        }
        .btn-bounce { animation: btnBounce 0.52s cubic-bezier(0.22,1,0.36,1) both; }

        /* ── Arrow shoot — directional ────────────────── */
        @keyframes arrowRight {
          0%   { transform: translateX(0); opacity: 1; }
          38%  { transform: translateX(11px); opacity: 0; }
          39%  { transform: translateX(-11px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes arrowLeft {
          0%   { transform: translateX(0); opacity: 1; }
          38%  { transform: translateX(-11px); opacity: 0; }
          39%  { transform: translateX(11px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .arrow-right { animation: arrowRight 0.48s ease both; }
        .arrow-left  { animation: arrowLeft  0.48s ease both; }

        /* ── Ripple ring ──────────────────────────────── */
        @keyframes rippleRing {
          from { transform: scale(0.45); opacity: 0.9; }
          to   { transform: scale(3.2); opacity: 0; }
        }
        .lb-ripple {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          border: 1.5px solid #C9A84C;
          pointer-events: none;
          animation: rippleRing 0.58s ease-out forwards;
        }

        /* ── Close button ─────────────────────────────── */
        .lb-close-btn {
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          background: rgba(255,255,255,0.09);
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.22), 0 8px 32px rgba(0,0,0,0.45);
          color: rgba(255,255,255,0.65);
          transition: transform 0.32s cubic-bezier(0.22,1,0.36,1), background 0.25s ease, color 0.2s ease;
        }
        .lb-close-btn:hover {
          background: rgba(255,255,255,0.14);
          color: white;
          transform: scale(1.1) rotate(90deg);
        }
        .lb-close-btn:active { transform: scale(0.88) rotate(90deg); }
      `}</style>

      {/* ── Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-[260px_260px_320px_200px] gap-4">
        {PORTFOLIO.map((img, i) => (
          <button
            key={img.src}
            onClick={() => openAt(i)}
            className={`relative overflow-hidden rounded-[1.5rem] group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C] active:scale-[0.97] transition-transform duration-200 ${img.className}`}
            aria-label={`Otvori sliku ${i + 1}`}
          >
            <Image src={img.src} alt="" fill sizes={img.sizes} className="object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-500" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300"
                style={{
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* ── Lightbox ─────────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.28s ease' }}
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Galerija radova"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{
              background: 'rgba(3,5,12,0.94)',
              backdropFilter: 'blur(40px) saturate(160%)',
              WebkitBackdropFilter: 'blur(40px) saturate(160%)',
            }}
          />

          {/* Image area */}
          <div
            className="relative z-10 w-full h-full flex items-center justify-center p-16 sm:p-20 md:p-24"
            onClick={e => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{
              transform: visible ? 'scale(1)' : 'scale(0.94)',
              transition: 'transform 0.36s cubic-bezier(0.22,1,0.36,1)',
              touchAction: 'none',
            }}
          >
            <div
              key={`${openIdx}-${slideKey}`}
              className={zoom > 1 ? '' : (slideDir === 'prev' ? 'lb-prev' : 'lb-next')}
              style={{ position: 'relative', width: '100%', height: '100%' }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  transform: `translate(${tx}px, ${ty}px) scale(${zoom})`,
                  transition: dragging ? 'none' : 'transform 0.28s cubic-bezier(0.22,1,0.36,1)',
                  willChange: 'transform',
                }}
              >
                <Image
                  src={PORTFOLIO[openIdx!].src}
                  alt={`Rad ${openIdx! + 1} od ${PORTFOLIO.length}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 85vw"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Counter */}
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full text-white/55 text-[11px] font-mono tracking-[0.12em] select-none"
            style={{
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            {openIdx! + 1} / {PORTFOLIO.length}
          </div>

          {/* Close */}
          <button
            onClick={(e) => { e.stopPropagation(); close(); }}
            className="lb-close-btn absolute top-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]"
            aria-label="Zatvori"
          >
            <XIcon size={17} weight="bold" />
          </button>

          {/* Prev */}
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="lb-nav-btn absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full flex items-center justify-center overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]"
            aria-label="Prethodna slika"
          >
            {/* Spring bounce + arrow shoot — both re-keyed on each press */}
            <span key={`bl-${pressLeft}`} className={pressLeft > 0 ? 'btn-bounce' : ''} style={{ display: 'flex' }}>
              <span key={`al-${pressLeft}`} className={`lb-nav-icon${pressLeft > 0 ? ' arrow-left' : ''}`}>
                <ArrowLeftIcon size={20} weight="bold" />
              </span>
            </span>
            {/* Gold ripple ring */}
            {pressLeft > 0 && <span key={`rl-${pressLeft}`} className="lb-ripple" />}
          </button>

          {/* Next */}
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="lb-nav-btn absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full flex items-center justify-center overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]"
            aria-label="Sledeća slika"
          >
            <span key={`br-${pressRight}`} className={pressRight > 0 ? 'btn-bounce' : ''} style={{ display: 'flex' }}>
              <span key={`ar-${pressRight}`} className={`lb-nav-icon${pressRight > 0 ? ' arrow-right' : ''}`}>
                <ArrowRightIcon size={20} weight="bold" />
              </span>
            </span>
            {pressRight > 0 && <span key={`rr-${pressRight}`} className="lb-ripple" />}
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-5 left-0 right-0 z-20 flex justify-center items-center gap-2">
            {PORTFOLIO.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  if (i === openIdx) return;
                  const dir = i > openIdx! ? 'next' : 'prev';
                  setSlideDir(dir);
                  setSlideKey(k => k + 1);
                  setOpenIdx(i);
                }}
                aria-label={`Slika ${i + 1}`}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === openIdx ? '22px' : '6px',
                  height: '6px',
                  background: i === openIdx ? '#C9A84C' : 'rgba(255,255,255,0.3)',
                }}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
