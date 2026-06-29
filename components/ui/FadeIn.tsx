'use client';

import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';

interface FadeInProps extends HTMLMotionProps<'div'> {
  delay?: number;
  y?: number;
  x?: number;
  children: React.ReactNode;
}

export function FadeIn({ delay = 0, y = 30, x = 0, children, className, style, ...rest }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
