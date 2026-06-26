import Dexie, { type Table } from 'dexie';

export interface DictionaryEntry {
  id: string;
  word: string;
  translation: string;
  language: string;
}

export interface Dictionary {
  id: string;
  name: string;
  emoji?: string;
  entries: DictionaryEntry[];
}

export interface KeyStat {
  keyId: string;
  correctPresses: number;
  incorrectPresses: number;
}

export interface FingerStat {
  fingerId: string;
  correctPresses: number;
  incorrectPresses: number;
}

export interface TrainingSession {
  id: string;
  date: number;
  durationSeconds: number;
  charactersTyped: number;
  wpm: number;
  accuracy: number;
}

export interface WordSentenceCount {
  word: string;
  count: number;
}

export class KeyboardVocabularyDB extends Dexie {
  dictionaries!: Table<Dictionary, string>;
  keyStats!: Table<KeyStat, string>;
  fingerStats!: Table<FingerStat, string>;
  trainingSessions!: Table<TrainingSession, string>;
  wordSentenceCounts!: Table<WordSentenceCount, string>;

  constructor() {
    super('KeyboardVocabularyDB');
    this.version(1).stores({
      dictionaries: 'id, name',
      keyStats: 'keyId',
      fingerStats: 'fingerId',
      trainingSessions: 'id, date',
    });
    this.version(2).stores({
      wordSentenceCounts: 'word'
    });
  }
}

export const db = new KeyboardVocabularyDB();
