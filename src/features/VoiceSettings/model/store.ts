import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VoiceSettingsState {
  enabled: boolean;
  rate: number;
  voiceURI: string | null;
  setEnabled: (val: boolean) => void;
  setRate: (val: number) => void;
  setVoiceURI: (val: string) => void;
}

export const useVoiceSettings = create<VoiceSettingsState>()(
  persist(
    (set) => ({
      enabled: true,
      rate: 1.0,
      voiceURI: null,
      setEnabled: (enabled) => set({ enabled }),
      setRate: (rate) => set({ rate }),
      setVoiceURI: (voiceURI) => set({ voiceURI }),
    }),
    {
      name: 'voice-settings',
    }
  )
);
