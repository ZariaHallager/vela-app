'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export type ChipCategory = 'cycle' | 'skin' | 'pain' | 'energy' | 'hormonal';

const categorySelectedStyles: Record<ChipCategory, string> = {
  cycle: 'bg-gradient-to-r from-rose-400/20 to-pink-300/20 border-rose-400 text-mauve ring-1 ring-rose-300/50',
  skin: 'bg-gradient-to-r from-amber-300/20 to-rose-300/20 border-amber-400 text-mauve ring-1 ring-amber-300/50',
  pain: 'bg-gradient-to-r from-purple-400/20 to-lavender/20 border-purple-400 text-mauve ring-1 ring-purple-300/50',
  energy: 'bg-gradient-to-r from-indigo-400/20 to-lavender/20 border-indigo-400 text-mauve ring-1 ring-indigo-300/50',
  hormonal: 'bg-gradient-to-r from-rose-400/20 to-purple-400/20 border-purple-400 text-mauve ring-1 ring-rose-300/50',
};

const categoryCheckColor: Record<ChipCategory, string> = {
  cycle: 'text-rose-400',
  skin: 'text-amber-500',
  pain: 'text-purple-500',
  energy: 'text-indigo-500',
  hormonal: 'text-rose-500',
};

interface SymptomChipProps {
  label: string;
  selected?: boolean;
  onToggle: (label: string) => void;
  disabled?: boolean;
  category?: ChipCategory;
}

export default function SymptomChip({
  label,
  selected = false,
  onToggle,
  disabled = false,
  category,
}: SymptomChipProps) {
  return (
    <motion.button
      type="button"
      onClick={() => !disabled && onToggle(label)}
      animate={selected ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      whileHover={{ scale: disabled ? 1 : 1.04, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
      whileTap={{ scale: 0.93, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
      transition={{ type: 'tween', duration: 0.35, ease: 'easeOut' }}
      aria-pressed={selected}
      disabled={disabled}
      className={cn(
        'inline-flex items-center px-4 py-2 rounded-full text-sm font-medium',
        'border transition-all duration-200 select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender',
        selected && category
          ? categorySelectedStyles[category]
          : selected
            ? 'bg-gradient-to-r from-rose-400/20 to-purple-400/20 border-lavender text-mauve ring-1 ring-lavender/40'
            : 'bg-champagne/60 border-blush text-mauve/70 hover:border-lavender/60',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <AnimatePresence mode="wait">
        {selected && (
          <motion.span
            key="check"
            initial={{ scale: 0, opacity: 0, width: 0, marginRight: 0 }}
            animate={{ scale: 1, opacity: 1, width: 'auto', marginRight: 6 }}
            exit={{ scale: 0, opacity: 0, width: 0, marginRight: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            className={cn(
              'leading-none',
              category ? categoryCheckColor[category] : 'text-lavender',
            )}
            aria-hidden="true"
          >
            ✓
          </motion.span>
        )}
      </AnimatePresence>
      {label}
    </motion.button>
  );
}
