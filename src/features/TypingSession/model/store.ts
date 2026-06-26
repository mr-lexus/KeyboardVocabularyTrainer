import { create } from 'zustand';
import { type DictionaryEntry } from '../../../entities/Dictionary/model';
import { useProgressStore } from './progressStore';

export type TrainingMode = 'en-ru' | 'ru-en' | 'random';

interface TypingSessionState {
  currentDictionaryId: string | null;
  mode: TrainingMode;
  entries: DictionaryEntry[];
  currentEntryIndex: number;
  userInput: string;
  isFinished: boolean;
  selectedLayoutId: string;

  setDictionary: (id: string, entries: DictionaryEntry[], resumeIndex?: number) => void;
  setMode: (mode: TrainingMode) => void;
  setUserInput: (input: string) => void;
  setLayout: (id: string) => void;
  nextWord: () => void;
  resetSession: () => void;
}

export const useTypingSession = create<TypingSessionState>((set, get) => ({
  currentDictionaryId: null,
  mode: 'en-ru',
  entries: [],
  currentEntryIndex: 0,
  userInput: '',
  isFinished: false,
  selectedLayoutId: 'silakka54',

  setDictionary: (id, entries, resumeIndex = 0) => {
    // If not resuming, we shuffle
    const finalEntries = resumeIndex === 0 ? [...entries].sort(() => Math.random() - 0.5) : entries;
    set({ 
      currentDictionaryId: id, 
      entries: finalEntries,
      currentEntryIndex: resumeIndex,
      userInput: '',
      isFinished: finalEntries.length === 0
    });

    if (finalEntries.length > 0) {
      useProgressStore.getState().saveProgress(id, {
        entries: finalEntries,
        currentEntryIndex: resumeIndex,
        mode: get().mode
      });
    }
  },
  
  setMode: (mode) => set({ mode }),
  
  setUserInput: (input) => set({ userInput: input }),

  setLayout: (id) => set({ selectedLayoutId: id }),
  
  nextWord: () => set((state) => {
    const nextIndex = state.currentEntryIndex + 1;
    if (nextIndex >= state.entries.length) {
      if (state.currentDictionaryId) {
        useProgressStore.getState().clearProgress(state.currentDictionaryId);
      }
      return { isFinished: true, userInput: '' };
    }
    
    if (state.currentDictionaryId) {
      useProgressStore.getState().saveProgress(state.currentDictionaryId, {
        entries: state.entries,
        currentEntryIndex: nextIndex,
        mode: state.mode
      });
    }
    return { currentEntryIndex: nextIndex, userInput: '' };
  }),
  
  resetSession: () => set({
    currentDictionaryId: null,
    entries: [],
    currentEntryIndex: 0,
    userInput: '',
    isFinished: false
  })
}));
