import React, { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../shared/api/db';
import { useTypingSession, type TrainingMode } from '../model/store';
import { useProgressStore } from '../model/progressStore';
import { useDisplaySettings } from '../model/displayStore';
import { useVoiceSettings, type PlayTiming } from '../../VoiceSettings/model/store';
import { SaveWordButton } from '../../DictionaryManager';
import { speechApi } from '../../../shared/lib/speech';
import { VirtualKeyboard } from '../../../widgets/VirtualKeyboard';
import { HandsOverlay } from '../../../widgets/HandsOverlay';
import { layouts, getFingerForChar } from '../../../entities/Keyboard';
import { recordKeystroke } from '../api/stats';
import { builtInDictionaryApi, type BuiltInDictionaryMeta } from '../../../entities/Dictionary/builtInApi';
import type { DictionaryEntry } from '../../../entities/Dictionary/model';
import { Volume2, Keyboard as KeyboardIcon, Hand } from 'lucide-react';
import styles from './TypingSession.module.scss';
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
    setLayout,
    selectedLayoutId,
    nextWord,
    resetSession,
  } = useTypingSession();

  const [selected, setSelected] = useState<SelectedDictionary | null>(null);
  const [setupMode, setSetupMode] = useState<TrainingMode>('en-ru');

  const voiceSettings = useVoiceSettings();
  const displaySettings = useDisplaySettings();

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      const loaded = window.speechSynthesis?.getVoices().filter(v => v.lang.startsWith('en')) || [];
      setVoices(loaded);
      
      if (!useVoiceSettings.getState().voiceURI && loaded.length > 0) {
        const karen = loaded.find(v => v.name.includes('Karen'));
        if (karen) {
          useVoiceSettings.getState().setVoiceURI(karen.voiceURI);
        }
      }
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

  const playCurrentWordVoice = React.useCallback((wordToPlay?: string) => {
    const entry = entries[currentEntryIndex];
    const word = wordToPlay || entry?.word;
    if (!word) return;

    let uriToUse = voiceSettings.voiceURI || undefined;
    if (uriToUse === 'random' && voices.length > 0) {
      const randVoice = voices[Math.floor(Math.random() * voices.length)];
      uriToUse = randVoice.voiceURI;
    } else if (uriToUse === 'random') {
      uriToUse = undefined;
    }
    speechApi.speak(word, 'en-US', voiceSettings.rate, uriToUse);
  }, [entries, currentEntryIndex, voices, voiceSettings.voiceURI, voiceSettings.rate]);

  useEffect(() => {
    if (currentDictionaryId && !isFinished && entries[currentEntryIndex]) {
      if (voiceSettings.enabled && voiceSettings.playTiming === 'before') {
        setTimeout(() => playCurrentWordVoice(entries[currentEntryIndex].word), 50);
      }
    }
  }, [currentDictionaryId, currentEntryIndex, isFinished, voiceSettings.enabled, voiceSettings.playTiming, entries, playCurrentWordVoice]);

  const { progress } = useProgressStore();

  const handleStart = async (resume: boolean = false) => {
    if (!selected) return;
    const dictId = selected.id;

    if (resume) {
      const saved = progress[dictId];
      if (saved) {
        setMode(saved.mode);
        setDictionary(dictId, saved.entries, saved.currentEntryIndex);
        return;
      }
    }

    let dictEntries: DictionaryEntry[];

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
      recordKeystroke(expectedChar, isCorrect, layouts[selectedLayoutId]);
      if (!isCorrect) {
        sessionStatsRef.current.errors += 1;
      }
    }

    setUserInput(val);

    if (val === targetWord) {
      if (voiceSettings.enabled && voiceSettings.playTiming === 'after') {
        playCurrentWordVoice(currentEntry.word);
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
      <div className={styles.typingSession__container}>
        <div className={styles.typingSession__setupLayout}>
          <div className={styles.typingSession__setupMain}>
            <div className={styles.typingSession__setupCard}>
              <h2 className={styles.typingSession__setupTitle}>Start Training</h2>

              {/* Built-in dictionaries */}
              {hasBuiltIn && (
                <div className={styles.typingSession__formGroup}>
                  <label className={styles.typingSession__groupLabel}>
                    <span className={styles.typingSession__groupLabelIcon}>📚</span>
                    Built-in Dictionaries
                  </label>

                  <div className={styles.typingSession__subGroupHeader}>By Levels</div>
                  <div className={styles.typingSession__dictGrid}>
                    {builtInMeta.filter(m => m.id.startsWith('cefr-')).map((meta) => {
                      const isActive = selected?.id === meta.id && selected?.source === 'builtin';
                      return (
                        <button
                          key={meta.id}
                          id={`dict-builtin-${meta.id}`}
                          className={clsx(styles.typingSession__dictCard, isActive && styles.typingSession__dictCard_selected)}
                          onClick={() => setSelected({ id: meta.id, source: 'builtin' })}
                        >
                          <span className={styles.typingSession__dictEmoji}>{meta.emoji}</span>
                          <span className={styles.typingSession__dictName}>{meta.name}</span>
                          <span className={styles.typingSession__dictMeta}>
                            {meta.wordCount} words
                            {progress[meta.id] ? ` (${Math.round((progress[meta.id].currentEntryIndex / progress[meta.id].entries.length) * 100)}%)` : ''}
                          </span>
                          <span className={styles.typingSession__dictDesc}>{meta.description}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className={styles.typingSession__subGroupHeader}>By Topics</div>
                  <div className={styles.typingSession__dictGrid}>
                    {builtInMeta.filter(m => m.id.startsWith('builtin-')).map((meta) => {
                      const isActive = selected?.id === meta.id && selected?.source === 'builtin';
                      return (
                        <button
                          key={meta.id}
                          id={`dict-builtin-${meta.id}`}
                          className={clsx(styles.typingSession__dictCard, isActive && styles.typingSession__dictCard_selected)}
                          onClick={() => setSelected({ id: meta.id, source: 'builtin' })}
                        >
                          <span className={styles.typingSession__dictEmoji}>{meta.emoji}</span>
                          <span className={styles.typingSession__dictName}>{meta.name}</span>
                          <span className={styles.typingSession__dictMeta}>
                            {meta.wordCount} words
                            {progress[meta.id] ? ` (${Math.round((progress[meta.id].currentEntryIndex / progress[meta.id].entries.length) * 100)}%)` : ''}
                          </span>
                          <span className={styles.typingSession__dictDesc}>{meta.description}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className={styles.typingSession__subGroupHeader}>Phrasebooks</div>
                  <div className={styles.typingSession__dictGrid}>
                    {builtInMeta.filter(m => m.id.startsWith('phrasebook-')).map((meta) => {
                      const isActive = selected?.id === meta.id && selected?.source === 'builtin';
                      return (
                        <button
                          key={meta.id}
                          id={`dict-builtin-${meta.id}`}
                          className={clsx(styles.typingSession__dictCard, isActive && styles.typingSession__dictCard_selected)}
                          onClick={() => setSelected({ id: meta.id, source: 'builtin' })}
                        >
                          <span className={styles.typingSession__dictEmoji}>{meta.emoji}</span>
                          <span className={styles.typingSession__dictName}>{meta.name}</span>
                          <span className={styles.typingSession__dictMeta}>
                            {meta.wordCount} words
                            {progress[meta.id] ? ` (${Math.round((progress[meta.id].currentEntryIndex / progress[meta.id].entries.length) * 100)}%)` : ''}
                          </span>
                          <span className={styles.typingSession__dictDesc}>{meta.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* User dictionaries */}
              {hasUserDicts && (
                <div className={styles.typingSession__formGroup}>
                  <label className={styles.typingSession__groupLabel}>
                    <span className={styles.typingSession__groupLabelIcon}>✏️</span>
                    My Dictionaries
                  </label>
                  <div className={styles.typingSession__dictGrid}>
                    {userDictionaries?.map((dict) => {
                      const isActive = selected?.id === dict.id && selected?.source === 'user';
                      return (
                        <button
                          key={dict.id}
                          id={`dict-user-${dict.id}`}
                          className={clsx(styles.typingSession__dictCard, isActive && styles.typingSession__dictCard_selected)}
                          onClick={() => setSelected({ id: dict.id, source: 'user' })}
                        >
                          <span className={styles.typingSession__dictEmoji}>{dict.emoji || '📝'}</span>
                          <span className={styles.typingSession__dictName}>{dict.name}</span>
                          <span className={styles.typingSession__dictMeta}>
                            {dict.entries.length} words
                            {progress[dict.id] ? ` (${Math.round((progress[dict.id].currentEntryIndex / progress[dict.id].entries.length) * 100)}%)` : ''}
                          </span>
                          <span className={styles.typingSession__dictDesc}>Custom dictionary</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {!hasBuiltIn && !hasUserDicts && (
                <p className={styles.typingSession__emptyHint}>
                  No dictionaries available. Go to the{' '}
                  <a href="#/dictionaries" className={styles.typingSession__link}>Dictionaries</a> page to create one.
                </p>
              )}
            </div>
          </div>

          {/* Settings Sidebar */}
          <div className={styles.typingSession__setupSidebar}>
            {/* Mode selector */}
            <div className={styles.typingSession__formGroup}>
              <label className={styles.typingSession__label}>Training Mode</label>
              <div className={styles.typingSession__modeRow}>
                {(['en-ru', 'ru-en', 'random'] as TrainingMode[]).map((m) => (
                  <button
                    key={m}
                    id={`mode-${m}`}
                    className={clsx(styles.typingSession__modeBtn, setupMode === m && styles.typingSession__modeBtn_active)}
                    onClick={() => setSetupMode(m)}
                  >
                    {m === 'en-ru' ? 'EN → RU' : m === 'ru-en' ? 'RU → EN' : 'Random'}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout selector */}
            <div className={styles.typingSession__formGroup}>
              <label className={styles.typingSession__label}>Keyboard Layout</label>
              <div className={styles.typingSession__modeRow}>
                {Object.keys(layouts).map((layoutId) => (
                  <button
                    key={layoutId}
                    className={clsx(styles.typingSession__modeBtn, selectedLayoutId === layoutId && styles.typingSession__modeBtn_active)}
                    onClick={() => setLayout(layoutId)}
                  >
                    {layouts[layoutId].name}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice toggle */}
            <div className={styles.typingSession__formGroup}>
              <div className={styles.typingSession__voiceRow}>
                <label className={styles.typingSession__label}>Enable Voice</label>
                <input
                  id="voice-toggle"
                  type="checkbox"
                  checked={voiceSettings.enabled}
                  onChange={(e) => voiceSettings.setEnabled(e.target.checked)}
                  className={styles.typingSession__checkbox}
                />
              </div>
              {voiceSettings.enabled && (
                <div className={styles.typingSession__modeRow} style={{ marginTop: '0.5rem' }}>
                  <button
                    className={clsx(styles.typingSession__modeBtn, voiceSettings.playTiming === 'before' && styles.typingSession__modeBtn_active)}
                    onClick={() => voiceSettings.setPlayTiming('before')}
                  >
                    Before typing
                  </button>
                  <button
                    className={clsx(styles.typingSession__modeBtn, voiceSettings.playTiming === 'after' && styles.typingSession__modeBtn_active)}
                    onClick={() => voiceSettings.setPlayTiming('after')}
                  >
                    After correct
                  </button>
                </div>
              )}
            </div>

            {voiceSettings.enabled && voices.length > 0 && (
              <div className={styles.typingSession__formGroup}>
                <label className={styles.typingSession__label}>Select Voice</label>
                <select
                  className={styles.typingSession__select}
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

            {/* Display Settings */}
            <div className={styles.typingSession__formGroup}>
              <div className={styles.typingSession__voiceRow}>
                <label className={styles.typingSession__label}>Show Keyboard</label>
                <input
                  type="checkbox"
                  checked={displaySettings.showKeyboard}
                  onChange={(e) => displaySettings.setShowKeyboard(e.target.checked)}
                  className={styles.typingSession__checkbox}
                />
              </div>
              <div className={styles.typingSession__voiceRow}>
                <label className={styles.typingSession__label}>Show Hands</label>
                <input
                  type="checkbox"
                  checked={displaySettings.showHands}
                  onChange={(e) => displaySettings.setShowHands(e.target.checked)}
                  className={styles.typingSession__checkbox}
                />
              </div>
            </div>

            {selected && progress[selected.id] ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  className={styles.typingSession__startButton}
                  style={{ padding: '0.6rem', fontSize: '0.95rem' }}
                  onClick={() => handleStart(true)}
                  disabled={!selected}
                >
                  Continue ({progress[selected.id].currentEntryIndex}/{progress[selected.id].entries.length})
                </button>
                <button
                  className={styles.typingSession__startButton}
                  style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', marginTop: 0, padding: '0.6rem', fontSize: '0.9rem', fontWeight: '500' }}
                  onClick={() => handleStart(false)}
                  disabled={!selected}
                >
                  Start Over
                </button>
              </div>
            ) : (
              <button
                id="start-training-btn"
                className={styles.typingSession__startButton}
                style={{ marginTop: '1rem' }}
                onClick={() => handleStart(false)}
                disabled={!selected}
              >
                Start
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className={styles.typingSession__container}>
        <h2>Session Finished!</h2>
        <button className={styles.typingSession__startButton} onClick={resetSession}>
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
  const targetFinger = nextChar ? getFingerForChar(nextChar, layouts[selectedLayoutId]) : null;

  return (
    <div className={styles.typingSession__container}>
      <button className={styles.typingSession__backButton} onClick={resetSession} title="Back to Setup">
        ← Back
      </button>
      <div className={styles.typingSession__statsRow}>
        <div className={styles.typingSession__statItem}>
          <span className={styles.typingSession__statValue}>{currentEntryIndex + 1} / {entries.length}</span>
          <span className={styles.typingSession__statLabel}>Progress</span>
        </div>
        
        {voiceSettings.enabled && voices.length > 0 && (
          <div className={styles.typingSession__statItem} style={{ justifyContent: 'center', gap: '0.2rem' }}>
            <select
              className={styles.typingSession__select}
              style={{ fontSize: '0.85rem', padding: '0.4rem', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}
              value={voiceSettings.voiceURI || ''}
              onChange={(e) => voiceSettings.setVoiceURI(e.target.value)}
            >
              <option value="">Default Voice</option>
              <option value="random">Random</option>
              {voices.map(voice => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name}
                </option>
              ))}
            </select>
            <select
              className={styles.typingSession__select}
              style={{ fontSize: '0.8rem', padding: '0.2rem', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}
              value={voiceSettings.playTiming}
              onChange={(e) => voiceSettings.setPlayTiming(e.target.value as PlayTiming)}
            >
              <option value="before">Before input</option>
              <option value="after">After correct</option>
            </select>
          </div>
        )}
        
        <div className={styles.typingSession__statItem} style={{ justifyContent: 'center' }}>
          <select
            className={styles.typingSession__select}
            style={{ fontSize: '0.85rem', padding: '0.4rem', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}
            value={selectedLayoutId}
            onChange={(e) => setLayout(e.target.value)}
          >
            {Object.keys(layouts).map(id => (
              <option key={id} value={id}>
                {layouts[id].name.split(' ')[0]}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.typingSession__statItem} style={{ flexDirection: 'row', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
          <button
            className={clsx(styles.typingSession__iconToggleBtn, displaySettings.showKeyboard && styles.typingSession__iconToggleBtn_active)}
            onClick={() => displaySettings.setShowKeyboard(!displaySettings.showKeyboard)}
            title="Toggle Keyboard"
            tabIndex={-1}
          >
            <KeyboardIcon size={18} />
          </button>
          <button
            className={clsx(styles.typingSession__iconToggleBtn, displaySettings.showHands && styles.typingSession__iconToggleBtn_active)}
            onClick={() => displaySettings.setShowHands(!displaySettings.showHands)}
            title="Toggle Hands"
            tabIndex={-1}
          >
            <Hand size={18} />
          </button>
        </div>
      </div>

      <div className={styles.typingSession__trainingArea}>
        <div className={styles.typingSession__wordDisplay}>
          {effectiveMode === 'en-ru' ? (
            <>
              <div className={styles.typingSession__targetWord}>
                {currentEntry.word}
                {voiceSettings.enabled && (
                  <button 
                    className={styles.typingSession__playButton} 
                    onClick={() => playCurrentWordVoice(currentEntry.word)}
                    title="Play pronunciation"
                    tabIndex={-1}
                  >
                    <Volume2 size={24} />
                  </button>
                )}
                <SaveWordButton word={currentEntry.word} translation={currentEntry.translation} />
              </div>
              <div className={styles.typingSession__translation}>{currentEntry.translation}</div>
            </>
          ) : (
            <>
              <div className={styles.typingSession__targetWord}>
                {currentEntry.translation}
                <SaveWordButton word={currentEntry.word} translation={currentEntry.translation} />
              </div>
              <div className={styles.typingSession__translation} style={{ opacity: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                Translation: {currentEntry.word}
                {voiceSettings.enabled && (
                  <button 
                    className={styles.typingSession__playButton} 
                    onClick={() => playCurrentWordVoice(currentEntry.word)}
                    title="Play pronunciation"
                    style={{ width: 'auto', height: 'auto', padding: '0.2rem' }}
                    tabIndex={-1}
                  >
                    <Volume2 size={18} />
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          className={clsx(styles.typingSession__inputField, isError && styles.typingSession__inputField_error)}
          value={userInput}
          onChange={handleInputChange}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        {displaySettings.showKeyboard && (
          <div style={{ marginTop: '0.5rem', width: '100%' }}>
            <VirtualKeyboard 
              targetWord={targetTypingWord} 
              userInput={userInput} 
              layoutLanguage={effectiveMode === 'ru-en' ? 'ru' : 'en'} 
              layout={layouts[selectedLayoutId]}
            />
          </div>
        )}

        {displaySettings.showHands && (
          <div style={{ width: '100%' }}>
            <HandsOverlay targetFinger={targetFinger} isError={isError} />
          </div>
        )}
      </div>
    </div>
  );
};
