'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import TypewriterText from '@/components/ui/TypewriterText';
import { useSessionStore } from '@/lib/entitydb';
import { cn, stripMarkdown } from '@/lib/utils';

interface InsightStepProps {
  onNext: () => void;
}

export default function InsightStep({ onNext }: InsightStepProps) {
  const [insightText, setInsightText] = useState('');
  const [isStreaming, setIsStreaming] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ctaHovered, setCtaHovered] = useState(false);
  const didFetch = useRef(false);

  const phase = useSessionStore((s) => s.phase);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;

    const { conversationHistory, turnCount, addMessage, incrementTurn } =
      useSessionStore.getState();

    (async () => {
      try {
        const resp = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: conversationHistory,
            step: 'insight',
            phase: useSessionStore.getState().phase,
            sessionTurn: turnCount,
          }),
        });

        if (!resp.ok) {
          const json = await resp.json();
          throw new Error(json.message ?? `HTTP ${resp.status}`);
        }

        const reader = resp.body!.getReader();
        const decoder = new TextDecoder();
        let full = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          full += decoder.decode(value, { stream: true });
          setInsightText(full);
        }

        addMessage({ role: 'assistant', content: full });
        incrementTurn();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      } finally {
        setIsStreaming(false);
      }
    })();
  }, []);

  const isDone = !isStreaming;

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
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-6 overflow-visible"
        >
          {/* Floating sparkle accents */}
          {([
            { top: '-4px', right: '20px', delay: 0, size: 'text-sm', color: 'text-rose-300/65' },
            { top: '14px', right: '6px', delay: 0.7, size: 'text-xs', color: 'text-purple-300/50' },
            { top: '4px', right: '44px', delay: 1.2, size: 'text-[9px]', color: 'text-lavender/55' },
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

          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl" aria-hidden="true">
              🔍
            </span>
            <p className="text-xs font-semibold uppercase tracking-widest text-lavender">
              Your personalized insight
            </p>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl text-mauve leading-snug">
            Here&apos;s what your body may be telling you
          </h2>
          {phase && (
            <p className="text-sm text-mauve/50 mt-1 capitalize">
              Calibrated for{' '}
              <span className="text-lavender font-medium">
                {phaseLabel(phase)}
              </span>
            </p>
          )}
        </motion.div>

        {/* Streamed content */}
        <div className="min-h-[140px] mb-8">
          {error ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm leading-relaxed"
            >
              {error}
            </motion.p>
          ) : (
            <div className="text-mauve/80 text-base leading-relaxed">
              {insightText && (
                <TypewriterText
                  text={stripMarkdown(insightText)}
                  className="whitespace-pre-wrap"
                />
              )}
            </div>
          )}

          {isStreaming && !insightText && <LoadingDots />}
        </div>

        {/* Continue */}
        <motion.button
          type="button"
          onClick={onNext}
          disabled={!isDone && !error}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: isDone || error ? 1 : 0.4, y: 0 }}
          transition={{ delay: 0.35 }}
          whileHover={{ scale: isDone || error ? 1.02 : 1 }}
          whileTap={{ scale: isDone || error ? 0.97 : 1 }}
          onHoverStart={() => (isDone || !!error) && setCtaHovered(true)}
          onHoverEnd={() => setCtaHovered(false)}
          className={cn(
            'relative overflow-hidden w-full py-4 rounded-xl font-semibold text-base tracking-wide transition-all duration-200',
            isDone || error
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
            {isStreaming && !error ? 'Analyzing…' : "Let's explore deeper →"}
          </span>
        </motion.button>
      </GlassCard>
    </motion.div>
  );
}

function phaseLabel(phase: string): string {
  const labels: Record<string, string> = {
    cycling: 'regular cycles',
    irregular: 'irregular cycles',
    heavy: 'heavy bleeding',
    light: 'light bleeding',
    spotting: 'spotting',
    cramps: 'cramps',
    bloating: 'bloating',
    fatigue: 'fatigue',
    mood_swings: 'mood swings',
    sleep_issues: 'sleep issues',
    sex_drive: 'sex drive',
    fertility: 'fertility',
    gut_health: 'gut health',
    mental_health: 'mental health',
    thyroid: 'thyroid',
    pcos: 'pcos',
    hormonal_imbalance: 'hormonal imbalance',
    estrogen_dominance: 'estrogen dominance',
    thyroid_disruption: 'thyroid disruption',
    perimenopause: 'perimenopause',
    menopause: 'menopause',
    postmenopause: 'post-menopause',
    postpartum: 'postpartum',
    pregnancy: 'pregnancy',
  };
  return labels[phase] ?? phase;
}

function LoadingDots() {
  return (
    <div className="flex gap-1.5 pt-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-lavender"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            repeat: Infinity,
            duration: 1.2,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
