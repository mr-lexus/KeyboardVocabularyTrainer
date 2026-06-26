import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../shared/api/db';
import { dictionaryApi } from '../../../entities/Dictionary/api';
import { builtInDictionaryApi, type BuiltInDictionaryMeta, type BuiltInDictionary } from '../../../entities/Dictionary/builtInApi';
import type { Dictionary } from '../../../entities/Dictionary/model';
import { SaveWordButton } from './SaveWordButton/SaveWordButton';
import { SentencesModal } from './SentencesModal/SentencesModal';
import { EmojiPicker } from '../../../shared/ui/EmojiPicker/ui/EmojiPicker';
import styles from './DictionaryManager.module.scss';
import { Trash2, Plus, Lock, BookOpen, Edit2 } from 'lucide-react';
import clsx from 'clsx';

type ActiveTab = 'builtin' | 'user';

export const DictionaryManager = () => {
  const userDictionaries = useLiveQuery(() => db.dictionaries.toArray());
  const sentenceCounts = useLiveQuery(() => db.wordSentenceCounts.toArray());
  const countsMap = new Map(sentenceCounts?.map(c => [c.word, c.count]) || []);

  const [builtInMeta, setBuiltInMeta] = useState<BuiltInDictionaryMeta[]>([]);
  const [selectedBuiltIn, setSelectedBuiltIn] = useState<BuiltInDictionary | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('builtin');
  const [selectedUserDictId, setSelectedUserDictId] = useState<string | null>(null);
  const [newDictName, setNewDictName] = useState('');
  const [newDictEmoji, setNewDictEmoji] = useState('📝');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [newWord, setNewWord] = useState('');
  const [newTranslation, setNewTranslation] = useState('');

  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const [wordForSentences, setWordForSentences] = useState<string | null>(null);

  const [showEditEmojiPicker, setShowEditEmojiPicker] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitleValue, setEditingTitleValue] = useState('');

  const [isCounting, setIsCounting] = useState(false);
  const [countProgress, setCountProgress] = useState({ loaded: 0, total: 0 });

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
    const dict = await dictionaryApi.create(newDictName, newDictEmoji);
    setNewDictName('');
    setNewDictEmoji('📝');
    setShowEmojiPicker(false);
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

  const handleUpdateEmoji = async (emoji: string) => {
    if (!selectedUserDictId) return;
    await dictionaryApi.updateEmoji(selectedUserDictId, emoji);
    setShowEditEmojiPicker(false);
  };

  const handleUpdateTitle = async () => {
    if (!selectedUserDictId || !editingTitleValue.trim()) {
      setIsEditingTitle(false);
      return;
    }
    await dictionaryApi.updateName(selectedUserDictId, editingTitleValue.trim());
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUpdateTitle();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
    }
  };

  const handleCountAllSentences = async () => {
    const currentDict = activeTab === 'builtin' ? selectedBuiltIn : selectedUserDict;
    if (!currentDict) return;

    const singleWords = currentDict.entries
      .filter(e => !e.word.trim().includes(' ') || !e.translation.trim().includes(' '))
      .map(e => e.word);

    const wordsToCount = singleWords.filter(w => !countsMap.has(w));
    if (wordsToCount.length === 0) return;

    setIsCounting(true);
    try {
      const results = await builtInDictionaryApi.countSentencesForWords(wordsToCount, (loaded, total) => {
        setCountProgress({ loaded, total });
      });
      
      const toSave = Object.entries(results).map(([word, count]) => ({ word, count }));
      await db.wordSentenceCounts.bulkPut(toSave);
    } catch (e) {
      console.error('Failed to count sentences', e);
    } finally {
      setIsCounting(false);
      setCountProgress({ loaded: 0, total: 0 });
    }
  };

  const selectedUserDict = userDictionaries?.find((d: Dictionary) => d.id === selectedUserDictId);

  return (
    <div className={styles.dictionaryManager__container}>
      <aside className={styles.dictionaryManager__sidebar}>
        {/* Tabs */}
        <div className={styles.dictionaryManager__tabs}>
          <button
            className={clsx(styles.dictionaryManager__tab, activeTab === 'builtin' && styles.dictionaryManager__tab_active)}
            onClick={() => setActiveTab('builtin')}
          >
            📚 Built-in
          </button>
          <button
            className={clsx(styles.dictionaryManager__tab, activeTab === 'user' && styles.dictionaryManager__tab_active)}
            onClick={() => setActiveTab('user')}
          >
            ✏️ My Dicts
          </button>
        </div>

        {activeTab === 'builtin' && (
          <>
            <p className={styles.dictionaryManager__sidebarHint}>Read-only preloaded dictionaries</p>
            <div className={styles.dictionaryManager__list}>
              <div className={styles.dictionaryManager__groupHeader}>By Levels</div>
              {builtInMeta.filter(m => m.id.startsWith('cefr-')).map((meta) => (
                <div
                  key={meta.id}
                  className={clsx(
                    styles.dictionaryManager__listItem,
                    selectedBuiltIn?.id === meta.id && styles.dictionaryManager__listItem_selected
                  )}
                  onClick={() => handleSelectBuiltIn(meta.id)}
                >
                  <span className={styles.dictionaryManager__listItemIcon}>{meta.emoji}</span>
                  <span className={styles.dictionaryManager__listItemName}>{meta.name}</span>
                  <span className={styles.dictionaryManager__listItemBadge}>{meta.wordCount}</span>
                  <Lock size={13} className={styles.dictionaryManager__lockIcon} />
                </div>
              ))}
              
              <div className={styles.dictionaryManager__groupHeader}>By Topics</div>
              {builtInMeta.filter(m => m.id.startsWith('builtin-')).map((meta) => (
                <div
                  key={meta.id}
                  className={clsx(
                    styles.dictionaryManager__listItem,
                    selectedBuiltIn?.id === meta.id && styles.dictionaryManager__listItem_selected
                  )}
                  onClick={() => handleSelectBuiltIn(meta.id)}
                >
                  <span className={styles.dictionaryManager__listItemIcon}>{meta.emoji}</span>
                  <span className={styles.dictionaryManager__listItemName}>{meta.name}</span>
                  <span className={styles.dictionaryManager__listItemBadge}>{meta.wordCount}</span>
                  <Lock size={13} className={styles.dictionaryManager__lockIcon} />
                </div>
              ))}

              <div className={styles.dictionaryManager__groupHeader}>Phrasebooks</div>
              {builtInMeta.filter(m => m.id.startsWith('phrasebook-')).map((meta) => (
                <div
                  key={meta.id}
                  className={clsx(
                    styles.dictionaryManager__listItem,
                    selectedBuiltIn?.id === meta.id && styles.dictionaryManager__listItem_selected
                  )}
                  onClick={() => handleSelectBuiltIn(meta.id)}
                >
                  <span className={styles.dictionaryManager__listItemIcon}>{meta.emoji}</span>
                  <span className={styles.dictionaryManager__listItemName}>{meta.name}</span>
                  <span className={styles.dictionaryManager__listItemBadge}>{meta.wordCount}</span>
                  <Lock size={13} className={styles.dictionaryManager__lockIcon} />
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'user' && (
          <>
            <form onSubmit={handleCreateDict} className={styles.dictionaryManager__inputGroup} style={{ position: 'relative' }}>
              <button 
                type="button" 
                className={styles.dictionaryManager__emojiSelectBtn}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                {newDictEmoji}
              </button>
              
              {showEmojiPicker && (
                <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 9999, marginTop: '0.5rem' }}>
                  <EmojiPicker 
                    onEmojiSelect={(emoji) => {
                      setNewDictEmoji(emoji);
                      setShowEmojiPicker(false);
                    }}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                </div>
              )}

              <input
                type="text"
                className={styles.dictionaryManager__input}
                placeholder="New dictionary..."
                value={newDictName}
                onChange={(e) => setNewDictName(e.target.value)}
              />
              <button type="submit" className={styles.dictionaryManager__button}><Plus size={18} /></button>
            </form>

            <div className={styles.dictionaryManager__list}>
              {userDictionaries?.map((dict: Dictionary) => (
                <div
                  key={dict.id}
                  className={clsx(styles.dictionaryManager__listItem, selectedUserDictId === dict.id && styles.dictionaryManager__listItem_selected)}
                  onClick={() => setSelectedUserDictId(dict.id)}
                >
                  <span className={styles.dictionaryManager__listItemIcon}>{dict.emoji || '📝'}</span>
                  <span className={styles.dictionaryManager__listItemName}>{dict.name}</span>
                  <span className={styles.dictionaryManager__listItemBadge}>{dict.entries.length}</span>
                  <button
                    className={styles.dictionaryManager__iconButton}
                    onClick={(e) => handleDeleteDict(dict.id, e)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {userDictionaries?.length === 0 && (
                <p className={styles.dictionaryManager__emptyHint}>No custom dictionaries yet.</p>
              )}
            </div>
          </>
        )}
      </aside>

      {/* Main panel */}
      <main className={styles.dictionaryManager__main}>
        {/* Built-in view */}
        {activeTab === 'builtin' && (
          selectedBuiltIn ? (
            <>
              <div className={styles.dictionaryManager__headerRow}>
                <h2 className={styles.dictionaryManager__title}>
                  {builtInMeta.find(m => m.id === selectedBuiltIn.id)?.emoji} {selectedBuiltIn.name}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Lock size={14} /> Read-only · {selectedBuiltIn.entries.length} words
                  </span>
                  {(() => {
                    const wordsToCount = selectedBuiltIn.entries
                      .filter(e => !e.word.trim().includes(' ') || !e.translation.trim().includes(' '))
                      .filter(e => !countsMap.has(e.word)).length;
                    if (wordsToCount > 0) {
                      return (
                        <button 
                          className={styles.dictionaryManager__button} 
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', height: 'auto' }}
                          onClick={handleCountAllSentences}
                          disabled={isCounting}
                        >
                          {isCounting ? `Counting... ${countProgress.loaded}/${countProgress.total}` : `Count Sentences (${wordsToCount} left)`}
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
              <p className={styles.dictionaryManager__dictDescription}>{selectedBuiltIn.description}</p>
              <div className={styles.dictionaryManager__entryList}>
                {selectedBuiltIn.entries.map((entry) => {
                  const isPhrasebook = selectedBuiltIn.id.startsWith('phrasebook-') || selectedBuiltIn.id.startsWith('pb-');
                  const showSentenceSearch = !isPhrasebook;
                  return (
                    <div key={entry.id} className={styles.dictionaryManager__entryItem}>
                      <span className={styles.dictionaryManager__entryWord}>{entry.word}</span>
                      <span className={styles.dictionaryManager__entryTranslation}>{entry.translation}</span>
                      <div className={styles.dictionaryManager__entryActions}>
                        {showSentenceSearch && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {countsMap.has(entry.word) && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', minWidth: '1rem', textAlign: 'right' }}>
                                {countsMap.get(entry.word)}
                              </span>
                            )}
                            <button 
                              className={styles.dictionaryManager__iconButton}
                              onClick={() => setWordForSentences(entry.word)}
                              title="Find sentences"
                            >
                              <BookOpen size={16} />
                            </button>
                          </div>
                        )}
                        <SaveWordButton word={entry.word} translation={entry.translation} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className={styles.dictionaryManager__placeholder}>Select a dictionary to preview</div>
          )
        )}

        {/* User dict view */}
        {activeTab === 'user' && (
          selectedUserDict ? (
            <>
              <div className={styles.dictionaryManager__headerRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
                  <button 
                    className={styles.dictionaryManager__titleEmojiBtn}
                    onClick={() => setShowEditEmojiPicker(!showEditEmojiPicker)}
                    title="Change dictionary icon"
                  >
                    {selectedUserDict.emoji || '📝'}
                  </button>
                  {showEditEmojiPicker && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 9999, marginTop: '0.5rem' }}>
                      <EmojiPicker 
                        onEmojiSelect={handleUpdateEmoji}
                        onClose={() => setShowEditEmojiPicker(false)}
                      />
                    </div>
                  )}
                  {isEditingTitle ? (
                    <input 
                      type="text"
                      className={styles.dictionaryManager__titleInput}
                      value={editingTitleValue}
                      onChange={(e) => setEditingTitleValue(e.target.value)}
                      onBlur={handleUpdateTitle}
                      onKeyDown={handleTitleKeyDown}
                      autoFocus
                    />
                  ) : (
                    <>
                      <h2 className={styles.dictionaryManager__title} style={{ margin: 0 }}>{selectedUserDict.name}</h2>
                      <button 
                        className={styles.dictionaryManager__titleEditBtn}
                        onClick={() => {
                          setEditingTitleValue(selectedUserDict.name);
                          setIsEditingTitle(true);
                        }}
                        title="Rename dictionary"
                      >
                        <Edit2 size={16} />
                      </button>
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    {selectedUserDict.entries.length} words
                  </span>
                  {(() => {
                    const wordsToCount = selectedUserDict.entries
                      .filter(e => !e.word.trim().includes(' ') || !e.translation.trim().includes(' '))
                      .filter(e => !countsMap.has(e.word)).length;
                    if (wordsToCount > 0) {
                      return (
                        <button 
                          className={styles.dictionaryManager__button} 
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', height: 'auto' }}
                          onClick={handleCountAllSentences}
                          disabled={isCounting}
                        >
                          {isCounting ? `Counting... ${countProgress.loaded}/${countProgress.total}` : `Count Sentences (${wordsToCount} left)`}
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                  onClick={() => setIsBulkMode(false)}
                  className={styles.dictionaryManager__button}
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
                  className={styles.dictionaryManager__button}
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
                <form onSubmit={handleBulkImport} className={styles.dictionaryManager__inputGroup} style={{ flexDirection: 'column' }}>
                  <textarea
                    className={styles.dictionaryManager__input}
                    style={{ minHeight: '100px', resize: 'vertical' }}
                    placeholder="summer=лето;history=история"
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                  />
                  <button type="submit" className={styles.dictionaryManager__button}>Import Words</button>
                </form>
              ) : (
                <form onSubmit={handleAddEntry} className={styles.dictionaryManager__inputGroup}>
                  <input
                    type="text"
                    className={styles.dictionaryManager__input}
                    placeholder="Word (English)"
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                  />
                  <input
                    type="text"
                    className={styles.dictionaryManager__input}
                    placeholder="Translation (Russian)"
                    value={newTranslation}
                    onChange={(e) => setNewTranslation(e.target.value)}
                  />
                  <button type="submit" className={styles.dictionaryManager__button}>Add Word</button>
                </form>
              )}

              <div className={styles.dictionaryManager__entryList}>
                {selectedUserDict.entries.map((entry) => {
                  const isSingleWord = !entry.word.trim().includes(' ') || !entry.translation.trim().includes(' ');
                  return (
                    <div key={entry.id} className={styles.dictionaryManager__entryItem}>
                      <span className={styles.dictionaryManager__entryWord}>{entry.word}</span>
                      <span className={styles.dictionaryManager__entryTranslation}>{entry.translation}</span>
                      <div className={styles.dictionaryManager__entryActions}>
                        {isSingleWord && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {countsMap.has(entry.word) && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', minWidth: '1rem', textAlign: 'right' }}>
                                {countsMap.get(entry.word)}
                              </span>
                            )}
                            <button 
                              className={styles.dictionaryManager__iconButton}
                              onClick={() => setWordForSentences(entry.word)}
                              title="Find sentences"
                            >
                              <BookOpen size={16} />
                            </button>
                          </div>
                        )}
                        <SaveWordButton word={entry.word} translation={entry.translation} />
                        <button
                          className={styles.dictionaryManager__iconButton}
                          onClick={() => handleDeleteEntry(entry.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className={styles.dictionaryManager__placeholder}>Select a dictionary to edit</div>
          )
        )}
      </main>
      
      {wordForSentences && (
        <SentencesModal 
          word={wordForSentences} 
          onClose={() => setWordForSentences(null)} 
        />
      )}
    </div>
  );
};
