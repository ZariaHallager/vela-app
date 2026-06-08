'use client';

import { motion, LayoutGroup } from 'framer-motion';
import { cn } from '@/lib/utils';

const STEPS = [
  'opening',
  'reflection',
  'phase',
  'insight',
  'conditionContext',
  'followup',
  'pdf',
] as const;

type VisibleStep = (typeof STEPS)[number];

interface ProgressDotsProps {
  currentStep: VisibleStep | string;
  className?: string;
}

export default function ProgressDots({ currentStep, className }: ProgressDotsProps) {
  const currentIndex = STEPS.indexOf(currentStep as VisibleStep);

  return (
    <LayoutGroup>
      <div
        role="progressbar"
        aria-label="Conversation progress"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        className={cn('flex items-center gap-2', className)}
      >
        {STEPS.map((step, i) => {
          const isActive = i === currentIndex;
          const isDone = i < currentIndex;

          return (
            <motion.div
              key={step}
              layoutId={`dot-${step}`}
              initial={false}
              animate={{
                width: isActive ? 24 : 8,
                opacity: isDone ? 0.45 : isActive ? 1 : 0.3,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className={cn(
                'h-2 rounded-full',
                isActive
                  ? 'bg-lavender animate-glow-pulse'
                  : isDone
                    ? 'bg-lavender'
                    : 'bg-blush',
              )}
            />
          );
        })}
      </div>
    </LayoutGroup>
  );
}
