export type Finger =
  | 'left-pinky'
  | 'left-ring'
  | 'left-middle'
  | 'left-index'
  | 'left-thumb'
  | 'right-thumb'
  | 'right-index'
  | 'right-middle'
  | 'right-ring'
  | 'right-pinky';

export interface KeyDefinition {
  id: string; // The char or code, e.g. "a", "space"
  label: string; // Display text
  ruId?: string;
  ruLabel?: string;
  finger: Finger;
  width?: number; // Relative width, default 1
}

export interface KeyboardLayout {
  id: string;
  name: string;
  type?: 'split' | 'standard'; // defaults to 'split' for backward compatibility
  // for split layouts
  leftHand?: KeyDefinition[][];
  rightHand?: KeyDefinition[][];
  leftThumb?: KeyDefinition[];
  rightThumb?: KeyDefinition[];
  // for standard layouts
  rows?: KeyDefinition[][];
}
