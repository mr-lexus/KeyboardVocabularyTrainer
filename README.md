# Keyboard Vocabulary Trainer
## RUS

[**🔗 Попробовать демо (Live Demo)**](https://mr-lexus.github.io/KeyboardVocabularyTrainer/)

**Keyboard Vocabulary Trainer** — это интерактивное веб-приложение, созданное для одновременной тренировки навыка слепой печати и изучения иностранной лексики (англо-русский словарь).

### 💡 Идея проекта
Главная идея заключается в объединении развития мышечной памяти и изучения языка. Вместо бессмысленного набора случайных символов или стандартных текстов, вы печатаете слова из выбранного словаря. Вы видите слово, его перевод, а приложение подсказывает, каким пальцем нажимать следующую клавишу. Такой двойной подход делает обучение печати и запоминание новых слов более увлекательным и эффективным.

### ✨ Основные возможности
- **Помощник слепой печати**: Виртуальная клавиатура и визуализация рук на экране подсвечивают правильный палец для каждого нажатия.
- **Несколько режимов тренировки**:
  - **EN → RU**: Печатайте английское слово, видя его русский перевод.
  - **RU → EN**: Печатайте русское слово для практики кириллической раскладки, видя его английский перевод.
  - **Случайный**: Динамическое чередование обоих направлений.
- **Словари**: 195 встроенных словарей (50 000+ записей) — от уровней CEFR до разговорников; также можно создавать собственные словари под свои темы.
- **Озвучивание (Text-to-Speech)**: Автоматическое произношение слова после его правильного набора для улучшения восприятия на слух.
- **Аналитика и статистика**: Отслеживайте свой прогресс с помощью подробных метрик, включая скорость печати (знаков в минуту), точность и продолжительность сессий.
- **Локальное сохранение**: Ваш прогресс и пользовательские словари надежно сохраняются прямо в браузере.

### 📚 Коллекция словарей
- **Уровни CEFR (18 словарей)**: лексика от A1 до C2, разбитая на части — удобно расти постепенно.
- **Базовые темы (24 словаря)**: основы английского, путешествия, IT, еда, бизнес, здоровье, наука и другое.
- **Разговорники (153 словаря)**: живые фразы для реальных ситуаций — бытовые сценарии (граница, аптека, заправка, прачечная, концерты, аренда авто), профессиональные пакеты (AI/ML, DevOps, продакт-менеджмент, поддержка), хобби (настольные игры, дроны и FPV, умный дом, 3D-печать) и десятки других тем: спорт, кино, мифология, садоводство, симрейсинг и т.д.

---
## ENG

[**🔗 Try the Demo**](https://mr-lexus.github.io/KeyboardVocabularyTrainer/)

**Keyboard Vocabulary Trainer** is an interactive web application designed to help users simultaneously improve their touch-typing skills and learn foreign vocabulary (English-Russian).

### 💡 The Idea
The core idea is to combine muscle memory training with language acquisition. Instead of mindlessly typing random characters or standard texts, you type words from a selected vocabulary list. You see the word, its translation, and the application guides you on which finger to use for the next character. This dual-focus approach makes both learning to type and learning new words more engaging and efficient.

### ✨ Key Features
- **Touch-Typing Guidance**: On-screen virtual keyboard and hands overlay highlight the correct finger for each keystroke.
- **Multiple Training Modes**:
  - **EN → RU**: Type the English word while seeing its Russian translation.
  - **RU → EN**: Type the Russian word to practice the Cyrillic keyboard layout while seeing its English translation.
  - **Random**: Mixes both directions for a dynamic challenge.
- **Dictionaries**: 195 built-in dictionaries (50,000+ entries) — from CEFR levels to phrasebooks; you can also create your own custom dictionaries for specific topics.
- **Speech Synthesis (Text-to-Speech)**: Automatically pronounces the word upon successful typing to improve listening comprehension and pronunciation.
- **Analytics & Statistics**: Track your progress with detailed metrics including Words Per Minute (WPM), accuracy, and session duration.
- **Offline Support**: Progress and custom dictionaries are saved locally in your browser.

### 📚 Dictionary Collection
- **CEFR Levels (18 dictionaries)**: vocabulary from A1 to C2 split into parts — grow step by step.
- **Core Topics (24 dictionaries)**: English basics, travel, IT, food, business, health, science and more.
- **Phrasebooks (153 dictionaries)**: real-speech phrases for practical situations — everyday scenarios (border control, pharmacy, gas station, laundromat, concerts, car rental), professional packs (AI/ML, DevOps, product management, customer support), hobby verticals (board games, drones & FPV, smart home, 3D printing) plus dozens of other topics: sports, movies, mythology, gardening, sim racing, etc.

### 🛠 Development
Dictionary content is generated and quality-checked by a reproducible pipeline (plain Node ESM, no extra dependencies):

```bash
yarn dicts:build     # rebuild phrasebooks + run the normalize/cleanup pass
yarn dicts:validate  # validation gate: schema, duplicates, homoglyphs, counts, descriptions
```

`yarn dicts:validate` also runs automatically in CI before every deploy, so broken dictionary data never reaches production.
