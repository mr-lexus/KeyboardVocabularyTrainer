import React from 'react';
import { type Finger } from '../../../entities/Keyboard/model';
import styles from './HandsOverlay.module.scss';
import clsx from 'clsx';

interface HandsOverlayProps {
  targetFinger: Finger | null;
  isError: boolean;
}

export const HandsOverlay: React.FC<HandsOverlayProps> = ({ targetFinger, isError }) => {
  const renderFinger = (finger: Finger, className: string, label: string) => {
    const isNext = targetFinger === finger && !isError;
    const isErr = targetFinger === finger && isError;

    return (
      <div 
        key={finger}
        className={clsx(
          styles.handsOverlay__finger, 
          styles[className], 
          isNext && styles.handsOverlay__finger_next, 
          isErr && styles.handsOverlay__finger_error
        )}
      >
        {label}
      </div>
    );
  };

  return (
    <div className={styles.handsOverlay__container}>
      <div className={clsx(styles.handsOverlay__hand, styles.handsOverlay__leftHand)}>
        {renderFinger('left-pinky', 'handsOverlay__pinky', 'P')}
        {renderFinger('left-ring', 'handsOverlay__ring', 'R')}
        {renderFinger('left-middle', 'handsOverlay__middle', 'M')}
        {renderFinger('left-index', 'handsOverlay__index', 'I')}
        {renderFinger('left-thumb', 'handsOverlay__thumb', 'T')}
      </div>
      <div className={clsx(styles.handsOverlay__hand, styles.handsOverlay__rightHand)}>
        {renderFinger('right-thumb', 'handsOverlay__thumb', 'T')}
        {renderFinger('right-index', 'handsOverlay__index', 'I')}
        {renderFinger('right-middle', 'handsOverlay__middle', 'M')}
        {renderFinger('right-ring', 'handsOverlay__ring', 'R')}
        {renderFinger('right-pinky', 'handsOverlay__pinky', 'P')}
      </div>
    </div>
  );
};
