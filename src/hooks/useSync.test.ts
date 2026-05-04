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
      result.current.tapStart();
    });

    expect(result.current.lines[0].words[0].start).toBe(1.0);
    
    // Release at 1.5s (Word 1 end)
    currentTime = 1.5;
    rerender();
    act(() => {
      result.current.tapEnd();
    });

    expect(result.current.lines[0].words[0].end).toBe(1.5);
    expect(result.current.currentIndex).toEqual({ lineIdx: 0, wordIdx: 1 });

    // Move time and press again at 2.5s (Word 2 start)
    currentTime = 2.5;
    rerender();
    
    act(() => {
      result.current.tapStart();
    });

    expect(result.current.lines[0].words[1].start).toBe(2.5);
    
    // Release at 3.0s (Word 2 end)
    currentTime = 3.0;
    rerender();
    act(() => {
      result.current.tapEnd();
    });

    expect(result.current.lines[0].words[1].end).toBe(3.0);
    expect(result.current.currentIndex).toEqual({ lineIdx: 1, wordIdx: 0 }); // Moved to next line

    // Verify last word end time logic
    // Usually, the end of the last word is marked by the start of the next line or a final tap
  });

  it('should reset sync state correctly', () => {
    const { result } = renderHook(() => useSync(mockLines, 1.0));
    
    act(() => {
      result.current.setIsSyncing(true);
      result.current.tapStart();
      result.current.resetSync();
    });

    expect(result.current.lines[0].words[0].start).toBe(0);
    expect(result.current.currentIndex).toEqual({ lineIdx: 0, wordIdx: 0 });
  });
});
