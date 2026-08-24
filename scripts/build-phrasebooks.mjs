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

// Top-up batches appended to matching topic keys (merged below).
import { topups as tEverydayA } from './core/topup-everyday-a.mjs';
import { topups as tEverydayB } from './core/topup-everyday-b.mjs';
import { topups as tSocial } from './core/topup-social.mjs';
import { topups as tTravel } from './core/topup-travel.mjs';
import { topups as tScenarios } from './core/topup-scenarios.mjs';
import { topups as tShoppingTech } from './core/topup-shopping-tech.mjs';
import { topups as tSmallScenarios } from './core/topup-small-scenarios.mjs';
import { topups as tGapfill } from './core/topup-gapfill.mjs';

// Session batches: lodging/money-transit/food-retail/travel-health are top-up maps;
// career/home-car/life-events add brand-new topics plus niche rescues.
import { topups as bLodging } from './core/batch-lodging.mjs';
import { topups as bMoneyTransit } from './core/batch-money-transit.mjs';
import { topups as bFoodRetail } from './core/batch-food-retail.mjs';
import { topups as bTravelHealth } from './core/batch-travel-health.mjs';
import { presentations, negotiations, programminglanguages } from './core/batch-career.mjs';
import { homerepairs, carservice } from './core/batch-home-car.mjs';
import { petvet, parenting, movinghouse, weddings, aviationflying } from './core/batch-life-events.mjs';
import { motorsportdriver, motorsportspectator } from './core/batch-motorsport.mjs';
import { motorsportengineermechanic } from './core/batch-motorsport-eng.mjs';
import { simracing } from './core/batch-simracing.mjs';
import { topups as tMsDriver } from './core/topup-motorsport-driver.mjs';
import { topups as tMsDriver2 } from './core/topup-motorsport-driver2.mjs';
import { topups as tMsSpectator } from './core/topup-motorsport-spectator.mjs';
import { topups as tMsSpectator2 } from './core/topup-motorsport-spectator2.mjs';
import { topups as tMsEng2 } from './core/topup-motorsport-eng2.mjs';
import { topups as tMsGapfill } from './core/topup-motorsport-gapfill.mjs';
import { topups as tMsFinal } from './core/topup-ms-final.mjs';
import { topups as tMsEng3 } from './core/topup-ms-eng3.mjs';
import { topups as tMsEng4 } from './core/topup-ms-eng4.mjs';
import { topups as tSim2 } from './core/topup-simracing2.mjs';
import { topups as tSim3 } from './core/topup-simracing3.mjs';
import { topups as tSim4 } from './core/topup-simracing4.mjs';
import { topups as tMsFinalFill } from './core/topup-ms-finalfill.mjs';

// Fill-up batches for the thinnest phrasebooks (registered LAST so legacy
// topics keep global-dedupe priority).
import { artpainting, religionspirituality, sciencephysics, historyempires, technologygadgets, internetwebsites } from './core/fill-thin-a.mjs';
import { toolshardware, officestationery, mythologyfolklore, videogamesshootersaction, hobbiesgardening } from './core/fill-thin-b.mjs';

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
  // brand-new topics & niche rescues (existing corpus files get curated leads)
  presentations,
  negotiations,
  programminglanguages,
  homerepairs,
  carservice,
  petvet,
  parenting,
  movinghouse,
  weddings,
  aviationflying,
  motorsportdriver,
  motorsportspectator,
  motorsportengineermechanic,
  simracing,
  // thin-dictionary fill-ups (part A) — must stay LAST for dedupe priority
  artpainting,
  religionspirituality,
  sciencephysics,
  historyempires,
  technologygadgets,
  internetwebsites,
  // thin-dictionary fill-ups (part B) — must stay LAST for dedupe priority
  toolshardware,
  officestationery,
  mythologyfolklore,
  videogamesshootersaction,
  hobbiesgardening,
};

// Merge every top-up batch into its base topic (order: base phrases first).
for (const batch of [tEverydayA, tEverydayB, tSocial, tTravel, tScenarios, tShoppingTech, tSmallScenarios, tGapfill, bLodging, bMoneyTransit, bFoodRetail, bTravelHealth, tMsDriver, tMsDriver2, tMsSpectator, tMsSpectator2, tMsEng2, tMsGapfill, tMsFinal, tMsEng3, tMsEng4, tSim2, tSim3, tSim4, tMsFinalFill]) {
  for (const [key, extra] of Object.entries(batch)) {
    const topic = TOPICS[key];
    if (!topic) throw new Error(`topup references unknown topic key: ${key}`);
    topic.phrases.push(...extra);
  }
}

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
    // topic.dropCorpus = true discards the legacy corpus entirely
    // (used when old content is off-topic junk, e.g. old Motorsport dicts).
    if (exists && !topic.dropCorpus) {
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
