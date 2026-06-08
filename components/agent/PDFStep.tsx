'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { useSessionStore } from '@/lib/entitydb';

interface PDFStepProps {
  onComplete: () => void;
}

const INCLUDED_ITEMS = [
  'Symptom chronology timeline',
  'Pattern hypotheses in clinical language',
  'Flagged anomalies from your description',
  'Questions to bring your provider',
  'What you have already tried',
];

function DocumentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-7 h-7"
      aria-hidden="true"
    >
      <path
        d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
        stroke="white"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 2v5h5"
        stroke="white"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 13h8M8 17h5"
        stroke="white"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

export default function PDFStep({ onComplete }: PDFStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const store = useSessionStore();

  const generatePdf = async (): Promise<void> => {
    const resp = await fetch('/api/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session: {
          conversationHistory: store.conversationHistory,
          phases: store.phases,
          symptomChips: store.symptomChips,
          openingText: store.openingText,
          followUpAnswers: store.followUpAnswers,
          followUpQuestions: store.followUpQuestions,
          conditionContext: store.conditionContext,
          turnCount: store.turnCount,
        },
      }),
    });

    if (!resp.ok) {
      throw new Error('PDF generation failed. Please try again.');
    }

    const buffer = await resp.arrayBuffer();
    const blob = new Blob([buffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'vela-clinical-brief.pdf';
    anchor.click();
    URL.revokeObjectURL(url);

    setPdfGenerated(true);
  };

  const handlePrimary = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setError(null);

    try {
      await generatePdf();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinish = () => {
    store.destroy();
    onComplete();
  };

  const primaryLabel = isGenerating ? 'Generating…' : pdfGenerated ? 'Downloaded' : 'Generate & download';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <GlassCard className="p-8 md:p-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 280, damping: 22 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{
              background: 'linear-gradient(135deg, #C084FC 0%, #F9A8D4 100%)',
              boxShadow: '0 8px 28px rgba(192, 132, 252, 0.30)',
            }}
          >
            <DocumentIcon />
          </motion.div>

          <h2 className="font-serif text-2xl md:text-3xl text-mauve leading-snug mb-2">
            Your clinical brief is ready
          </h2>
          <p className="text-mauve/60 text-base leading-relaxed max-w-md mx-auto">
            A personalized pre-visit document capturing your symptom history,
            pattern hypotheses, and questions for your provider.
          </p>
        </motion.div>

        {/* What's included */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-8 rounded-xl border border-blush/40 overflow-hidden"
        >
          <div className="px-4 py-2.5 bg-blush/20 border-b border-blush/40">
            <p className="text-xs font-semibold uppercase tracking-widest text-mauve/45">
              What&apos;s included
            </p>
          </div>
          <ul>
            {INCLUDED_ITEMS.map((item, i) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm text-mauve/70 ${i < INCLUDED_ITEMS.length - 1 ? 'border-b border-blush/25' : ''
                  }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: 'linear-gradient(135deg, #C084FC, #F9A8D4)' }}
                  aria-hidden="true"
                />
                {item}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-red-400 text-sm mb-4 leading-relaxed overflow-hidden"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="mb-3"
        >
          <motion.button
            type="button"
            onClick={handlePrimary}
            disabled={isGenerating || pdfGenerated}
            whileHover={{ scale: isGenerating || pdfGenerated ? 1 : 1.02 }}
            whileTap={{ scale: isGenerating || pdfGenerated ? 1 : 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`w-full py-4 rounded-xl font-semibold text-base tracking-wide flex items-center justify-center gap-2 transition-all duration-200 ${isGenerating
              ? 'bg-blush/40 text-mauve/30 cursor-not-allowed'
              : pdfGenerated
                ? 'bg-lavender/12 text-lavender border border-lavender/35'
                : 'bg-lavender text-white shadow-lg shadow-lavender/30 hover:bg-lavender/90'
              }`}
          >
            {isGenerating ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                  className="inline-block leading-none text-lg"
                  aria-hidden="true"
                >
                  ↻
                </motion.span>
                {primaryLabel}
              </>
            ) : pdfGenerated ? (
              <>
                <CheckIcon className="w-4 h-4 shrink-0" />
                {primaryLabel}
              </>
            ) : (
              primaryLabel
            )}
          </motion.button>
        </motion.div>

        {/* Finish */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center pt-5 mt-2 border-t border-blush/25"
        >
          <p className="text-xs text-mauve/35 mb-3 leading-relaxed">
            Session data lives only in this browser tab and is cleared when you finish.
          </p>
          <button
            type="button"
            onClick={handleFinish}
            className="text-sm text-mauve/45 hover:text-mauve/70 underline underline-offset-2 transition-colors duration-150"
          >
            Finish &amp; clear session
          </button>
        </motion.div>
      </GlassCard>
    </motion.div>
  );
}
