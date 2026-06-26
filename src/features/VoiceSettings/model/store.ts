import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PlayTiming = 'before' | 'after';

interface VoiceSettingsState {
  enabled: boolean;
  rate: number;
  voiceURI: string | null;
  playTiming: PlayTiming;
  setEnabled: (val: boolean) => void;
  setRate: (val: number) => void;
  setVoiceURI: (val: string) => void;
  setPlayTiming: (val: PlayTiming) => void;
}

export const useVoiceSettings = create<VoiceSettingsState>()(
  persist(
    (set) => ({
      enabled: true,
      rate: 1.0,
      voiceURI: null,
      playTiming: 'after',
      setEnabled: (enabled) => set({ enabled }),
      setRate: (rate) => set({ rate }),
      setVoiceURI: (voiceURI) => set({ voiceURI }),
      setPlayTiming: (playTiming) => set({ playTiming }),
    }),
    {
      name: 'voice-settings',
    }
  )
);
