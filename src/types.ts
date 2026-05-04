
export interface WordSync {
  text: string;
  start: number;
  end: number;
  id: string;
}

export interface SubtitleLine {
  id: string;
  words: WordSync[];
  start: number;
  end: number;
}

export type ExportFormat = 'SRT' | 'VTT_KARAOKE' | 'JSON' | 'LRC';

export interface PlayerState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playbackRate: number;
}
