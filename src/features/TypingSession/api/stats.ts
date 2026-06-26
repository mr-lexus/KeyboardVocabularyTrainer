import { db } from '../../../shared/api/db';
import { getFingerForChar } from '../../../entities/Keyboard';

import type { KeyboardLayout } from '../../../entities/Keyboard/model';

export const recordKeystroke = async (char: string, isCorrect: boolean, layout: KeyboardLayout) => {
  const finger = getFingerForChar(char, layout);
  const keyId = char.toLowerCase();

  try {
    // Key stats
    const keyStat = await db.keyStats.get(keyId);
    if (keyStat) {
      await db.keyStats.update(keyId, {
        correctPresses: keyStat.correctPresses + (isCorrect ? 1 : 0),
        incorrectPresses: keyStat.incorrectPresses + (!isCorrect ? 1 : 0)
      });
    } else {
      await db.keyStats.add({
        keyId,
        correctPresses: isCorrect ? 1 : 0,
        incorrectPresses: !isCorrect ? 1 : 0
      });
    }

    // Finger stats
    if (finger) {
      const fingerStat = await db.fingerStats.get(finger);
      if (fingerStat) {
        await db.fingerStats.update(finger, {
          correctPresses: fingerStat.correctPresses + (isCorrect ? 1 : 0),
          incorrectPresses: fingerStat.incorrectPresses + (!isCorrect ? 1 : 0)
        });
      } else {
        await db.fingerStats.add({
          fingerId: finger,
          correctPresses: isCorrect ? 1 : 0,
          incorrectPresses: !isCorrect ? 1 : 0
        });
      }
    }
  } catch (err) {
    console.error('Failed to record keystroke stats', err);
  }
};
