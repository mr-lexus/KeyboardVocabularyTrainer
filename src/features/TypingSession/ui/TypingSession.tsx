import React, { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../shared/api/db';
import { useTypingSession, type TrainingMode } from '../model/store';
import { useVoiceSettings } from '../../VoiceSettings/model/store';
import { speechApi } from '../../../shared/lib/speech';
import { VirtualKeyboard } from '../../../widgets/VirtualKeyboard';
import { HandsOverlay } from '../../../widgets/HandsOverlay';
import { getFingerForChar } from '../../../entities/Keyboard/silakka54';
import { recordKeystroke } from '../api/stats';
import { builtInDictionaryApi, type BuiltInDictionaryMeta } from '../../../entities/Dictionary/builtInApi';
import type { DictionaryEntry } from '../../../entities/Dictionary/model';
import styles from './TypingSession.module.css';
import clsx from 'clsx';

type DictionarySource = 'builtin' | 'user';

interface SelectedDictionary {
  id: string;
  source: DictionarySource;
}

export const TypingSession = () => {
  const userDictionaries = useLiveQuery(() => db.dictionaries.toArray());
  const [builtInMeta, setBuiltInMeta] = useState<BuiltInDictionaryMeta[]>([]);

  useEffect(() => {
    builtInDictionaryApi.getManifest().then(setBuiltInMeta).catch(console.error);
  }, []);

  const {
    currentDictionaryId,
    mode,
    entries,
    currentEntryIndex,
    userInput,
    isFinished,
    setDictionary,
    setMode,
    setUserInput,
    nextWord,
    resetSession,
  } = useTypingSession();

  const [selected, setSelected] = useState<SelectedDictionary | null>(null);
  const [setupMode, setSetupMode] = useState<TrainingMode>('en-ru');

  const voiceSettings = useVoiceSettings();

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis?.getVoices().filter(v => v.lang.startsWith('en')) || []);
    };
    
    loadVoices();
    if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);
  const sessionStatsRef = useRef({ startTime: 0, characters: 0, errors: 0 });

  useEffect(() => {
    if (currentDictionaryId && !isFinished) {
      inputRef.current?.focus();
      if (currentEntryIndex === 0) {
        sessionStatsRef.current = { startTime: Date.now(), characters: 0, errors: 0 };
      }
    }
  }, [currentDictionaryId, currentEntryIndex, isFinished]);

  const handleStart = async () => {
    if (!selected) return;

    let dictEntries: DictionaryEntry[];
    const dictId = selected.id;

    if (selected.source === 'builtin') {
      const dict = await builtInDictionaryApi.getById(selected.id);
      if (!dict || dict.entries.length === 0) {
        alert('Selected dictionary is empty!');
        return;
      }
      dictEntries = dict.entries;
    } else {
      const dict = await db.dictionaries.get(selected.id);
      if (!dict || dict.entries.length === 0) {
        alert('Selected dictionary is empty!');
        return;
      }
      dictEntries = dict.entries;
    }

    setMode(setupMode);
    setDictionary(dictId, dictEntries);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const currentEntry = entries[currentEntryIndex];
    if (!currentEntry) return;

    let effectiveMode = mode;
    if (mode === 'random') {
      effectiveMode = currentEntryIndex % 2 === 0 ? 'en-ru' : 'ru-en';
    }

    const targetWord = effectiveMode === 'ru-en' ? currentEntry.translation : currentEntry.word;
    const expectedChar = targetWord[userInput.length];
    const lastChar = val[val.length - 1];

    if (val.length > userInput.length && expectedChar) {
      const isCorrect = lastChar.toLowerCase() === expectedChar.toLowerCase();
      recordKeystroke(expectedChar, isCorrect);
      if (!isCorrect) {
        sessionStatsRef.current.errors += 1;
      }
    }

    setUserInput(val);

    if (val === targetWord) {
      if (voiceSettings.enabled) {
        let uriToUse = voiceSettings.voiceURI || undefined;
        if (uriToUse === 'random' && voices.length > 0) {
          const randVoice = voices[Math.floor(Math.random() * voices.length)];
          uriToUse = randVoice.voiceURI;
        } else if (uriToUse === 'random') {
          uriToUse = undefined;
        }
        speechApi.speak(currentEntry.word, 'en-US', voiceSettings.rate, uriToUse);
      }

      sessionStatsRef.current.characters += targetWord.length;

      const isLastWord = currentEntryIndex === entries.length - 1;
      if (isLastWord) {
        const durationSeconds = (Date.now() - sessionStatsRef.current.startTime) / 1000;
        const minutes = durationSeconds / 60;
        const wpm = minutes > 0 ? (sessionStatsRef.current.characters / 5) / minutes : 0;
        const totalKeystrokes = sessionStatsRef.current.characters + sessionStatsRef.current.errors;
        const accuracy = totalKeystrokes > 0 ? (sessionStatsRef.current.characters / totalKeystrokes) * 100 : 0;

        db.trainingSessions.add({
          id: crypto.randomUUID(),
          date: Date.now(),
          durationSeconds: Math.round(durationSeconds),
          charactersTyped: sessionStatsRef.current.characters,
          wpm: Math.round(wpm),
          accuracy: Math.round(accuracy),
        });
      }

      setTimeout(() => {
        nextWord();
      }, 100);
    }
  };

  if (!currentDictionaryId) {
    const hasUserDicts = (userDictionaries?.length ?? 0) > 0;
    const hasBuiltIn = builtInMeta.length > 0;

    return (
      <div className={styles.container}>
        <div className={styles.setupCard}>
          <h2 className={styles.setupTitle}>Start Training</h2>

          {/* Built-in dictionaries */}
          {hasBuiltIn && (
            <div className={styles.formGroup}>
              <label className={styles.groupLabel}>
                <span className={styles.groupLabelIcon}>📚</span>
                Built-in Dictionaries
              </label>
              <div className={styles.dictGrid}>
                {builtInMeta.map((meta) => {
                  const isActive = selected?.id === meta.id && selected?.source === 'builtin';
                  return (
                    <button
                      key={meta.id}
                      id={`dict-builtin-${meta.id}`}
                      className={clsx(styles.dictCard, isActive && styles.dictCardSelected)}
                      onClick={() => setSelected({ id: meta.id, source: 'builtin' })}
                    >
                      <span className={styles.dictEmoji}>{meta.emoji}</span>
                      <span className={styles.dictName}>{meta.name}</span>
                      <span className={styles.dictMeta}>{meta.wordCount} words</span>
                      <span className={styles.dictDesc}>{meta.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* User dictionaries */}
          {hasUserDicts && (
            <div className={styles.formGroup}>
              <label className={styles.groupLabel}>
                <span className={styles.groupLabelIcon}>✏️</span>
                My Dictionaries
              </label>
              <div className={styles.dictGrid}>
                {userDictionaries?.map((dict) => {
                  const isActive = selected?.id === dict.id && selected?.source === 'user';
                  return (
                    <button
                      key={dict.id}
                      id={`dict-user-${dict.id}`}
                      className={clsx(styles.dictCard, isActive && styles.dictCardSelected)}
                      onClick={() => setSelected({ id: dict.id, source: 'user' })}
                    >
                      <span className={styles.dictEmoji}>📝</span>
                      <span className={styles.dictName}>{dict.name}</span>
                      <span className={styles.dictMeta}>{dict.entries.length} words</span>
                      <span className={styles.dictDesc}>Custom dictionary</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!hasBuiltIn && !hasUserDicts && (
            <p className={styles.emptyHint}>
              No dictionaries available. Go to the{' '}
              <a href="#/dictionaries" className={styles.link}>Dictionaries</a> page to create one.
            </p>
          )}

          {/* Mode selector */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Training Mode</label>
            <div className={styles.modeRow}>
              {(['en-ru', 'ru-en', 'random'] as TrainingMode[]).map((m) => (
                <button
                  key={m}
                  id={`mode-${m}`}
                  className={clsx(styles.modeBtn, setupMode === m && styles.modeBtnActive)}
                  onClick={() => setSetupMode(m)}
                >
                  {m === 'en-ru' ? 'EN → RU' : m === 'ru-en' ? 'RU → EN' : '🔀 Random'}
                </button>
              ))}
            </div>
          </div>

          {/* Voice toggle */}
          <div className={styles.voiceRow}>
            <label className={styles.label}>Enable Voice</label>
            <input
              id="voice-toggle"
              type="checkbox"
              checked={voiceSettings.enabled}
              onChange={(e) => voiceSettings.setEnabled(e.target.checked)}
              className={styles.checkbox}
            />
          </div>

          {voiceSettings.enabled && voices.length > 0 && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Select Voice</label>
              <select
                className={styles.select}
                value={voiceSettings.voiceURI || ''}
                onChange={(e) => voiceSettings.setVoiceURI(e.target.value)}
              >
                <option value="">Default System Voice</option>
                <option value="random">🔀 Random English Voice</option>
                {voices.map(voice => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            id="start-training-btn"
            className={styles.startButton}
            onClick={handleStart}
            disabled={!selected}
          >
            START
          </button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className={styles.container}>
        <h2>Session Finished!</h2>
        <button className={styles.startButton} onClick={resetSession}>
          Back to Setup
        </button>
      </div>
    );
  }

  const currentEntry = entries[currentEntryIndex];
  if (!currentEntry) return null;

  let effectiveMode = mode;
  if (mode === 'random') {
    effectiveMode = currentEntryIndex % 2 === 0 ? 'en-ru' : 'ru-en';
  }

  const targetTypingWord = effectiveMode === 'ru-en' ? currentEntry.translation : currentEntry.word;
  const isError = !targetTypingWord.startsWith(userInput) && userInput.length > 0;
  const nextChar = !isError && userInput.length < targetTypingWord.length ? targetTypingWord[userInput.length] : null;
  const targetFinger = nextChar ? getFingerForChar(nextChar) : null;

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={resetSession} title="Back to Setup">
        ← Back
      </button>
      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{currentEntryIndex + 1} / {entries.length}</span>
          <span className={styles.statLabel}>Progress</span>
        </div>
        
        {voiceSettings.enabled && voices.length > 0 && (
          <div className={styles.statItem} style={{ justifyContent: 'center' }}>
            <select
              className={styles.select}
              style={{ fontSize: '0.85rem', padding: '0.4rem', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}
              value={voiceSettings.voiceURI || ''}
              onChange={(e) => voiceSettings.setVoiceURI(e.target.value)}
            >
              <option value="">Default Voice</option>
              <option value="random">🔀 Random</option>
              {voices.map(voice => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className={styles.trainingArea}>
        <div className={styles.wordDisplay}>
          {effectiveMode === 'en-ru' ? (
            <>
              <div className={styles.targetWord}>{currentEntry.word}</div>
              <div className={styles.translation}>{currentEntry.translation}</div>
            </>
          ) : (
            <>
              <div className={styles.targetWord}>{currentEntry.translation}</div>
              <div className={styles.translation} style={{ opacity: 0.5 }}>Translation: {currentEntry.word}</div>
            </>
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          className={clsx(styles.inputField, isError && styles.inputFieldError)}
          value={userInput}
          onChange={handleInputChange}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        <div style={{ marginTop: '0.5rem', width: '100%' }}>
          <VirtualKeyboard targetWord={targetTypingWord} userInput={userInput} layoutLanguage={effectiveMode === 'ru-en' ? 'ru' : 'en'} />
        </div>

        <div style={{ width: '100%' }}>
          <HandsOverlay targetFinger={targetFinger} isError={isError} />
        </div>
      </div>
    </div>
  );
};
