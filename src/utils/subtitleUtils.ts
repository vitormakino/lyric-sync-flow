import { WordSync, SubtitleLine } from '../types';

/**
 * Formats seconds to HH:MM:SS.mmm for SRT/VTT
 */
export const formatTime = (seconds: number, format: 'SRT' | 'VTT' = 'VTT'): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  const pad = (n: number, z = 2) => n.toString().padStart(z, '0');
  const msSeparator = format === 'SRT' ? ',' : '.';

  return `${pad(h)}:${pad(m)}:${pad(s)}${msSeparator}${pad(ms, 3)}`;
};

/**
 * Formats seconds to [mm:ss.xx] for LRC
 */
export const formatLRCTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `[${m.toString().padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}]`;
};

/**
 * Export to SRT (Simple line-based)
 */
export const exportToSRT = (lines: SubtitleLine[]): string => {
  return lines
    .map((line, index) => {
      const text = line.words.map(w => w.text).join(' ');
      return `${index + 1}\n${formatTime(line.start, 'SRT')} --> ${formatTime(line.end, 'SRT')}\n${text}\n`;
    })
    .join('\n');
};

/**
 * Export to WebVTT Karaoke (Intra-line timestamps)
 */
export const exportToWebVTTKaraoke = (lines: SubtitleLine[]): string => {
  let output = 'WEBVTT\n\n';
  lines.forEach((line) => {
    output += `${formatTime(line.start)} --> ${formatTime(line.end)}\n`;
    line.words.forEach((word, i) => {
      // For karaoke, we add the timestamp before each word starting from the second word
      // format: <00:00:00.000>
      if (i === 0) {
        output += word.text;
      } else {
        output += ` <${formatTime(word.start)}>${word.text}`;
      }
    });
    output += '\n\n';
  });
  return output;
};

/**
 * Parses raw text into SubtitleLines (initial state)
 */
export const parseLyrics = (text: string): SubtitleLine[] => {
  return text
    .split(/\n\n+/) // Split by double newlines into "stanzas" or lines
    .map((stanza, idx) => {
      const words = stanza.trim().split(/\s+/).map((word, wIdx) => ({
        id: `word-${idx}-${wIdx}-${Math.random().toString(36).substr(2, 9)}`,
        text: word,
        start: 0,
        end: 0,
      }));
      return {
        id: `line-${idx}`,
        words,
        start: 0,
        end: 0,
      };
    });
};

/**
 * Cleans tags from VTT/SRT content
 */
export const cleanSubtitleTags = (text: string): string => {
  return text
    .replace(/<[^>]+>/g, '') // Remove HTML-like tags
    .replace(/\{[^}]+\}/g, '') // Remove SSA/ASS style tags
    .trim();
};
