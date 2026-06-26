import React, { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../../shared/api/db';
import { dictionaryApi } from '../../../../entities/Dictionary/api';
import { Bookmark, Plus, Check } from 'lucide-react';
import styles from './SaveWordButton.module.scss';
import clsx from 'clsx';

interface SaveWordButtonProps {
  word: string;
  translation: string;
}

export const SaveWordButton: React.FC<SaveWordButtonProps> = ({ word, translation }) => {
  const userDictionaries = useLiveQuery(() => db.dictionaries.toArray());
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!userDictionaries) return null;

  const dictsContainingWord = userDictionaries.filter(dict => 
    dict.entries.some(e => e.word.toLowerCase() === word.toLowerCase())
  );
  const isSaved = dictsContainingWord.length > 0;

  const toggleDictionary = async (dictId: string) => {
    const dict = userDictionaries.find(d => d.id === dictId);
    if (!dict) return;

    const existingEntry = dict.entries.find(e => e.word.toLowerCase() === word.toLowerCase());
    
    if (existingEntry) {
      await dictionaryApi.deleteEntry(dictId, existingEntry.id);
    } else {
      await dictionaryApi.addEntry(dictId, word, translation);
    }
  };

  return (
    <div className={styles.saveWordBtn__container} ref={dropdownRef}>
      <button 
        className={clsx(styles.saveWordBtn__button, isSaved && styles.saveWordBtn__button_saved)}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        title="Save to user dictionary"
        tabIndex={-1}
      >
        <Bookmark size={20} fill={isSaved ? 'currentColor' : 'none'} />
      </button>

      {isOpen && (
        <div className={styles.saveWordBtn__dropdown}>
          <div className={styles.saveWordBtn__dropdownHeader}>Save to dictionary</div>
          {userDictionaries.length === 0 ? (
            <div className={styles.saveWordBtn__emptyMsg}>No dictionaries found. Go to Dictionaries page to create one.</div>
          ) : (
            <div className={styles.saveWordBtn__dictList}>
              {userDictionaries.map(dict => {
                const hasWord = dict.entries.some(e => e.word.toLowerCase() === word.toLowerCase());
                return (
                  <button 
                    key={dict.id} 
                    className={clsx(styles.saveWordBtn__dictItem, hasWord && styles.saveWordBtn__dictItem_saved)}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDictionary(dict.id);
                    }}
                  >
                    <span className={styles.saveWordBtn__dictName}>{dict.name}</span>
                    {hasWord ? <Check size={16} className={styles.saveWordBtn__checkIcon} /> : <Plus size={16} className={styles.saveWordBtn__plusIcon} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
