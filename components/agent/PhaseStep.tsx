'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import PhaseCard from '@/components/ui/PhaseCard';
import { useSessionStore } from '@/lib/entitydb';
import { cn } from '@/lib/utils';
import type { LifePhase } from '@/lib/types';

const PHASES: LifePhase[] = [
  'cycling',
  'perimenopause',
  'menopause',
  'postmenopause',
  'postpartum',
  'pregnancy',
  'irregular',
  'heavy',
  'light',
  'spotting',
  'cramps',
  'bloating',
  'fatigue',
  'mood_swings',
  'sleep_issues',
  'sex_drive',
  'fertility',
  'gut_health',
  'mental_health',
  'thyroid',
  'pcos',
  'hormonal_imbalance',
  'estrogen_dominance',
  'thyroid_disruption'
];

const FALLBACK_QUESTIONS = [
  'How long have you been experiencing these symptoms?',
  'Do the symptoms follow a pattern or cycle throughout the month?',
  'How significantly are these symptoms affecting your daily life and energy levels?',
  'Have you had any relevant lab work done recently, such as hormonal panels or thyroid tests?',
  'What have you already tried to manage these symptoms — lifestyle changes, supplements, or medications?',
];

interface PhaseStepProps {
  onNext: (phases: LifePhase[], questions: string[]) => void;
}

export default function PhaseStep({ onNext }: PhaseStepProps) {
  const [selectedPhases, setSelectedPhases] = useState<LifePhase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ctaHovered, setCtaHovered] = useState(false);

  const togglePhase = (phase: LifePhase) => {
    setSelectedPhases((prev) =>
      prev.includes(phase) ? prev.filter((p) => p !== phase) : [...prev, phase],
    );
  };

  const handleContinue = async () => {
    if (selectedPhases.length === 0 || isLoading) return;
    setIsLoading(true);
    setError(null);

    const { conversationHistory, turnCount, addMessage, incrementTurn } =
      useSessionStore.getState();

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
          step: 'phase',
          phases: selectedPhases,
          sessionTurn: turnCount,
        }),
      });

      if (!resp.ok) {
        const json = await resp.json();
        throw new Error(json.message ?? `HTTP ${resp.status}`);
      }

      // Read the full streamed response (JSON array string)
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
      }

      let questions: string[] = FALLBACK_QUESTIONS;
      try {
        const parsed = JSON.parse(fullText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          questions = parsed.filter((q): q is string => typeof q === 'string');
        }
      } catch {
        // model didn't return valid JSON — use fallback
      }

      addMessage({ role: 'user', content: `My current phases/symptoms: ${selectedPhases.join(', ')}` });
      incrementTurn();

      onNext(selectedPhases, questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <GlassCard className="p-8 md:p-10">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-8 overflow-visible"
        >
          {/* Floating sparkle accents */}
          {([
            { top: '-6px', right: '32px', delay: 0, size: 'text-sm', color: 'text-rose-300/60' },
            { top: '10px', right: '10px', delay: 0.6, size: 'text-xs', color: 'text-purple-300/50' },
            { top: '2px', right: '58px', delay: 1.1, size: 'text-[9px]', color: 'text-lavender/55' },
          ] as const).map(({ top, right, delay, size, color }, i) => (
            <motion.span
              key={i}
              className={`absolute pointer-events-none select-none ${size} ${color}`}
              style={{ top, right }}
              animate={{ y: [-4, 4, -4], opacity: [0.3, 0.85, 0.3] }}
              transition={{ duration: 2.4 + i * 0.45, delay, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden="true"
            >
              ✦
            </motion.span>
          ))}

          <h2 className="font-serif text-2xl md:text-3xl text-mauve leading-snug mb-2">
            Help us understand your body&apos;s current chapter
          </h2>
          <p className="text-mauve/60 text-base leading-relaxed">
            This calibrates the clinical context of your symptoms so your brief is accurate. Select all that apply.
          </p>
        </motion.div>

        {/* Phase cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {PHASES.map((phase, i) => (
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.15 + i * 0.065,
                type: 'spring',
                stiffness: 280,
                damping: 26,
              }}
            >
              <PhaseCard
                phase={phase}
                selected={selectedPhases.includes(phase)}
                onSelect={togglePhase}
                disabled={isLoading}
              />
            </motion.div>
          ))}
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm mb-4 leading-relaxed"
          >
            {error}
          </motion.p>
        )}

        {/* Continue */}
        <motion.button
          type="button"
          onClick={handleContinue}
          disabled={selectedPhases.length === 0 || isLoading}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          whileHover={{ scale: selectedPhases.length > 0 && !isLoading ? 1.02 : 1 }}
          whileTap={{ scale: selectedPhases.length > 0 && !isLoading ? 0.97 : 1 }}
          onHoverStart={() => selectedPhases.length > 0 && !isLoading && setCtaHovered(true)}
          onHoverEnd={() => setCtaHovered(false)}
          className={cn(
            'relative overflow-hidden w-full py-4 rounded-xl font-semibold text-base tracking-wide transition-all duration-200',
            selectedPhases.length > 0 && !isLoading
              ? 'bg-gradient-to-r from-rose-400 via-lavender to-purple-400 text-white shadow-lg shadow-purple-400/30'
              : 'bg-blush/40 text-mauve/30 cursor-not-allowed',
          )}
        >
          <motion.span
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
            initial={{ x: '-100%', skewX: '-12deg' }}
            animate={{ x: ctaHovered ? '250%' : '-100%' }}
            transition={{ duration: 0.55, ease: 'easeInOut' }}
            aria-hidden="true"
          />
          <span className="relative z-10">
            {isLoading ? 'Preparing your insights…' : 'Continue →'}
          </span>
        </motion.button>
      </GlassCard>
    </motion.div>
  );
}
