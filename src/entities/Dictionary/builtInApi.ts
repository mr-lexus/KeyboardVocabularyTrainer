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
