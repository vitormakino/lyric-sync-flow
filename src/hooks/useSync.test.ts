import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSync } from './useSync';
import { SubtitleLine } from '../types';

const mockLines: SubtitleLine[] = [
  {
    id: 'l1',
    start: 0,
    end: 0,
    words: [
      { id: 'w1', text: 'Hello', start: 0, end: 0 },
      { id: 'w2', text: 'World', start: 0, end: 0 }
    ]
  }
];

describe('useSync Integration', () => {
  it('should sync words correctly when tapping', () => {
    let currentTime = 1.0;
    const { result, rerender } = renderHook(() => useSync(mockLines, currentTime));

    // Start syncing
    act(() => {
      result.current.setIsSyncing(true);
    });

    // First tap at 1.0s (Word 1 start)
    act(() => {
      result.current.tap();
    });

    expect(result.current.lines[0].words[0].start).toBe(1.0);
    expect(result.current.currentIndex).toEqual({ lineIdx: 0, wordIdx: 1 });

    // Move time and tap again at 2.5s (Word 2 start, Word 1 end)
    currentTime = 2.5;
    rerender();
    
    act(() => {
      result.current.tap();
    });

    expect(result.current.lines[0].words[0].end).toBe(2.5);
    expect(result.current.lines[0].words[1].start).toBe(2.5);
    expect(result.current.currentIndex).toEqual({ lineIdx: 1, wordIdx: 0 }); // Moved to next line

    // Verify last word end time logic
    // Usually, the end of the last word is marked by the start of the next line or a final tap
  });

  it('should reset sync state correctly', () => {
    const { result } = renderHook(() => useSync(mockLines, 1.0));
    
    act(() => {
      result.current.setIsSyncing(true);
      result.current.tap();
      result.current.resetSync();
    });

    expect(result.current.lines[0].words[0].start).toBe(0);
    expect(result.current.currentIndex).toEqual({ lineIdx: 0, wordIdx: 0 });
  });
});
