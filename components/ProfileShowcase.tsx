'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

function Poster() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="absolute w-44 h-44 rounded-full bg-[#C9A84C]/15 blur-3xl" />
      <Image
        src="/LogoWhite.png"
        alt="Jović Group"
        width={128}
        height={128}
        className="relative object-contain opacity-90 animate-pulse"
      />
    </div>
  );
}

const ProfileCanvas = dynamic(() => import('./ProfileCanvas'), {
  ssr: false,
  loading: () => <Poster />,
});

function DragIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 4 5 8l4 4M15 4l4 4-4 4M5 8h14" />
    </svg>
  );
}

export default function ProfileShowcase({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false); // becomes true once it first enters view
  const [inView, setInView] = useState(false);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    try {
      const c = document.createElement('canvas');
      setWebgl(!!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))));
    } catch {
      setWebgl(false);
    }
    setMobile(window.matchMedia('(max-width: 820px), (pointer: coarse)').matches);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setInView(e.isIntersecting);
        if (e.isIntersecting) setMounted(true);
      },
      { rootMargin: '200px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const showCanvas = webgl !== false && mounted;

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      role="img"
      aria-label="3D prikaz preseka PVC profila sa trostrukim staklom"
    >
      {/* Ambient framing glow */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[78%] h-[68%] rounded-full bg-[#C9A84C]/8 blur-[80px] pointer-events-none"
        aria-hidden
      />

      {showCanvas ? (
        <ProfileCanvas animate={!reduce} paused={!inView} mobile={mobile} />
      ) : (
        <Poster />
      )}

      {/* Drag hint — desktop, only while the interactive 3D is live */}
      {showCanvas && !reduce && (
        <div
          className="hidden lg:flex absolute bottom-3 left-1/2 -translate-x-1/2 items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-wide text-white/70 pointer-events-none"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          aria-hidden
        >
          <DragIcon /> Prevucite za rotaciju
        </div>
      )}
    </div>
  );
}
