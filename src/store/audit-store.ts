/**
 * Zustand store — In-progress audit state
 *
 * Tracks the auditor's current property selection, template, step
 * position, and per-question responses. State is persisted to
 * sessionStorage so progress survives accidental page refreshes.
 *
 * File objects (image attachments) are intentionally excluded from
 * persistence because they cannot be serialised to JSON.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** A single question's response data */
export interface QuestionResponse {
  questionId: string;
  score: number;
  notes: string;
  imageUrl: string | null;
  imageFile: File | null;
}

/** Full store shape — state + actions */
interface AuditState {
  /* ---- Audit metadata ---- */
  propertyId: string | null;
  templateId: string | null;
  currentStep: number;
  totalSteps: number;

  /* ---- Responses keyed by question ID ---- */
  responses: Record<string, QuestionResponse>;

  /* ---- Actions ---- */
  setProperty: (propertyId: string) => void;
  setTemplate: (templateId: string) => void;
  setCurrentStep: (step: number) => void;
  setTotalSteps: (steps: number) => void;
  setResponse: (questionId: string, response: Partial<QuestionResponse>) => void;
  getResponse: (questionId: string) => QuestionResponse;
  reset: () => void;
}

/* ------------------------------------------------------------------ */
/*  Defaults                                                           */
/* ------------------------------------------------------------------ */

const defaultResponse: QuestionResponse = {
  questionId: '',
  score: 0,
  notes: '',
  imageUrl: null,
  imageFile: null,
};

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

export const useAuditStore = create<AuditState>()(
  persist(
    (set, get) => ({
      propertyId: null,
      templateId: null,
      currentStep: 0,
      totalSteps: 0,
      responses: {},

      /* ---- Setters ---- */

      setProperty: (propertyId) => set({ propertyId }),

      setTemplate: (templateId) => set({ templateId }),

      setCurrentStep: (step) => set({ currentStep: step }),

      setTotalSteps: (steps) => set({ totalSteps: steps }),

      setResponse: (questionId, partial) =>
        set((state) => ({
          responses: {
            ...state.responses,
            [questionId]: {
              ...defaultResponse,
              ...state.responses[questionId],
              ...partial,
              questionId,
            },
          },
        })),

      getResponse: (questionId) => {
        const state = get();
        return state.responses[questionId] || { ...defaultResponse, questionId };
      },

      /* ---- Reset ---- */

      reset: () =>
        set({
          propertyId: null,
          templateId: null,
          currentStep: 0,
          totalSteps: 0,
          responses: {},
        }),
    }),
    {
      name: 'ilh-audit-store',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        propertyId: state.propertyId,
        templateId: state.templateId,
        currentStep: state.currentStep,
        totalSteps: state.totalSteps,
        /*
         * Strip File objects from responses before serialising —
         * File instances cannot survive JSON round-trips.
         */
        responses: Object.fromEntries(
          Object.entries(state.responses).map(([key, val]) => [
            key,
            { ...val, imageFile: null },
          ])
        ),
      }),
    }
  )
);
