import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type DictionaryEntry } from '../../../entities/Dictionary/model';
import { type TrainingMode } from './store';

export interface DictionaryProgress {
  entries: DictionaryEntry[];
  currentEntryIndex: number;
  mode: TrainingMode;
}

interface ProgressState {
  progress: Record<string, DictionaryProgress>;
  saveProgress: (dictId: string, progress: DictionaryProgress) => void;
  clearProgress: (dictId: string) => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      progress: {},
      saveProgress: (dictId, prog) => set((state) => ({
        progress: {
          ...state.progress,
          [dictId]: prog
        }
      })),
      clearProgress: (dictId) => set((state) => {
        const newProgress = { ...state.progress };
        delete newProgress[dictId];
        return { progress: newProgress };
      })
    }),
    {
      name: 'dictionary-progress',
    }
  )
);
