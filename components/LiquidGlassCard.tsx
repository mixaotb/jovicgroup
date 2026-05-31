'use client';

import { useRef, useCallback, useId } from 'react';

export default function LiquidGlassCard({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const uid = useId();
  const filterId = `lgc${uid.replace(/:/g, '')}`;
  const cardRef = useRef<HTMLDivElement>(null);
  const specularRef = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const map = el.querySelector('feDisplacementMap');
    if (map) {
      const s = Math.max(15, Math.min((x / rect.width) * 100, (y / rect.height) * 100));
      map.setAttribute('scale', String(s));
    }

    if (specularRef.current) {
      specularRef.current.style.backgroundImage = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.07) 32%, transparent 60%)`;
    }
  }, []);

  const onLeave = useCallback(() => {
    const map = cardRef.current?.querySelector('feDisplacementMap');
    if (map) map.setAttribute('scale', '77');
    if (specularRef.current) specularRef.current.style.backgroundImage = '';
  }, []);

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden ${className}`}
      style={style}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {/* Per-card SVG distortion filter */}
      <svg
        aria-hidden="true"
        style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      >
        <defs>
          <filter
            id={filterId}
            x="-10%"
            y="-10%"
            width="120%"
            height="120%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="turbulence"
              baseFrequency="0.008 0.009"
              numOctaves="2"
              result="noise"
              seed="3"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="77"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Layer 1 — backdrop blur + SVG distortion */}
      <div
        className="absolute inset-0 rounded-[inherit] pointer-events-none"
        style={{
          backdropFilter: 'blur(5px) saturate(150%)',
          WebkitBackdropFilter: 'blur(5px) saturate(150%)',
          filter: `url(#${filterId}) brightness(1.07)`,
          zIndex: 1,
        }}
      />

      {/* Layer 2 — semi-transparent tint (light/dark adaptive) */}
      <div
        className="absolute inset-0 rounded-[inherit] pointer-events-none bg-white/65 dark:bg-white/[0.07]"
        style={{ zIndex: 2 }}
      />

      {/* Layer 3 — specular highlight (mouse-tracking) + outer shadow for light mode definition */}
      <div
        ref={specularRef}
        className="absolute inset-0 rounded-[inherit] pointer-events-none"
        style={{
          boxShadow:
            'inset 1px 1px 1px rgba(255,255,255,0.55), inset 0 -1px 0 rgba(255,255,255,0.06), 0 2px 20px rgba(0,0,0,0.06)',
          zIndex: 3,
        }}
      />

      {/* Layer 4 — content */}
      <div className="relative" style={{ zIndex: 4 }}>
        {children}
      </div>
    </div>
  );
}
