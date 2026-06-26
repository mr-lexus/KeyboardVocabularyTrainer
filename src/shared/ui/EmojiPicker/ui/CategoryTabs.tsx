import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import styles from './EmojiPicker.module.scss';
import { CATEGORIES, CATEGORY_ICONS, type EmojiCategory } from '../model/emojiData';

interface CategoryTabsProps {
  activeCategory: EmojiCategory;
  onSelect: (category: EmojiCategory) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = React.memo(({ activeCategory, onSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Auto scroll to active tab
  useEffect(() => {
    if (!containerRef.current) return;
    const activeEl = containerRef.current.querySelector(`.${styles.categoryTabs__btn_active}`) as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeCategory]);

  return (
    <div className={styles.categoryTabs} ref={containerRef}>
      {CATEGORIES.map(category => (
        <button
          key={category}
          type="button"
          className={clsx(
            styles.categoryTabs__btn,
            activeCategory === category && styles.categoryTabs__btn_active
          )}
          onClick={() => onSelect(category)}
          title={category}
        >
          {CATEGORY_ICONS[category] || '✨'}
        </button>
      ))}
    </div>
  );
});

CategoryTabs.displayName = 'CategoryTabs';
