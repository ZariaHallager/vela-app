export type Role = 'user' | 'assistant' | 'system';

export interface Message {
  role: Role;
  content: string;
}

export type LifePhase =
  | 'cycling'
  | 'perimenopause'
  | 'menopause'
  | 'postmenopause'
  | 'postpartum'
  | 'pregnancy'
  | 'irregular'
  | 'heavy'
  | 'light'
  | 'spotting'
  | 'cramps'
  | 'bloating'
  | 'fatigue'
  | 'mood_swings'
  | 'sleep_issues'
  | 'sex_drive'
  | 'fertility'
  | 'gut_health'
  | 'mental_health'
  | 'thyroid'
  | 'pcos'
  | 'hormonal_imbalance'
  | 'estrogen_dominance'
  | 'thyroid_disruption';

export type Step =
  | 'opening'
  | 'reflection'
  | 'phase'
  | 'insight'
  | 'conditionContext'
  | 'followup'
  | 'pdf'
  | 'destroyed';

export interface SessionData {
  conversationHistory: Message[];
  phases: LifePhase[];
  symptomChips: string[];
  openingText: string;
  followUpAnswers: Record<string, string>;
  followUpQuestions: string[];
  turnCount: number;
  conditionContext: string[];
}

export interface PDFRequestBody {
  session: SessionData;
}

export interface ChatRequestBody {
  messages: Message[];
  sessionTurn: number;
  step: Step;
  phases?: LifePhase[];
  symptomChips?: string[];
  conditionContext?: string[];
}
