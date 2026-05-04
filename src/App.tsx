/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useAudio } from './hooks/useAudio';
import { useSync } from './hooks/useSync';
import { parseLyrics, formatTime, syllabifyText } from './utils/subtitleUtils';
import { YouTubePlayer } from './components/YouTubePlayer';
import { SyncPreview } from './components/SyncPreview';
import { Timeline } from './components/Timeline';
import { ExportPanel } from './components/ExportPanel';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Upload, 
  Youtube, 
  Type, 
  Keyboard, 
  Info, 
  Music, 
  Trash2, 
  Code, 
  Maximize,
  Minimize,
  X,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const { 
    playerState, 
    loadLocalFile, 
    loadYouTube, 
    togglePlay, 
    setPlaying,
    onYtReady,
    isReady,
    setPlaybackRate, 
    seek,
    ytPlayerRef,
    sourceType,
    videoId
  } = useAudio();

  const [rawLyrics, setRawLyrics] = useState('');
  const [initialLines, setInitialLines] = useState<any[]>([]);
  const [ytUrl, setYtUrl] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { 
    lines, 
    currentIndex, 
    isSyncing, 
    setIsSyncing, 
    tap, 
    undoTap,
    resetSync, 
    updateWord 
  } = useSync(initialLines, playerState.currentTime);

  const [lastTapTime, setLastTapTime] = useState(0);

  const handleTap = () => {
    if (!playerState.isPlaying) return;
    tap();
    setLastTapTime(Date.now());
  };

  // Handle keyboard shortcuts globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Play/Pause with Enter
      if (e.code === 'Enter') {
        e.preventDefault();
        togglePlay();
      }

      // Space logic: 
      // 1. If playing: Mark syllable (tap)
      // 2. If paused: Start playback
      if (e.code === 'Space') {
        e.preventDefault();
        if (playerState.isPlaying) {
          handleTap();
        } else {
          togglePlay();
        }
      } 
      
      // Undo with Backspace
      if (e.code === 'Backspace' && playerState.isPlaying) {
        e.preventDefault();
        undoTap();
      }

      // Exit Fullscreen with Escape
      if (e.code === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerState.isPlaying, togglePlay, undoTap, isFullscreen]);

  // Automatically enable syncing mode when playing if lyrics are present
  useEffect(() => {
    if (playerState.isPlaying && initialLines.length > 0) {
      setIsSyncing(true);
    } else {
      setIsSyncing(false);
    }
  }, [playerState.isPlaying, initialLines]);

  const handleParse = () => {
    const parsed = parseLyrics(rawLyrics);
    setInitialLines(parsed);
  };

  const handleYtLoad = () => {
    // Robust YouTube ID extraction (handles watch?v=, shorts/, embed/, youtu.be/)
    const regex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[&?]|$)/;
    const match = ytUrl.match(regex);
    
    if (match && match[1]) {
      loadYouTube(match[1]);
    } else if (ytUrl.trim().length > 0) {
      alert("Invalid YouTube URL. Please use a standard link, shorts, or embed URL (11-character ID).");
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadLocalFile(file);
    }
  };

  const handleYtStateChange = useCallback((state: number) => {
    // YT.PlayerState.PLAYING = 1, PAUSED = 2, ENDED = 0
    if (state === 1) setPlaying(true);
    else if (state === 2 || state === 0) setPlaying(false);
  }, [setPlaying]);


  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 font-sans selection:bg-amber-500/30 flex flex-col">
      {/* Header Section */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 py-4 md:h-20 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-transform hover:rotate-3">
              <Music className="text-black" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase">LYRIC <span className="text-amber-500">SYNC FLOW</span></h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold">
                {sourceType ? `Active Source: ${sourceType.toUpperCase()}` : 'V 2.1.0 - HIGH PRECISION ENGINE'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-3 w-full md:w-auto">
            <label className="flex-1 md:flex-none px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center gap-2">
              <Upload size={14} /> IMPORT AUDIO
              <input type="file" className="hidden" accept="audio/*,video/*" onChange={handleFileUpload} />
            </label>
            <div className="flex-1 md:flex-none flex bg-white/5 rounded-lg border border-white/10 p-0.5">
              <input 
                type="text" 
                placeholder="YouTube URL..."
                value={ytUrl}
                onChange={(e) => setYtUrl(e.target.value)}
                className="bg-transparent border-none text-[11px] px-3 py-1.5 focus:outline-none w-full md:w-32 md:focus:w-64 transition-all font-mono"
              />
              <button 
                onClick={handleYtLoad}
                className="px-3 py-1.5 bg-white/10 rounded font-mono text-[10px] hover:bg-white/20 transition-colors border-none"
                title="Load YouTube Video"
              >
                LOAD
              </button>
            </div>
            <button className="hidden md:flex items-center gap-2 px-6 py-2 bg-amber-500 text-black font-bold rounded-lg text-xs shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-transform hover:scale-105">
               <Info size={14} /> HELP
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-6 max-w-[1400px] mx-auto w-full p-6 min-h-0">
        
        {/* Left Side: Lyric Editor */}
        <section className="lg:col-span-3 flex flex-col gap-4 bg-white/5 rounded-2xl border border-white/5 p-5 min-h-[300px] lg:min-h-0">
          <div className="flex justify-between items-center">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Type size={14} className="text-amber-500/70" /> Lyric Editor
            </h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setRawLyrics(syllabifyText(rawLyrics));
                }}
                className="p-1 px-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-md text-amber-500 transition-all flex items-center gap-1.5 group/syll"
                title="Auto Syllabify (Magic Break)"
              >
                <Sparkles size={11} className="group-hover/syll:rotate-12 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-wider">Syllabify</span>
              </button>
              <button 
                onClick={() => setRawLyrics('')}
                className="p-1.5 bg-white/5 hover:bg-red-500/20 border border-white/10 rounded-md text-slate-400 hover:text-red-500 transition-all"
                title="Clear All"
              >
                <Trash2 size={12} />
              </button>
              <span className="text-[10px] font-mono text-amber-500/60 ml-1">{lines.reduce((acc, l) => acc + l.words.length, 0)} WORDS</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-3">
            <textarea
              value={rawLyrics}
              onChange={(e) => setRawLyrics(e.target.value)}
              placeholder="Paste lyrics here. Use double newlines for line breaks..."
              className="flex-1 bg-black/40 border border-white/10 rounded-xl p-4 text-sm font-sans leading-relaxed text-slate-300 focus:outline-none focus:border-amber-500/50 resize-none custom-scrollbar transition-colors"
            />
            <button 
              onClick={handleParse}
              className="w-full py-3 bg-white/5 border border-dashed border-white/20 rounded-xl text-[10px] text-slate-400 hover:text-white hover:border-white/40 uppercase tracking-[0.2em] font-bold transition-all"
            >
              Update Lyrics List
            </button>
          </div>
          
          <div className="hidden md:block p-4 border border-amber-500/20 bg-amber-500/5 rounded-xl">
            <h4 className="text-[10px] text-amber-500 font-bold uppercase mb-2 flex items-center gap-1">
              <Info size={12} /> Pro Tip
            </h4>
            <p className="text-[11px] text-slate-400 leading-snug">
              Use millisecond mode (Shift + Space) for faster tempo songs to ensure intra-word precision.
            </p>
          </div>
        </section>

        {/* Center: Stage & Controls */}
        <section className="lg:col-span-6 flex flex-col gap-6 order-first lg:order-none">
          {/* Teleprompter Stage */}
          <div 
            onClick={handleTap}
            className={`
              flex-1 rounded-3xl border p-6 md:p-12 min-h-[350px] md:min-h-[450px] flex flex-col items-center justify-center relative overflow-hidden group shadow-2xl transition-all duration-500
              ${playerState.isPlaying 
                ? 'bg-gradient-to-b from-amber-500/10 to-transparent border-amber-500/20 cursor-crosshair' 
                : 'bg-gradient-to-b from-white/5 to-transparent border-white/10 cursor-default'}
            `}
          >
            {/* Surge Effect on Tap */}
            <motion.div
              key={lastTapTime}
              initial={{ opacity: 0.5, scale: 0.8 }}
              animate={lastTapTime > 0 ? { opacity: 0, scale: 1.5 } : {}}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 bg-amber-500/20 pointer-events-none"
            />

            <div className={`absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(245,158,11,0.08),transparent_70%)] transition-opacity ${playerState.isPlaying ? 'opacity-100' : 'opacity-0'}`}></div>
            
            <SyncPreview 
              lines={lines} 
              currentTime={playerState.currentTime} 
              currentIndex={currentIndex}
              isSyncing={isSyncing}
            />

            {/* Focus Mode Toggle */}
            <button 
              onClick={(e) => { e.stopPropagation(); setIsFullscreen(true); }}
              className="absolute bottom-6 right-6 p-3 bg-black/40 hover:bg-black/60 border border-white/10 rounded-full text-slate-400 hover:text-amber-500 transition-all z-30 group/fs"
              title="Enter Focus Mode"
            >
              <Maximize size={18} className="group-hover/fs:scale-110 transition-transform" />
            </button>

            {/* Recording Indicator & Help */}
            {playerState.isPlaying && (
              <div className="absolute top-8 flex flex-col items-center gap-2">
                <div className="flex items-center gap-3 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full backdrop-blur-md animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,1)]"></div>
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">Recording Tap Points</span>
                </div>
                <div className="hidden md:flex gap-4">
                    <div className="flex items-center gap-2 px-2 py-0.5 bg-black/50 rounded-md border border-white/10">
                      <kbd className="px-1 bg-white/10 rounded text-[9px] font-mono">ENTER</kbd>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">PLAY/PAUSE</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-0.5 bg-black/50 rounded-md border border-white/10">
                      <kbd className="px-1 bg-white/10 rounded text-[9px] font-mono">SPACE</kbd>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">TAP</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-0.5 bg-black/50 rounded-md border border-white/10">
                      <kbd className="px-1 bg-white/10 rounded text-[9px] font-mono">BACKSPACE</kbd>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">UNDO</span>
                    </div>
                </div>
                
                {/* Mobile Specific Controls */}
                <div className="md:hidden flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); undoTap(); }}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/20 active:bg-white/20 active:scale-95 transition-all"
                  >
                    <RotateCcw size={14} className="text-amber-500" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">UNDO LAST TAP</span>
                  </button>
                </div>
              </div>
            )}

            {!playerState.isPlaying && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity gap-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  disabled={sourceType !== null && !isReady}
                  className={`
                    w-20 h-20 bg-amber-500 text-black rounded-full flex items-center justify-center shadow-2xl transform transition-transform hover:scale-110 active:scale-95
                    ${(sourceType !== null && !isReady) ? 'opacity-50 cursor-wait' : ''}
                  `}
                >
                  {(sourceType !== null && !isReady) ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                      <RotateCcw size={32} />
                    </motion.div>
                  ) : (
                    <Play size={32} fill="black" className="ml-1" />
                  )}
                </button>
                <p className="text-white text-[10px] font-bold uppercase tracking-widest bg-black/50 px-3 py-1 rounded-full border border-white/10">
                  {sourceType !== null && !isReady 
                    ? 'Initializing Player...' 
                    : <span className="flex items-center gap-2">
                        <span className="hidden md:inline">Press Enter or Space to Start</span>
                        <span className="md:hidden">Tap to Start</span>
                      </span>
                  }
                </p>
              </div>
            )}
          </div>

          {/* Media Player Column (Embedded in center for better focus) */}
          <div className="flex flex-col gap-4">
            {sourceType === 'youtube' ? (
              videoId ? (
                <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                  <YouTubePlayer 
                    videoId={videoId} 
                    onReady={onYtReady}
                    onStateChange={handleYtStateChange} 
                  />
                </div>
              ) : (
                <div className="aspect-video w-full bg-black/40 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-4 text-slate-500">
                  <Youtube size={48} className="opacity-20" />
                  <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">Awaiting YouTube Video ID</p>
                </div>
              )
            ) : sourceType === 'local' ? (
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6 flex flex-col items-center justify-center gap-3">
                 <Music size={32} className="text-amber-500 opacity-50" />
                 <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Local Audio Active</p>
              </div>
            ) : (
              <div className="aspect-video w-full bg-black/20 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-4 text-slate-500">
                <Upload size={32} className="opacity-10" />
                <p className="text-[10px] uppercase tracking-widest font-bold opacity-20">Import Audio or YouTube Link</p>
              </div>
            )}

            {/* Playback Controls Dashboard */}
            <div className="h-28 bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between px-10 shadow-3xl backdrop-blur-md relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite] pointer-events-none"></div>
               
               <div className="flex flex-col gap-2">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Speed Control</span>
                <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                  {[0.5, 0.75, 1, 1.25].map(rate => (
                    <button
                      key={rate}
                      onClick={() => setPlaybackRate(rate)}
                      className={`
                        px-3 py-1.5 rounded transition-all font-mono text-[10px] font-bold
                        ${playerState.playbackRate === rate 
                          ? 'bg-amber-500/20 border border-amber-500/50 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
                          : 'text-slate-500 hover:text-slate-300'}
                      `}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-8">
                <button 
                  onClick={() => seek(0)}
                  className="p-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all active:scale-90"
                >
                  <RotateCcw size={18} className="text-slate-400" />
                </button>
                <button 
                  onClick={togglePlay}
                  disabled={sourceType !== null && !isReady}
                  className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] active:scale-95 disabled:opacity-50 disabled:cursor-wait"
                >
                  {(sourceType !== null && !isReady) ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
                      <RotateCcw size={24} />
                    </motion.div>
                  ) : playerState.isPlaying ? (
                    <Pause size={28} fill="black" />
                  ) : (
                    <Play size={28} className="ml-1" fill="black" />
                  )}
                </button>
                <button 
                   onClick={() => resetSync()}
                   className="p-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all active:scale-90 group"
                   title="Reset All Sync Data"
                >
                  <Trash2 size={18} className="text-slate-500 group-hover:text-red-400" />
                </button>
              </div>

              <div className="text-right">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Current Clock</span>
                <div className="text-2xl font-mono font-black text-white tracking-tighter tabular-nums drop-shadow-md">
                  {Math.floor(playerState.currentTime / 60).toString().padStart(2, '0')}:
                  {Math.floor(playerState.currentTime % 60).toString().padStart(2, '0')}.
                  <span className="text-amber-500">{(playerState.currentTime % 1).toFixed(3).substring(2)}</span>
                </div>
              </div>
            </div>
            
            {/* Main Progress Bar */}
            <div className="px-2">
               <input 
                  type="range" 
                  min={0} 
                  max={playerState.duration || 100} 
                  step={0.01}
                  value={playerState.currentTime}
                  onChange={(e) => seek(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 transition-all"
                />
            </div>
          </div>
        </section>

        {/* Right Side: Timeline & Export */}
        <section className="lg:col-span-3 flex flex-col gap-6">
           <div className="bg-white/5 rounded-2xl border border-white/5 flex flex-col h-[400px] lg:h-[60%] overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Keyboard size={14} className="text-amber-500/70" /> Timeline Editor
                </h3>
              </div>
              <div className="p-4 flex-1 overflow-hidden">
                <Timeline 
                  lines={lines} 
                  onWordUpdate={updateWord} 
                  currentTime={playerState.currentTime}
                  onSeek={seek}
                  currentIndex={currentIndex}
                />
              </div>
           </div>

           <div className="bg-white/5 rounded-2xl border border-white/5 p-4 flex items-center gap-[2px] h-12">
              <div className="flex-1 h-[20%] bg-white/20 rounded-full"></div>
              <div className="flex-1 h-[40%] bg-white/20 rounded-full"></div>
              <div className="flex-1 h-[60%] bg-white/20 rounded-full"></div>
              <div className="flex-1 h-[90%] bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
              <div className="flex-1 h-[70%] bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
              <div className="flex-1 h-[30%] bg-white/20 rounded-full"></div>
              <div className="flex-1 h-[50%] bg-white/20 rounded-full"></div>
              <div className="flex-1 h-[80%] bg-white/20 rounded-full"></div>
              <div className="flex-1 h-[40%] bg-white/20 rounded-full"></div>
              <div className="flex-1 h-[20%] bg-white/20 rounded-full"></div>
              <div className="flex-1 h-[15%] bg-white/20 rounded-full"></div>
              <div className="flex-1 h-[60%] bg-white/20 rounded-full"></div>
           </div>

           <div className="bg-white/5 rounded-2xl border border-white/5 p-5 flex flex-col gap-4 flex-1">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Code size={14} className="text-amber-500/70" /> Export Engine
              </h3>
              
              <div className="bg-black/60 rounded-xl p-4 font-mono text-[10px] leading-relaxed text-slate-400 border border-white/5 flex-1 overflow-y-auto custom-scrollbar">
                <div className="opacity-40 mb-2">/-- RAW PREVIEW --/</div>
                <div className="space-y-4">
                  {lines.map((l, i) => {
                    const isRecorded = l.words.some(w => w.start > 0);
                    if (!isRecorded && i > currentIndex.lineIdx + 2) return null;
                    if (i < currentIndex.lineIdx - 5) return null;

                    return (
                      <div key={i} className={`p-2 rounded border transition-colors ${i === currentIndex.lineIdx ? 'bg-amber-500/10 border-amber-500/30' : 'border-transparent'}`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[8px] font-bold text-slate-500">LINE {i + 1}</span>
                          <span className={l.start > 0 ? 'text-amber-500' : 'text-slate-700'}>
                            [{formatTime(l.start)} {"-->"} {formatTime(l.end)}]
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {l.words.map(w => (
                            <span key={w.id} className={w.start > 0 ? 'text-slate-300' : 'text-slate-600'}>
                              {w.text}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <ExportPanel lines={lines} />
              </div>
           </div>
        </section>
      </main>

      {/* Footer Bar */}
      <footer className="flex justify-between items-center text-[10px] text-slate-600 font-mono border-t border-white/5 px-10 py-6">
        <div className="flex gap-8">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500/50 animate-pulse"></span>
            SAMPLING: <span className="text-slate-400">44.1kHz</span>
          </div>
          <div>LATENCY: <span className="text-slate-400">~14ms (Web Audio)</span></div>
          <div>STATUS: <span className={isSyncing ? 'text-amber-500 font-bold' : 'text-slate-400'}>{isSyncing ? 'ACTIVE SYNC' : 'IDLE'}</span></div>
        </div>
        <div className="tracking-widest uppercase opacity-50">SYNC ENGINE: MULTI-CORE PRECISION V2</div>
      </footer>

      {/* Focus Mode Overlay */}
      {isFullscreen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center p-6 md:p-12"
        >
          {/* Top Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-white/5 z-50">
            <motion.div 
              className="h-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]"
              initial={{ width: 0 }}
              animate={{ width: `${(playerState.currentTime / (playerState.duration || 1)) * 100}%` }}
              transition={{ ease: "linear", duration: 0.1 }}
            />
          </div>

          {/* Close Button */}
          <button 
            onClick={() => setIsFullscreen(false)}
            className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/50 hover:text-white transition-all z-50"
          >
            <X size={24} />
          </button>

          {/* Immersive Lyrics Stage */}
          <div 
            onClick={handleTap}
            className="w-full h-full flex flex-col items-center justify-center relative cursor-crosshair"
          >
             <SyncPreview 
                lines={lines} 
                currentTime={playerState.currentTime} 
                currentIndex={currentIndex}
                isSyncing={isSyncing}
              />

              {/* Status Indicator */}
              <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
                 <div className="flex items-center gap-3 px-6 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-full backdrop-blur-xl">
                    <div className={`w-2 h-2 rounded-full ${playerState.isPlaying ? 'bg-amber-500 animate-pulse' : 'bg-slate-600'}`}></div>
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em]">
                      {playerState.isPlaying ? 'Recording Performance' : 'Paused'}
                    </span>
                 </div>
                 {!playerState.isPlaying && (
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden md:block">Press Space to Resume</span>
                 )}
              </div>

              {/* Mobile Interaction Help */}
              <div className="md:hidden absolute bottom-12 left-0 w-full flex justify-center gap-4 px-6">
                <button 
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  className="flex-1 py-4 bg-white text-black font-black rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-transform"
                >
                  {playerState.isPlaying ? 'PAUSE' : 'PLAY'}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); undoTap(); }}
                  className="flex-1 py-4 bg-white/10 border border-white/20 text-white font-black rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-transform"
                >
                  UNDO
                </button>
              </div>
          </div>
        </motion.div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; transition: background 0.2s; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
