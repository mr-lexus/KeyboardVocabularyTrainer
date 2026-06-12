import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../shared/api/db';
import { dictionaryApi } from '../../../entities/Dictionary/api';
import { builtInDictionaryApi, type BuiltInDictionaryMeta, type BuiltInDictionary } from '../../../entities/Dictionary/builtInApi';
import type { Dictionary } from '../../../entities/Dictionary/model';
import styles from './DictionaryManager.module.css';
import { Trash2, Plus, Lock } from 'lucide-react';
import clsx from 'clsx';

type ActiveTab = 'builtin' | 'user';

export const DictionaryManager = () => {
  const userDictionaries = useLiveQuery(() => db.dictionaries.toArray());

  const [builtInMeta, setBuiltInMeta] = useState<BuiltInDictionaryMeta[]>([]);
  const [selectedBuiltIn, setSelectedBuiltIn] = useState<BuiltInDictionary | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('builtin');
  const [selectedUserDictId, setSelectedUserDictId] = useState<string | null>(null);
  const [newDictName, setNewDictName] = useState('');

  const [newWord, setNewWord] = useState('');
  const [newTranslation, setNewTranslation] = useState('');

  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');

  useEffect(() => {
    builtInDictionaryApi.getManifest().then(setBuiltInMeta).catch(console.error);
  }, []);

  const handleSelectBuiltIn = async (id: string) => {
    const dict = await builtInDictionaryApi.getById(id);
    setSelectedBuiltIn(dict);
  };

  const handleCreateDict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDictName.trim()) return;
    const dict = await dictionaryApi.create(newDictName);
    setNewDictName('');
    setSelectedUserDictId(dict.id);
  };

  const handleDeleteDict = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await dictionaryApi.delete(id);
    if (selectedUserDictId === id) setSelectedUserDictId(null);
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserDictId || !newWord.trim() || !newTranslation.trim()) return;
    await dictionaryApi.addEntry(selectedUserDictId, newWord, newTranslation, 'en');
    setNewWord('');
    setNewTranslation('');
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserDictId || !bulkText.trim()) return;
    await dictionaryApi.bulkAddEntries(selectedUserDictId, bulkText);
    setBulkText('');
    setIsBulkMode(false);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!selectedUserDictId) return;
    await dictionaryApi.deleteEntry(selectedUserDictId, entryId);
  };

  const selectedUserDict = userDictionaries?.find((d: Dictionary) => d.id === selectedUserDictId);

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={clsx(styles.tab, activeTab === 'builtin' && styles.tabActive)}
            onClick={() => setActiveTab('builtin')}
          >
            📚 Built-in
          </button>
          <button
            className={clsx(styles.tab, activeTab === 'user' && styles.tabActive)}
            onClick={() => setActiveTab('user')}
          >
            ✏️ My Dicts
          </button>
        </div>

        {activeTab === 'builtin' && (
          <>
            <p className={styles.sidebarHint}>Read-only preloaded dictionaries</p>
            <div className={styles.list}>
              {builtInMeta.map((meta) => (
                <div
                  key={meta.id}
                  className={clsx(
                    styles.listItem,
                    selectedBuiltIn?.id === meta.id && styles.listItemSelected
                  )}
                  onClick={() => handleSelectBuiltIn(meta.id)}
                >
                  <span className={styles.listItemIcon}>{meta.emoji}</span>
                  <span className={styles.listItemName}>{meta.name}</span>
                  <span className={styles.listItemBadge}>{meta.wordCount}</span>
                  <Lock size={13} className={styles.lockIcon} />
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'user' && (
          <>
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
              {userDictionaries?.map((dict: Dictionary) => (
                <div
                  key={dict.id}
                  className={clsx(styles.listItem, selectedUserDictId === dict.id && styles.listItemSelected)}
                  onClick={() => setSelectedUserDictId(dict.id)}
                >
                  <span className={styles.listItemIcon}>📝</span>
                  <span className={styles.listItemName}>{dict.name}</span>
                  <span className={styles.listItemBadge}>{dict.entries.length}</span>
                  <button
                    className={styles.iconButton}
                    onClick={(e) => handleDeleteDict(dict.id, e)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {userDictionaries?.length === 0 && (
                <p className={styles.emptyHint}>No custom dictionaries yet.</p>
              )}
            </div>
          </>
        )}
      </aside>

      {/* Main panel */}
      <main className={styles.main}>
        {/* Built-in view */}
        {activeTab === 'builtin' && (
          selectedBuiltIn ? (
            <>
              <div className={styles.headerRow}>
                <h2 className={styles.title}>
                  {builtInMeta.find(m => m.id === selectedBuiltIn.id)?.emoji} {selectedBuiltIn.name}
                </h2>
                <span style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Lock size={14} /> Read-only · {selectedBuiltIn.entries.length} words
                </span>
              </div>
              <p className={styles.dictDescription}>{selectedBuiltIn.description}</p>
              <div className={styles.entryList}>
                {selectedBuiltIn.entries.map((entry) => (
                  <div key={entry.id} className={styles.entryItem}>
                    <span className={styles.entryWord}>{entry.word}</span>
                    <span className={styles.entryTranslation}>{entry.translation}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className={styles.placeholder}>Select a dictionary to preview</div>
          )
        )}

        {/* User dict view */}
        {activeTab === 'user' && (
          selectedUserDict ? (
            <>
              <div className={styles.headerRow}>
                <h2 className={styles.title}>{selectedUserDict.name}</h2>
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  {selectedUserDict.entries.length} words
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                  onClick={() => setIsBulkMode(false)}
                  className={styles.button}
                  style={{
                    opacity: isBulkMode ? 0.6 : 1,
                    backgroundColor: !isBulkMode ? 'var(--color-accent)' : 'var(--color-bg-primary)',
                    color: !isBulkMode ? '#000' : 'var(--color-text-primary)',
                  }}
                >
                  Single Word
                </button>
                <button
                  onClick={() => setIsBulkMode(true)}
                  className={styles.button}
                  style={{
                    opacity: !isBulkMode ? 0.6 : 1,
                    backgroundColor: isBulkMode ? 'var(--color-accent)' : 'var(--color-bg-primary)',
                    color: isBulkMode ? '#000' : 'var(--color-text-primary)',
                  }}
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
                {selectedUserDict.entries.map((entry) => (
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
            <div className={styles.placeholder}>Select a dictionary to edit</div>
          )
        )}
      </main>
    </div>
  );
};
