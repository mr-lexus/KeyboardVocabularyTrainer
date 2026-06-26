import React from 'react';
import { type KeyDefinition, type KeyboardLayout } from '../../../entities/Keyboard/model';
import { usePressedKeys } from '../../../shared/lib/hooks/usePressedKeys';
import styles from './VirtualKeyboard.module.scss';
import clsx from 'clsx';

interface VirtualKeyboardProps {
  targetWord: string;
  userInput: string;
  layoutLanguage?: 'en' | 'ru';
  layout: KeyboardLayout;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ targetWord, userInput, layoutLanguage = 'en', layout }) => {
  const pressedKeys = usePressedKeys();

  const isError = !targetWord.startsWith(userInput) && userInput.length > 0;
  const nextChar = !isError && userInput.length < targetWord.length ? targetWord[userInput.length].toLowerCase() : null;

  const renderKey = (keyDef: KeyDefinition) => {
    // Determine the logical id of this key based on layout
    const logicalId = layoutLanguage === 'ru' && keyDef.ruId ? keyDef.ruId : keyDef.id;
    const logicalLabel = layoutLanguage === 'ru' && keyDef.ruLabel ? keyDef.ruLabel : keyDef.label;

    // We still check physical pressed key by keyDef.id, but maybe some Russian layouts send actual Russian characters.
    // usePressedKeys listens to KeyboardEvent.key. So we should check if they pressed logicalId too.
    const isPressed = pressedKeys.has(keyDef.id.toLowerCase()) || 
                      pressedKeys.has(keyDef.id) ||
                      (keyDef.ruId && pressedKeys.has(keyDef.ruId.toLowerCase()));
                      
    const isNext = nextChar === logicalId.toLowerCase();
    
    // Simplistic error highlighting: if there's an error, highlight pressed keys as error
    const showAsError = isError && isPressed;

    const u = keyDef.width || 1;
    // Use flex-grow for proportional sizing instead of strict fixed widths
    // We'll set flexGrow to `u` and flexBasis to `0` or a small percentage
    const widthStyle = { flex: `${u} 1 0` };

    return (
      <div 
        key={keyDef.id} 
        className={clsx(
          styles.virtualKeyboard__key, 
          isPressed && styles.virtualKeyboard__key_pressed,
          isNext && styles.virtualKeyboard__key_next,
          showAsError && styles.virtualKeyboard__key_error
        )}
        style={widthStyle}
      >
        {logicalLabel}
      </div>
    );
  };

  if (layout.type === 'standard' && layout.rows) {
    return (
      <div className={clsx(styles.virtualKeyboard__container, styles.virtualKeyboard__standardLayout)}>
        {layout.rows.map((row, i) => (
          <div key={`std-r${i}`} className={styles.virtualKeyboard__standardRow}>
            {row.map(renderKey)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={clsx(styles.virtualKeyboard__container, styles.splitLayout)}>
      <div className={clsx(styles.virtualKeyboard__half, styles.leftHalf)}>
        {layout.leftHand?.map((row, i) => (
          <div key={`left-r${i}`} className={styles.virtualKeyboard__row}>
            {row.map(renderKey)}
          </div>
        ))}
        <div className={clsx(styles.virtualKeyboard__thumbCluster, styles.virtualKeyboard__leftThumb)}>
          {layout.leftThumb?.map(renderKey)}
        </div>
      </div>

      <div className={clsx(styles.virtualKeyboard__half, styles.rightHalf)}>
        {layout.rightHand?.map((row, i) => (
          <div key={`right-r${i}`} className={styles.virtualKeyboard__row}>
            {row.map(renderKey)}
          </div>
        ))}
        <div className={clsx(styles.virtualKeyboard__thumbCluster, styles.virtualKeyboard__rightThumb)}>
          {layout.rightThumb?.map(renderKey)}
        </div>
      </div>
    </div>
  );
};
