'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { useSessionStore } from '@/lib/entitydb';
import { cn } from '@/lib/utils';

interface ConditionArea {
  id: string;
  title: string;
  icon: string;
  description: string;
  accentColor: string;
  headerColor: string;
}

const CONDITION_AREAS: ConditionArea[] = [
  {
    id: 'irregular-periods',
    title: 'Irregular / absent periods',
    icon: '🌙',
    description: 'Cycles that skip, come early/late, or stopped',
    accentColor: 'border-rose-300/60 bg-rose-50/30',
    headerColor: 'text-rose-400',
  },
  {
    id: 'thyroid',
    title: 'Thyroid issues',
    icon: '🦋',
    description: 'Unexplained weight, fatigue, hair, or mood shifts',
    accentColor: 'border-amber-300/60 bg-amber-50/30',
    headerColor: 'text-amber-500',
  },
  {
    id: 'pcos',
    title: 'PCOS',
    icon: '⚡',
    description: 'Hormonal imbalance, acne, hair, weight changes',
    accentColor: 'border-purple-300/60 bg-purple-50/30',
    headerColor: 'text-purple-500',
  },
  {
    id: 'endometriosis',
    title: 'Endometriosis',
    icon: '🩸',
    description: 'Severe cramps, pelvic pain, painful sex',
    accentColor: 'border-pink-300/60 bg-pink-50/30',
    headerColor: 'text-pink-500',
  },
  {
    id: 'ovarian-cysts',
    title: 'Ovarian cysts',
    icon: '🫧',
    description: 'Pelvic pressure, bloating, sudden sharp pain',
    accentColor: 'border-indigo-300/60 bg-indigo-50/30',
    headerColor: 'text-indigo-500',
  },
  {
    id: 'mental-health',
    title: 'Mental health',
    icon: '🧠',
    description: 'Anxiety, depression, mood dysregulation',
    accentColor: 'border-teal-300/60 bg-teal-50/30',
    headerColor: 'text-teal-500',
  },
  {
    id: 'fertility',
    title: 'Fertility concerns',
    icon: '🌱',
    description: 'Difficulty conceiving or cycle irregularities',
    accentColor: 'border-green-300/60 bg-green-50/30',
    headerColor: 'text-green-500',
  },
  {
    id: 'gut-health',
    title: 'Gut & digestive health',
    icon: '🌿',
    description: 'Bloating, IBS-like symptoms, food sensitivities',
    accentColor: 'border-orange-300/60 bg-orange-50/30',
    headerColor: 'text-orange-500',
  },
];

interface ConditionContextStepProps {
  onNext: () => void;
}

export default function ConditionContextStep({ onNext }: ConditionContextStepProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const setConditionContext = useSessionStore((s) => s.setConditionContext);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const handleContinue = () => {
    const selectedTitles = CONDITION_AREAS.filter((c) => selected.includes(c.id)).map(
      (c) => c.title,
    );
    setConditionContext(selectedTitles);
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <GlassCard className="p-8 md:p-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-7 relative"
        >
          {/* Floating sparkles */}
          {[
            { x: '90%', delay: 0, color: 'text-rose-300' },
            { x: '84%', delay: 0.7, color: 'text-purple-300' },
            { x: '96%', delay: 1.4, color: 'text-pink-200' },
          ].map((s, i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              className={cn('absolute top-0 pointer-events-none select-none text-xs', s.color)}
              style={{ left: s.x }}
              animate={{ y: [-4, 4, -4], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
            >
              ✦
            </motion.span>
          ))}

          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl" aria-hidden="true">
              🔮
            </span>
            <p className="text-xs font-semibold uppercase tracking-widest text-lavender">
              Condition context
            </p>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl text-mauve leading-snug mb-2">
            Which areas resonate with you?
          </h2>
          <p className="text-mauve/60 text-base leading-relaxed">
            Select any that feel relevant — this helps personalize your follow-up questions and
            clinical brief. You can choose as many as apply.
          </p>
        </motion.div>

        {/* Condition cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {CONDITION_AREAS.map((condition, i) => {
            const isSelected = selected.includes(condition.id);
            return (
              <motion.button
                key={condition.id}
                type="button"
                onClick={() => toggle(condition.id)}
                aria-pressed={isSelected}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.18 + i * 0.06,
                  type: 'spring',
                  stiffness: 280,
                  damping: 26,
                }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  'w-full text-left rounded-2xl p-4 border transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender',
                  isSelected
                    ? 'border-lavender/60 bg-gradient-to-br from-rose-50/40 via-lavender/10 to-purple-50/40 shadow-md shadow-lavender/20'
                    : cn('glass border-blush/50 hover:border-lavender/40', condition.accentColor),
                )}
              >
                <div className="flex items-start gap-3">
                  <motion.span
                    className="text-2xl leading-none mt-0.5 shrink-0"
                    aria-hidden="true"
                    animate={isSelected ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  >
                    {condition.icon}
                  </motion.span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'font-semibold text-sm leading-snug font-serif',
                        isSelected ? 'text-mauve' : 'text-mauve/90',
                        !isSelected && condition.headerColor,
                      )}
                    >
                      {condition.title}
                    </p>
                    <p className="text-xs text-mauve/55 mt-0.5 leading-snug">
                      {condition.description}
                    </p>
                  </div>

                  {/* Animated check indicator */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="ml-auto shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-rose-400 to-purple-400 flex items-center justify-center shadow-sm"
                        aria-hidden="true"
                      >
                        <svg
                          className="w-3 h-3 text-white"
                          viewBox="0 0 12 12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="2,6 5,9 10,3" />
                        </svg>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Selection count hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: selected.length > 0 ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-xs text-lavender/80 text-center mb-4 font-medium"
        >
          {selected.length} area{selected.length !== 1 ? 's' : ''} selected
        </motion.p>

        {/* Continue — gradient shimmer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.4 }}
          className="relative overflow-hidden rounded-xl"
        >
          <motion.button
            type="button"
            onClick={handleContinue}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={cn(
              'relative w-full py-4 rounded-xl font-semibold text-base tracking-wide transition-all duration-200 overflow-hidden',
              'bg-gradient-to-r from-rose-400 via-lavender to-purple-400 text-white shadow-lg shadow-rose-300/30',
            )}
          >
            {/* Shimmer sweep */}
            <motion.span
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 pointer-events-none"
              initial={{ x: '-120%' }}
              whileHover={{ x: '220%' }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            />
            <span className="relative">
              {selected.length > 0 ? 'Continue →' : 'Skip for now →'}
            </span>
          </motion.button>
        </motion.div>
      </GlassCard>
    </motion.div>
  );
}
