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
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const store = useSessionStore();

  const generatePdf = async (): Promise<string> => {
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
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    setPdfBase64(base64);

    const blob = new Blob([buffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'vela-clinical-brief.pdf';
    anchor.click();
    URL.revokeObjectURL(url);

    setPdfGenerated(true);
    return base64;
  };

  const sendEmail = async (base64: string) => {
    const resp = await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, pdfBase64: base64 }),
    });

    if (!resp.ok) {
      const json = await resp.json();
      throw new Error(json.error ?? 'Failed to send email. Please try again.');
    }

    setEmailSent(true);
  };

  const handlePrimary = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setError(null);

    try {
      const base64 = await generatePdf();
      if (email) {
        setIsSendingEmail(true);
        await sendEmail(base64);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
      setIsSendingEmail(false);
    }
  };

  const handleDownloadOnly = async () => {
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

  const handleSendAfterDownload = async () => {
    if (!email || !pdfBase64 || isSendingEmail) return;
    setIsSendingEmail(true);
    setError(null);

    try {
      await sendEmail(pdfBase64);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleFinish = () => {
    store.destroy();
    onComplete();
  };

  const primaryDone = pdfGenerated && (!email || emailSent);
  const primaryDisabled = isGenerating || primaryDone;

  const primaryLabel = (() => {
    if (isGenerating) return isSendingEmail ? 'Sending…' : 'Generating…';
    if (pdfGenerated) return email && emailSent ? 'Downloaded & sent' : 'Downloaded';
    return email ? 'Generate & send' : 'Generate & download';
  })();

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

        {/* Email input — always visible */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="mb-5"
        >
          <label
            htmlFor="pdf-email-input"
            className="flex items-baseline gap-2 mb-2"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-mauve/50">
              Send to email
            </span>
            <span className="text-xs text-mauve/35">optional</span>
          </label>

          {emailSent ? (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-lavender/10 border border-lavender/25 text-sm text-mauve/70"
            >
              <CheckIcon className="w-4 h-4 text-lavender shrink-0" />
              Sent to {email}
            </motion.div>
          ) : (
            <div className="flex gap-2">
              <input
                id="pdf-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && pdfGenerated) handleSendAfterDownload();
                }}
                placeholder="you@example.com"
                disabled={isGenerating}
                className="flex-1 rounded-xl px-4 py-3 text-mauve placeholder-mauve/30 bg-champagne/60 border border-blush/60 focus:outline-none focus:ring-2 focus:ring-lavender/60 focus:border-transparent text-sm transition-all duration-200 disabled:opacity-50"
              />
              {pdfGenerated && email && (
                <motion.button
                  type="button"
                  onClick={handleSendAfterDownload}
                  disabled={isSendingEmail}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: isSendingEmail ? 1 : 1.02 }}
                  whileTap={{ scale: isSendingEmail ? 1 : 0.97 }}
                  className={`px-5 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-200 ${!isSendingEmail
                    ? 'bg-mauve text-champagne hover:bg-mauve/85'
                    : 'bg-blush/40 text-mauve/30 cursor-not-allowed'
                    }`}
                >
                  {isSendingEmail ? '…' : 'Send'}
                </motion.button>
              )}
            </div>
          )}
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
            disabled={primaryDisabled}
            whileHover={{ scale: primaryDisabled ? 1 : 1.02 }}
            whileTap={{ scale: primaryDisabled ? 1 : 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`w-full py-4 rounded-xl font-semibold text-base tracking-wide flex items-center justify-center gap-2 transition-all duration-200 ${isGenerating
              ? 'bg-blush/40 text-mauve/30 cursor-not-allowed'
              : primaryDone
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
            ) : primaryDone ? (
              <>
                <CheckIcon className="w-4 h-4 shrink-0" />
                {primaryLabel}
              </>
            ) : (
              primaryLabel
            )}
          </motion.button>
        </motion.div>

        {/* Download only — secondary link, shown when email is provided */}
        <AnimatePresence>
          {!pdfGenerated && email && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden text-center mb-2"
            >
              <button
                type="button"
                onClick={handleDownloadOnly}
                disabled={isGenerating}
                className="text-sm text-mauve/40 hover:text-mauve/65 underline underline-offset-2 transition-colors duration-150 disabled:cursor-not-allowed py-1"
              >
                Download only
              </button>
            </motion.div>
          )}
        </AnimatePresence>

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
