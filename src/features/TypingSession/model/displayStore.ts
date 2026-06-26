import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DisplaySettingsState {
  showKeyboard: boolean;
  showHands: boolean;
  setShowKeyboard: (val: boolean) => void;
  setShowHands: (val: boolean) => void;
}

export const useDisplaySettings = create<DisplaySettingsState>()(
  persist(
    (set) => ({
      showKeyboard: true,
      showHands: true,
      setShowKeyboard: (showKeyboard) => set({ showKeyboard }),
      setShowHands: (showHands) => set({ showHands }),
    }),
    {
      name: 'display-settings',
    }
  )
);
