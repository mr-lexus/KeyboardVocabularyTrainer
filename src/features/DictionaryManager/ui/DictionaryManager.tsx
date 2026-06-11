import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../shared/api/db';
import { dictionaryApi } from '../../../entities/Dictionary/api';
import styles from './DictionaryManager.module.css';
import { Trash2, Plus } from 'lucide-react';
import clsx from 'clsx';

export const DictionaryManager = () => {
  const dictionaries = useLiveQuery(() => db.dictionaries.toArray());
  const [selectedDictId, setSelectedDictId] = useState<string | null>(null);
  const [newDictName, setNewDictName] = useState('');
  
  const [newWord, setNewWord] = useState('');
  const [newTranslation, setNewTranslation] = useState('');
  
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const handleCreateDict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDictName.trim()) return;
    const dict = await dictionaryApi.create(newDictName);
    setNewDictName('');
    setSelectedDictId(dict.id);
  };

  const handleDeleteDict = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await dictionaryApi.delete(id);
    if (selectedDictId === id) setSelectedDictId(null);
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDictId || !newWord.trim() || !newTranslation.trim()) return;
    
    await dictionaryApi.addEntry(selectedDictId, newWord, newTranslation, 'en');
    setNewWord('');
    setNewTranslation('');
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDictId || !bulkText.trim()) return;
    await dictionaryApi.bulkAddEntries(selectedDictId, bulkText);
    setBulkText('');
    setIsBulkMode(false);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!selectedDictId) return;
    await dictionaryApi.deleteEntry(selectedDictId, entryId);
  };

  const selectedDict = dictionaries?.find(d => d.id === selectedDictId);

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <h2 className={styles.title}>Dictionaries</h2>
        
        <form onSubmit={handleCreateDict} className={styles.inputGroup}>
          <input 
            type="text" 
            className={styles.input} 
            placeholder="New dictionary..."
            value={newDictName}
            onChange={(e) => setNewDictName(e.target.value)}
          />
          <button type="submit" className={styles.button}><Plus size={18} /></button>
        </form>

        <div className={styles.list}>
          {dictionaries?.map(dict => (
            <div 
              key={dict.id} 
              className={clsx(styles.listItem, selectedDictId === dict.id && styles.listItemSelected)}
              onClick={() => setSelectedDictId(dict.id)}
            >
              <span>{dict.name}</span>
              <button 
                className={styles.iconButton} 
                onClick={(e) => handleDeleteDict(dict.id, e)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {dictionaries?.length === 0 && (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>No dictionaries yet.</p>
          )}
        </div>
      </aside>

      <main className={styles.main}>
        {selectedDict ? (
          <>
            <div className={styles.headerRow}>
              <h2 className={styles.title}>{selectedDict.name}</h2>
              <span style={{ color: 'var(--color-text-secondary)' }}>
                {selectedDict.entries.length} words
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button 
                onClick={() => setIsBulkMode(false)} 
                className={styles.button}
                style={{ opacity: isBulkMode ? 0.6 : 1, backgroundColor: !isBulkMode ? 'var(--color-accent)' : 'var(--color-bg-primary)', color: !isBulkMode ? '#000' : 'var(--color-text-primary)' }}
              >
                Single Word
              </button>
              <button 
                onClick={() => setIsBulkMode(true)} 
                className={styles.button}
                style={{ opacity: !isBulkMode ? 0.6 : 1, backgroundColor: isBulkMode ? 'var(--color-accent)' : 'var(--color-bg-primary)', color: isBulkMode ? '#000' : 'var(--color-text-primary)' }}
              >
                Bulk Import
              </button>
            </div>

            {isBulkMode ? (
              <form onSubmit={handleBulkImport} className={styles.inputGroup} style={{ flexDirection: 'column' }}>
                <textarea 
                  className={styles.input} 
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  placeholder="summer=лето;history=история"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                />
                <button type="submit" className={styles.button}>Import Words</button>
              </form>
            ) : (
              <form onSubmit={handleAddEntry} className={styles.inputGroup}>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="Word (English)"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                />
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="Translation (Russian)"
                  value={newTranslation}
                  onChange={(e) => setNewTranslation(e.target.value)}
                />
                <button type="submit" className={styles.button}>Add Word</button>
              </form>
            )}

            <div className={styles.entryList}>
              {selectedDict.entries.map(entry => (
                <div key={entry.id} className={styles.entryItem}>
                  <span className={styles.entryWord}>{entry.word}</span>
                  <span className={styles.entryTranslation}>{entry.translation}</span>
                  <button 
                    className={styles.iconButton}
                    onClick={() => handleDeleteEntry(entry.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-secondary)' }}>
            Select a dictionary to edit
          </div>
        )}
      </main>
    </div>
  );
};
