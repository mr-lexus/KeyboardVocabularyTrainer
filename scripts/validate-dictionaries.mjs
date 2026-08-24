// Dictionary validation gate (see plan todo 10).
//
// Read-only checks over a dictionaries directory (default public/dictionaries):
//   V1  manifest parses
//   V2  every referenced file exists; no orphan *.json files
//   V3  manifest ids unique
//   V4  schema: id/name/description/entries present; entries have non-empty
//       string word/translation/id and language === 'en'
//   V5  entry ids unique per file
//   V6  no duplicate normalized words within one dictionary
//   V7  no mixed-script (homoglyph) tokens in word fields
//   V8  no single word present in two or more cefr-* files
//   V9  manifest wordCount === entries.length for every row
//   V10 no stale template descriptions; file.description === manifest.description
//   V11 FAIL on dictionaries <50 entries, WARN for 50-99
//   V12 filled/new dictionaries (todos 5-9) carry >=100 pbq_ entries
//
// Failures exit 1; warnings never fail. The script mutates nothing.
// Usage: node scripts/validate-dictionaries.mjs [--dir <dictionaries-dir>]

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const dirArgIdx = process.argv.indexOf('--dir');
const dirArg = dirArgIdx !== -1 ? process.argv[dirArgIdx + 1] : undefined;
const DICT_DIR = dirArg ? path.resolve(dirArg) : path.join(ROOT, 'public', 'dictionaries');
const MANIFEST_PATH = path.join(DICT_DIR, 'manifest.json');

function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9а-яё ]+/gi, '').replace(/\s+/g, ' ').trim();
}

const HAS_LATIN = /[a-z]/i;
const HAS_CYRILLIC = /[а-яё]/i;

/** Dictionaries filled to >=100 curated entries by plan todos 5-9. */
const CURATED_100_IDS = new Set([
  // todo 5 — fill-thin-a
  'phrasebook-artpainting',
  'phrasebook-religionspirituality',
  'phrasebook-sciencephysics',
  'phrasebook-historyempires',
  'phrasebook-technologygadgets',
  'phrasebook-internetwebsites',
  // todo 6 — fill-thin-b
  'phrasebook-toolshardware',
  'phrasebook-officestationery',
  'phrasebook-mythologyfolklore',
  'phrasebook-videogamesshootersaction',
  'phrasebook-hobbiesgardening',
  // todo 7 — batch-everyday3
  'phrasebook-bordercustoms',
  'phrasebook-pharmacy',
  'phrasebook-gasstationparking',
  'phrasebook-laundromatcleaning',
  'phrasebook-concertsevents',
  'phrasebook-carrental',
  // todo 8 — batch-professional
  'phrasebook-aimlengineering',
  'phrasebook-devopsclouds',
  'phrasebook-productmanagement',
  'phrasebook-customersupport',
  // todo 9 — batch-hobbies2
  'phrasebook-boardgames',
  'phrasebook-dronesfpv',
  'phrasebook-smarthomeiot',
  'phrasebook-3dprinting',
]);

const STALE_DESC_RE = /^Phrasebook for |^Vocabulary for /;

const failures = [];
const warnings = [];

function fail(checkId, message) {
  failures.push(`${checkId}: ${message}`);
}

function warn(checkId, message) {
  warnings.push(`${checkId}: ${message}`);
}

function main() {
  // --- V1: manifest parses ----------------------------------------------------
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    if (!Array.isArray(manifest.dictionaries)) throw new Error('dictionaries is not an array');
  } catch (e) {
    fail('V1', `manifest.json failed to parse: ${e.message}`);
    reportAndExit();
    return;
  }

  const rowsById = new Map();
  for (const row of manifest.dictionaries) {
    if (!rowsById.has(row.id)) rowsById.set(row.id, row);
  }

  // --- V2: referenced files exist, no orphan json ------------------------------
  const referencedFiles = new Set();
  for (const row of manifest.dictionaries) {
    if (typeof row.file !== 'string' || !row.file) {
      fail('V2', `manifest row "${row.id}" has no file reference`);
      continue;
    }
    const base = path.basename(row.file);
    referencedFiles.add(base);
    if (!fs.existsSync(path.join(DICT_DIR, base))) {
      fail('V2', `referenced file missing: ${base} (${row.id})`);
    }
  }
  const diskFiles = fs.readdirSync(DICT_DIR).filter((f) => f.endsWith('.json') && f !== 'manifest.json');
  for (const f of diskFiles) {
    if (!referencedFiles.has(f)) {
      fail('V2', `orphan file not referenced by manifest: ${f}`);
    }
  }

  // --- V3: manifest ids unique --------------------------------------------------
  const seenIds = new Set();
  for (const row of manifest.dictionaries) {
    if (seenIds.has(row.id)) fail('V3', `duplicate manifest id: ${row.id}`);
    seenIds.add(row.id);
  }

  // --- per-file checks (V4-V7, V10 file side, V11, V12) -------------------------
  const cefrWordOwners = new Map(); // normalized single word -> first cefr file
  const loadedById = new Map();

  for (const fileName of diskFiles.sort()) {
    const filePath = path.join(DICT_DIR, fileName);
    let dict;
    try {
      dict = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      fail('V4', `${fileName} failed to parse: ${e.message}`);
      continue;
    }
    const dictId = dict.id || fileName.replace(/\.json$/, '');
    loadedById.set(dictId, dict);

    // V4 schema
    for (const field of ['id', 'name', 'description', 'entries']) {
      if (dict[field] === undefined || dict[field] === null) {
        fail('V4', `${fileName}: missing field "${field}"`);
      }
    }
    const entries = Array.isArray(dict.entries) ? dict.entries : [];
    entries.forEach((entry, i) => {
      for (const field of ['id', 'word', 'translation']) {
        const v = entry[field];
        if (typeof v !== 'string' || v.trim() === '') {
          fail('V4', `${fileName} entry #${i}: invalid "${field}" (${JSON.stringify(v)})`);
        }
      }
      if (entry.language !== 'en') {
        fail('V4', `${fileName} entry #${i} (${entry.id}): language must be "en", got ${JSON.stringify(entry.language)}`);
      }
    });

    // V5 unique entry ids
    const idSeen = new Set();
    for (const entry of entries) {
      if (idSeen.has(entry.id)) fail('V5', `${fileName}: duplicate entry id ${entry.id}`);
      idSeen.add(entry.id);
    }

    // V6 duplicate normalized words within the dictionary
    const wordSeen = new Set();
    for (const entry of entries) {
      const n = normalize(String(entry.word));
      if (!n) continue;
      if (wordSeen.has(n)) fail('V6', `${fileName}: duplicate word "${entry.word}"`);
      wordSeen.add(n);
    }

    // V7 mixed-script tokens in word fields
    for (const entry of entries) {
      for (const token of String(entry.word).split(/\s+/)) {
        if (HAS_LATIN.test(token) && HAS_CYRILLIC.test(token)) {
          fail('V7', `${fileName} (${entry.id}): mixed-script token "${token}" in word "${entry.word}"`);
          break;
        }
      }
    }

    // V8 cefr cross-file duplicates (single words)
    if (/^cefr-/.test(fileName)) {
      for (const entry of entries) {
        const n = normalize(String(entry.word));
        if (!n || n.includes(' ')) continue;
        if (cefrWordOwners.has(n)) {
          fail('V8', `"${entry.word}" appears in both ${cefrWordOwners.get(n)} and ${fileName}`);
        } else {
          cefrWordOwners.set(n, fileName);
        }
      }
    }

    // V11 size floor
    if (entries.length < 50) {
      fail('V11', `${dictId} has only ${entries.length} entries (minimum 50)`);
    } else if (entries.length < 100) {
      warn('V11', `${dictId} has ${entries.length} entries (below soft target 100)`);
    }

    // V12 curated minimum for filled/new dictionaries
    if (CURATED_100_IDS.has(dictId)) {
      const pbqCount = entries.filter((e) => typeof e.id === 'string' && e.id.startsWith('pbq_')).length;
      if (pbqCount < 100) {
        fail('V12', `${dictId} carries only ${pbqCount} pbq_ entries (minimum 100)`);
      }
    }
  }

  // --- manifest-side checks (V9, V10) -------------------------------------------
  for (const row of manifest.dictionaries) {
    const dict = loadedById.get(row.id);
    if (!dict) continue; // already reported missing by V2

    // V9 wordCount sync
    const count = Array.isArray(dict.entries) ? dict.entries.length : -1;
    if (row.wordCount !== count) {
      fail('V9', `${row.id}: manifest wordCount ${row.wordCount} != actual ${count}`);
    }

    // V10 descriptions
    if (STALE_DESC_RE.test(String(row.description))) {
      fail('V10', `${row.id}: stale template description "${row.description}"`);
    }
    if (String(dict.description ?? '') !== String(row.description ?? '')) {
      fail('V10', `${row.id}: file description differs from manifest description`);
    }
  }

  reportAndExit();
}

function reportAndExit() {
  console.log(`Validating dictionaries in ${DICT_DIR}`);
  console.log('');
  if (warnings.length) {
    console.log(`Warnings (${warnings.length}):`);
    for (const w of warnings) console.log(`  [warn] ${w}`);
    console.log('');
  }
  if (failures.length) {
    console.log(`FAILURES (${failures.length}):`);
    for (const f of failures) console.log(`  [fail] ${f}`);
    console.log('');
    console.log(`Result: FAILED with ${failures.length} failure(s), ${warnings.length} warning(s).`);
    process.exit(1);
  }
  console.log('Result: OK — all dictionary checks passed.');
  process.exit(0);
}

main();
