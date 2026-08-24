// Mechanical data-quality cleanup across ALL dictionaries (see plan todo 1).
//
// Pipeline per public/dictionaries/*.json (except manifest.json), in order:
//   a. HOMOGLYPH FIX — inside any word token mixing Latin+Cyrillic, replace
//      Cyrillic visual twins with Latin ones. entry.translation is never touched.
//   b. IN-DICT DEDUPE — drop later entries whose normalized word repeats within
//      the same dictionary (first occurrence wins); conflicting translations logged.
//   c. MULTI-SENSE CANONICALIZATION — single-word entries in cefr-*/builtin-*
//      keep only the primary sense of "a/b" translations.
//   d. DUPLICATE ENTRY-ID REPAIR — rename later duplicate ids with _d2, _d3...
//   e. CEFR CROSS-FILE DEDUPE — a single word already seen in an earlier
//      cefr-* file is removed from all later ones (no rebalancing).
//   f. DESCRIPTION UNIFICATION — stale template descriptions are replaced with
//      meaningful Russian texts in BOTH the json file and its manifest row.
//   g. Manifest wordCount refresh for every changed file + summary report.
//
// Idempotent: a second run performs zero file changes.
// Usage: node scripts/normalize-dictionaries.mjs [--dir <dictionaries-dir>]

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const dirArgIdx = process.argv.indexOf('--dir');
const dirArg = dirArgIdx !== -1 ? process.argv[dirArgIdx + 1] : undefined;
const DICT_DIR = dirArg ? path.resolve(dirArg) : path.join(ROOT, 'public', 'dictionaries');
const MANIFEST_PATH = path.join(DICT_DIR, 'manifest.json');

// --- shared normalize() semantics with scripts/build-phrasebooks.mjs ---------
function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9а-яё ]+/gi, '').replace(/\s+/g, ' ').trim();
}

// --- a. homoglyph repair ------------------------------------------------------
// Cyrillic letters that look like Latin ones (only these twins are replaced).
const CYR_TO_LAT = {
  а: 'a', е: 'e', о: 'o', р: 'p', с: 'c', у: 'y', х: 'x',
  А: 'A', В: 'B', Е: 'E', К: 'K', М: 'M', Н: 'H', О: 'O', Р: 'P', С: 'C', Т: 'T', Х: 'X',
};
const HAS_LATIN = /[a-z]/i;
const HAS_CYRILLIC = /[а-яё]/i;

function fixMixedToken(token) {
  if (!(HAS_LATIN.test(token) && HAS_CYRILLIC.test(token))) return token;
  let changed = false;
  const fixed = [...token]
    .map((ch) => {
      const lat = CYR_TO_LAT[ch];
      if (lat === undefined) return ch;
      changed = true;
      return lat;
    })
    .join('');
  return changed ? fixed : token;
}

function fixWord(word) {
  // Split keeping whitespace separators so spacing is preserved verbatim.
  return String(word).split(/(\s+)/).map((part) => (/\s/.test(part) ? part : fixMixedToken(part))).join('');
}

// --- f. description unification ----------------------------------------------
const STALE_DESC_RE = /^Phrasebook for |^Vocabulary for /;

/** id -> meaningful Russian description (what the dict contains, who needs it). */
const DESCRIPTION_FIXES = {
  'builtin-travel': 'Путешествия и места: слова для ориентирования в городе, транспорте и отелях — базовый набор для поездок за границу.',
  'builtin-home': 'Дом, быт и еда: повседневная лексика о жилье, готовке и домашних делах — для начинающих и разговорной практики.',

  'phrasebook-traveltransport': 'Фразы о путешествиях и транспорте: билеты, маршруты, багаж, ориентиры в городе. Для тех, кто ездит за рубеж и хочет объясняться самостоятельно.',
  'phrasebook-hotelaccommodation': 'Фразы для отеля и съёмного жилья: бронь, заселение, услуги номера, просьбы и жалобы. Для туристов и командировочных.',
  'phrasebook-restaurantfood': 'Фразы для кафе и ресторана: заказ, меню, счёт, особые пожелания. Для путешественников и всех, кто ест вне дома за границей.',
  'phrasebook-educationstudy': 'Фразы об учёбе: занятия, экзамены, учебники, вопросы преподавателю. Для школьников, студентов и слушателей курсов.',
  'phrasebook-hobbiesfreetime': 'Фразы о хобби и свободном времени: увлечения, планы на выходные, приглашения. Для лёгкой светской беседы и знакомств.',
  'phrasebook-familyrelationships': 'Фразы о семье и отношениях: родственники, семейные события, разговоры о близких. Для бытового общения и рассказа о себе.',
  'phrasebook-homeliving': 'Фразы о доме и быте: аренда, обустройство, соседи, домашние хлопоты. Для тех, кто живёт или собирается жить за границей.',
  'phrasebook-natureweather': 'Фразы о природе и погоде: прогноз, времена года, явления природы. Универсальная тема для светской беседы.',
  'phrasebook-artsculture': 'Фразы об искусстве и культуре: выставки, театр, музыка, впечатления. Для походов в музеи и культурных разговоров.',
  'phrasebook-laworder': 'Фразы о законе и правопорядке: полиция, документы, права, происшествия. На случай сложных ситуаций за границей.',
  'phrasebook-sciencespace': 'Фразы о науке и космосе: исследования, открытия, планеты, технологии. Для чтения новостей и обсуждения научных тем.',
  'phrasebook-politicssociety': 'Фразы о политике и обществе: выборы, законы, социальные темы, дискуссии. Для понимания новостей и споров о жизни общества.',
  'phrasebook-clothingfashion': 'Фразы об одежде и моде: покупки, размеры, стиль, примерка. Для шопинга и разговоров о стиле.',
  'phrasebook-bodyparts': 'Названия частей тела и простые фразы о самочувствии. База для визита к врачу, спортзала и описания внешности.',
  'phrasebook-colorsshapes': 'Цвета, формы и простые фразы с ними. Помогает описывать предметы, выбирать товары и понимать описания.',
  'phrasebook-animalspets': 'Фразы о животных и питомцах: породы, уход, зоомагазин, ветклиника. Для владельцев животных и любителей природы.',
  'phrasebook-sportsfitness': 'Фразы о спорте и фитнесе: тренировки, секции, соревнования, результат. Для зала, секций и разговоров о активном образе жизни.',
  'phrasebook-drivingroad': 'Фразы для водителя: дорога, правила, заправка, поломки, парковка. Для тех, кто водит за границей или арендует машину.',
  'phrasebook-financebanking': 'Фразы о деньгах и банке: карты, счета, переводы, обмен валюты. Для банковских визитов и финансовых вопросов в поездке.',
  'phrasebook-medianews': 'Фразы о медиа и новостях: статьи, репортажи, соцсети, обсуждение событий. Для чтения прессы и разговоров о текущих событиях.',
  'phrasebook-environmentecology': 'Фразы об экологии и окружающей среде: климат, переработка, защита природы. Для обсуждения экологических тем.',
  'phrasebook-communicationpost': 'Фразы об общении и почте: письма, посылки, звонки, мессенджеры. Для отделений связи и контакта с людьми.',
  'phrasebook-cookingrecipes': 'Фразы о готовке и рецептах: ингредиенты, шаги, вкус, кухонная техника. Для кулинарных экспериментов и разговоров о еде.',
  'phrasebook-geographyplaces': 'Фразы о географии и местах: страны, города, направления, достопримечательности. Для путешествий, учёбы и викторин.',
  'phrasebook-religionbeliefs': 'Фразы о религии и верованиях: традиции, праздники, обычаи, вежливые вопросы. Для межкультурного общения.',
  'phrasebook-militarywar': 'Фразы о военном деле и истории войн: техника, звания, конфликты. Для чтения новостей и исторической литературы.',
  'phrasebook-architecturebuildings': 'Фразы об архитектуре и зданиях: стили, конструкции, достопримечательности. Для экскурсий и прогулок по городу.',
  'phrasebook-agriculturefarming': 'Фразы о сельском хозяйстве: поля, урожай, животные, ферма. Для деревни, дачи и аграрных тем.',
  'phrasebook-medicinediseases': 'Фразы о медицине и болезнях: симптомы, лечение, лекарства, приём у врача. Важный набор для заботы о здоровье за границей.',
  'phrasebook-toolsequipment': 'Фразы об инструментах и оборудовании: ремонт, работа, техника безопасности. Для мастерской и бытовых задач.',
  'phrasebook-mathematicsnumbers': 'Числа, счёт и математические фразы: от арифметики до процентов. База для покупок, времени и учёбы.',
  'phrasebook-spaceastronomy': 'Фразы о космосе и астрономии: планеты, звёзды, полёты, телескопы. Для интересующихся наукой о небе.',
  'phrasebook-musicinstruments': 'Фразы о музыке и инструментах: жанры, концерты, обучение, любимые исполнители. Для музыкантов и меломанов.',
  'phrasebook-literaturebooks': 'Фразы о литературе и книгах: жанры, авторы, библиотека, мнения о прочитанном. Для читателей и книжных разговоров.',
  'phrasebook-historypast': 'Фразы об истории: эпохи, события, даты, экскурсии. Для музеев, путешествий и содержательных бесед.',
  'phrasebook-fantasymagic': 'Фразы о фэнтези и магии: сказки, герои, вымышленные миры, игры. Для фанатов жанра и игровых вселенных.',
  'phrasebook-humorjokes': 'Фразы о юморе: шутки, анекдоты, ирония, реакции на них. Чтобы понимать чужой юмор и шутить самому.',
  'phrasebook-holidayscelebrations': 'Фразы о праздниках: поздравления, подарки, традиции, застолье. Для сезонных событий и приглашений.',
  'phrasebook-describingpeople': 'Фразы для описания людей: внешность, характер, привычки. Нужно для знакомств, историй и характеристик.',
  'phrasebook-dailyroutine': 'Фразы о распорядке дня: утро, работа, вечер, планы. Основа бытового разговора о себе и своей жизни.',
  'phrasebook-complaintsdissatisfaction': 'Фразы для жалоб и недовольства: сервис, качество, возврат, претензии. На случай, когда товар или услуга не понравились.',
  'phrasebook-promisescommitments': 'Фразы об обещаниях и договорённостях: сроки, обязательства, подтверждения. Для работы и личных планов.',
  'phrasebook-sympathycondolences': 'Фразы поддержки и соболезнования: сочувствие, утешение, слова участия. Деликатный набор для трудных ситуаций.',
  'phrasebook-idiomsproverbs': 'Идиомы и пословицы: устойчивые выражения с живым русским соответствием. Для понимания носителей и богатой речи.',
  'phrasebook-slanginformal': 'Сленг и неформальная речь: разговорные словечки и дружеские фразы. Чтобы понимать сериалы и живую речь носителей.',
  'phrasebook-realestatehousing': 'Фразы о недвижимости: аренда, покупка, осмотр, договор. Для съёма и покупки жилья за границей.',
  'phrasebook-crimepolice': 'Фразы о преступлениях и полиции: заявление, кража, вызов помощи. Критичный набор на случай ЧП в поездке.',
  'phrasebook-hobbiesphotography': 'Фразы о фотографии: съёмка, камера, свет, обработка кадров. Для фотографов любого уровня.',
  'phrasebook-hobbiesgardening': 'Фразы о садоводстве: растения, уход, грядки, семена. Для дачи, сада и цветников.',
  'phrasebook-computerssoftware': 'Фразы о компьютерах и программах: настройки, ошибки, обновления, просьбы о помощи. Для работы и быта за экраном.',
  'phrasebook-personalcarehygiene': 'Фразы о личной гигиене и уходе за собой: косметика, аптека, процедуры. Для быта и покупок средств ухода.',
  'phrasebook-householdchores': 'Фразы о домашних делах: уборка, стирка, посуда, порядок в доме. Для быта и распределения обязанностей.',
  'phrasebook-schoolclassroom': 'Фразы для школы и класса: уроки, задания, правила, общение с учителем. Для учеников и родителей.',
  'phrasebook-petsdogscats': 'Фразы о собаках и кошках: породы, поведение, уход, ветеринары. Для владельцев питомцев.',
  'phrasebook-lawcourt': 'Фразы о суде и праве: процесс, адвокат, доказательства, приговор. Для юридических ситуаций и чтения новостей.',
  'phrasebook-politicselections': 'Фразы о выборах и политических кампаниях: голосование, кандидаты, дебаты. Для понимания политических процессов.',
  'phrasebook-economytrade': 'Фразы об экономике и торговле: рынки, цены, сделки, импорт и экспорт. Для деловых новостей и переговоров.',
  'phrasebook-religionspirituality': 'Фразы о религии и духовности: вера, практики, праздники, философские беседы. Для межкультурных разговоров.',
  'phrasebook-geographylandscapes': 'Фразы о ландшафтах и природе Земли: горы, реки, леса, климат. Для путешествий, учёбы и описаний мест.',
  'phrasebook-sciencephysics': 'Фразы о физике и науке: материя, энергия, законы, эксперименты. Для учёбы и научно-популярных бесед.',
  'phrasebook-mathematicsgeometry': 'Фразы о геометрии: фигуры, углы, расчёты, чертежи. Для школы, строительства и точных наук.',
  'phrasebook-historyempires': 'Фразы об империях и великих эпохах: власть, войны, расцвет и падение государств. Для любителей истории.',
  'phrasebook-artpainting': 'Фразы о живописи и изобразительном искусстве: картины, стили, художники, выставки. Для галерей и разговора об искусстве.',
  'phrasebook-technologygadgets': 'Фразы о гаджетах и технологиях: телефоны, настройки, покупки, поломки. Для техники в быту и на работе.',
  'phrasebook-internetwebsites': 'Фразы об интернете и сайтах: браузер, аккаунты, поиск, безопасность в сети. Для повседневной онлайн-жизни.',
  'phrasebook-vehiclestransport': 'Фразы о транспорте: машины, мотоциклы, обслуживание, дороги. Для водителей и любителей техники.',
  'phrasebook-materialssubstances': 'Фразы о материалах и веществах: металл, пластик, свойства, применение. Для работы, ремонта и науки.',
  'phrasebook-toolshardware': 'Фразы об инструментах и оснастке: дрели, крепёж, измерения, мастерская. Для ремонта и поделок своими руками.',
  'phrasebook-officestationery': 'Фразы про офис и канцелярию: бумаги, ручки, печать, организация рабочего места. Для офисной работы и учёбы.',
  'phrasebook-furnituredecor': 'Фразы о мебели и декоре: покупка, сборка, интерьер, перестановка. Для обустройства жилья.',
  'phrasebook-clothesaccessories': 'Фразы об одежде и аксессуарах: размер, ткань, примерка, уход за вещами. Для шопинга и гардероба.',
  'phrasebook-foodingredients': 'Фразы о продуктах: свежесть, состав, покупка, хранение. Для магазина и кухни.',
  'phrasebook-drinksbeverages': 'Фразы о напитках: кофе, чай, вода, заказ в баре. Для кафе и домашних запасов.',
  'phrasebook-moviescinema': 'Фразы о кино: жанры, сеансы, отзывы, любимые фильмы. Для кинотеатра и разговоров о фильмах.',
  'phrasebook-fitnessgym': 'Фразы для зала и фитнеса: упражнения, тренажёры, тренер, прогресс. Для тренировок и разговоров о спорте.',
  'phrasebook-mythologyfolklore': 'Фразы о мифологии и фольклоре: боги, легенды, сказания, символы. Для чтения мифов и культурных бесед.',
  'phrasebook-philosophyethics': 'Фразы о философии и этике: смысл, мораль, споры идей. Для глубоких разговоров и чтения текстов.',
  'phrasebook-psychologymind': 'Фразы о психологии: эмоции, мышление, привычки, отношения с собой. Для саморазвития и понимания людей.',
  'phrasebook-linguisticslanguages': 'Фразы о языках и лингвистике: грамматика, акцент, изучение, перевод. Для полиглотов и преподавателей.',
  'phrasebook-anthropologycultures': 'Фразы о культурах и народах: традиции, обычаи, различия, этикет. Для путешествий и межкультурного общения.',
  'phrasebook-sociologydemographics': 'Фразы об обществе и демографии: население, города, тренды, исследования. Для новостей и аналитики.',
  'phrasebook-economicsmarkets': 'Фразы об экономике и рынках: спрос, инфляция, инвестиции, кризисы. Для делового чтения и обсуждений.',
  'phrasebook-businessmanagement': 'Фразы о бизнесе и управлении: команды, задачи, встречи, решения. Для менеджеров и предпринимателей.',
  'phrasebook-marketingadvertising': 'Фразы о маркетинге и рекламе: кампании, аудитория, бренды, метрики. Для маркетологов и владельцев бизнеса.',
  'phrasebook-publicrelationsmedia': 'Фразы о PR и медиа: пресса, репутация, заявления, интервью. Для специалистов по коммуникациям и публичных профессий.',
  'phrasebook-campingoutdoors': 'Фразы для кемпинга и походов: палатка, костёр, маршрут, снаряжение. Для отдыха на природе.',
  'phrasebook-beachocean': 'Фразы о пляже и море: купание, загар, волны, отдых у воды. Для отпуска на побережье.',
  'phrasebook-wintersnow': 'Фразы о зиме и снеге: мороз, лыжи, лёд, зимние забавы. Для холодного сезона и горнолыжных поездок.',
  'phrasebook-dessertssweets': 'Фразы о десертах и сладостях: заказ, вкус, рецепты, кондитерская. Для сладкоежек и посещений кафе.',
  'phrasebook-bicyclescycling': 'Фразы о велосипедах: езда, ремонт, маршруты, экипировка. Для велолюбителей и городских поездок.',
  'phrasebook-fishingangling': 'Фразы о рыбалке: снасти, клёв, места, улов. Для рыбаков и отдыха у воды.',
  'phrasebook-videogamesshootersaction': 'Фразы из шутеров и экшен-игр: матч, команда, тактика, стриминг. Для геймеров и игровых чатов.',
  'phrasebook-videogamesrpgstrategy': 'Фразы из RPG и стратегий: квесты, прокачка, ресурсы, тактика. Для геймеров и обсуждений игр.',
};

function cefrDescription(id, cefrPartTotals) {
  const m = id.match(/^cefr-([abc][12])-(\d)$/);
  if (!m) return null;
  const level = m[1].toUpperCase();
  const part = Number(m[2]);
  const total = cefrPartTotals.get(m[1]);
  if (!total) return null;
  return `Лексика уровня ${level}, часть ${part} из ${total}`;
}

function fallbackDescription(name) {
  return `«${name}»: тематический набор английских слов и фраз тренажёра с переводом на русский.`;
}

// --- pb-* retirement migration -------------------------------------------------
/** Legacy mini-dictionaries merged into their topical phrasebooks, then deleted. */
const RETIRE_PB = {
  'pb-small-talk': 'phrasebook-smalltalkbasics.json',
  'pb-airport': 'phrasebook-attheairport.json',
  'pb-restaurant': 'phrasebook-attherestaurant.json',
  'pb-hotel': 'phrasebook-atthehotel.json',
  'pb-it-interview': 'phrasebook-jobinterview.json',
  'pb-business': 'phrasebook-workbusiness.json',
  'pb-emergency': 'phrasebook-emergencyhealth.json',
};

function retirePb() {
  const stats = { mergedEntries: 0, retiredFiles: [] };
  for (const [srcId, targetFile] of Object.entries(RETIRE_PB)) {
    const srcPath = path.join(DICT_DIR, `${srcId}.json`);
    if (!fs.existsSync(srcPath)) continue; // already retired — idempotent skip
    const src = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
    const targetPath = path.join(DICT_DIR, targetFile);
    const target = fs.existsSync(targetPath)
      ? JSON.parse(fs.readFileSync(targetPath, 'utf8'))
      : { id: targetFile.replace(/\.json$/, ''), name: srcId, description: '', entries: [] };
    target.entries = target.entries ?? [];
    const seenWords = new Set(target.entries.map((e) => normalize(String(e.word))));
    const seenIds = new Set(target.entries.map((e) => e.id));
    let moved = 0;
    for (const entry of src.entries ?? []) {
      const n = normalize(String(entry.word));
      if (n && seenWords.has(n)) continue; // already covered by the topical dictionary
      if (n) seenWords.add(n);
      let suffix = 0;
      let newId = `pbm_${srcId}_${suffix}`;
      while (seenIds.has(newId)) newId = `pbm_${srcId}_${++suffix}`;
      seenIds.add(newId);
      target.entries.push({ ...entry, id: newId });
      moved++;
    }
    fs.writeFileSync(targetPath, JSON.stringify(target, null, 2) + '\n');
    fs.unlinkSync(srcPath);
    stats.mergedEntries += moved;
    stats.retiredFiles.push(srcId);
    console.log(`[retire-pb] ${srcId}: moved ${moved} unique entries into ${targetFile}, file deleted`);
  }
  return stats;
}

// --- main ---------------------------------------------------------------------
function main() {
  const stats = {
    filesScanned: 0,
    filesChanged: 0,
    homoglyphWordsFixed: 0,
    inDictDupesDropped: 0,
    conflictingTranslations: 0,
    multiSenseCanonicalized: 0,
    dupIdsRenamed: 0,
    cefrCrossFileRemoved: 0,
    descriptionsFixed: 0,
    pbMergedEntries: 0,
    pbRetiredFiles: [],
  };

  // --- pb-* retirement runs first so merged entries flow through the pipeline ---
  const pbStats = retirePb();
  stats.pbMergedEntries = pbStats.mergedEntries;
  stats.pbRetiredFiles = pbStats.retiredFiles;

  const allFiles = fs.readdirSync(DICT_DIR)
    .filter((f) => f.endsWith('.json') && f !== 'manifest.json')
    .sort();

  // Total parts per CEFR level (for "часть N из M" descriptions).
  const cefrPartTotals = new Map();
  for (const f of allFiles) {
    const m = f.match(/^cefr-([abc][12])-\d+\.json$/);
    if (m) cefrPartTotals.set(m[1], (cefrPartTotals.get(m[1]) ?? 0) + 1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const manifestById = new Map(manifest.dictionaries.map((d) => [d.id, d]));

  const seenCefrSingleWords = new Set(); // normalized single words from earlier cefr files

  for (const fileName of allFiles) {
    const filePath = path.join(DICT_DIR, fileName);
    const originalRaw = fs.readFileSync(filePath, 'utf8');
    const dict = JSON.parse(originalRaw);
    stats.filesScanned++;
    const dictId = dict.id || fileName.replace(/\.json$/, '');
    const fileLog = [];

    // --- a. homoglyph fix on entry.word ---
    let homoglyphsHere = 0;
    for (const entry of dict.entries ?? []) {
      if (typeof entry.word !== 'string') continue;
      const fixed = fixWord(entry.word);
      if (fixed !== entry.word) {
        entry.word = fixed;
        homoglyphsHere++;
      }
    }
    if (homoglyphsHere) fileLog.push(`homoglyph words fixed: ${homoglyphsHere}`);
    stats.homoglyphWordsFixed += homoglyphsHere;

    // --- b. in-dict dedupe (keep first occurrence) ---
    const seenNorm = new Map();
    const deduped = [];
    for (const entry of dict.entries ?? []) {
      const n = normalize(String(entry.word));
      if (n && seenNorm.has(n)) {
        const first = seenNorm.get(n);
        stats.inDictDupesDropped++;
        if (normalize(String(entry.translation)) !== normalize(String(first.translation))) {
          stats.conflictingTranslations++;
          console.log(`[conflict] ${dictId}: "${entry.word}" (${entry.translation}) duplicates "${first.word}" (${first.translation}) — kept first`);
        } else {
          console.log(`[dupe] ${dictId}: dropped repeat of "${entry.word}"`);
        }
        continue;
      }
      if (n) seenNorm.set(n, entry);
      deduped.push(entry);
    }
    dict.entries = deduped;

    // --- c. multi-sense canonicalization (cefr-/builtin- single words only) ---
    if (dictId.startsWith('cefr-') || dictId.startsWith('builtin-')) {
      for (const entry of dict.entries) {
        if (typeof entry.translation !== 'string' || !entry.translation.includes('/')) continue;
        if (/\s/.test(String(entry.word).trim())) continue; // multi-word phrases untouched
        const primary = entry.translation.split('/')[0].trim();
        if (!primary) continue; // never leave an empty translation
        if (primary !== entry.translation) {
          entry.translation = primary;
          stats.multiSenseCanonicalized++;
        }
      }
    }

    // --- d. duplicate entry-id repair ---
    const idSeen = new Set();
    for (const entry of dict.entries) {
      if (!idSeen.has(entry.id)) {
        idSeen.add(entry.id);
        continue;
      }
      let suffix = 2;
      while (idSeen.has(`${entry.id}_d${suffix}`)) suffix++;
      console.log(`[dup-id] ${dictId}: renamed ${entry.id} -> ${entry.id}_d${suffix}`);
      entry.id = `${entry.id}_d${suffix}`;
      idSeen.add(entry.id);
      stats.dupIdsRenamed++;
    }

    // --- e. cefr cross-file dedupe (files processed in ascending order) ---
    if (fileName.startsWith('cefr-')) {
      const kept = [];
      for (const entry of dict.entries) {
        const n = normalize(String(entry.word));
        if (n && !n.includes(' ') && seenCefrSingleWords.has(n)) {
          console.log(`[cefr-leak] removed "${entry.word}" from ${dictId} (already in an earlier level file)`);
          stats.cefrCrossFileRemoved++;
          continue;
        }
        if (n && !n.includes(' ')) seenCefrSingleWords.add(n);
        kept.push(entry);
      }
      dict.entries = kept;
    }

    // --- f. description unification ---
    let newDescription;
    if (Object.hasOwn(DESCRIPTION_FIXES, dictId)) {
      newDescription = DESCRIPTION_FIXES[dictId];
    } else if (dictId.startsWith('cefr-')) {
      newDescription = cefrDescription(dictId, cefrPartTotals);
    }
    const row = manifestById.get(dictId);
    const currentDescription = dict.description ?? row?.description ?? '';
    if (newDescription === undefined && STALE_DESC_RE.test(currentDescription)) {
      newDescription = fallbackDescription(dict.name || row?.name || dictId);
    }
    if (newDescription && newDescription !== currentDescription) {
      dict.description = newDescription;
      stats.descriptionsFixed++;
      fileLog.push(`description updated`);
    }

    // --- write file only when content actually changed (idempotency) ---
    const serialized = JSON.stringify(dict, null, 2) + '\n';
    if (serialized !== originalRaw) {
      fs.writeFileSync(filePath, serialized);
      stats.filesChanged++;
    }

    // --- g. manifest sync for this dictionary ---
    if (row) {
      if (row.wordCount !== dict.entries.length) row.wordCount = dict.entries.length;
      if (dict.description && row.description !== dict.description) row.description = dict.description;
    }

    if (fileLog.length) {
      console.log(`[${dictId}] ${fileLog.join('; ')}`);
    }
  }

  // Retired pb-* dictionaries lose their manifest rows (idempotent).
  const beforeRows = manifest.dictionaries.length;
  manifest.dictionaries = manifest.dictionaries.filter((d) => !/^pb-/.test(d.id));
  if (manifest.dictionaries.length !== beforeRows) {
    console.log(`[retire-pb] removed ${beforeRows - manifest.dictionaries.length} pb-* manifest rows`);
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');

  // --- summary report ---------------------------------------------------------
  console.log('\nNormalize report:');
  for (const [k, v] of Object.entries(stats)) console.log(`  ${k}: ${v}`);
}

main();
