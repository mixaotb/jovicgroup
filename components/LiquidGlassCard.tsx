'use client';

import { useRef, useCallback, useId, useEffect } from 'react';

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
  const rectRef = useRef<DOMRect | null>(null);
  const mapRef = useRef<SVGFEDisplacementMapElement | null>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    rectRef.current = el.getBoundingClientRect();
    mapRef.current = el.querySelector('feDisplacementMap');
    const ro = new ResizeObserver(() => {
      rectRef.current = el.getBoundingClientRect();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = rectRef.current;
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (mapRef.current) {
      const s = Math.max(2, Math.min((x / rect.width) * 12, (y / rect.height) * 12));
      mapRef.current.setAttribute('scale', String(s));
    }

    if (specularRef.current) {
      specularRef.current.style.backgroundImage = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.07) 32%, transparent 60%)`;
    }
  }, []);

  const onLeave = useCallback(() => {
    if (mapRef.current) mapRef.current.setAttribute('scale', '4');
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
            x="0%"
            y="0%"
            width="100%"
            height="100%"
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
              scale="4"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Layer 1 — backdrop blur + SVG distortion.
          Both the displacement `filter` and the backdrop blur are applied via
          CSS only on hover-capable (pointer: fine) devices. On touch screens the
          mouse-tracking effect is inert, and the displacement + backdrop-filter
          edges leave stray seam lines at the rounded clip, so Layer 1 stays
          inert there (Layer 2's tint keeps the glass look). */}
      <div
        className="lgc-distort absolute inset-0 rounded-[inherit] pointer-events-none"
        style={{
          ['--lgc-filter' as string]: `url(#${filterId})`,
          zIndex: 1,
        } as React.CSSProperties}
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
