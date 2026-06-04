'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'motion/react';

/** Splits "1.200+" → {prefix:'', num:1200, suffix:'+'}, "5 god." → {num:5, suffix:' god.'} */
function parse(value: string) {
  const match = value.match(/[\d.,]*\d/);
  if (!match) return { prefix: value, num: null as number | null, suffix: '' };
  const raw = match[0];
  const start = match.index ?? 0;
  return {
    prefix: value.slice(0, start),
    num: parseInt(raw.replace(/[^\d]/g, ''), 10),
    suffix: value.slice(start + raw.length),
  };
}

/** 1200 → "1.200" (Serbian/European thousands grouping) */
const group = (n: number) => n.toLocaleString('de-DE');

export default function CountUp({
  value,
  className,
  duration = 1.7,
}: {
  value: string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const { prefix, num, suffix } = parse(value);
  const [display, setDisplay] = useState(num === null ? value : `${prefix}0${suffix}`);

  useEffect(() => {
    if (num === null) return;
    if (!inView) return;
    if (reduce) {
      setDisplay(`${prefix}${group(num)}${suffix}`);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 4); // easeOutQuart
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      setDisplay(`${prefix}${group(Math.round(ease(t) * num))}${suffix}`);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, num, prefix, suffix, reduce, duration]);

  return <span ref={ref} className={className}>{display}</span>;
}
