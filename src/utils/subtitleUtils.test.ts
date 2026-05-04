import { describe, it, expect } from 'vitest';
import { formatTime, parseLyrics, exportToWebVTTKaraoke, cleanSubtitleTags } from './subtitleUtils';

describe('subtitleUtils', () => {
  it('should format time correctly for VTT', () => {
    expect(formatTime(61.5)).toBe('00:01:01.500');
  });

  it('should parse lyrics into lines and words', () => {
    const lyrics = 'Hello world\nHow are you';
    const result = parseLyrics(lyrics);
    expect(result.length).toBe(1); // Since they are separated by single newline
    expect(result[0].words.length).toBe(5);
    expect(result[0].words[0].text).toBe('Hello');
  });

  it('should clean subtitle tags', () => {
    const dirty = '{\\pos(192,20)}<c.yellow>Hello</c> <i>world</i>';
    expect(cleanSubtitleTags(dirty)).toBe('Hello world');
  });

  it('should export to WebVTT Karaoke format', () => {
    const lines = [{
      id: 'l1',
      start: 1,
      end: 3,
      words: [
        { id: 'w1', text: 'Hello', start: 1, end: 2 },
        { id: 'w2', text: 'World', start: 2, end: 3 }
      ]
    }];
    const exported = exportToWebVTTKaraoke(lines);
    expect(exported).toContain('00:00:01.000 --> 00:00:03.000');
    expect(exported).toContain('Hello <00:00:02.000>World');
  });
});
