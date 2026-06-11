export const speechApi = {
  speak: (text: string, lang: string = 'en-US', rate: number = 1.0, voiceURI?: string) => {
    if (!('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis API not supported');
      return;
    }
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;

    if (voiceURI) {
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(v => v.voiceURI === voiceURI);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    window.speechSynthesis.speak(utterance);
  },
  
  getVoices: () => {
    if (!('speechSynthesis' in window)) return [];
    return window.speechSynthesis.getVoices();
  }
};
