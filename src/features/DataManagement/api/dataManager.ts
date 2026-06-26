import { 
  db, 
  type Dictionary, 
  type KeyStat, 
  type FingerStat, 
  type TrainingSession, 
  type WordSentenceCount 
} from '../../../shared/api/db';

const LOCAL_STORAGE_KEYS = [
  'dictionary-progress',
  'display-settings',
  'theme-storage',
  'voice-settings',
  'recent_emojis',
  'favorite_emojis',
  'hasSeenReadme'
];

export const exportData = async () => {
  const data: {
    indexedDB: {
      dictionaries?: Dictionary[];
      keyStats?: KeyStat[];
      fingerStats?: FingerStat[];
      trainingSessions?: TrainingSession[];
      wordSentenceCounts?: WordSentenceCount[];
    };
    localStorage: Record<string, string>;
  } = {
    indexedDB: {},
    localStorage: {}
  };

  // Export IndexedDB
  const dictionaries = await db.dictionaries.toArray();
  const keyStats = await db.keyStats.toArray();
  const fingerStats = await db.fingerStats.toArray();
  const trainingSessions = await db.trainingSessions.toArray();
  const wordSentenceCounts = await db.wordSentenceCounts.toArray();

  data.indexedDB = {
    dictionaries,
    keyStats,
    fingerStats,
    trainingSessions,
    wordSentenceCounts
  };

  // Export LocalStorage
  LOCAL_STORAGE_KEYS.forEach(key => {
    const value = localStorage.getItem(key);
    if (value !== null) {
      data.localStorage[key] = value;
    }
  });

  // Create and download file
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  link.download = `keyboard-vocabulary-backup-${dateStr}.json`;
  
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importData = async (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (!data || !data.indexedDB || !data.localStorage) {
          throw new Error('Invalid backup file format');
        }

        // Import IndexedDB
        await db.transaction('rw', 
          [
            db.dictionaries, 
            db.keyStats, 
            db.fingerStats, 
            db.trainingSessions, 
            db.wordSentenceCounts
          ], 
          async () => {
            // Clear existing data
            await db.dictionaries.clear();
            await db.keyStats.clear();
            await db.fingerStats.clear();
            await db.trainingSessions.clear();
            await db.wordSentenceCounts.clear();

            // Insert new data
            if (data.indexedDB.dictionaries?.length) {
              await db.dictionaries.bulkAdd(data.indexedDB.dictionaries);
            }
            if (data.indexedDB.keyStats?.length) {
              await db.keyStats.bulkAdd(data.indexedDB.keyStats);
            }
            if (data.indexedDB.fingerStats?.length) {
              await db.fingerStats.bulkAdd(data.indexedDB.fingerStats);
            }
            if (data.indexedDB.trainingSessions?.length) {
              await db.trainingSessions.bulkAdd(data.indexedDB.trainingSessions);
            }
            if (data.indexedDB.wordSentenceCounts?.length) {
              await db.wordSentenceCounts.bulkAdd(data.indexedDB.wordSentenceCounts);
            }
        });

        // Import LocalStorage
        LOCAL_STORAGE_KEYS.forEach(key => {
          if (data.localStorage[key] !== undefined) {
            localStorage.setItem(key, data.localStorage[key]);
          } else {
            localStorage.removeItem(key);
          }
        });

        resolve();
      } catch (error) {
        console.error('Import error:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
