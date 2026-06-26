import { silakka54 } from './silakka54';
import { standard } from './standard';
import type { KeyboardLayout, Finger } from './model';

export * from './model';

export const layouts: Record<string, KeyboardLayout> = {
  silakka54,
  standard,
};

export const getFingerForChar = (char: string, layout: KeyboardLayout): Finger | null => {
  let allKeys;
  
  if (layout.type === 'standard' && layout.rows) {
    allKeys = layout.rows.flat();
  } else {
    allKeys = [
      ...(layout.leftHand?.flat() || []),
      ...(layout.rightHand?.flat() || []),
      ...(layout.leftThumb || []),
      ...(layout.rightThumb || [])
    ];
  }

  const charLower = char.toLowerCase();
  
  // Hardcoded fallback mapping for characters not explicitly in the layout (like ъ or ё)
  const fallbackMap: Record<string, string> = {
    'ъ': ']', // typical fallback for ъ on layouts that might miss it
    'ё': '`'  // typical fallback for ё
  };
  const effectiveChar = fallbackMap[charLower] || charLower;

  const key = allKeys.find(k => 
    k.id.toLowerCase() === effectiveChar || 
    (k.ruId && k.ruId.toLowerCase() === effectiveChar)
  );
  return key ? key.finger : null;
};
