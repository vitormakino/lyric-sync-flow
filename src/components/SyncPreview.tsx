import { SubtitleLine } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SyncPreviewProps {
  lines: SubtitleLine[];
  currentTime: number;
  currentIndex?: { lineIdx: number; wordIdx: number };
  isSyncing: boolean;
}

export function SyncPreview({ lines, currentTime, currentIndex, isSyncing }: SyncPreviewProps) {
  // Find current line to display based on currentTime or index
  const activeLineIdx = isSyncing && currentIndex
    ? currentIndex.lineIdx 
    : lines.findIndex(l => currentTime >= l.start && (l.end === 0 || currentTime <= l.end));

  const displayedLines = lines.slice(
    Math.max(0, activeLineIdx - 1),
    Math.min(lines.length, (activeLineIdx !== -1 ? activeLineIdx : 0) + 2)
  );

  const nextLine = lines[activeLineIdx + 1];

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-center gap-8 z-10 w-full">
      <div className="flex flex-col gap-6 w-full">
        <AnimatePresence mode="wait">
          <div className="flex flex-col gap-8">
            {displayedLines.map((line) => {
              const globalLineIdx = lines.indexOf(line);
              const isCurrentLine = globalLineIdx === activeLineIdx;
              
              return (
                <motion.div
                  key={line.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: isCurrentLine ? 1 : 0.3,
                    scale: isCurrentLine ? 1 : 0.85,
                    y: 0,
                    filter: isCurrentLine ? 'blur(0px)' : 'blur(2px)'
                  }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                  className="flex flex-wrap justify-center gap-x-4 gap-y-2 px-4"
                >
                  {line.words.map((word, wIdx) => {
                    const isCurrentWordSync = isSyncing && currentIndex && 
                                             globalLineIdx === currentIndex.lineIdx && 
                                             wIdx === currentIndex.wordIdx;
                                             
                    const isWordActivePlayback = !isSyncing && 
                                                word.start > 0 &&
                                                currentTime >= word.start && 
                                                (word.end === 0 || currentTime <= word.end);

                    return (
                      <span
                        key={word.id}
                        className={`
                          relative text-3xl md:text-5xl font-black italic tracking-tighter transition-all duration-500
                          ${isCurrentWordSync ? 'text-amber-500 scale-125 drop-shadow-[0_0_25px_rgba(245,158,11,0.6)] z-20' : ''}
                          ${isWordActivePlayback ? 'text-amber-500 drop-shadow-[0_0_20px_rgba(245,158,11,0.7)]' : ''}
                          ${!isCurrentWordSync && !isWordActivePlayback ? (word.start > 0 ? 'text-emerald-400' : 'text-white') : ''}
                          ${!isCurrentWordSync && !isWordActivePlayback && isCurrentLine && word.start === 0 ? 'opacity-40' : ''}
                          ${!isCurrentLine ? 'text-slate-600 opacity-10 blur-[1px]' : ''}
                        `}
                      >
                        {isCurrentWordSync && (
                          <motion.div 
                            layoutId="sync-dot"
                            className="absolute -top-6 left-1/2 -translate-x-1/2 w-3 h-3 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,1)]"
                          />
                        )}
                        {word.text.toUpperCase()}
                      </span>
                    );
                  })}
                </motion.div>
              );
            })}
            
            {lines.length === 0 && (
              <div className="text-slate-600 text-lg font-light italic tracking-widest animate-pulse">
                Awaiting lyrical input...
              </div>
            )}
          </div>
        </AnimatePresence>
      </div>
      
      {nextLine && !isSyncing && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-slate-500 text-xs font-light uppercase tracking-[0.4em] max-w-md line-clamp-1 opacity-60"
        >
          Next: {nextLine.words.map(w => w.text).join(' ')}
        </motion.div>
      )}

      {isSyncing && (
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full">
           <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></div>
           <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Recording Points</span>
        </div>
      )}
    </div>
  );
}
