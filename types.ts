
export interface PoetryItem {
  id: string;
  author: string;
  lines: string[];
  meter?: string;
  tags: string[];
  likes: number;
}

export interface TaqtiResult {
  word: string;
  scansion: string; // e.g., "1010"
  weight: string;   // e.g., "فاعلن"
}

export interface MeterAnalysis {
  name: string;
  results: TaqtiResult[];
}
