import type { KeyboardLayout } from './model';

export const silakka54: KeyboardLayout = {
  id: 'silakka54',
  name: 'Silakka54 (QWERTY/ЙЦУКЕН)',
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
      { id: 'q', label: 'Q', ruId: 'й', ruLabel: 'Й', finger: 'left-pinky' },
      { id: 'w', label: 'W', ruId: 'ц', ruLabel: 'Ц', finger: 'left-ring' },
      { id: 'e', label: 'E', ruId: 'у', ruLabel: 'У', finger: 'left-middle' },
      { id: 'r', label: 'R', ruId: 'к', ruLabel: 'К', finger: 'left-index' },
      { id: 't', label: 'T', ruId: 'е', ruLabel: 'Е', finger: 'left-index' },
    ],
    [
      { id: 'CapsLock', label: 'Caps', finger: 'left-pinky' },
      { id: 'a', label: 'A', ruId: 'ф', ruLabel: 'Ф', finger: 'left-pinky' },
      { id: 's', label: 'S', ruId: 'ы', ruLabel: 'Ы', finger: 'left-ring' },
      { id: 'd', label: 'D', ruId: 'в', ruLabel: 'В', finger: 'left-middle' },
      { id: 'f', label: 'F', ruId: 'а', ruLabel: 'А', finger: 'left-index' },
      { id: 'g', label: 'G', ruId: 'п', ruLabel: 'П', finger: 'left-index' },
    ],
    [
      { id: 'ShiftLeft', label: 'Shift', finger: 'left-pinky' },
      { id: 'z', label: 'Z', ruId: 'я', ruLabel: 'Я', finger: 'left-pinky' },
      { id: 'x', label: 'X', ruId: 'ч', ruLabel: 'Ч', finger: 'left-ring' },
      { id: 'c', label: 'C', ruId: 'с', ruLabel: 'С', finger: 'left-middle' },
      { id: 'v', label: 'V', ruId: 'м', ruLabel: 'М', finger: 'left-index' },
      { id: 'b', label: 'B', ruId: 'и', ruLabel: 'И', finger: 'left-index' },
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
      { id: 'y', label: 'Y', ruId: 'н', ruLabel: 'Н', finger: 'right-index' },
      { id: 'u', label: 'U', ruId: 'г', ruLabel: 'Г', finger: 'right-index' },
      { id: 'i', label: 'I', ruId: 'ш', ruLabel: 'Ш', finger: 'right-middle' },
      { id: 'o', label: 'O', ruId: 'щ', ruLabel: 'Щ', finger: 'right-ring' },
      { id: 'p', label: 'P', ruId: 'з', ruLabel: 'З', finger: 'right-pinky' },
      { id: '[', label: '[', ruId: 'х', ruLabel: 'Х', finger: 'right-pinky' },
    ],
    [
      { id: 'h', label: 'H', ruId: 'р', ruLabel: 'Р', finger: 'right-index' },
      { id: 'j', label: 'J', ruId: 'о', ruLabel: 'О', finger: 'right-index' },
      { id: 'k', label: 'K', ruId: 'л', ruLabel: 'Л', finger: 'right-middle' },
      { id: 'l', label: 'L', ruId: 'д', ruLabel: 'Д', finger: 'right-ring' },
      { id: ';', label: ';', ruId: 'ж', ruLabel: 'Ж', finger: 'right-pinky' },
      { id: '\'', label: '\'', ruId: 'э', ruLabel: 'Э', finger: 'right-pinky' },
    ],
    [
      { id: 'n', label: 'N', ruId: 'т', ruLabel: 'Т', finger: 'right-index' },
      { id: 'm', label: 'M', ruId: 'ь', ruLabel: 'Ь', finger: 'right-index' },
      { id: ',', label: ',', ruId: 'б', ruLabel: 'Б', finger: 'right-middle' },
      { id: '.', label: '.', ruId: 'ю', ruLabel: 'Ю', finger: 'right-ring' },
      { id: '/', label: '/', ruId: '.', ruLabel: '.', finger: 'right-pinky' },
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
  // Support char that is mapped to a key by checking id or ruId
  const allKeys = [
    ...silakka54.leftHand.flat(),
    ...silakka54.rightHand.flat(),
    ...silakka54.leftThumb,
    ...silakka54.rightThumb
  ];
  const charLower = char.toLowerCase();
  
  // Hardcoded fallback mapping for characters not explicitly in the layout (like ъ or ё)
  const fallbackMap: Record<string, string> = {
    'ъ': '[', // fallback to Х's key for lack of a better one on this 54 key layout
    'ё': '1'  // fallback to 1
  };
  const effectiveChar = fallbackMap[charLower] || charLower;

  const key = allKeys.find(k => 
    k.id.toLowerCase() === effectiveChar || 
    (k.ruId && k.ruId.toLowerCase() === effectiveChar)
  );
  return key ? key.finger : null;
};
