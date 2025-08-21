import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { aiTeachingService, TeachingHint, TeachingRequest, TeachingResponse } from '../services/aiTeachingService';
import { aiAnalyticsService, AnalyticsRequest, AnalyticsResponse, PuzzleAnalysis } from '../services/aiAnalyticsService';

export interface AICoachingPreferences {
  userLevel: 'beginner' | 'intermediate' | 'expert';
  coachingMode: 'step-by-step' | 'occasional-hints' | 'minimal-hints';
  enableTooltips: boolean;
  showHodokuReferences: boolean;
  autoAnalyzePuzzles: boolean;
}

export interface CoachingSession {
  id: string;
  puzzleId: string;
  sessionType: 'teaching' | 'analytics' | 'combined';
  hints: TeachingHint[];
  analysis?: PuzzleAnalysis;
  currentStep: number;
  totalSteps: number;
  createdAt: Date;
  lastUpdated: Date;
}

export interface AICoachingStore {
  // User Preferences
  preferences: AICoachingPreferences;
  
  // Current Session
  currentSession: CoachingSession | null;
  
  // Session History
  sessionHistory: CoachingSession[];
  
  // Loading States
  isLoading: boolean;
  isGeneratingHint: boolean;
  isAnalyzing: boolean;
  
  // Actions
  updatePreferences: (preferences: Partial<AICoachingPreferences>) => void;
  startCoachingSession: (puzzleId: string, sessionType: 'teaching' | 'analytics' | 'combined') => void;
  endCoachingSession: () => void;
  getHint: (request: TeachingRequest) => Promise<TeachingResponse>;
  analyzePuzzle: (request: AnalyticsRequest) => Promise<AnalyticsResponse>;
  getStepByStepGuidance: (puzzle: number[][], currentState: number[][]) => Promise<TeachingResponse[]>;
  explainTechnique: (technique: string) => Promise<TeachingResponse>;
  saveSessionToHistory: () => void;
  loadSessionFromHistory: (sessionId: string) => void;
  clearHistory: () => void;
}

const defaultPreferences: AICoachingPreferences = {
  userLevel: 'intermediate',
  coachingMode: 'occasional-hints',
  enableTooltips: true,
  showHodokuReferences: true,
  autoAnalyzePuzzles: true,
};

export const useAICoachingStore = create<AICoachingStore>()(
  persist(
    (set, get) => ({
      // Initial state
      preferences: defaultPreferences,
      currentSession: null,
      sessionHistory: [],
      isLoading: false,
      isGeneratingHint: false,
      isAnalyzing: false,

      // Actions
      updatePreferences: (newPreferences: Partial<AICoachingPreferences>) => {
        set((state) => ({
          preferences: { ...state.preferences, ...newPreferences }
        }));
      },

      startCoachingSession: (puzzleId: string, sessionType: 'teaching' | 'analytics' | 'combined') => {
        const session: CoachingSession = {
          id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
          puzzleId,
          sessionType,
          hints: [],
          currentStep: 0,
          totalSteps: 0,
          createdAt: new Date(),
          lastUpdated: new Date(),
        };

        set({ currentSession: session });
      },

      endCoachingSession: () => {
        const { currentSession } = get();
        if (currentSession) {
          set((state) => ({
            sessionHistory: [...state.sessionHistory, currentSession],
            currentSession: null
          }));
        }
      },

      getHint: async (request: TeachingRequest): Promise<TeachingResponse> => {
        set({ isGeneratingHint: true });
        
        try {
          const response = await aiTeachingService.getHint({
            ...request,
            userLevel: get().preferences.userLevel
          });

          // Update current session with new hint
          set((state) => ({
            currentSession: state.currentSession ? {
              ...state.currentSession,
              hints: [...state.currentSession.hints, response.hint],
              lastUpdated: new Date()
            } : null
          }));

          return response;
        } catch (error) {
          console.error('Error getting hint:', error);
          
          // Create a fallback hint response for better user experience
          const fallbackResponse: TeachingResponse = {
            hint: {
              id: Math.random().toString(36).substr(2, 9),
              type: 'strategy',
              message: `🔍 **Fallback Hint:** Since AI coaching is unavailable, here's a systematic approach:

1. **Scan for Naked Singles**: Look for cells that can only contain one number
2. **Find Hidden Singles**: Check if a number can only go in one place in a row/column/box
3. **Look for Pairs**: Find two cells in a row/column/box that can only contain the same two numbers
4. **Check Box-Line Interactions**: See if numbers in a box eliminate possibilities in rows/columns

Start by looking at row 1 - can you find any cells where only one number can fit?`,
              difficulty: get().preferences.userLevel
            },
            explanation: "AI coaching service temporarily unavailable - using fallback hints",
            relatedTechniques: ['naked-single', 'hidden-single', 'naked-pair', 'box-line-reduction']
          };
          
          return fallbackResponse;
        } finally {
          set({ isGeneratingHint: false });
        }
      },

      analyzePuzzle: async (request: AnalyticsRequest): Promise<AnalyticsResponse> => {
        set({ isAnalyzing: true });
        
        try {
          const response = await aiAnalyticsService.analyzePuzzle(request);

          // Update current session with analysis
          set((state) => ({
            currentSession: state.currentSession ? {
              ...state.currentSession,
              analysis: response.analysis,
              lastUpdated: new Date()
            } : null
          }));

          return response;
        } catch (error) {
          console.error('Error analyzing puzzle:', error);
          throw error;
        } finally {
          set({ isAnalyzing: false });
        }
      },

      getStepByStepGuidance: async (puzzle: number[][], currentState: number[][]): Promise<TeachingResponse[]> => {
        set({ isLoading: true });
        
        try {
          const responses = await aiTeachingService.getStepByStepGuidance(
            puzzle,
            currentState,
            get().preferences.userLevel
          );

          // Update current session with step-by-step guidance
          const hints = responses.map(r => r.hint);
          set((state) => ({
            currentSession: state.currentSession ? {
              ...state.currentSession,
              hints: [...state.currentSession.hints, ...hints],
              totalSteps: hints.length,
              lastUpdated: new Date()
            } : null
          }));

          return responses;
        } catch (error) {
          console.error('Error getting step-by-step guidance:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      explainTechnique: async (technique: string): Promise<TeachingResponse> => {
        set({ isLoading: true });
        
        try {
          const response = await aiTeachingService.explainTechnique(
            technique,
            get().preferences.userLevel
          );

          return response;
        } catch (error) {
          console.error('Error explaining technique:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      saveSessionToHistory: () => {
        const { currentSession } = get();
        if (currentSession) {
          set((state) => ({
            sessionHistory: [...state.sessionHistory, currentSession]
          }));
        }
      },

      loadSessionFromHistory: (sessionId: string) => {
        const { sessionHistory } = get();
        const session = sessionHistory.find(s => s.id === sessionId);
        if (session) {
          set({ currentSession: session });
        }
      },

      clearHistory: () => {
        set({ sessionHistory: [] });
      },
    }),
    {
      name: 'ai-coaching-storage',
      partialize: (state) => ({
        preferences: state.preferences,
        sessionHistory: state.sessionHistory,
      }),
    }
  )
);
