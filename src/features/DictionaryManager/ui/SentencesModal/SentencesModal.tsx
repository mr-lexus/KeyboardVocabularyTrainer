import React, { useEffect, useState } from 'react';
import { builtInDictionaryApi } from '../../../../entities/Dictionary/builtInApi';
import { useTypingSession } from '../../../TypingSession/model/store';
import { useNavigate } from 'react-router-dom';
import { X, BookOpen, Loader2 } from 'lucide-react';
import { db } from '../../../../shared/api/db';
import styles from './SentencesModal.module.scss';

interface SentencesModalProps {
  word: string;
  onClose: () => void;
}

export const SentencesModal: React.FC<SentencesModalProps> = ({ word, onClose }) => {
  const [sentences, setSentences] = useState<{ en: string; ru: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const setDictionary = useTypingSession((s) => s.setDictionary);
  const setMode = useTypingSession((s) => s.setMode);

  useEffect(() => {
    builtInDictionaryApi.findSentencesWithWord(word, Infinity, (loaded, total) => {
      setProgress({ loaded, total });
    }).then((data) => {
      setSentences(data);
      setIsLoading(false);
      setCurrentPage(1);
      // Save the count to IndexedDB
      db.wordSentenceCounts.put({ word, count: data.length }).catch(console.error);
    });
  }, [word]);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(sentences.length / ITEMS_PER_PAGE);
  const paginatedSentences = sentences.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleStartTraining = () => {
    if (sentences.length === 0) return;
    
    const entries = sentences.map((s, idx) => ({
      id: `sentence_${idx}`,
      word: s.en,
      translation: s.ru,
      language: 'en' as const,
    }));

    setMode('en-ru');
    setDictionary('temp-sentences', entries);
    navigate('/');
  };

  return (
    <div className={styles.sentencesModal__overlay} onClick={onClose}>
      <div className={styles.sentencesModal__modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.sentencesModal__header}>
          <h3 className={styles.sentencesModal__title}>
            <BookOpen size={20} />
            Sentences with "{word}"
          </h3>
          <button className={styles.sentencesModal__closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.sentencesModal__content}>
          {isLoading ? (
            <div className={styles.sentencesModal__loading}>
              <Loader2 className={styles.sentencesModal__spinner} size={24} />
              <span>Searching sentences...</span>
              {progress.total > 0 && (
                <div className={styles.sentencesModal__progressContainer}>
                  <div 
                    className={styles.sentencesModal__progressBar} 
                    style={{ width: `${Math.round((progress.loaded / progress.total) * 100)}%` }} 
                  />
                </div>
              )}
              {progress.total > 0 && (
                <span className={styles.sentencesModal__progressText}>
                  {progress.loaded} / {progress.total} dictionaries scanned
                </span>
              )}
            </div>
          ) : sentences.length > 0 ? (
            <>
              <div className={styles.sentencesModal__list}>
                {paginatedSentences.map((s, idx) => (
                  <div key={idx} className={styles.sentencesModal__sentenceItem}>
                    <div className={styles.sentencesModal__en}>{s.en}</div>
                    <div className={styles.sentencesModal__ru}>{s.ru}</div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className={styles.sentencesModal__pagination}>
                  <button 
                    className={styles.sentencesModal__pageBtn}
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    Prev
                  </button>
                  <span className={styles.sentencesModal__pageInfo}>
                    {currentPage} / {totalPages}
                  </span>
                  <button 
                    className={styles.sentencesModal__pageBtn}
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className={styles.sentencesModal__empty}>
              No sentences found for "{word}".
            </div>
          )}
        </div>

        <div className={styles.sentencesModal__footer}>
          <button 
            className={styles.sentencesModal__startBtn} 
            disabled={sentences.length === 0 || isLoading}
            onClick={handleStartTraining}
          >
            Start Exercise
          </button>
        </div>
      </div>
    </div>
  );
};
