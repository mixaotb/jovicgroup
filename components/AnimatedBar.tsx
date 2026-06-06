'use client';

import { useRef } from 'react';
import { useInView } from 'motion/react';

export default function AnimatedBar({ pct, delay = 0 }: { pct: number; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <div
      ref={ref}
      className="h-[3px] rounded-full overflow-hidden"
      style={{ background: 'var(--glass-border)' }}
    >
      <div
        style={{
          height: '100%',
          borderRadius: '9999px',
          background: 'linear-gradient(90deg, #C9A84C, #E8C97A)',
          width: inView ? `${pct}%` : '0%',
          transition: inView ? `width 1.4s cubic-bezier(0.22,1,0.36,1) ${delay}s` : 'none',
        }}
      />
    </div>
  );
}
