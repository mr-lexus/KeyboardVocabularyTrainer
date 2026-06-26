import type { DictionaryEntry } from '../../shared/api/db';

export interface BuiltInDictionaryMeta {
  id: string;
  name: string;
  description: string;
  file: string;
  wordCount: number;
  emoji: string;
}

export interface BuiltInDictionary {
  id: string;
  name: string;
  description: string;
  entries: DictionaryEntry[];
  emoji: string;
}

let manifestCache: BuiltInDictionaryMeta[] | null = null;
const dictionaryCache = new Map<string, BuiltInDictionary>();

export const builtInDictionaryApi = {
  /** Загружает манифест со списком встроенных словарей */
  getManifest: async (): Promise<BuiltInDictionaryMeta[]> => {
    if (manifestCache) return manifestCache;
    const base = import.meta.env.BASE_URL;
    const res = await fetch(`${base}dictionaries/manifest.json`);
    const data = await res.json();
    manifestCache = data.dictionaries as BuiltInDictionaryMeta[];
    return manifestCache;
  },

  /** Найти предложения со словом сканируя phrasebooks */
  findSentencesWithWord: async (
    word: string, 
    limit: number = Infinity,
    onProgress?: (loaded: number, total: number) => void
  ): Promise<{ en: string; ru: string }[]> => {
    const manifest = await builtInDictionaryApi.getManifest();
    const pbMeta = manifest.filter(m => m.id.startsWith('phrasebook-') || m.id.startsWith('pb-'));
    
    const sentences: { en: string; ru: string }[] = [];
    const lowerWord = word.toLowerCase();
    const regex = new RegExp(`\\b${lowerWord}\\b`, 'i');
    const base = import.meta.env.BASE_URL;
    
    const total = pbMeta.length;
    let loaded = 0;
    if (onProgress) onProgress(loaded, total);

    const batchSize = 10;
    for (let i = 0; i < total; i += batchSize) {
      if (sentences.length >= limit) break;

      const batch = pbMeta.slice(i, i + batchSize);
      await Promise.all(batch.map(async (meta) => {
        try {
          const res = await fetch(`${base}${meta.file}`);
          const data = await res.json();
          for (const entry of data.entries) {
            if (entry.word.trim().includes(' ') && regex.test(entry.word)) {
              sentences.push({ en: entry.word, ru: entry.translation });
            }
          }
        } catch (e) {
          console.error(`Failed to load ${meta.file}`, e);
        }
      }));

      loaded += batch.length;
      if (onProgress) onProgress(Math.min(loaded, total), total);
    }

    if (onProgress) onProgress(total, total);
    
    const unique = [];
    const seen = new Set();
    for (const s of sentences) {
      if (!seen.has(s.en)) {
        seen.add(s.en);
        unique.push(s);
      }
    }

    return limit === Infinity ? unique : unique.slice(0, limit);
  },

  /** Подсчитывает количество предложений для списка слов */
  countSentencesForWords: async (
    words: string[],
    onProgress?: (loaded: number, total: number) => void
  ): Promise<Record<string, number>> => {
    const manifest = await builtInDictionaryApi.getManifest();
    const pbMeta = manifest.filter(m => m.id.startsWith('phrasebook-') || m.id.startsWith('pb-'));
    
    const counts: Record<string, Set<string>> = {};
    for (const w of words) counts[w] = new Set();

    const regexes = words.map(w => ({ word: w, regex: new RegExp(`\\b${w.toLowerCase()}\\b`, 'i') }));
    const base = import.meta.env.BASE_URL;
    
    const total = pbMeta.length;
    let loaded = 0;
    if (onProgress) onProgress(loaded, total);

    const batchSize = 10;
    for (let i = 0; i < total; i += batchSize) {
      const batch = pbMeta.slice(i, i + batchSize);
      await Promise.all(batch.map(async (meta) => {
        try {
          const res = await fetch(`${base}${meta.file}`);
          const data = await res.json();
          for (const entry of data.entries) {
            if (entry.word.trim().includes(' ')) {
              for (const { word, regex } of regexes) {
                if (regex.test(entry.word)) {
                  counts[word].add(entry.word);
                }
              }
            }
          }
        } catch (e) {
          console.error(`Failed to load ${meta.file}`, e);
        }
      }));

      loaded += batch.length;
      if (onProgress) onProgress(Math.min(loaded, total), total);
    }

    if (onProgress) onProgress(total, total);
    
    const result: Record<string, number> = {};
    for (const w of words) {
      result[w] = counts[w].size;
    }
    return result;
  },

  /** Загружает конкретный встроенный словарь по id */
  getById: async (id: string): Promise<BuiltInDictionary | null> => {
    if (dictionaryCache.has(id)) return dictionaryCache.get(id)!;

    const manifest = await builtInDictionaryApi.getManifest();
    const meta = manifest.find((m) => m.id === id);
    if (!meta) return null;

    const base = import.meta.env.BASE_URL;
    // meta.file is like 'dictionaries/english-basics.json' (no leading slash)
    const res = await fetch(`${base}${meta.file}`);
    const data = await res.json();

    const dict: BuiltInDictionary = {
      id: data.id,
      name: data.name,
      description: data.description,
      entries: data.entries,
      emoji: meta.emoji,
    };

    dictionaryCache.set(id, dict);
    return dict;
  },
};
