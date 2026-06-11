import React from 'react';
import { type Finger } from '../../../entities/Keyboard/model';
import styles from './HandsOverlay.module.css';
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
          styles.finger, 
          styles[className], 
          isNext && styles.next, 
          isErr && styles.error
        )}
      >
        {label}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={clsx(styles.hand, styles.leftHand)}>
        {renderFinger('left-pinky', 'pinky', 'P')}
        {renderFinger('left-ring', 'ring', 'R')}
        {renderFinger('left-middle', 'middle', 'M')}
        {renderFinger('left-index', 'index', 'I')}
        {renderFinger('left-thumb', 'thumb', 'T')}
      </div>
      <div className={clsx(styles.hand, styles.rightHand)}>
        {renderFinger('right-thumb', 'thumb', 'T')}
        {renderFinger('right-index', 'index', 'I')}
        {renderFinger('right-middle', 'middle', 'M')}
        {renderFinger('right-ring', 'ring', 'R')}
        {renderFinger('right-pinky', 'pinky', 'P')}
      </div>
    </div>
  );
};
