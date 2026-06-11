import { create } from 'zustand';
import { type DictionaryEntry } from '../../../entities/Dictionary/model';

export type TrainingMode = 'en-ru' | 'ru-en' | 'random';

interface TypingSessionState {
  currentDictionaryId: string | null;
  mode: TrainingMode;
  entries: DictionaryEntry[];
  currentEntryIndex: number;
  userInput: string;
  isFinished: boolean;

  setDictionary: (id: string, entries: DictionaryEntry[]) => void;
  setMode: (mode: TrainingMode) => void;
  setUserInput: (input: string) => void;
  nextWord: () => void;
  resetSession: () => void;
}

export const useTypingSession = create<TypingSessionState>((set) => ({
  currentDictionaryId: null,
  mode: 'en-ru',
  entries: [],
  currentEntryIndex: 0,
  userInput: '',
  isFinished: false,

  setDictionary: (id, entries) => set({ 
    currentDictionaryId: id, 
    entries: [...entries].sort(() => Math.random() - 0.5), // simple shuffle
    currentEntryIndex: 0,
    userInput: '',
    isFinished: entries.length === 0
  }),
  
  setMode: (mode) => set({ mode }),
  
  setUserInput: (input) => set({ userInput: input }),
  
  nextWord: () => set((state) => {
    const nextIndex = state.currentEntryIndex + 1;
    if (nextIndex >= state.entries.length) {
      return { isFinished: true, userInput: '' };
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
