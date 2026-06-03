/**
 * ZUSTAND AUDIT STORE — src/store/audit-store.ts
 * ============================================================
 *
 * WHAT THIS FILE DOES:
 * This is the client-side state management store for an in-progress
 * audit. It tracks everything about the audit the inspector is currently
 * conducting: which property they're inspecting, which step they're on,
 * and every score/note/photo they've entered for each question.
 *
 * WHY IT MATTERS FOR ILH:
 * Field auditors conduct inspections at remote property sites where
 * network connectivity can be unreliable. If an auditor accidentally
 * refreshes the browser, loses their tab, or navigates away to check
 * historical logs mid-audit, they would lose ALL their progress without
 * this store. By persisting the audit draft to the browser's
 * sessionStorage, we guarantee that their work is preserved through:
 *   - Accidental page refreshes
 *   - Brief network drops
 *   - Navigating to other pages (e.g., checking the CAP board)
 *   - Browser back/forward navigation
 *
 * IMPORTANT LIMITATION:
 * sessionStorage is tab-scoped. If the auditor opens a new tab, they
 * start fresh. If they close the tab entirely, the draft is lost.
 * This is intentional — we don't want old audit drafts lingering in
 * localStorage across sessions and potentially contaminating future audits.
 *
 * FOR DEVELOPERS:
 * - This uses Zustand (https://zustand.docs.pmnd.rs/) with the `persist`
 *   middleware to auto-save state to sessionStorage.
 * - File objects (image attachments) CANNOT be serialized to JSON. They
 *   are stripped out during persistence. The actual image files are
 *   uploaded directly to Supabase Storage, and only the public URL
 *   is persisted in the store.
 * - Call `reset()` when cancelling or submitting an audit to clear
 *   stale data and prevent state contamination in subsequent audits.
 * ============================================================
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/**
 * QuestionResponse — The auditor's answer to a single checklist question.
 *
 * Each question in the audit form generates one of these objects. It captures:
 *   - questionId: Links this response to the specific audit_questions row
 *   - score: The compliance score (0 to 5). Scores ≤ 2 trigger a CAP item.
 *   - notes: Free-text observations (e.g., "Earthing certificate expired 3 months ago")
 *   - imageUrl: Public URL of uploaded photo evidence (stored in Supabase Storage)
 *   - imageFile: The raw File object from the device camera (NOT persisted to JSON)
 */
export interface QuestionResponse {
  questionId: string;
  score: number;
  notes: string;
  imageUrl: string | null;
  imageFile: File | null;
}

/**
 * AuditState — The full shape of the Zustand store (state + actions).
 *
 * STATE FIELDS:
 *   - propertyId: The selected ILH property being inspected (e.g., "ILH Pune")
 *   - templateId: Which audit template is being used (currently only one exists)
 *   - currentStep: The wizard step index (0 = property selection, 1-N = categories, N+1 = review)
 *   - totalSteps: Total number of wizard steps (dynamically calculated from category count)
 *   - responses: A dictionary mapping question IDs to the auditor's answers
 *
 * ACTION METHODS:
 *   - setProperty, setTemplate, setCurrentStep, setTotalSteps: Simple state setters
 *   - setResponse: Merges a partial update into an existing question response
 *   - getResponse: Retrieves a response (or a default blank one) for a question
 *   - reset: Clears ALL state — called after submission or cancellation
 */
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

/** Default response for any question that hasn't been answered yet.
 *  Score starts at 0 (worst case) — this is intentional so that
 *  unanswered questions count as failures in the overall score,
 *  incentivizing auditors to answer every question. */
const defaultResponse: QuestionResponse = {
  questionId: '',
  score: 0,
  notes: '',
  imageUrl: null,
  imageFile: null,
};

/* ------------------------------------------------------------------ */
/*  Store Implementation                                               */
/* ------------------------------------------------------------------ */

/**
 * useAuditStore — The main Zustand hook used by all audit-related components.
 *
 * USAGE EXAMPLE:
 *   const { propertyId, setProperty, responses, setResponse } = useAuditStore();
 *
 * PERSISTENCE:
 * The `persist` middleware automatically saves state to sessionStorage
 * under the key "ilh-audit-store" after every state change. When the
 * component mounts, it rehydrates from sessionStorage, restoring the
 * auditor's progress. This happens transparently — the components
 * don't need to know about persistence at all.
 *
 * The `partialize` function controls WHAT gets persisted. We strip out
 * `imageFile` (File objects) because they contain binary data that
 * cannot survive a JSON.stringify → JSON.parse round-trip. The actual
 * image files are uploaded to Supabase Storage immediately when the
 * auditor takes a photo, and the resulting public URL (`imageUrl`)
 * IS persisted.
 */
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

      /**
       * setResponse — Merge a partial update into an existing question response.
       *
       * This is called every time the auditor:
       *   - Taps a score button (e.g., setResponse(qId, { score: 4 }))
       *   - Types a note  (e.g., setResponse(qId, { notes: "..." }))
       *   - Uploads a photo (e.g., setResponse(qId, { imageUrl: "https://..." }))
       *
       * The merge strategy preserves existing fields. For example, if the
       * auditor first sets a score and then adds a note, the score is preserved.
       */
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

      /* ---- Reset ----
       * Called when:
       *   1. The auditor cancels an in-progress audit ("Cancel Audit" button)
       *   2. The audit is successfully submitted to the database
       *
       * This clears ALL cached state from both Zustand and sessionStorage,
       * preventing stale draft data from contaminating the next audit.
       * Without this, starting a new audit could show scores from the
       * previous property — a critical data integrity issue. */

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
      name: 'ilh-audit-store',         // sessionStorage key
      storage: createJSONStorage(() => sessionStorage),

      /**
       * partialize — Controls which parts of the state are persisted.
       *
       * WHY WE STRIP imageFile:
       * The browser's File API creates objects with binary data handles
       * that cannot be serialized to JSON. If we tried to persist them,
       * they would become `{}` (empty objects) after rehydration, causing
       * "image loaded" indicators to show for nonexistent files.
       *
       * Instead, images are uploaded to Supabase Storage immediately,
       * and only the public URL string (imageUrl) is persisted.
       */
      partialize: (state) => ({
        propertyId: state.propertyId,
        templateId: state.templateId,
        currentStep: state.currentStep,
        totalSteps: state.totalSteps,
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
