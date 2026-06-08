'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { LifePhase } from '@/lib/types';

interface PhaseConfig {
  label: string;
  emoji: string;
  description: string;
}

const PHASE_CONFIG: Record<LifePhase, PhaseConfig> = {
  cycling: {
    label: 'Regular Cycles',
    emoji: '🌙',
    description: 'Menstruating with monthly cycles',
  },
  perimenopause: {
    label: 'Perimenopause',
    emoji: '🌊',
    description: 'Irregular cycles, approaching menopause',
  },
  menopause: {
    label: 'Menopause',
    emoji: '🌺',
    description: 'No period for 12+ months',
  },
  postmenopause: {
    label: 'Post-Menopause',
    emoji: '✨',
    description: 'Several years past menopause',
  },
  postpartum: {
    label: 'Postpartum',
    emoji: '🌱',
    description: 'Within 2 years of giving birth',
  },
  pregnancy: {
    label: 'Pregnancy',
    emoji: '🌸',
    description: 'Currently pregnant',
  },
  irregular: {
    label: 'Irregular Cycles',
    emoji: '🔀',
    description: 'Unpredictable or skipped periods',
  },
  heavy: {
    label: 'Heavy Periods',
    emoji: '💧',
    description: 'Heavier than normal menstrual flow',
  },
  light: {
    label: 'Light Periods',
    emoji: '🩸',
    description: 'Lighter than normal menstrual flow',
  },
  spotting: {
    label: 'Spotting',
    emoji: '🔴',
    description: 'Light bleeding between periods',
  },
  cramps: {
    label: 'Cramps',
    emoji: '⚡',
    description: 'Painful menstrual or pelvic cramps',
  },
  bloating: {
    label: 'Bloating',
    emoji: '🌀',
    description: 'Persistent or cyclical bloating',
  },
  fatigue: {
    label: 'Fatigue',
    emoji: '😴',
    description: 'Low energy or chronic tiredness',
  },
  mood_swings: {
    label: 'Mood Swings',
    emoji: '🌦️',
    description: 'Emotional shifts tied to cycles or hormones',
  },
  sleep_issues: {
    label: 'Sleep Issues',
    emoji: '🌛',
    description: 'Difficulty falling or staying asleep',
  },
  sex_drive: {
    label: 'Sex Drive Changes',
    emoji: '💫',
    description: 'Decreased or fluctuating libido',
  },
  fertility: {
    label: 'Fertility Concerns',
    emoji: '🌻',
    description: 'Trying to conceive or fertility challenges',
  },
  gut_health: {
    label: 'Gut Health',
    emoji: '🌿',
    description: 'Digestive issues, IBS, or gut discomfort',
  },
  mental_health: {
    label: 'Mental Health',
    emoji: '🧠',
    description: 'Anxiety, depression, or mood disorders',
  },
  thyroid: {
    label: 'Thyroid Symptoms',
    emoji: '🦋',
    description: 'Weight changes, hair loss, or temperature sensitivity',
  },
  pcos: {
    label: 'PCOS',
    emoji: '🔬',
    description: 'Polycystic ovary syndrome symptoms',
  },
  hormonal_imbalance: {
    label: 'Hormonal Imbalance',
    emoji: '⚖️',
    description: 'General hormonal dysregulation',
  },
  estrogen_dominance: {
    label: 'Estrogen Dominance',
    emoji: '🌹',
    description: 'Excess estrogen relative to progesterone',
  },
  thyroid_disruption: {
    label: 'Thyroid Disruption',
    emoji: '⚡',
    description: 'Thyroid dysfunction affecting energy and metabolism',
  },
};

interface PhaseCardProps {
  phase: LifePhase;
  selected?: boolean;
  onSelect: (phase: LifePhase) => void;
  disabled?: boolean;
}

export default function PhaseCard({
  phase,
  selected = false,
  onSelect,
  disabled = false,
}: PhaseCardProps) {
  const { label, emoji, description } = PHASE_CONFIG[phase];

  return (
    <motion.button
      type="button"
      onClick={() => !disabled && onSelect(phase)}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      aria-pressed={selected}
      disabled={disabled}
      className={cn(
        'w-full text-left rounded-2xl p-5 border transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender',
        selected
          ? 'glass glow-lavender border-lavender/60 bg-lavender/10'
          : 'glass border-blush/50 hover:border-lavender/40',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className="text-2xl leading-none mt-0.5 shrink-0"
          aria-hidden="true"
        >
          {emoji}
        </span>
        <div className="min-w-0">
          <p
            className={cn(
              'font-semibold text-base leading-snug font-serif',
              selected ? 'text-mauve' : 'text-mauve/90',
            )}
          >
            {label}
          </p>
          <p className="text-sm text-mauve/60 mt-0.5 leading-snug">
            {description}
          </p>
        </div>
        {selected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="ml-auto shrink-0 w-5 h-5 rounded-full bg-lavender flex items-center justify-center"
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
      </div>
    </motion.button>
  );
}
