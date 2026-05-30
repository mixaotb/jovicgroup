'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface RevealUpProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export default function RevealUp({ children, delay = 0, className }: RevealUpProps) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // SSR + reduced-motion: render children visible, no Motion, no hydration mismatch
  if (!mounted || reduce) {
    return <div className={className}>{children}</div>;
  }

  // Client only: Motion takes over with real initial → whileInView animation
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
