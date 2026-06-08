'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import SymptomChip, { type ChipCategory } from '@/components/ui/SymptomChip';
import { cn } from '@/lib/utils';

interface SymptomGroup {
  category: ChipCategory;
  label: string;
  symptoms: string[];
}

const SYMPTOM_GROUPS: SymptomGroup[] = [
  {
    category: 'cycle',
    label: 'Cycle & Hormones',
    symptoms: [
      'Irregular periods',
      'Cramps',
      'Heavy bleeding',
      'Spotting between periods',
      'Absent periods',
      'PMS',
    ],
  },
  {
    category: 'skin',
    label: 'Skin, Hair & Body',
    symptoms: [
      'Hair loss',
      'Facial/body hair growth',
      'Severe acne',
      'Oily skin',
      'Dark skin patches',
      'Weight changes',
      'Difficulty losing weight',
    ],
  },
  {
    category: 'pain',
    label: 'Pain & Discomfort',
    symptoms: [
      'Pelvic pain',
      'Painful intercourse',
      'Bloating/abdominal swelling',
      'Painful bowel movements',
      'Joint pain',
      'Headaches',
    ],
  },
  {
    category: 'energy',
    label: 'Energy & Mind',
    symptoms: ['Fatigue', 'Brain fog', 'Mood swings', 'Anxiety', 'Sleep issues', 'Low libido'],
  },
  {
    category: 'hormonal',
    label: 'Hormonal Symptoms',
    symptoms: ['Hot flashes', 'Night sweats'],
  },
];

interface OpeningStepProps {
  onNext: (openingText: string, selectedChips: string[]) => void;
}

const categoryHeaderColor: Record<ChipCategory, string> = {
  cycle: 'text-rose-400',
  skin: 'text-amber-500',
  pain: 'text-purple-500',
  energy: 'text-indigo-500',
  hormonal: 'text-rose-500',
};

export default function OpeningStep({ onNext }: OpeningStepProps) {
  const [text, setText] = useState('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);

  const toggleChip = (label: string) => {
    setSelectedChips((prev) =>
      prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label],
    );
  };

  const canSubmit = text.trim().length > 0 || selectedChips.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const chipSentence =
      selectedChips.length > 0
        ? `I've been experiencing: ${selectedChips.join(', ')}.`
        : '';
    const combined = [chipSentence, text.trim()].filter(Boolean).join(' ');
    onNext(combined, selectedChips);
  };

  // Global chip index for staggered entry animation
  let chipIndex = 0;

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
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-8 relative"
        >
          {/* Floating sparkles */}
          {[
            { x: '92%', delay: 0, size: 'text-rose-300' },
            { x: '85%', delay: 0.6, size: 'text-purple-300' },
            { x: '97%', delay: 1.2, size: 'text-pink-200' },
          ].map((s, i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              className={cn('absolute top-0 pointer-events-none select-none text-xs', s.size)}
              style={{ left: s.x }}
              animate={{ y: [-4, 4, -4], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
            >
              ✦
            </motion.span>
          ))}
          <h1 className="font-serif text-3xl md:text-4xl text-mauve leading-snug mb-3">
            What&apos;s been going on with your body lately?
          </h1>
          <p className="text-mauve/60 text-base leading-relaxed">
            Share freely — everything here is private and never stored. The more
            you tell us, the more useful your clinical brief will be.
          </p>
        </motion.div>

        {/* Categorized symptom chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mb-6 space-y-5"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-mauve/40">
            Tap any that apply
          </p>

          {SYMPTOM_GROUPS.map((group) => (
            <div key={group.category}>
              <p
                className={cn(
                  'text-[10px] font-semibold uppercase tracking-[0.18em] mb-2',
                  categoryHeaderColor[group.category],
                )}
              >
                {group.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.symptoms.map((symptom) => {
                  const idx = chipIndex++;
                  return (
                    <motion.div
                      key={symptom}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: 0.22 + idx * 0.022,
                        type: 'spring',
                        stiffness: 320,
                        damping: 20,
                      }}
                    >
                      <SymptomChip
                        label={symptom}
                        selected={selectedChips.includes(symptom)}
                        onToggle={toggleChip}
                        category={group.category}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Free-text area */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.4 }}
          className="mb-8"
        >
          <label
            htmlFor="opening-text"
            className="text-xs font-semibold uppercase tracking-widest text-mauve/40 block mb-2"
          >
            Or describe in your own words
          </label>
          <textarea
            id="opening-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
            placeholder="e.g. I've been exhausted lately, my periods are irregular, and I get these mood swings in the afternoon…"
            rows={4}
            className={cn(
              'w-full rounded-xl p-4 text-mauve placeholder-mauve/30',
              'bg-champagne/60 border border-blush/60',
              'focus:outline-none focus:ring-2 focus:ring-lavender focus:border-transparent',
              'resize-none text-base leading-relaxed transition-all duration-200',
            )}
          />
          <p className="text-xs text-mauve/30 mt-1 text-right">⌘ + Enter to continue</p>
        </motion.div>

        {/* Submit — gradient shimmer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.4 }}
          className="relative overflow-hidden rounded-xl"
        >
          <motion.button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            whileHover={{ scale: canSubmit ? 1.02 : 1 }}
            whileTap={{ scale: canSubmit ? 0.97 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={cn(
              'relative w-full py-4 rounded-xl font-semibold text-base tracking-wide transition-all duration-200 overflow-hidden',
              canSubmit
                ? 'bg-gradient-to-r from-rose-400 via-lavender to-purple-400 text-white shadow-lg shadow-rose-300/30'
                : 'bg-blush/40 text-mauve/30 cursor-not-allowed',
            )}
          >
            {canSubmit && (
              <motion.span
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 pointer-events-none"
                initial={{ x: '-120%' }}
                whileHover={{ x: '220%' }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              />
            )}
            <span className="relative">Continue →</span>
          </motion.button>
        </motion.div>
      </GlassCard>
    </motion.div>
  );
}
