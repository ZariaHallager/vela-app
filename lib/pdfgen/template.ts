import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
import type { SessionData, LifePhase, Message } from '@/lib/types';

// ─── Color palette ────────────────────────────────────────────────────────────
const MAUVE = '#2D1B2E';
const MAUVE_LIGHT = '#4A2D4E';
const MAUVE_GLOW = '#3E2244';          // subtle lighter mauve for watermark band
const ROSE_HEADER = '#6B1B47';         // rose-tinted gradient end for header
const BLUSH = '#F2D5D5';
const BLUSH_BADGE = '#FDF0F2';         // very soft rose for provider question badges
const BLUSH_BADGE_BORDER = '#E8C8D0';  // hairline border for badges
const CHAMPAGNE = '#FAF7F5';
const LAVENDER = '#C084FC';
const BODY_TEXT = '#1C1C2E';
const MUTED = '#6B6B8A';
const DIVIDER = '#E8E0ED';

// ─── Phase display names ───────────────────────────────────────────────────────
const PHASE_LABELS: Record<LifePhase, string> = {
  cycling: 'Regular Cycling',
  perimenopause: 'Perimenopause',
  menopause: 'Menopause',
  postmenopause: 'Post-Menopause',
  postpartum: 'Postpartum',
  pregnancy: 'Pregnancy',
  irregular: 'Irregular Cycles',
  heavy: 'Heavy Periods',
  light: 'Light Periods',
  spotting: 'Spotting',
  cramps: 'Cramps',
  bloating: 'Bloating',
  fatigue: 'Fatigue',
  mood_swings: 'Mood Swings',
  sleep_issues: 'Sleep Issues',
  sex_drive: 'Changes in Sex Drive',
  fertility: 'Fertility Concerns',
  gut_health: 'Gut Health Issues',
  mental_health: 'Mental Health Concerns',
  thyroid: 'Thyroid Symptoms',
  pcos: 'PCOS',
  hormonal_imbalance: 'Hormonal Imbalance',
  estrogen_dominance: 'Estrogen Dominance',
  thyroid_disruption: 'Thyroid Disruption',
};

// ─── Lab / anomaly keywords ────────────────────────────────────────────────────
const LAB_KEYWORDS = [
  'lab', 'labs', 'blood test', 'blood work', 'tsh', 'thyroid', 'estrogen',
  'progesterone', 'testosterone', 'cortisol', 'fsh', 'lh', 'amh',
  'ferritin', 'iron', 'vitamin d', 'b12', 'a1c', 'glucose', 'insulin',
  'hormone', 'results', 'levels', 'panel', 'test result',
  'cycle length', 'irregular period', 'missed period', 'spotting',
  'heavy bleeding', 'cycle day', 'luteal', 'follicular',
];

// ─── Tried-treatment keywords ─────────────────────────────────────────────────
const TREATMENT_KEYWORDS = [
  'tried', 'taking', 'started', 'stopped', 'prescribed',
  'supplement', 'medication', 'pill', 'patch', 'cream', 'iud',
  'birth control', 'hrt', 'hormone therapy', 'ibuprofen', 'advil',
  'melatonin', 'magnesium', 'cbd', 'acupuncture', 'therapy',
  'diet', 'exercise', 'yoga', 'meditation',
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Extract plain text assistant messages from conversation (excluding system) */
function getAssistantMessages(history: Message[]): string[] {
  return history
    .filter(m => m.role === 'assistant')
    .map(m => m.content.trim())
    .filter(Boolean);
}

/** Extract user messages from conversation (excluding system) */
function getUserMessages(history: Message[]): string[] {
  return history
    .filter(m => m.role === 'user')
    .map(m => m.content.trim())
    .filter(Boolean);
}

/**
 * Pull candidate sentences mentioning labs or cycle anomalies from any text.
 */
function extractAnomalySentences(texts: string[]): string[] {
  const sentences: string[] = [];
  for (const text of texts) {
    const parts = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
    for (const sentence of parts) {
      const lower = sentence.toLowerCase();
      if (LAB_KEYWORDS.some(kw => lower.includes(kw))) {
        sentences.push(sentence);
      }
    }
  }
  // Deduplicate by similarity (simple exact-dup removal)
  return Array.from(new Set(sentences)).slice(0, 8);
}

/**
 * Pull candidate sentences about what has been tried from user messages.
 */
function extractTriedSentences(userMessages: string[]): string[] {
  const sentences: string[] = [];
  for (const text of userMessages) {
    const parts = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
    for (const sentence of parts) {
      const lower = sentence.toLowerCase();
      if (TREATMENT_KEYWORDS.some(kw => lower.includes(kw))) {
        sentences.push(sentence);
      }
    }
  }
  return Array.from(new Set(sentences)).slice(0, 8);
}

interface HypothesisContent {
  hypotheses: string[];
  whatItMeans: string[];
}

/**
 * Extract hypothesis and "What This Means" content from the insight message only.
 * Filters to messages containing the **Pattern Hypothesis** header, then parses
 * each section independently so reflection/phase/follow-up messages are excluded.
 */
function extractHypotheses(assistantMessages: string[]): HypothesisContent {
  const allHypotheses: string[] = [];
  const allWhatItMeans: string[] = [];

  // Only process insight messages — those that explicitly contain the Pattern Hypothesis header
  const insightMessages = assistantMessages.filter(msg =>
    /\*\*\s*Pattern Hypothesis\s*\*\*/i.test(msg)
  );

  for (const msg of insightMessages) {
    // Content under **Pattern Hypothesis** up to the next bold header
    const hypothesisMatch = msg.match(
      /\*\*\s*Pattern Hypothesis\s*\*\*[:\s]*([\s\S]*?)(?=\*\*\s*What This Means|\*\*\s*[A-Z][^*]{2,}\*\*|$)/i
    );
    if (hypothesisMatch?.[1]) {
      const lines = hypothesisMatch[1]
        .split('\n')
        .map(l => l.replace(/\*\*/g, '').replace(/^[-•*\d.]+\s*/, '').trim())
        .filter(l => l.length >= 15 && /[A-Za-z]/.test(l) && !l.endsWith('?'));
      allHypotheses.push(...lines);
    }

    // Content under **What This Means for You** (or **What This Means**) to the next header or end
    const whatItMeansMatch = msg.match(
      /\*\*\s*What This Means(?:\s+for\s+You)?\s*\*\*[:\s]*([\s\S]*?)(?=\*\*\s*[A-Z][^*]{2,}\*\*|$)/i
    );
    if (whatItMeansMatch?.[1]) {
      const lines = whatItMeansMatch[1]
        .split('\n')
        .map(l => l.replace(/\*\*/g, '').replace(/^[-•*\d.]+\s*/, '').trim())
        .filter(l => l.length >= 15 && /[A-Za-z]/.test(l));
      allWhatItMeans.push(...lines);
    }
  }

  return {
    hypotheses: Array.from(new Set(allHypotheses)).slice(0, 6),
    whatItMeans: Array.from(new Set(allWhatItMeans)).slice(0, 4),
  };
}

/**
 * Synthesize 5–8 clinically relevant provider questions from session data.
 * Draws on phase, condition context, symptom chips, opening text, and follow-up
 * answers — so this section is always populated regardless of AI message format.
 */
function generateProviderQuestions(session: SessionData): string[] {
  const { symptomChips, openingText, phases, conditionContext, followUpAnswers } = session;
  const questions: string[] = [];

  // 1. Phase-specific standard questions
  const phaseQuestions: Partial<Record<LifePhase, string[]>> = {
    cycling: [
      'What is considered a normal cycle length for my age, and should I be tracking it more closely?',
      'Should my hormone levels (FSH, LH, estrogen, progesterone) be tested at a specific cycle day?',
    ],
    perimenopause: [
      'What hormone tests would help confirm I am in perimenopause and guide treatment decisions?',
      'How can I distinguish perimenopause symptoms from thyroid or other conditions?',
      'What lifestyle interventions are most evidence-based for managing perimenopausal symptoms?',
    ],
    menopause: [
      'Am I a candidate for hormone replacement therapy, and what are the current risk-benefit guidelines?',
      'What monitoring should I have for bone density and cardiovascular health during menopause?',
    ],
    postmenopause: [
      'How often should I have bone density (DEXA) scans, and am I at risk for osteoporosis?',
      'Are there non-hormonal options to address genitourinary symptoms of menopause?',
    ],
    postpartum: [
      'Should my thyroid function be re-tested given my postpartum symptoms?',
      'How do I know if what I am experiencing is postpartum depression versus hormonal fluctuation?',
    ],
    pregnancy: [
      'What thyroid and glucose screenings are recommended given my symptoms during pregnancy?',
      'Are my symptoms within the normal range for this stage of pregnancy, or do they need evaluation?',
    ],
  };

  for (const phase of phases ?? []) {
    if (phaseQuestions[phase]) {
      questions.push(...phaseQuestions[phase]!);
    }
  }

  // 2. Condition-area questions derived from conditionContext
  const conditionMap: Array<[string[], string[]]> = [
    [
      ['pcos'],
      [
        'Should I be screened for insulin resistance or metabolic syndrome given my PCOS symptoms?',
        'How often should my AMH, testosterone, and androgen levels be monitored?',
      ],
    ],
    [
      ['endometriosis', 'endo'],
      [
        'Is laparoscopy the only way to confirm endometriosis, and is that the right next step for me?',
        'What pain management strategies are most effective while preserving my fertility options?',
      ],
    ],
    [
      ['thyroid', 'hashimoto', 'hypothyroid', 'hyperthyroid'],
      [
        'Is my current TSH target range optimal, or should it be adjusted based on my symptoms?',
        'Should I have a full thyroid panel (T3, T4, TPO antibodies) rather than just TSH?',
      ],
    ],
    [
      ['fibroids', 'fibroid'],
      [
        'What are the non-surgical options for managing fibroids given my symptom severity?',
        'How often should my fibroids be monitored with imaging?',
      ],
    ],
    [
      ['adenomyosis'],
      [
        'What treatment options exist for adenomyosis beyond hysterectomy?',
        'How is adenomyosis definitively diagnosed and differentiated from fibroids?',
      ],
    ],
    [
      ['adrenal', 'cortisol', 'hpa'],
      [
        'Should I have a cortisol rhythm test (salivary or serum) to evaluate adrenal function?',
        'What lifestyle interventions are evidence-based for HPA axis dysregulation?',
      ],
    ],
    [
      ['hormonal imbalance', 'hormone imbalance'],
      [
        'Which specific hormone panel would best capture the imbalance pattern I am experiencing?',
        'At what point in my cycle should hormone levels be drawn for the most accurate results?',
      ],
    ],
  ];

  const conditionText = conditionContext.join(' ').toLowerCase();
  for (const [triggers, qs] of conditionMap) {
    if (triggers.some(t => conditionText.includes(t))) {
      questions.push(...qs);
    }
  }

  // 3. Symptom-specific questions from chips + opening text
  const allSymptomText = [openingText, ...symptomChips].join(' ').toLowerCase();

  const symptomMap: Array<[string[], string]> = [
    [
      ['fatigue', 'tired', 'exhausted', 'low energy'],
      'Have my iron, ferritin, B12, vitamin D, and thyroid levels been checked as potential causes of my fatigue?',
    ],
    [
      ['insomnia', 'sleep', 'waking', 'night sweat'],
      'What hormone or cortisol testing could explain my sleep disruption pattern?',
    ],
    [
      ['mood', 'anxiety', 'depression', 'irritab'],
      'How do estrogen and progesterone fluctuations relate to my mood symptoms, and are there targeted interventions?',
    ],
    [
      ['bloating', 'digestive', 'gut', 'ibs'],
      'Could my digestive symptoms be hormonally driven, and should I be evaluated for a gut-hormone connection?',
    ],
    [
      ['hair loss', 'hair thin', 'hair fall'],
      'Which labs should I order to identify the root cause of my hair loss — ferritin, thyroid, androgens, DHEA?',
    ],
    [
      ['acne', 'breakout', 'skin'],
      'Are my skin symptoms consistent with androgen excess, and what testing or treatments are appropriate?',
    ],
    [
      ['weight gain', 'weight loss', 'weight change', 'metabolism'],
      'Could my weight changes be driven by a hormonal or metabolic issue that warrants further testing?',
    ],
    [
      ['pain', 'cramps', 'pelvic pain', 'painful period'],
      'What imaging or diagnostic workup would help identify the cause of my pain?',
    ],
    [
      ['heavy period', 'heavy bleeding', 'heavy flow'],
      'What is causing my heavy bleeding, and what treatment options preserve my long-term health?',
    ],
    [
      ['brain fog', 'memory', 'concentration', 'cognitive'],
      'Is cognitive fog a recognized hormonal symptom at my life stage, and are there evidence-based interventions?',
    ],
    [
      ['libido', 'sex drive', 'sexual'],
      'What hormonal and non-hormonal options exist to address changes in libido at my life stage?',
    ],
    [
      ['hot flash', 'hot flush', 'flushing'],
      'How do I track and manage vasomotor symptoms, and what are the safest treatment options for me?',
    ],
  ];

  for (const [keywords, question] of symptomMap) {
    if (keywords.some(kw => allSymptomText.includes(kw))) {
      questions.push(question);
    }
  }

  // 4. Follow-up context questions when answers reference treatments or labs
  const answerText = Object.values(followUpAnswers).join(' ').toLowerCase();
  if (TREATMENT_KEYWORDS.some(kw => answerText.includes(kw))) {
    questions.push(
      'Are the treatments or supplements I have been using appropriate for my hormone profile, and could any cause interactions?',
    );
  }
  if (LAB_KEYWORDS.some(kw => answerText.includes(kw))) {
    questions.push(
      'Can we review my recent lab results together and discuss whether any values warrant a targeted treatment change?',
    );
  }

  // Deduplicate and ensure 5–8 questions with universal fallbacks
  const unique = Array.from(new Set(questions));

  const fallbacks = [
    'What is the most important hormone or lab test to order given my complete symptom picture?',
    'Are there any red-flag symptoms I should watch for that would require urgent follow-up?',
    'What would a realistic treatment timeline look like for my primary concerns?',
    'Are there evidence-based lifestyle or dietary changes specifically suited to my condition?',
    'Should I seek a specialist referral, and if so, what type of specialist would be most appropriate?',
  ];

  for (const fallback of fallbacks) {
    if (unique.length >= 5) break;
    if (!unique.includes(fallback)) unique.push(fallback);
  }

  return unique.slice(0, 8);
}

// ─── Section builders ─────────────────────────────────────────────────────────

/**
 * Full first page with Vela branding and a formal legal disclaimer.
 * Ends with pageBreak: 'after' so the clinical brief always starts on page 2.
 */
function buildDisclaimerPage(date: string): Content {
  return {
    stack: [
      // ── Branding block ─────────────────────────────────────────────────────
      {
        canvas: [
          {
            type: 'rect',
            x: 0, y: 0,
            w: 515, h: 100,
            linearGradient: [MAUVE, ROSE_HEADER],
            r: 4,
          } as never,
          {
            type: 'rect',
            x: 0, y: 0,
            w: 180, h: 100,
            linearGradient: [MAUVE_GLOW, MAUVE],
            r: 4,
          } as never,
        ],
        absolutePosition: { x: 40, y: 40 },
      } as Content,
      {
        stack: [
          { text: 'VELA', style: 'appName' },
          {
            text: 'Your personal pre-visit health brief',
            style: 'subtitle',
            margin: [0, 2, 0, 0],
          },
        ],
        margin: [0, 12, 0, 36],
        color: '#FFFFFF',
      } as Content,

      // ── Section heading ─────────────────────────────────────────────────────
      {
        text: 'Important Notice & Medical Disclaimer',
        style: 'disclaimerHeading',
        margin: [0, 0, 0, 16],
      } as Content,

      // ── Bordered disclaimer card ────────────────────────────────────────────
      {
        table: {
          widths: ['*'],
          body: [[
            {
              stack: [
                {
                  text: 'This document is NOT a medical diagnosis.',
                  style: 'disclaimerBoldLine',
                  margin: [0, 0, 0, 10],
                },
                {
                  text: 'This report was generated by Vela, an AI-assisted health summary tool, based solely on symptoms and information you self-reported during your session. It does not constitute a medical diagnosis, clinical evaluation, or medical advice.',
                  style: 'disclaimerBody',
                  margin: [0, 0, 0, 12],
                },
                {
                  columns: [
                    {
                      canvas: [{ type: 'rect', x: 0, y: 3, w: 3, h: 11, color: LAVENDER, r: 1 } as never],
                      width: 10,
                    },
                    {
                      text: 'Generated from self-reported symptoms only — no physical examination or clinical assessment was performed.',
                      style: 'disclaimerBulletText',
                    },
                  ],
                  margin: [0, 0, 0, 6],
                },
                {
                  columns: [
                    {
                      canvas: [{ type: 'rect', x: 0, y: 3, w: 3, h: 11, color: LAVENDER, r: 1 } as never],
                      width: 10,
                    },
                    {
                      text: 'Intended to help you prepare for a conversation with a licensed healthcare provider — not to replace one.',
                      style: 'disclaimerBulletText',
                    },
                  ],
                  margin: [0, 0, 0, 6],
                },
                {
                  columns: [
                    {
                      canvas: [{ type: 'rect', x: 0, y: 3, w: 3, h: 11, color: LAVENDER, r: 1 } as never],
                      width: 10,
                    },
                    {
                      text: 'All AI-generated content is educational in nature and does not substitute for professional medical advice, diagnosis, or treatment.',
                      style: 'disclaimerBulletText',
                    },
                  ],
                  margin: [0, 0, 0, 6],
                },
                {
                  columns: [
                    {
                      canvas: [{ type: 'rect', x: 0, y: 3, w: 3, h: 11, color: LAVENDER, r: 1 } as never],
                      width: 10,
                    },
                    {
                      text: 'Pattern hypotheses and questions in this document are suggestions to explore with your provider — they are not confirmed findings.',
                      style: 'disclaimerBulletText',
                    },
                  ],
                  margin: [0, 0, 0, 14],
                },
                {
                  canvas: [{
                    type: 'line',
                    x1: 0, y1: 0, x2: 455, y2: 0,
                    lineWidth: 0.5, lineColor: DIVIDER,
                  }],
                  margin: [0, 0, 0, 14],
                },
                {
                  text: 'IN CASE OF EMERGENCY',
                  style: 'disclaimerEmergencyLabel',
                  margin: [0, 0, 0, 6],
                },
                {
                  text: 'If you are experiencing a medical emergency, severe chest pain, difficulty breathing, thoughts of self-harm, or any other urgent symptoms — call 911 (US) or your local emergency services immediately. Do not rely on this document in an emergency.',
                  style: 'disclaimerBody',
                  margin: [0, 0, 0, 0],
                },
              ],
              border: [true, true, true, true] as [boolean, boolean, boolean, boolean],
              fillColor: '#FFFBFC',
              margin: [20, 20, 20, 20],
            },
          ]],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => BLUSH_BADGE_BORDER,
          vLineColor: () => BLUSH_BADGE_BORDER,
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 0,
        },
        margin: [0, 0, 0, 28],
      } as Content,

      // ── Session reference line ──────────────────────────────────────────────
      {
        columns: [
          {
            text: [
              { text: 'Document generated: ', style: 'disclaimerMeta' },
              { text: date, style: 'disclaimerMetaBold' },
            ],
          },
          {
            text: 'Confidential — For Patient Use Only',
            style: 'disclaimerMeta',
            alignment: 'right' as const,
          },
        ],
        margin: [0, 0, 0, 0],
      } as Content,

      // ── Page break so clinical brief starts on page 2 ──────────────────────
      { text: '', pageBreak: 'after' } as Content,
    ],
  } as Content;
}

function buildHeaderSection(phases: LifePhase[], date: string): Content {
  return [
    // Gradient header bar: mauve → rose-tinted
    {
      canvas: [
        {
          type: 'rect',
          x: 0, y: 0,
          w: 515, h: 80,
          linearGradient: [MAUVE, ROSE_HEADER],
          r: 4,
        } as never,
        // Soft blush watermark band behind the VELA wordmark (left portion)
        {
          type: 'rect',
          x: 0, y: 0,
          w: 160, h: 80,
          linearGradient: [MAUVE_GLOW, MAUVE],
          r: 4,
        } as never,
      ],
      absolutePosition: { x: 40, y: 40 },
    } as Content,
    {
      columns: [
        {
          stack: [
            { text: 'VELA', style: 'appName' },
            { text: 'Pre-Visit Clinical Brief', style: 'subtitle' },
          ],
          margin: [0, 0, 0, 0],
        },
        {
          stack: [
            { text: date, style: 'dateText', alignment: 'right' as const },
            phases.length > 0
              ? { text: phases.map((p) => PHASE_LABELS[p] ?? p).join(', '), style: 'phaseLabel', alignment: 'right' as const }
              : { text: '', style: 'phaseLabel' },
          ],
          alignment: 'right' as const,
        },
      ],
      margin: [0, 8, 0, 28],
      color: '#FFFFFF',
    } as Content,
    { text: '', margin: [0, 0, 0, 16] } as Content,
  ];
}

function buildSymptomChronology(openingText: string, chips: string[]): Content {
  const rows: Content[][] = [
    [
      { text: 'Symptom / Concern', style: 'tableHeader', fillColor: MAUVE } as Content,
      { text: 'Reported By', style: 'tableHeader', fillColor: MAUVE } as Content,
    ],
  ];

  // Chips first
  for (const chip of chips) {
    rows.push([
      { text: chip, style: 'tableCell' } as Content,
      { text: 'Quick select', style: 'tableCellMuted' } as Content,
    ]);
  }

  // Parse opening text into individual symptom sentences
  if (openingText.trim()) {
    const sentences = openingText
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 8);

    for (const sentence of sentences) {
      rows.push([
        { text: sentence, style: 'tableCell' } as Content,
        { text: 'Written description', style: 'tableCellMuted' } as Content,
      ]);
    }
  }

  if (rows.length === 1) {
    rows.push([
      { text: 'No specific symptoms recorded.', style: 'tableCellMuted', colSpan: 2 } as Content,
      {} as Content,
    ]);
  }

  return [
    sectionTitle('1. Symptom Chronology'),
    {
      table: {
        headerRows: 1,
        widths: ['*', 140],
        body: rows,
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0,
        hLineColor: () => DIVIDER,
        paddingLeft: () => 8,
        paddingRight: () => 8,
        paddingTop: () => 6,
        paddingBottom: () => 6,
      },
      margin: [0, 0, 0, 24],
    } as Content,
  ];
}

/**
 * Render symptom chip strings as a compact tiled badge grid (3 per row).
 */
function buildChipGrid(chips: string[]): Content {
  const chipsPerRow = 3;
  const rows: Content[][] = [];

  for (let i = 0; i < chips.length; i += chipsPerRow) {
    const slice = chips.slice(i, i + chipsPerRow);
    const row: Content[] = slice.map(chip => ({
      text: chip,
      style: 'chipCell',
      fillColor: BLUSH_BADGE,
      margin: [6, 3, 6, 3],
    } as Content));
    while (row.length < chipsPerRow) {
      row.push({ text: '', border: [false, false, false, false] as [boolean, boolean, boolean, boolean] } as Content);
    }
    rows.push(row);
  }

  return {
    table: {
      widths: ['*', '*', '*'],
      body: rows,
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => BLUSH_BADGE_BORDER,
      vLineColor: () => BLUSH_BADGE_BORDER,
      paddingLeft: () => 4,
      paddingRight: () => 4,
      paddingTop: () => 3,
      paddingBottom: () => 3,
    },
    margin: [0, 0, 0, 12],
  } as Content;
}

/**
 * Soft intro section (Section 0) — patient-selected life phases, symptom chips,
 * and opening free-text shown as a quote block.  No clinical analysis here.
 */
function buildPatientOverview(
  phases: LifePhase[],
  symptomChips: string[],
  openingText: string,
): Content {
  const items: Content[] = [sectionTitle('Your Symptom Overview') as Content];

  if (phases.length > 0) {
    const phaseText = phases.map(p => PHASE_LABELS[p] ?? p).join('   ·   ');
    items.push({
      columns: [
        {
          canvas: [{ type: 'rect', x: 0, y: 2, w: 3, h: 12, color: LAVENDER, r: 1 } as never],
          width: 10,
        },
        {
          text: [
            { text: 'Life Phase:  ', style: 'overviewLabel' },
            { text: phaseText, style: 'overviewPhaseText' },
          ],
        },
      ],
      margin: [0, 0, 0, 10],
    } as Content);
  }

  if (symptomChips.length > 0) {
    items.push({
      text: 'Selected Symptoms',
      style: 'overviewLabel',
      margin: [0, 0, 0, 6],
    } as Content);
    items.push(buildChipGrid(symptomChips) as Content);
  }

  if (openingText.trim()) {
    items.push({
      table: {
        widths: [3, '*'],
        body: [[
          {
            text: '',
            fillColor: BLUSH,
            border: [false, false, false, false] as [boolean, boolean, boolean, boolean],
          },
          {
            text: openingText.trim(),
            style: 'overviewQuote',
            border: [false, false, false, false] as [boolean, boolean, boolean, boolean],
            margin: [10, 0, 0, 0],
          },
        ]],
      },
      layout: {
        paddingLeft: () => 0,
        paddingRight: () => 0,
        paddingTop: () => 8,
        paddingBottom: () => 8,
      },
      margin: [0, 6, 0, 0],
    } as Content);
  }

  items.push({ text: '', margin: [0, 0, 0, 16] } as Content);
  return items as Content;
}

function buildPatternHypotheses(assistantMessages: string[]): Content {
  const { hypotheses, whatItMeans } = extractHypotheses(assistantMessages);
  const hasContent = hypotheses.length > 0 || whatItMeans.length > 0;

  if (!hasContent) {
    return [
      sectionTitle('5. Pattern Hypotheses'),
      {
        text: 'Insufficient conversation data to generate hypotheses.',
        style: 'muted',
        margin: [0, 0, 0, 24],
      } as Content,
    ];
  }

  const items: Content[] = [];

  if (hypotheses.length > 0) {
    items.push(...hypotheses.map(h => bulletItem(h)));
  }

  if (whatItMeans.length > 0) {
    items.push({
      text: 'What This Means for You',
      style: 'subSectionLabel',
      margin: [0, 10, 0, 5],
    } as Content);
    items.push(...whatItMeans.map(w => bulletItem(w)));
  }

  return [
    sectionTitle('5. Pattern Hypotheses'),
    { stack: items, margin: [0, 0, 0, 24] } as Content,
  ];
}

function buildFlaggedAnomalies(allText: string[]): Content {
  const anomalies = extractAnomalySentences(allText);

  if (anomalies.length === 0) return { text: '', margin: [0, 0, 0, 0] } as Content;

  return [
    sectionTitle('4. Flagged Anomalies & Lab References'),
    {
      stack: anomalies.map(a => bulletItem(a)),
      margin: [0, 0, 0, 24],
    } as Content,
  ];
}

function buildPatientQuestions(session: SessionData): Content {
  const questions = generateProviderQuestions(session);

  return [
    sectionTitle('3. Questions to Bring Your Provider'),
    {
      text: 'The following questions were generated based on your symptoms and conversation:',
      style: 'bodyText',
      margin: [0, 0, 0, 8],
    } as Content,
    {
      stack: questions.map(q => questionBadge(q)),
      margin: [0, 0, 0, 24],
    } as Content,
  ];
}

function buildWhatSheTried(
  userMessages: string[],
  followUpAnswers: Record<string, string>,
): Content {
  // Primary source: follow-up Q&A where keys are the question text
  const qaEntries = Object.entries(followUpAnswers).filter(([, v]) => v.trim());

  // Secondary source: tried-treatment sentences from free-text user messages not already
  // covered by a follow-up answer
  const triedSentences = extractTriedSentences(userMessages);
  const coveredAnswers = new Set(qaEntries.map(([, v]) => v.trim()));
  const extraTried = triedSentences.filter(s => !coveredAnswers.has(s)).slice(0, 4);

  if (qaEntries.length === 0 && extraTried.length === 0) {
    return [
      sectionTitle('2. What She Has Already Tried'),
      {
        text: 'No prior interventions or treatments reported in this session.',
        style: 'muted',
        margin: [0, 0, 0, 24],
      } as Content,
    ];
  }

  const rows: Content[][] = [];

  // Q&A rows: italic question | plain answer
  for (const [question, answer] of qaEntries) {
    rows.push([
      { text: question, style: 'tableCell', italics: true } as Content,
      { text: answer, style: 'tableCell' } as Content,
    ]);
  }

  // Extra tried sentences span both columns
  for (const sentence of extraTried) {
    rows.push([
      { text: sentence, style: 'tableCell', colSpan: 2 } as Content,
      {} as Content,
    ]);
  }

  return [
    sectionTitle('2. What She Has Already Tried'),
    {
      table: {
        headerRows: 0,
        widths: ['40%', '60%'],
        body: rows,
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0,
        hLineColor: () => DIVIDER,
        paddingLeft: () => 8,
        paddingRight: () => 8,
        paddingTop: () => 6,
        paddingBottom: () => 6,
        fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? CHAMPAGNE : '#FFFFFF'),
      },
      margin: [0, 0, 0, 24],
    } as Content,
  ];
}

// ─── Primitive helpers ─────────────────────────────────────────────────────────

function sectionTitle(text: string): Content {
  return {
    stack: [
      // Section header with lavender left-border accent
      {
        columns: [
          {
            canvas: [
              { type: 'rect', x: 0, y: 1, w: 3, h: 18, color: LAVENDER, r: 1 } as never,
            ],
            width: 10,
          },
          { text, style: 'sectionHeader' },
        ],
        margin: [0, 8, 0, 0],
      },
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: LAVENDER }],
        margin: [0, 4, 0, 10],
      },
    ],
  } as Content;
}

function bulletItem(text: string): Content {
  return {
    columns: [
      { text: '•', style: 'bullet', width: 12 },
      { text, style: 'bodyText' },
    ],
    margin: [0, 0, 0, 5],
  } as Content;
}

/** Rose-tinted badge for provider question items */
function questionBadge(text: string): Content {
  return {
    table: {
      widths: ['*'],
      body: [
        [
          {
            text,
            style: 'bodyText',
            fillColor: BLUSH_BADGE,
            border: [false, false, false, false] as [boolean, boolean, boolean, boolean],
            margin: [10, 6, 10, 6],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => BLUSH_BADGE_BORDER,
      vLineColor: () => BLUSH_BADGE_BORDER,
    },
    margin: [0, 0, 0, 4],
  } as Content;
}

// ─── Main builder ──────────────────────────────────────────────────────────────

export function buildClinicalDocument(session: SessionData): TDocumentDefinitions {
  const {
    conversationHistory,
    phases,
    symptomChips,
    openingText,
    followUpAnswers,
  } = session;

  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const assistantMessages = getAssistantMessages(conversationHistory);
  const userMessages = getUserMessages(conversationHistory);
  const allText = [
    openingText,
    ...userMessages,
    ...assistantMessages,
    ...Object.values(followUpAnswers),
  ].filter(Boolean);

  const content: Content[] = [
    buildDisclaimerPage(date) as Content,
    buildHeaderSection(phases, date) as Content,
    buildPatientOverview(phases, symptomChips, openingText) as Content,
    buildSymptomChronology(openingText, symptomChips) as Content,
    buildWhatSheTried(userMessages, followUpAnswers) as Content,
    buildPatientQuestions(session) as Content,
    buildFlaggedAnomalies(allText) as Content,
    buildPatternHypotheses(assistantMessages) as Content,
  ];

  return {
    content,
    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
      color: BODY_TEXT,
      lineHeight: 1.4,
    },
    styles: {
      appName: {
        fontSize: 22,
        bold: true,
        color: '#FFFFFF',
        characterSpacing: 3,
        margin: [0, 8, 0, 2],
      },
      subtitle: {
        fontSize: 10,
        color: BLUSH,
        margin: [0, 0, 0, 0],
      },
      dateText: {
        fontSize: 9,
        color: BLUSH,
        margin: [0, 8, 0, 2],
      },
      phaseLabel: {
        fontSize: 9,
        bold: true,
        color: LAVENDER,
      },
      sectionHeader: {
        fontSize: 13,
        bold: true,
        color: MAUVE_LIGHT,
        margin: [0, 0, 0, 0],
      },
      tableHeader: {
        fontSize: 9,
        bold: true,
        color: '#FFFFFF',
        margin: [0, 2, 0, 2],
      },
      tableCell: {
        fontSize: 9,
        color: BODY_TEXT,
        margin: [0, 1, 0, 1],
      },
      tableCellMuted: {
        fontSize: 9,
        color: MUTED,
        italics: true,
        margin: [0, 1, 0, 1],
      },
      bodyText: {
        fontSize: 10,
        color: BODY_TEXT,
        margin: [0, 0, 0, 0],
      },
      muted: {
        fontSize: 9,
        color: MUTED,
        italics: true,
      },
      bullet: {
        fontSize: 12,
        color: LAVENDER,
        bold: true,
      },
      overviewLabel: {
        fontSize: 9,
        bold: true,
        color: MUTED,
        characterSpacing: 0.5,
      },
      overviewPhaseText: {
        fontSize: 10,
        color: MAUVE_LIGHT,
        bold: true,
      },
      overviewQuote: {
        fontSize: 10,
        color: BODY_TEXT,
        italics: true,
        lineHeight: 1.5,
      },
      chipCell: {
        fontSize: 9,
        color: MAUVE_LIGHT,
        alignment: 'center' as const,
      },
      subSectionLabel: {
        fontSize: 10,
        bold: true,
        color: MAUVE_LIGHT,
        italics: true,
      },
      disclaimerHeading: {
        fontSize: 16,
        bold: true,
        color: MAUVE_LIGHT,
      },
      disclaimerBoldLine: {
        fontSize: 11,
        bold: true,
        color: ROSE_HEADER,
      },
      disclaimerBody: {
        fontSize: 10,
        color: BODY_TEXT,
        lineHeight: 1.5,
      },
      disclaimerBulletText: {
        fontSize: 10,
        color: BODY_TEXT,
        lineHeight: 1.4,
      },
      disclaimerEmergencyLabel: {
        fontSize: 9,
        bold: true,
        color: ROSE_HEADER,
        characterSpacing: 1,
      },
      disclaimerMeta: {
        fontSize: 8,
        color: MUTED,
        italics: true,
      },
      disclaimerMetaBold: {
        fontSize: 8,
        color: MUTED,
        bold: true,
        italics: false,
      },
    },
    pageSize: 'LETTER',
    pageMargins: [40, 40, 40, 60] as [number, number, number, number],
    footer: (currentPage: number, pageCount: number): Content => ({
      stack: [
        {
          canvas: [
            {
              type: 'line',
              x1: 40, y1: 0,
              x2: 572, y2: 0,
              lineWidth: 0.5,
              lineColor: DIVIDER,
            },
          ],
        },
        {
          columns: [
            {
              text: 'VELA — Pre-Visit Clinical Brief  |  Confidential & For Patient Use Only',
              fontSize: 7,
              color: MUTED,
              margin: [40, 5, 0, 0],
            },
            {
              text: `Page ${currentPage} of ${pageCount}`,
              fontSize: 7,
              color: MUTED,
              alignment: 'right' as const,
              margin: [0, 5, 40, 0],
            },
          ],
        },
        {
          text: 'Not a medical diagnosis — generated from patient-reported symptoms. Share with your licensed healthcare provider.',
          fontSize: 6.5,
          color: MUTED,
          alignment: 'center' as const,
          margin: [40, 3, 40, 0],
          italics: true,
        },
      ],
      margin: [0, 8, 0, 0],
    }),
  };
}
