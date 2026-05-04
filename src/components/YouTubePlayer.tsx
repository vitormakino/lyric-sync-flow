import { useEffect, useRef, memo } from 'react';

interface YouTubePlayerProps {
  videoId: string;
  onReady: (player: any) => void;
  onStateChange: (event: any) => void;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

export const YouTubePlayer = memo(function YouTubePlayer({ videoId, onReady, onStateChange }: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    let player: any;

    const createPlayer = () => {
      if (!containerRef.current || !window.YT || !window.YT.Player || !videoId) {
        return;
      }

      try {
        console.log("Initializing YouTube Player for ID:", videoId);
        player = new window.YT.Player(containerRef.current, {
          height: '100%',
          width: '100%',
          videoId,
          playerVars: {
            autoplay: 1,
            enablejsapi: 1,
            modestbranding: 1,
            rel: 0,
            origin: window.location.origin
          },
          events: {
            onReady: (event: any) => onReady(event.target),
            onStateChange: (event: any) => onStateChange(event.data),
            onError: (e: any) => console.error("YouTube Player Error:", e.data)
          },
        });
        playerRef.current = player;
      } catch (err) {
        console.error("Error creating YouTube player:", err);
      }
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      if (!document.getElementById('youtube-iframe-api')) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }

      const originalOnReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (originalOnReady) originalOnReady();
        createPlayer();
      };
    }

    return () => {
      if (player && player.destroy) {
        player.destroy();
      }
    };
  }, [videoId]);

  return (
    <div className="aspect-video w-full bg-black rounded-lg overflow-hidden shadow-2xl">
      <div ref={containerRef} />
    </div>
  );
});
