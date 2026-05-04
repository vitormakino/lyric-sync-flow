import { useState, useEffect, useRef, useCallback } from 'react';
import { PlayerState } from '../types';

export function useAudio() {
  const [playerState, setPlayerState] = useState<PlayerState>({
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    playbackRate: 1,
  });

  const [isReady, setIsReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const [sourceType, setSourceType] = useState<'local' | 'youtube' | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);

  const onYtReady = useCallback((player: any) => {
    ytPlayerRef.current = player;
    setIsReady(true);
  }, []);

  // Poll for time updates (more precise than onTimeUpdate)
  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();

    const update = () => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (sourceType === 'local' && audioRef.current && !audioRef.current.paused) {
        setPlayerState(prev => ({ 
          ...prev, 
          currentTime: audioRef.current!.currentTime,
          duration: audioRef.current!.duration 
        }));
      } else if (sourceType === 'youtube' && ytPlayerRef.current && typeof ytPlayerRef.current.getPlayerState === 'function' && ytPlayerRef.current.getPlayerState() === 1) {
        setPlayerState(prev => ({ 
          ...prev, 
          currentTime: ytPlayerRef.current.getCurrentTime(),
          duration: ytPlayerRef.current.getDuration()
        }));
      } else if (sourceType === null && playerState.isPlaying) {
        // Virtual clock for sourceless recording
        setPlayerState(prev => ({
          ...prev,
          currentTime: prev.currentTime + (delta * prev.playbackRate),
          duration: Math.max(prev.duration, prev.currentTime + 1)
        }));
      }
      animationId = requestAnimationFrame(update);
    };

    animationId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationId);
  }, [sourceType, playerState.isPlaying, playerState.playbackRate]);

  const loadLocalFile = (file: File) => {
    setIsReady(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.onloadedmetadata = () => {
      setPlayerState({
        currentTime: 0,
        duration: audio.duration,
        isPlaying: false,
        playbackRate: 1,
      });
      setSourceType('local');
      setVideoId(null);
      setIsReady(true);
    };
    audio.onplay = () => setPlaying(true);
    audio.onpause = () => setPlaying(false);
    audio.onended = () => setPlaying(false);
    audioRef.current = audio;
  };

  const loadYouTube = (id: string) => {
    setIsReady(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setSourceType('youtube');
    setVideoId(id);
    setPlayerState({
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      playbackRate: 1,
    });
  };

  const setPlaying = useCallback((playing: boolean) => {
    setPlayerState(prev => ({ ...prev, isPlaying: playing }));
  }, []);

  const togglePlay = useCallback(() => {
    if (sourceType === 'local' && audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
    } else if (sourceType === 'youtube' && ytPlayerRef.current && typeof ytPlayerRef.current.getPlayerState === 'function') {
      const state = ytPlayerRef.current.getPlayerState();
      // YT.PlayerState.PLAYING = 1, PAUSED = 2, BUFFERING = 3, CUED = 5, UNSTARTED = -1
      if (state === 1 || state === 3) {
        ytPlayerRef.current.pauseVideo();
      } else {
        ytPlayerRef.current.playVideo();
      }
    } else if (sourceType === null) {
      // Toggle virtual playback
      setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    }
  }, [sourceType]);

  const setPlaybackRate = useCallback((rate: number) => {
    if (sourceType === 'local' && audioRef.current) {
      audioRef.current.playbackRate = rate;
      setPlayerState(prev => ({ ...prev, playbackRate: rate }));
    } else if (sourceType === 'youtube' && ytPlayerRef.current && typeof ytPlayerRef.current.setPlaybackRate === 'function') {
      try {
        ytPlayerRef.current.setPlaybackRate(rate);
        setPlayerState(prev => ({ ...prev, playbackRate: rate }));
      } catch (e) {
        console.error("Failed to set YouTube playback rate:", e);
      }
    }
  }, [sourceType]);

  const seek = useCallback((time: number) => {
    if (sourceType === 'local' && audioRef.current) {
      audioRef.current.currentTime = time;
      setPlayerState(prev => ({ ...prev, currentTime: time }));
    } else if (sourceType === 'youtube' && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      try {
        ytPlayerRef.current.seekTo(time, true);
        setPlayerState(prev => ({ ...prev, currentTime: time }));
      } catch (e) {
        console.error("Failed to seek YouTube:", e);
      }
    }
  }, [sourceType]);

  return {
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
  };
}
