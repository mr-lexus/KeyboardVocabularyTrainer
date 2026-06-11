import React from 'react';
import { silakka54 } from '../../../entities/Keyboard/silakka54';
import { type KeyDefinition } from '../../../entities/Keyboard/model';
import { usePressedKeys } from '../../../shared/lib/hooks/usePressedKeys';
import styles from './VirtualKeyboard.module.css';
import clsx from 'clsx';

interface VirtualKeyboardProps {
  targetWord: string;
  userInput: string;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ targetWord, userInput }) => {
  const pressedKeys = usePressedKeys();

  const isError = !targetWord.startsWith(userInput) && userInput.length > 0;
  const nextChar = !isError && userInput.length < targetWord.length ? targetWord[userInput.length].toLowerCase() : null;

  const renderKey = (keyDef: KeyDefinition) => {
    const isPressed = pressedKeys.has(keyDef.id.toLowerCase()) || pressedKeys.has(keyDef.id);
    const isNext = nextChar === keyDef.id.toLowerCase();
    
    // Simplistic error highlighting: if there's an error, highlight pressed keys as error
    const showAsError = isError && isPressed;

    const width = keyDef.width ? `${keyDef.width * 3}rem` : '3rem';

    return (
      <div 
        key={keyDef.id} 
        className={clsx(
          styles.key, 
          isPressed && styles.pressed,
          isNext && styles.next,
          showAsError && styles.error
        )}
        style={{ width }}
      >
        {keyDef.label}
      </div>
    );
  };

  return (
    <div className={styles.keyboardContainer}>
      <div className={clsx(styles.half, styles.leftHalf)}>
        {silakka54.leftHand.map((row, i) => (
          <div key={`left-r${i}`} className={styles.row}>
            {row.map(renderKey)}
          </div>
        ))}
        <div className={clsx(styles.thumbCluster, styles.leftThumb)}>
          {silakka54.leftThumb.map(renderKey)}
        </div>
      </div>

      <div className={clsx(styles.half, styles.rightHalf)}>
        {silakka54.rightHand.map((row, i) => (
          <div key={`right-r${i}`} className={styles.row}>
            {row.map(renderKey)}
          </div>
        ))}
        <div className={clsx(styles.thumbCluster, styles.rightThumb)}>
          {silakka54.rightThumb.map(renderKey)}
        </div>
      </div>
    </div>
  );
};
