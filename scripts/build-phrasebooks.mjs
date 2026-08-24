// Rebuilds phrasebook dictionaries with high-quality curated real-speech content.
//
// Strategy per target dictionary:
//   1. Curated phrases go first (hand-authored, natural spoken EN/RU).
//   2. Remaining corpus entries follow, with Tatoeba-style artifacts filtered out
//      (sentences about "Tom", "Mary", etc.) and duplicates removed.
// New topics (no existing file) are created from curated content only.
// Finally, public/dictionaries/manifest.json is updated in place:
// descriptions become meaningful Russian texts, wordCount values refreshed.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { everyday } from './core/everyday.mjs';
import { everyday2 } from './core/everyday2.mjs';
import { travel } from './core/travel.mjs';
import { travel2 } from './core/travel2.mjs';
import { food } from './core/food.mjs';
import { services } from './core/services.mjs';
import { shopping } from './core/shopping.mjs';
import { work } from './core/work.mjs';
import { digital } from './core/digital.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DICT_DIR = path.join(ROOT, 'public', 'dictionaries');
const MANIFEST_PATH = path.join(DICT_DIR, 'manifest.json');

/** Sentences built around these proper names are corpus artifacts, not speech.
 *  Email salutation templates ("Dear Mr. Johnson,") are legitimate exceptions. */
const BAD_NAME_RE = /\b(Tom|Mary|John|Alice|Jackson|Smith)\b/;
const SALUTATION_RE = /^(dear\s+(mr|ms|mrs)\.\s+\w+|(hi|hello|hey)\s+\w+)\s*,\s*$/i;

function isNameArtifact(word) {
  return BAD_NAME_RE.test(word) && !SALUTATION_RE.test(word);
}
const MAX_CORPUS_PER_DICT = 500;

const TOPICS = {
  ...everyday,
  ...everyday2,
  ...travel,
  ...travel2,
  ...food,
  ...services,
  ...shopping,
  ...work,
  ...digital,
};

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const manifestById = new Map(manifest.dictionaries.map((d) => [d.id, d]));

  // Global dedupe across all curated sets.
  const curatedSeen = new Set();
  const warnings = [];
  const results = [];

  for (const [key, topic] of Object.entries(TOPICS)) {
    const filePath = path.join(DICT_DIR, path.basename(topic.file));
    const fileName = 'dictionaries/' + path.basename(topic.file);
    const exists = fs.existsSync(filePath);

    let dictId;
    if (exists) {
      const current = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      dictId = current.id || manifestById.get(idFromFileName(fileName))?.id;
    }
    dictId = dictId || idFromFileName(fileName);

    // --- curated part -----------------------------------------------------
    const curatedEntries = [];
    for (const [en, ru] of topic.phrases) {
      const enNorm = normalize(en);
      if (!en || !ru) {
        warnings.push(`[${key}] empty phrase: ${JSON.stringify([en, ru])}`);
        continue;
      }
      if (curatedSeen.has(enNorm)) continue;
      curatedSeen.add(enNorm);
      if (en.length > 95) warnings.push(`[${key}] long (${en.length}): ${en}`);
      curatedEntries.push({
        id: `pbq_${key}_${curatedEntries.length}`,
        word: en,
        translation: ru,
        language: 'en',
      });
    }

    const curatedWords = new Set(curatedEntries.map((e) => normalize(e.word)));

    // --- corpus part (existing file only) ---------------------------------
    let keptCorpus = 0;
    let dropped = 0;
    if (exists) {
      const current = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const seen = new Set(curatedWords);
      const corpusEntries = [];
      for (const entry of current.entries ?? []) {
        const norm = normalize(entry.word);
        if (isNameArtifact(entry.word) || seen.has(norm)) {
          dropped++;
          continue;
        }
        seen.add(norm);
        corpusEntries.push(entry);
      }
      const capLeftover = Math.max(0, MAX_CORPUS_PER_DICT - curatedEntries.length);
      keptCorpus = Math.min(corpusEntries.length, capLeftover);
      var finalCorpus = corpusEntries.slice(0, keptCorpus);
      dropped += corpusEntries.length - keptCorpus;
    } else {
      var finalCorpus = [];
    }

    const entries = [...curatedEntries, ...finalCorpus];
    const dict = {
      id: dictId,
      name: exists ? JSON.parse(fs.readFileSync(filePath, 'utf8')).name : (topic.name ?? key),
      description: topic.description,
      entries,
    };
    fs.writeFileSync(filePath, JSON.stringify(dict, null, 2) + '\n');

    results.push({
      key,
      id: dictId,
      file: fileName,
      isNew: !exists,
      curated: curatedEntries.length,
      corpus: finalCorpus.length,
      dropped,
      emoji: topic.emoji,
      description: topic.description,
      total: entries.length,
    });
  }

  // --- update manifest ----------------------------------------------------
  const byId = new Map(results.map((r) => [r.id, r]));
  const nextDictionaries = manifest.dictionaries.map((meta) => {
    const r = byId.get(meta.id);
    if (!r) return meta;
    return {
      ...meta,
      description: r.description,
      wordCount: r.total,
      emoji: r.emoji,
    };
  });

  const presentIds = new Set(nextDictionaries.map((d) => d.id));
  for (const r of results.filter((x) => x.isNew)) {
    if (presentIds.has(r.id)) continue;
    nextDictionaries.push({
      id: r.id,
      name: TOPICS[r.key].name ?? r.key,
      description: r.description,
      file: r.file,
      wordCount: r.total,
      emoji: r.emoji,
    });
  }

  fs.writeFileSync(
    MANIFEST_PATH,
    JSON.stringify({ dictionaries: nextDictionaries }, null, 2) + '\n',
  );

  // --- sweep remaining phrasebooks ----------------------------------------
  // Every other phrasebook-* file also loses corpus artifacts and duplicates,
  // so no built-in dictionary ships unnatural "Tom/Mary" sentences.
  const touchedFiles = new Set(results.map((r) => path.basename(r.file)));
  const manifestByFile = new Map(manifest.dictionaries.map((d) => [path.basename(d.file), d]));
  let swept = 0;
  let sweptDropped = 0;
  for (const fileName of fs.readdirSync(DICT_DIR)) {
    if (!fileName.startsWith('phrasebook-') || !fileName.endsWith('.json')) continue;
    if (touchedFiles.has(fileName)) continue;

    const filePath = path.join(DICT_DIR, fileName);
    const current = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const seen = new Set();
    const kept = [];
    for (const entry of current.entries ?? []) {
      const norm = normalize(entry.word);
      if (isNameArtifact(entry.word) || seen.has(norm)) {
        sweptDropped++;
        continue;
      }
      seen.add(norm);
      kept.push(entry);
    }
    if (kept.length === current.entries.length) continue;

    fs.writeFileSync(
      filePath,
      JSON.stringify({ ...current, entries: kept }, null, 2) + '\n',
    );
    const meta = manifestByFile.get(fileName);
    if (meta) meta.wordCount = kept.length;
    swept++;
  }

  fs.writeFileSync(
    MANIFEST_PATH,
    JSON.stringify({ dictionaries: nextDictionaries }, null, 2) + '\n',
  );

  // --- report ---------------------------------------------------------------
  console.log('Rebuilt dictionaries:');
  for (const r of results.sort((a, b) => a.key.localeCompare(b.key))) {
    console.log(
      `  ${r.isNew ? '[new ]' : '[upd ]'} ${path.basename(r.file).padEnd(45)} curated=${String(r.curated).padStart(3)} corpus=${String(r.corpus).padStart(3)} dropped=${String(r.dropped).padStart(4)} total=${String(r.total).padStart(4)}`,
    );
  }
  const totals = results.reduce(
    (acc, r) => ({
      curated: acc.curated + r.curated,
      corpus: acc.corpus + r.corpus,
      dropped: acc.dropped + r.dropped,
    }),
    { curated: 0, corpus: 0, dropped: 0 },
  );
  console.log(
    `\nTotals: ${results.length} dictionaries rebuilt (${results.filter((r) => r.isNew).length} new), ${totals.curated} curated phrases, ${totals.corpus} corpus kept, ${totals.dropped} dropped.`,
  );
  console.log(`Sweep pass: ${swept} other phrasebooks cleaned, ${sweptDropped} artifact/duplicate entries removed.`);
  if (warnings.length) {
    console.log('\nWarnings:');
    for (const w of warnings) console.log('  ' + w);
  }
}

function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9а-яё ]+/gi, '').replace(/\s+/g, ' ').trim();
}

function idFromFileName(file) {
  return path.basename(file, '.json');
}

main();
