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
import styles from './TypingSession.module.css';
import clsx from 'clsx';

export const TypingSession = () => {
  const dictionaries = useLiveQuery(() => db.dictionaries.toArray());
  
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

  const [setupDictId, setSetupDictId] = useState('');
  const [setupMode, setSetupMode] = useState<TrainingMode>('en-ru');

  const voiceSettings = useVoiceSettings();

  const inputRef = useRef<HTMLInputElement>(null);
  const sessionStatsRef = useRef({ startTime: 0, characters: 0, errors: 0 });

  // Automatically focus input when session starts
  useEffect(() => {
    if (currentDictionaryId && !isFinished) {
      inputRef.current?.focus();
      // Initialize stats on start
      if (currentEntryIndex === 0) {
        sessionStatsRef.current = { startTime: Date.now(), characters: 0, errors: 0 };
      }
    }
  }, [currentDictionaryId, currentEntryIndex, isFinished]);

  const handleStart = async () => {
    if (!setupDictId) return;
    const dict = await db.dictionaries.get(setupDictId);
    if (dict && dict.entries.length > 0) {
      setMode(setupMode);
      setDictionary(dict.id, dict.entries);
    } else {
      alert('Selected dictionary is empty!');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const currentEntry = entries[currentEntryIndex];
    if (!currentEntry) return;

    const targetWord = currentEntry.word;
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
        speechApi.speak(targetWord, 'en-US', voiceSettings.rate, voiceSettings.voiceURI || undefined);
      }
      
      sessionStatsRef.current.characters += targetWord.length;
      
      const isLastWord = currentEntryIndex === entries.length - 1;
      if (isLastWord) {
        // Save session stats
        const durationSeconds = (Date.now() - sessionStatsRef.current.startTime) / 1000;
        const minutes = durationSeconds / 60;
        // words = characters / 5
        const wpm = minutes > 0 ? (sessionStatsRef.current.characters / 5) / minutes : 0;
        const totalKeystrokes = sessionStatsRef.current.characters + sessionStatsRef.current.errors;
        const accuracy = totalKeystrokes > 0 ? (sessionStatsRef.current.characters / totalKeystrokes) * 100 : 0;

        db.trainingSessions.add({
          id: crypto.randomUUID(),
          date: Date.now(),
          durationSeconds: Math.round(durationSeconds),
          charactersTyped: sessionStatsRef.current.characters,
          wpm: Math.round(wpm),
          accuracy: Math.round(accuracy)
        });
      }

      setTimeout(() => {
        nextWord();
      }, 100);
    }
  };

  if (!currentDictionaryId) {
    return (
      <div className={styles.container}>
        <div className={styles.setupCard}>
          <h2 className={styles.setupTitle}>Start Training</h2>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Select Dictionary</label>
            <select 
              className={styles.select}
              value={setupDictId}
              onChange={(e) => setSetupDictId(e.target.value)}
            >
              <option value="" disabled>-- Select a dictionary --</option>
              {dictionaries?.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.entries.length} words)</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Mode</label>
            <select 
              className={styles.select}
              value={setupMode}
              onChange={(e) => setSetupMode(e.target.value as TrainingMode)}
            >
              <option value="en-ru">English → Russian</option>
              <option value="ru-en">Russian → English</option>
              <option value="random">Random</option>
            </select>
          </div>

          <div className={styles.formGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
            <label className={styles.label}>Enable Voice</label>
            <input 
              type="checkbox" 
              checked={voiceSettings.enabled} 
              onChange={(e) => voiceSettings.setEnabled(e.target.checked)} 
              style={{ width: '1.5rem', height: '1.5rem' }}
            />
          </div>

          <button 
            className={styles.startButton}
            onClick={handleStart}
            disabled={!setupDictId}
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

  // Determine what to show based on mode
  let effectiveMode = mode;
  if (mode === 'random') {
    // Determine pseudo-randomly based on index so it doesn't change on re-renders
    effectiveMode = currentEntryIndex % 2 === 0 ? 'en-ru' : 'ru-en';
  }

  const targetTypingWord = currentEntry.word;
  const isError = !targetTypingWord.startsWith(userInput) && userInput.length > 0;
  const nextChar = !isError && userInput.length < targetTypingWord.length ? targetTypingWord[userInput.length] : null;
  const targetFinger = nextChar ? getFingerForChar(nextChar) : null;

  return (
    <div className={styles.container}>
      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{currentEntryIndex + 1} / {entries.length}</span>
          <span className={styles.statLabel}>Progress</span>
        </div>
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
              {/* Maybe hint can be shown if needed, or leave hidden */}
              <div className={styles.translation} style={{ opacity: 0.5 }}>Type: {currentEntry.word}</div>
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
        
        {/* Virtual Keyboard */}
        <div style={{ marginTop: '0.5rem', width: '100%' }}>
          <VirtualKeyboard targetWord={targetTypingWord} userInput={userInput} />
        </div>

        {/* Hands Overlay */}
        <div style={{ width: '100%' }}>
          <HandsOverlay targetFinger={targetFinger} isError={isError} />
        </div>
      </div>
    </div>
  );
};
