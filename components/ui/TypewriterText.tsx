'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface TypewriterTextProps {
  /** The full text to render (can grow as streaming tokens arrive) */
  text: string;
  className?: string;
  /** Delay between each word in seconds (default 0.015) */
  wordDelay?: number;
}

export default function TypewriterText({
  text,
  className,
  wordDelay = 0.015,
}: TypewriterTextProps) {
  const words = useMemo(() => text.split(/(\s+)/), [text]);

  return (
    <span className={cn('inline', className)} aria-live="polite">
      <AnimatePresence initial={false}>
        {words.map((chunk, i) => (
          <motion.span
            key={`${i}-${chunk}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.18,
              delay: i * wordDelay,
              ease: 'easeOut',
            }}
            className="inline"
          >
            {chunk}
          </motion.span>
        ))}
      </AnimatePresence>
    </span>
  );
}
