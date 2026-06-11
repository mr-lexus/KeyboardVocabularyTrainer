import type { KeyboardLayout } from './model';

export const silakka54: KeyboardLayout = {
  id: 'silakka54',
  name: 'Silakka54 (QWERTY)',
  leftHand: [
    [
      { id: 'Escape', label: 'Esc', finger: 'left-pinky' },
      { id: '1', label: '1', finger: 'left-pinky' },
      { id: '2', label: '2', finger: 'left-ring' },
      { id: '3', label: '3', finger: 'left-middle' },
      { id: '4', label: '4', finger: 'left-index' },
      { id: '5', label: '5', finger: 'left-index' },
    ],
    [
      { id: 'Tab', label: 'Tab', finger: 'left-pinky' },
      { id: 'q', label: 'Q', finger: 'left-pinky' },
      { id: 'w', label: 'W', finger: 'left-ring' },
      { id: 'e', label: 'E', finger: 'left-middle' },
      { id: 'r', label: 'R', finger: 'left-index' },
      { id: 't', label: 'T', finger: 'left-index' },
    ],
    [
      { id: 'CapsLock', label: 'Caps', finger: 'left-pinky' },
      { id: 'a', label: 'A', finger: 'left-pinky' },
      { id: 's', label: 'S', finger: 'left-ring' },
      { id: 'd', label: 'D', finger: 'left-middle' },
      { id: 'f', label: 'F', finger: 'left-index' },
      { id: 'g', label: 'G', finger: 'left-index' },
    ],
    [
      { id: 'ShiftLeft', label: 'Shift', finger: 'left-pinky' },
      { id: 'z', label: 'Z', finger: 'left-pinky' },
      { id: 'x', label: 'X', finger: 'left-ring' },
      { id: 'c', label: 'C', finger: 'left-middle' },
      { id: 'v', label: 'V', finger: 'left-index' },
      { id: 'b', label: 'B', finger: 'left-index' },
    ],
  ],
  rightHand: [
    [
      { id: '6', label: '6', finger: 'right-index' },
      { id: '7', label: '7', finger: 'right-index' },
      { id: '8', label: '8', finger: 'right-middle' },
      { id: '9', label: '9', finger: 'right-ring' },
      { id: '0', label: '0', finger: 'right-pinky' },
      { id: '-', label: '-', finger: 'right-pinky' },
    ],
    [
      { id: 'y', label: 'Y', finger: 'right-index' },
      { id: 'u', label: 'U', finger: 'right-index' },
      { id: 'i', label: 'I', finger: 'right-middle' },
      { id: 'o', label: 'O', finger: 'right-ring' },
      { id: 'p', label: 'P', finger: 'right-pinky' },
      { id: '[', label: '[', finger: 'right-pinky' },
    ],
    [
      { id: 'h', label: 'H', finger: 'right-index' },
      { id: 'j', label: 'J', finger: 'right-index' },
      { id: 'k', label: 'K', finger: 'right-middle' },
      { id: 'l', label: 'L', finger: 'right-ring' },
      { id: ';', label: ';', finger: 'right-pinky' },
      { id: '\'', label: '\'', finger: 'right-pinky' },
    ],
    [
      { id: 'n', label: 'N', finger: 'right-index' },
      { id: 'm', label: 'M', finger: 'right-index' },
      { id: ',', label: ',', finger: 'right-middle' },
      { id: '.', label: '.', finger: 'right-ring' },
      { id: '/', label: '/', finger: 'right-pinky' },
      { id: 'ShiftRight', label: 'Shift', finger: 'right-pinky' },
    ],
  ],
  leftThumb: [
    { id: 'ControlLeft', label: 'Ctrl', finger: 'left-thumb' },
    { id: 'AltLeft', label: 'Alt', finger: 'left-thumb' },
    { id: ' ', label: 'Space', finger: 'left-thumb', width: 1.5 },
  ],
  rightThumb: [
    { id: 'Backspace', label: 'Bksp', finger: 'right-thumb', width: 1.5 },
    { id: 'Enter', label: 'Enter', finger: 'right-thumb' },
    { id: 'Fn', label: 'Fn', finger: 'right-thumb' },
  ],
};

export const getFingerForChar = (char: string) => {
  const allKeys = [
    ...silakka54.leftHand.flat(),
    ...silakka54.rightHand.flat(),
    ...silakka54.leftThumb,
    ...silakka54.rightThumb
  ];
  const key = allKeys.find(k => k.id.toLowerCase() === char.toLowerCase());
  return key ? key.finger : null;
};
