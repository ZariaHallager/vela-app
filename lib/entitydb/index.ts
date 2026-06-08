import { create } from 'zustand';
import type { LifePhase, Message, SessionData } from '@/lib/types';

interface SessionState extends SessionData {
  addMessage: (m: Message) => void;
  setPhases: (p: LifePhase[]) => void;
  setOpeningText: (text: string) => void;
  setSymptomChips: (chips: string[]) => void;
  setConditionContext: (items: string[]) => void;
  setFollowUpAnswer: (questionId: string, answer: string) => void;
  setFollowUpQuestions: (questions: string[]) => void;
  incrementTurn: () => void;
  destroy: () => void;
}

const initialState: SessionData = {
  conversationHistory: [],
  phases: [],
  symptomChips: [],
  openingText: '',
  followUpAnswers: {},
  followUpQuestions: [],
  turnCount: 0,
  conditionContext: [],
};

export const useSessionStore = create<SessionState>((set) => ({
  ...initialState,

  addMessage: (m) =>
    set((state) => ({
      conversationHistory: [...state.conversationHistory, m],
    })),

  setPhases: (p) => set({ phases: p }),

  setOpeningText: (text) => set({ openingText: text }),

  setSymptomChips: (chips) => set({ symptomChips: chips }),

  setConditionContext: (items) => set({ conditionContext: items }),

  setFollowUpAnswer: (questionId, answer) =>
    set((state) => ({
      followUpAnswers: { ...state.followUpAnswers, [questionId]: answer },
    })),

  setFollowUpQuestions: (questions) => set({ followUpQuestions: questions }),

  incrementTurn: () =>
    set((state) => ({ turnCount: state.turnCount + 1 })),

  destroy: () => set({ ...initialState }),
}));
