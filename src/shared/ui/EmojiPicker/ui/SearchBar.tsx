import React, { useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import styles from './EmojiPicker.module.scss';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = React.memo(({ value, onChange, autoFocus }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      // Small delay to allow the picker to render before focusing
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  return (
    <div className={styles.searchBar}>
      <Search size={16} className={styles.searchBar__icon} />
      <input
        ref={inputRef}
        type="text"
        className={styles.searchBar__input}
        placeholder="Поиск эмодзи..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
});

SearchBar.displayName = 'SearchBar';
