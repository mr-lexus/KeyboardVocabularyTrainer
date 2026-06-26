import fs from 'fs';
import translate from 'google-translate-api-x';

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const WORDS_PER_DICT = 350;

async function generate() {
  console.log("Downloading Oxford 5000 vocabulary...");
  
  let csvText;
  try {
    const response = await fetch('https://raw.githubusercontent.com/chunzhng/Oxford-3000-5000/main/oxford-5000.csv');
    csvText = await response.text();
  } catch (error) {
    console.error("Failed to download Oxford 5000 CSV", error);
    return;
  }
  
  // Parse CSV
  const lines = csvText.split('\n').slice(1); // skip header
  const wordsByLevel = {
    A1: new Set(),
    A2: new Set(),
    B1: new Set(),
    B2: new Set(),
    C1: new Set(),
    C2: new Set()
  };

  for (const line of lines) {
    const parts = line.split(',');
    if (parts.length >= 3) {
      const word = parts[0].trim().toLowerCase();
      const level = parts[2].trim().toUpperCase();
      if (wordsByLevel[level] && word) {
        wordsByLevel[level].add(word);
      }
    }
  }

  const data = {
    A1: Array.from(wordsByLevel.A1),
    A2: Array.from(wordsByLevel.A2),
    B1: Array.from(wordsByLevel.B1),
    B2: Array.from(wordsByLevel.B2),
    C1: Array.from(wordsByLevel.C1)
  };

  // Create synthetic C2 from the longest/most complex words of C1 and B2
  const potentialC2 = [...data.C1, ...data.B2];
  data.C2 = potentialC2.filter(w => w.length >= 10);
  
  // Remove C2 words from C1 and B2 to avoid overlap
  const c2Set = new Set(data.C2);
  data.B2 = data.B2.filter(w => !c2Set.has(w));
  data.C1 = data.C1.filter(w => !c2Set.has(w));

  const manifestPath = 'public/dictionaries/manifest.json';
  let manifest = { dictionaries: [] };
  if (fs.existsSync(manifestPath)) {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  }
  
  const newDicts = [];

  for (const level of CEFR_LEVELS) {
    const words = data[level] || [];
    if (words.length === 0) continue;
    
    // Shuffle words to make dictionaries varied
    words.sort(() => 0.5 - Math.random());
    
    const numDicts = Math.ceil(words.length / WORDS_PER_DICT);
    const actualWordsPerDict = Math.ceil(words.length / numDicts);
    
    for (let i = 0; i < numDicts; i++) {
      const chunk = words.slice(i * actualWordsPerDict, (i + 1) * actualWordsPerDict);
      if (chunk.length < 50) continue; // Skip too small chunks
      
      console.log(`Translating ${level} part ${i+1}/${numDicts} (${chunk.length} words)...`);
      let translations = [];
      try {
        const res = await translate(chunk, {to: 'ru'});
        translations = res.map(r => r.text.toLowerCase());
      } catch (e) {
        console.error("Translation failed, using placeholder", e.message);
        translations = chunk.map(w => w + "_ru");
      }
      
      const entries = chunk.map((word, idx) => ({
        id: `entry_${level.toLowerCase()}_${i}_${idx}`,
        word: word,
        translation: translations[idx],
        language: 'en'
      }));
      
      const dictId = `cefr-${level.toLowerCase()}-${i+1}`;
      const dictName = `${level} Level - Part ${i+1}`;
      const dictDesc = `Vocabulary for ${level} level, part ${i+1}`;
      const fileName = `dictionaries/${dictId}.json`;
      
      const dictObj = {
        id: dictId,
        name: dictName,
        description: dictDesc,
        entries
      };
      
      fs.writeFileSync(`public/${fileName}`, JSON.stringify(dictObj, null, 2));
      
      newDicts.push({
        id: dictId,
        name: dictName,
        description: dictDesc,
        file: fileName,
        wordCount: chunk.length,
        emoji: getEmojiForLevel(level)
      });
    }
  }
  
  manifest.dictionaries = [...manifest.dictionaries.filter(d => !d.id.startsWith('cefr-')), ...newDicts];
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log("Done generating dictionaries.");
}

function getEmojiForLevel(level) {
  const map = {
    'A1': '🌱',
    'A2': '🌿',
    'B1': '🌳',
    'B2': '🌲',
    'C1': '🏔️',
    'C2': '⛰️'
  };
  return map[level] || '📚';
}

generate();
