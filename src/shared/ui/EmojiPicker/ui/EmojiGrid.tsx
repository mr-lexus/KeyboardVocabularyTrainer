import React from 'react';
import clsx from 'clsx';
import styles from './EmojiPicker.module.scss';
import type { EmojiItem } from '../model/emojiData';

interface GroupedEmojis {
  category: string;
  items: EmojiItem[];
}

interface EmojiGridProps {
  data: GroupedEmojis[];
  favorites: EmojiItem[];
  onSelect: (emoji: string) => void;
  onDoubleClick?: (emoji: string) => void;
  onToggleFavorite: (emoji: string) => void;
}

export const EmojiGrid: React.FC<EmojiGridProps> = React.memo(({ 
  data, 
  favorites,
  onSelect, 
  onDoubleClick,
  onToggleFavorite 
}) => {
  if (data.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span>🤷</span>
        <span>Ничего не найдено</span>
      </div>
    );
  }

  return (
    <div className={styles.emojiPicker__body}>
      {data.map((group) => (
        <div key={group.category} className={styles.emojiGroup}>
          <h3 className={styles.emojiGroup__title}>{group.category}</h3>
          <div className={styles.emojiGrid}>
            {group.items.map((item) => {
              const isFavorite = favorites.some(f => f.emoji === item.emoji);
              return (
                <button
                  key={item.emoji}
                  className={clsx(styles.emojiItem, isFavorite && styles.emojiItem_favorite)}
                  onClick={() => onSelect(item.emoji)}
                  onDoubleClick={() => onDoubleClick?.(item.emoji)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onToggleFavorite(item.emoji);
                  }}
                  title={`${item.name} (Правый клик: ${isFavorite ? 'Убрать из избранного' : 'В избранное'})`}
                  type="button"
                >
                  {item.emoji}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
});

EmojiGrid.displayName = 'EmojiGrid';
