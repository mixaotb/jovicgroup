'use client';

import { motion, useScroll, useSpring } from 'motion/react';

/** Thin gold progress bar pinned to the very top, tracking page scroll. */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  return (
    <motion.div
      aria-hidden
      className="fixed top-0 left-0 right-0 z-[70] h-[2px] origin-left pointer-events-none"
      style={{
        scaleX,
        background: 'linear-gradient(90deg, #8A6F32, #C9A84C 45%, #E8C97A)',
        boxShadow: '0 0 12px rgba(201,168,76,0.55)',
      }}
    />
  );
}
