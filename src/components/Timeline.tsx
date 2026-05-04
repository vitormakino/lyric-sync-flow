import { useEffect, useRef } from 'react';
import { SubtitleLine, WordSync } from '../types';
import { formatTime } from '../utils/subtitleUtils';
import { Edit2, Trash2 } from 'lucide-react';

interface TimelineProps {
  lines: SubtitleLine[];
  onWordUpdate: (lineIdx: number, wordIdx: number, updates: Partial<WordSync>) => void;
  currentTime: number;
  onSeek: (time: number) => void;
  currentIndex?: { lineIdx: number; wordIdx: number };
}

export function Timeline({ lines, onWordUpdate, currentTime, onSeek, currentIndex }: TimelineProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to either the target word (recording) or the active word (playback)
    const targetId = currentIndex 
      ? `word-${currentIndex.lineIdx}-${currentIndex.wordIdx}`
      : lines.map((l, lIdx) => l.words.map((w, wIdx) => {
          if (currentTime >= w.start && currentTime <= w.end && w.start > 0) return `word-${lIdx}-${wIdx}`;
          return null;
        }).find(id => id)).find(id => id);

    if (targetId && scrollContainerRef.current) {
      const activeElement = document.getElementById(targetId);
      if (activeElement) {
        const container = scrollContainerRef.current;
        const elementRect = activeElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Check if element is within container's viewport
        const isVisible = (
          elementRect.top >= containerRect.top &&
          elementRect.bottom <= containerRect.bottom
        );

        if (!isVisible) {
          const scrollPos = activeElement.offsetTop - (container.offsetHeight / 2) + (activeElement.offsetHeight / 2);
          container.scrollTo({ top: scrollPos, behavior: 'smooth' });
        }
      }
    }
  }, [currentIndex, currentTime, lines]);

  return (
    <div ref={scrollContainerRef} className="flex flex-col gap-3 overflow-y-auto max-h-[100%] pr-2 custom-scrollbar">
      {lines.map((line, lIdx) => (
        <div key={line.id} className="bg-white/5 rounded-xl p-3 border border-white/5 transition-colors hover:border-white/10">
          <div className="flex justify-between items-center mb-2">
            <span className={`text-[9px] font-bold uppercase tracking-widest ${currentTime >= line.start && (line.end === 0 || currentTime <= line.end) && line.start > 0 ? 'text-amber-500' : 'text-slate-600'}`}>
              LINE {lIdx + 1}
            </span>
            <span className={`text-[9px] font-mono ${currentTime >= line.start && (line.end === 0 || currentTime <= line.end) && line.start > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-500/50'}`}>
              {line.start > 0 ? formatTime(line.start).split(':').slice(1).join(':') : '--:--'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {line.words.map((word, wIdx) => {
              const isRecorded = word.start > 0;
              const isActive = currentTime >= word.start && (word.end === 0 || currentTime <= word.end) && isRecorded;
              const isTarget = currentIndex && currentIndex.lineIdx === lIdx && currentIndex.wordIdx === wIdx;
              const isActuallyRecorded = isRecorded && !isActive && !isTarget;

              return (
                <div
                  key={word.id}
                  id={`word-${lIdx}-${wIdx}`}
                  onClick={() => word.start > 0 && onSeek(word.start)}
                  className={`
                    group relative px-2 py-1 rounded cursor-pointer transition-all border text-[11px] font-medium
                    ${isActive 
                      ? 'bg-amber-500/20 border-amber-500 text-amber-500 px-3 z-10 scale-105 shadow-lg shadow-amber-500/10' 
                      : isTarget
                        ? 'bg-white/20 border-amber-500/50 text-white animate-pulse scale-110 z-10 shadow-lg shadow-amber-500/20 ring-2 ring-amber-500/20'
                        : isActuallyRecorded
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 opacity-80 hover:opacity-100 hover:border-emerald-500/60'
                          : 'bg-black/30 border-white/5 text-slate-400 hover:border-white/20 hover:text-white'}
                  `}
                >
                  <span>{word.text}</span>
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-[9px] px-2 py-1.5 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 font-mono border border-white/10 backdrop-blur-md">
                    <span className="text-amber-500">I:</span> {word.start.toFixed(3)}s<br />
                    <span className="text-amber-500">O:</span> {word.end.toFixed(3)}s
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {lines.length === 0 && (
         <div className="text-center py-12 opacity-20">
            <Edit2 size={32} className="mx-auto mb-2" />
            <p className="text-xs uppercase tracking-widest">No segments found</p>
         </div>
      )}
    </div>
  );
}
