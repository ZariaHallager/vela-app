'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { useSessionStore } from '@/lib/entitydb';
import { stripMarkdown } from '@/lib/utils';

const MAX_TURNS = 10;

const FALLBACK_QUESTIONS = [
  'How long have you been experiencing these symptoms?',
  'Do the symptoms follow a pattern or cycle throughout the month?',
  'How significantly are these symptoms affecting your daily life and energy?',
  'Have you had any relevant lab work done recently, such as hormonal panels?',
  'What have you already tried to manage these symptoms?',
];

interface FollowUpStepProps {
  questions: string[];
  onNext: () => void;
}

export default function FollowUpStep({ questions, onNext }: FollowUpStepProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const turnCount = useSessionStore((s) => s.turnCount);
  const addMessage = useSessionStore((s) => s.addMessage);
  const setFollowUpAnswer = useSessionStore((s) => s.setFollowUpAnswer);
  const setFollowUpQuestions = useSessionStore((s) => s.setFollowUpQuestions);
  const incrementTurn = useSessionStore((s) => s.incrementTurn);

  const allQuestions = questions.length > 0 ? questions : FALLBACK_QUESTIONS;
  const currentQuestion = allQuestions[currentIndex];

  useEffect(() => {
    setFollowUpQuestions(allQuestions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalQuestions = allQuestions.length;
  const isLast = currentIndex >= totalQuestions - 1;
  const atTurnLimit = turnCount >= MAX_TURNS;
  const hasAnsweredAtLeastOne = currentIndex > 0;

  const handleSubmitAnswer = () => {
    if (!answer.trim() || isSubmitting) return;
    setIsSubmitting(true);

    addMessage({ role: 'user', content: answer.trim() });
    setFollowUpAnswer(currentQuestion, answer.trim());
    incrementTurn();

    if (isLast || atTurnLimit) {
      onNext();
      return;
    }

    setAnswer('');
    setCurrentIndex((prev) => prev + 1);
    setIsSubmitting(false);
  };

  const progressPercent = (currentIndex / totalQuestions) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <GlassCard className="p-8 md:p-10">
        {/* Header row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">
              💬
            </span>
            <p className="text-xs font-semibold uppercase tracking-widest text-lavender">
              Deep dive
            </p>
          </div>
          <p className="text-xs tabular-nums text-mauve/40">
            {currentIndex + 1} / {totalQuestions}
          </p>
        </motion.div>

        {/* Progress bar */}
        <div
          className="w-full h-1 bg-blush/30 rounded-full mb-8 overflow-hidden"
          role="progressbar"
          aria-valuenow={currentIndex + 1}
          aria-valuemin={1}
          aria-valuemax={totalQuestions}
        >
          <motion.div
            className="h-full bg-lavender rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
          />
        </div>

        {/* Question — slides in/out */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
            className="mb-6"
          >
            <p className="font-serif text-xl md:text-2xl text-mauve leading-snug">
              {stripMarkdown(currentQuestion)}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Answer textarea */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <AnimatePresence mode="wait">
            <motion.textarea
              key={currentIndex}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSubmitAnswer();
                }
              }}
              placeholder="Share as much detail as feels right…"
              rows={4}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full rounded-xl p-4 text-mauve placeholder-mauve/30 bg-champagne/60 border border-blush/60 focus:outline-none focus:ring-2 focus:ring-lavender focus:border-transparent resize-none text-base leading-relaxed transition-all duration-200"
            />
          </AnimatePresence>
          <p className="text-xs text-mauve/30 mt-1 text-right">⌘ + Enter to continue</p>
        </motion.div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {hasAnsweredAtLeastOne && (
            <motion.button
              type="button"
              onClick={onNext}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="flex-1 py-4 rounded-xl font-medium text-sm text-mauve/60 border border-blush hover:border-lavender/50 hover:text-mauve/80 transition-all duration-200"
            >
              Generate my report
            </motion.button>
          )}

          <motion.button
            type="button"
            onClick={handleSubmitAnswer}
            disabled={!answer.trim() || isSubmitting}
            whileHover={{ scale: answer.trim() && !isSubmitting ? 1.02 : 1 }}
            whileTap={{ scale: answer.trim() && !isSubmitting ? 0.97 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`flex-1 py-4 rounded-xl font-semibold text-base tracking-wide transition-all duration-200 ${answer.trim() && !isSubmitting
              ? 'bg-lavender text-white shadow-lg shadow-lavender/30 hover:bg-lavender/90'
              : 'bg-blush/40 text-mauve/30 cursor-not-allowed'
              }`}
          >
            {isLast || atTurnLimit ? 'Generate my report →' : 'Next question →'}
          </motion.button>
        </div>
      </GlassCard>
    </motion.div>
  );
}
