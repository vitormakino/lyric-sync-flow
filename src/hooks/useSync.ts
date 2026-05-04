import { useState, useCallback, useEffect } from 'react';
import { SubtitleLine, WordSync } from '../types';

export function useSync(initialLines: SubtitleLine[], currentTime: number) {
  const [lines, setLines] = useState<SubtitleLine[]>(initialLines);
  const [currentIndex, setCurrentIndex] = useState<{ lineIdx: number; wordIdx: number }>({ lineIdx: 0, wordIdx: 0 });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setLines(initialLines);
    setCurrentIndex({ lineIdx: 0, wordIdx: 0 });
  }, [initialLines]);

  const tap = useCallback(() => {
    if (!isSyncing) return;

    setLines(prevLines => {
      const newLines = [...prevLines];
      const { lineIdx, wordIdx } = currentIndex;

      // Handle the case where we tap to end the very last word
      if (lineIdx >= newLines.length) {
        setIsSyncing(false);
        // Set end time for the last word of the last line
        if (newLines.length > 0) {
          const lastLineIdx = newLines.length - 1;
          const lastLine = { ...newLines[lastLineIdx] };
          const lastWords = [...lastLine.words];
          if (lastWords.length > 0) {
            lastWords[lastWords.length - 1].end = currentTime;
            lastLine.end = currentTime;
            lastLine.words = lastWords;
            newLines[lastLineIdx] = lastLine;
          }
        }
        return newLines;
      }

      const currentLine = { ...newLines[lineIdx] };
      const currentWords = [...currentLine.words];
      const currentWord = { ...currentWords[wordIdx] };

      // Set start time for current word
      currentWord.start = currentTime;
      
      // If there was a previous word, set its end time
      if (wordIdx > 0) {
        currentWords[wordIdx - 1].end = currentTime;
      } else if (lineIdx > 0) {
        // If it's the first word of a line, set the end of the last word of previous line
        const prevLine = { ...newLines[lineIdx - 1] };
        const prevWords = [...prevLine.words];
        prevWords[prevWords.length - 1].end = currentTime;
        prevLine.words = prevWords;
        prevLine.end = currentTime; // Update line end
        newLines[lineIdx - 1] = prevLine;
      }

      // Update line start if it's the first word
      if (wordIdx === 0) {
        currentLine.start = currentTime;
      }

      currentWords[wordIdx] = currentWord;
      currentLine.words = currentWords;
      newLines[lineIdx] = currentLine;

      // Advance index
      let nextLineIdx = lineIdx;
      let nextWordIdx = wordIdx + 1;

      if (nextWordIdx >= currentWords.length) {
        nextLineIdx++;
        nextWordIdx = 0;
      }

      // If we just mapped the last word of the last line, we don't return yet
      // because we need one more tap to set its end time.
      // So currentIndex will go one step "beyond" the last word.
      
      setCurrentIndex({ lineIdx: nextLineIdx, wordIdx: nextWordIdx });
      
      // If we are finished with all words, the next tap will enter the "end recording" logic at top
      return newLines;
    });
  }, [currentIndex, currentTime, isSyncing]);

  const undoTap = useCallback(() => {
    setCurrentIndex(prev => {
      let l = prev.lineIdx;
      let w = prev.wordIdx - 1;
      
      if (w < 0) {
        l--;
        if (l < 0) return prev;
        w = lines[l].words.length - 1;
      }
      
      // Reset the word we are going back to
      setLines(prevLines => {
        const next = [...prevLines];
        const line = { ...next[l] };
        const words = [...line.words];
        words[w] = { ...words[w], start: 0, end: 0 };
        line.words = words;
        next[l] = line;
        return next;
      });
      
      return { lineIdx: l, wordIdx: w };
    });
  }, [lines]);

  const resetSync = useCallback(() => {
    setCurrentIndex({ lineIdx: 0, wordIdx: 0 });
    setLines(prev => prev.map(line => ({
      ...line,
      start: 0,
      end: 0,
      words: line.words.map(w => ({ ...w, start: 0, end: 0 }))
    })));
  }, []);

  const updateWord = useCallback((lineIdx: number, wordIdx: number, updates: Partial<WordSync>) => {
    setLines(prev => {
      if (!prev[lineIdx]) return prev;
      const next = [...prev];
      const line = { ...next[lineIdx] };
      const words = [...line.words];
      
      if (!words[wordIdx]) return prev;
      
      words[wordIdx] = { ...words[wordIdx], ...updates };
      line.words = words;
      
      // Recalculate line boundaries
      const activeWords = words.filter(w => w.start > 0);
      line.start = activeWords.length > 0 ? Math.min(...activeWords.map(w => w.start)) : 0;
      line.end = activeWords.length > 0 ? Math.max(...activeWords.map(w => w.end)) : 0;
      
      next[lineIdx] = line;
      return next;
    });
  }, []);

  return {
    lines,
    setLines,
    currentIndex,
    isSyncing,
    setIsSyncing,
    tap,
    undoTap,
    resetSync,
    updateWord
  };
}
