'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import ProgressDots from '@/components/ui/ProgressDots';
import OpeningStep from '@/components/agent/OpeningStep';
import ReflectionStep from '@/components/agent/ReflectionStep';
import PhaseStep from '@/components/agent/PhaseStep';
import InsightStep from '@/components/agent/InsightStep';
import ConditionContextStep from '@/components/agent/ConditionContextStep';
import FollowUpStep from '@/components/agent/FollowUpStep';
import PDFStep from '@/components/agent/PDFStep';
import { useSessionStore } from '@/lib/entitydb';
import type { LifePhase, Step } from '@/lib/types';

export default function AgentShell() {
  const [step, setStep] = useState<Step>('opening');
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);

  const store = useSessionStore();

  if (step === 'destroyed') {
    return (
      <>
        <AnimatedBackground />
        <ThankYou onRestart={() => setStep('opening')} />
      </>
    );
  }

  return (
    <>
      <AnimatedBackground />

      <main className="flex flex-col items-center justify-center min-h-screen px-4 py-10">
        <div className="w-full max-w-2xl">
          {/* Progress dots */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center mb-8"
          >
            <ProgressDots currentStep={step} />
          </motion.div>

          {/* Step panels */}
          <AnimatePresence mode="wait">
            {step === 'opening' && (
              <OpeningStep
                key="opening"
                onNext={(text, chips) => {
                  store.setOpeningText(text);
                  store.setSymptomChips(chips);
                  store.addMessage({ role: 'user', content: text });
                  setStep('reflection');
                }}
              />
            )}

            {step === 'reflection' && (
              <ReflectionStep
                key="reflection"
                onNext={() => setStep('phase')}
              />
            )}

            {step === 'phase' && (
              <PhaseStep
                key="phase"
                onNext={(phases: LifePhase[], questions: string[]) => {
                  store.setPhases(phases);
                  setFollowUpQuestions(questions);
                  setStep('insight');
                }}
              />
            )}

            {step === 'insight' && (
              <InsightStep
                key="insight"
                onNext={() => setStep('conditionContext')}
              />
            )}

            {step === 'conditionContext' && (
              <ConditionContextStep
                key="conditionContext"
                onNext={() => setStep('followup')}
              />
            )}

            {step === 'followup' && (
              <FollowUpStep
                key="followup"
                questions={followUpQuestions}
                onNext={() => setStep('pdf')}
              />
            )}

            {step === 'pdf' && (
              <PDFStep
                key="pdf"
                onComplete={() => setStep('destroyed')}
              />
            )}
          </AnimatePresence>
        </div>
      </main>
    </>
  );
}

function ThankYou({ onRestart }: { onRestart: () => void }) {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        className="text-center max-w-sm"
      >
        <div className="text-5xl mb-5" aria-hidden="true">
          🌸
        </div>
        <h1 className="font-serif text-3xl text-mauve mb-3">
          Take good care of yourself
        </h1>
        <p className="text-mauve/60 text-base leading-relaxed mb-8">
          Your session has been cleared. No data has been stored. We hope your clinical brief helps you have a more productive conversation with your provider.
        </p>
        <button
          type="button"
          onClick={onRestart}
          className="text-sm text-mauve/50 hover:text-lavender underline underline-offset-2 transition-colors duration-150"
        >
          Start a new session
        </button>
      </motion.div>
    </main>
  );
}
