import { db, type Dictionary, type DictionaryEntry } from '../../shared/api/db';

export const dictionaryApi = {
  getAll: async () => {
    return await db.dictionaries.toArray();
  },
  getById: async (id: string) => {
    return await db.dictionaries.get(id);
  },
  create: async (name: string) => {
    const newDict: Dictionary = {
      id: crypto.randomUUID(),
      name,
      entries: []
    };
    await db.dictionaries.add(newDict);
    return newDict;
  },
  delete: async (id: string) => {
    await db.dictionaries.delete(id);
  },
  addEntry: async (dictId: string, word: string, translation: string, language: string = 'en') => {
    const dict = await db.dictionaries.get(dictId);
    if (!dict) throw new Error('Dictionary not found');
    
    const newEntry: DictionaryEntry = {
      id: crypto.randomUUID(),
      word,
      translation,
      language
    };
    
    await db.dictionaries.update(dictId, {
      entries: [...dict.entries, newEntry]
    });
    
    return newEntry;
  },
  bulkAddEntries: async (dictId: string, text: string) => {
    const dict = await db.dictionaries.get(dictId);
    if (!dict) throw new Error('Dictionary not found');

    const pairs = text.split(';').map(p => p.trim()).filter(Boolean);
    const newEntries = pairs.map(p => {
      const [word, translation] = p.split('=').map(s => s.trim());
      if (!word || !translation) return null;
      return {
        id: crypto.randomUUID(),
        word,
        translation,
        language: 'en'
      };
    }).filter(Boolean) as DictionaryEntry[];

    if (newEntries.length === 0) return;

    await db.dictionaries.update(dictId, {
      entries: [...dict.entries, ...newEntries]
    });
  },
  deleteEntry: async (dictId: string, entryId: string) => {
    const dict = await db.dictionaries.get(dictId);
    if (!dict) throw new Error('Dictionary not found');
    
    await db.dictionaries.update(dictId, {
      entries: dict.entries.filter((e: DictionaryEntry) => e.id !== entryId)
    });
  }
};
