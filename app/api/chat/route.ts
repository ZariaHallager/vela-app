import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/lib/ai';
import { checkRateLimit } from '@/lib/ratelimit';
import type { ChatRequestBody, Message, LifePhase, Step } from '@/lib/types';

const MAX_SESSION_TURNS = 10;
const TOKEN_COMPRESS_THRESHOLD = 80_000;
const COMPRESS_KEEP_MESSAGES = 6;

function estimateTokens(messages: Message[]): number {
  const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
  return Math.ceil(totalChars / 4);
}

function compressHistory(systemPrompt: string, history: Message[]): Message[] {
  const system: Message = { role: 'system', content: systemPrompt };
  const recent = history.slice(-COMPRESS_KEEP_MESSAGES);
  return [system, ...recent];
}

function buildSystemPrompt(
  step: Step,
  phases: LifePhase[] | null | undefined,
  symptomChips?: string[],
  conditionContext?: string[],
): string {
  const chipSummary =
    symptomChips && symptomChips.length > 0
      ? `The user selected these specific symptoms: ${symptomChips.join(', ')}.`
      : '';

  const conditionSummary =
    conditionContext && conditionContext.length > 0
      ? `The user identified these condition areas as resonating with them: ${conditionContext.join(', ')}.`
      : '';

  const personalizationContext = [chipSummary, conditionSummary].filter(Boolean).join(' ');

  switch (step) {
    case 'reflection':
      return `You are a warm, empathetic women's health companion. The user has just shared their symptoms with you.
Your job is to provide a personal, non-clinical reflection that makes them feel heard and understood.
- Reference the EXACT symptoms and words the user mentioned.
- Use warm, conversational language — never medical jargon.
- Validate their experience without diagnosing.
- Keep your response to 3-4 sentences.
- End with gentle encouragement that you'll help them explore this further.`;

    case 'phase': {
      const phaseLabel = phases && phases.length > 0 ? phasesDisplayName(phases) : 'their life phase';
      const conditionAwareness =
        conditionContext && conditionContext.length > 0
          ? `\n- The user has flagged these condition areas as relevant: ${conditionContext.join(', ')}. Include at least one question directly relevant to each major condition area mentioned.`
          : '';
      return `You are a knowledgeable women's health companion helping someone who selected: ${phaseLabel}.
${personalizationContext}

Generate exactly 3 to 5 thoughtful follow-up questions that will help build a clearer clinical picture.
- Questions must be specific to the selected phases/symptoms and the exact condition areas described above.
- REQUIRED: Include 1 to 2 questions about mental and emotional wellbeing — specifically covering mood patterns, anxiety levels, sleep quality, or emotional health. These are clinically essential.
- Also focus on: onset and duration, frequency and patterns, severity and impact on daily life, relevant labs or cycle data, and what has already been tried.${conditionAwareness}
- Return ONLY a valid JSON array of question strings, with no additional text, markdown, or explanation.
Example format: ["Question one?", "Question two?", "Question three?"]`;
    }

    case 'insight': {
      const phaseLabel = phases && phases.length > 0 ? phasesDisplayName(phases) : 'their life phase';
      const conditionPatternGuidance =
        conditionContext && conditionContext.length > 0
          ? `\nThe user has identified the following condition areas: ${conditionContext.join(', ')}. Where the symptom pattern aligns with PCOS, endometriosis, ovarian cysts, or thyroid dysfunction, name that hormonal pattern type clearly and explain why the symptoms point to it. You are not diagnosing — you are helping her recognize patterns to discuss with her provider.`
          : `\nWhere the symptom cluster strongly suggests PCOS, endometriosis, ovarian cysts, or thyroid dysfunction, name that hormonal pattern type clearly and explain what features point to it. You are not diagnosing — you are helping her recognize patterns worth discussing with her provider.`;
      return `You are a clinical women's health specialist writing a structured insight for a patient with the following profile: ${phaseLabel}.
${personalizationContext}
${conditionPatternGuidance}

Based on the full conversation, provide a personalized clinical insight with two clear sections:

**Pattern Hypothesis**
Identify the most likely hormonal, metabolic, or physiological patterns behind the symptoms. Use accessible clinical terminology. Be specific and reference the exact symptoms and condition areas described. Do not shy away from naming recognizable hormonal pattern types (e.g. androgen excess, estrogen dominance, HPA axis dysregulation, thyroid disruption) when the evidence supports it.

**What This Means for You**
Translate the clinical patterns into practical meaning for this person. What is her body likely trying to communicate? What should she pay attention to? If any condition areas she flagged (PCOS, endometriosis, thyroid, etc.) align with the symptom picture, speak directly to that connection. Keep it warm, specific, and empowering.

Do NOT provide a diagnosis. Do NOT prescribe treatments. This is an educational overview to help her have better conversations with her healthcare provider.`;
    }

    case 'followup': {
      const phaseLabel = phases && phases.length > 0 ? phasesDisplayName(phases) : 'their life phase';
      return `You are a thorough women's health companion conducting a structured intake for someone in the ${phaseLabel} phase.
${personalizationContext}

Ask exactly ONE follow-up question at a time. Focus on gathering clinical detail:
- Onset and duration of symptoms
- Frequency and cyclical patterns
- Severity and impact on daily functioning
- Relevant lab results or cycle tracking data
- Treatments, supplements, or lifestyle changes already tried
- Mental and emotional wellbeing — mood, anxiety, sleep quality, emotional health

Ask questions that would help a healthcare provider understand the full picture. Be warm, direct, and specific. Never ask multiple questions in one turn.`;
    }

    default:
      return `You are a compassionate women's health companion. Be warm, clear, and helpful. Do not diagnose or prescribe.`;
  }
}

const PHASE_DISPLAY_NAMES: Record<LifePhase, string> = {
  cycling: 'reproductive cycling',
  perimenopause: 'perimenopause',
  menopause: 'menopause',
  postmenopause: 'post-menopause',
  postpartum: 'postpartum',
  pregnancy: 'pregnancy',
  irregular: 'irregular cycles',
  heavy: 'heavy periods',
  light: 'light periods',
  spotting: 'spotting',
  cramps: 'cramps',
  bloating: 'bloating',
  fatigue: 'fatigue',
  mood_swings: 'mood swings',
  sleep_issues: 'sleep issues',
  sex_drive: 'changes in sex drive',
  fertility: 'fertility concerns',
  gut_health: 'gut health issues',
  mental_health: 'mental health concerns',
  thyroid: 'thyroid symptoms',
  pcos: 'PCOS',
  hormonal_imbalance: 'hormonal imbalance',
  estrogen_dominance: 'estrogen dominance',
  thyroid_disruption: 'thyroid disruption',
};

function phasesDisplayName(phases: LifePhase[]): string {
  return phases.map((p) => PHASE_DISPLAY_NAMES[p] ?? p).join(', ');
}

export async function POST(req: NextRequest) {
  // --- IP extraction ---
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

  // --- Rate limit check ---
  const limitResult = checkRateLimit(ip);
  if (!limitResult.allowed) {
    console.error(`[chat] Rate limit exceeded for IP ${ip}. Reset at ${new Date(limitResult.resetAt).toISOString()}`);
    return NextResponse.json(
      { error: 'rate_limit_exceeded', message: 'You have reached the request limit. Please try again tomorrow.', resetAt: limitResult.resetAt },
      { status: 429 }
    );
  }

  // --- Parse body ---
  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body', message: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const { messages, sessionTurn, step, phases, symptomChips, conditionContext } = body;

  // --- Session turn guard (server-side redundant enforcement) ---
  if (typeof sessionTurn === 'number' && sessionTurn > MAX_SESSION_TURNS) {
    console.error(`[chat] Session turn limit exceeded (turn ${sessionTurn}) for IP ${ip}`);
    return NextResponse.json(
      { error: 'session_turn_limit', message: 'Session turn limit reached. Please generate your report.' },
      { status: 429 }
    );
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'invalid_messages', message: 'messages must be a non-empty array.' }, { status: 400 });
  }

  // --- Build system prompt ---
  const systemPrompt = buildSystemPrompt(step, phases, symptomChips, conditionContext);

  // --- Token estimation + history compression ---
  const fullMessages: Message[] = [{ role: 'system', content: systemPrompt }, ...messages];
  let finalMessages: Message[];

  const estimatedTokens = estimateTokens(fullMessages);
  if (estimatedTokens > TOKEN_COMPRESS_THRESHOLD) {
    finalMessages = compressHistory(systemPrompt, messages);
  } else {
    finalMessages = fullMessages;
  }

  // --- Stream response ---
  try {
    const model = process.env.AI_MODEL_ID ?? 'gemini-2.0-flash-lite-001';
    const stream = await ai.chat.completions.create({
      model,
      messages: finalMessages as Parameters<typeof ai.chat.completions.create>[0]['messages'],
      stream: true,
    });

    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
              controller.enqueue(encoder.encode(delta));
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-RateLimit-Remaining': String(limitResult.remaining),
        'X-RateLimit-Reset': String(limitResult.resetAt),
      },
    });
  } catch (err) {
    console.error('[chat] Upstream AI error:', err);
    return NextResponse.json(
      { error: 'upstream_error', message: 'Failed to reach the AI service. Please try again.' },
      { status: 502 }
    );
  }
}
