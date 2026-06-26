import React, { useState, useMemo, useCallback } from 'react';
import clsx from 'clsx';
import { EMOJI_DATABASE, CATEGORIES, type EmojiCategory, type EmojiItem } from '../model/emojiData';
import { CategoryTabs } from './CategoryTabs';
import { SearchBar } from './SearchBar';
import { EmojiGrid } from './EmojiGrid';
import styles from './EmojiPicker.module.scss';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose?: () => void;
  theme?: 'light' | 'dark';
}

const RECENT_KEY = 'keyboard-trainer:recent-emojis';
const FAVORITES_KEY = 'keyboard-trainer:favorite-emojis';
const MAX_RECENT = 24;

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ 
  onEmojiSelect, 
  onClose,
  theme = 'light' 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<EmojiCategory>('All');
  
  const [recentEmojis, setRecentEmojis] = useState<EmojiItem[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [favoriteEmojis, setFavoriteEmojis] = useState<EmojiItem[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleToggleFavorite = useCallback((emoji: string) => {
    setFavoriteEmojis(prev => {
      const isFavorite = prev.some(e => e.emoji === emoji);
      let next;
      if (isFavorite) {
        next = prev.filter(e => e.emoji !== emoji);
      } else {
        const item = EMOJI_DATABASE.find(e => e.emoji === emoji);
        next = item ? [...prev, item] : prev;
      }
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const handleSelect = useCallback((emoji: string) => {
    // Add to recent
    const item = EMOJI_DATABASE.find(e => e.emoji === emoji);
    if (item) {
      setRecentEmojis(prev => {
        const next = [item, ...prev.filter(e => e.emoji !== emoji)].slice(0, MAX_RECENT);
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
        return next;
      });
    }
    
    // Copy to clipboard
    navigator.clipboard.writeText(emoji).catch(() => {});
    
    onEmojiSelect(emoji);
  }, [onEmojiSelect]);

  const handleDoubleClick = useCallback((emoji: string) => {
    handleSelect(emoji);
    if (onClose) onClose();
  }, [handleSelect, onClose]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (value.trim().length > 0 && activeCategory !== 'All') {
      setActiveCategory('All');
    }
  }, [activeCategory]);

  const filteredData = useMemo(() => {
    const result: { category: string; items: EmojiItem[] }[] = [];
    const normalizedQuery = searchQuery.toLowerCase().trim();

    if (normalizedQuery) {
      // Search mode
      const matchedItems = EMOJI_DATABASE.filter(item => 
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.keywords.some(kw => kw.toLowerCase().includes(normalizedQuery)) ||
        item.category.toLowerCase().includes(normalizedQuery)
      );
      
      if (matchedItems.length > 0) {
        result.push({ category: 'Результаты поиска', items: matchedItems });
      }
    } else {
      // Category mode
      if (activeCategory === 'All') {
        if (recentEmojis.length > 0) {
          result.push({ category: '🕒 Недавние', items: recentEmojis });
        }
        if (favoriteEmojis.length > 0) {
          result.push({ category: '⭐ Избранное', items: favoriteEmojis });
        }
        // Group all other emojis by their actual category
        const groups = new Map<string, EmojiItem[]>();
        EMOJI_DATABASE.forEach(item => {
          if (!groups.has(item.category)) {
            groups.set(item.category, []);
          }
          groups.get(item.category)!.push(item);
        });
        CATEGORIES.forEach(cat => {
          if (cat !== 'All' && cat !== 'Recent' && cat !== 'Favorites' && groups.has(cat)) {
            result.push({ category: cat, items: groups.get(cat)! });
          }
        });
      } else if (activeCategory === 'Recent') {
        result.push({ category: '🕒 Недавние', items: recentEmojis });
      } else if (activeCategory === 'Favorites') {
        result.push({ category: '⭐ Избранное', items: favoriteEmojis });
      } else {
        const items = EMOJI_DATABASE.filter(item => item.category === activeCategory);
        if (items.length > 0) {
          result.push({ category: activeCategory, items });
        }
      }
    }

    return result;
  }, [searchQuery, activeCategory, recentEmojis, favoriteEmojis]);

  return (
    <div className={clsx(styles.emojiPicker, theme === 'dark' && styles.emojiPicker_dark)}>
      <div className={styles.emojiPicker__header}>
        <CategoryTabs 
          activeCategory={activeCategory} 
          onSelect={setActiveCategory} 
        />
        <SearchBar 
          value={searchQuery} 
          onChange={handleSearchChange} 
          autoFocus 
        />
      </div>
      
      <EmojiGrid 
        data={filteredData} 
        favorites={favoriteEmojis}
        onSelect={handleSelect} 
        onDoubleClick={handleDoubleClick}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  );
};
