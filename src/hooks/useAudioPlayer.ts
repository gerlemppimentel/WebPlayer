import { useState, useRef, useCallback, useEffect } from 'react';
import { RadioStation, TrackMetadata, PlayerState } from '../types';

const DEFAULT_METADATA: TrackMetadata = {
  title: 'Aguardando reprodução...',
  artist: '',
  albumArt: '',
  bitrate: '--',
  format: '--',
  sampleRate: '--',
  channels: '--',
};

export function useAudioPlayer() {
  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    volume: 0.8,
    isMuted: false,
    currentStation: null,
    metadata: DEFAULT_METADATA,
    isLoading: false,
    error: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const metadataIntervalRef = useRef<number | null>(null);

  const clearMetadataInterval = () => {
    if (metadataIntervalRef.current) {
      clearInterval(metadataIntervalRef.current);
      metadataIntervalRef.current = null;
    }
  };

  const fetchMetadata = useCallback(async (stationUrl: string) => {
    try {
      // Try to get metadata through various methods
      const corsProxy = 'https://api.allorigins.win/raw?url=';
      const encodedUrl = encodeURIComponent(stationUrl);
      
      // Try fetching stream info
      const response = await fetch(`${corsProxy}${encodedUrl}`, {
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        const icyName = response.headers.get('icy-name') || '';
        const icyDescription = response.headers.get('icy-description') || '';
        const icyBitrate = response.headers.get('icy-br') || '';
        const icyGenre = response.headers.get('icy-genre') || '';

        setState(prev => ({
          ...prev,
          metadata: {
            ...prev.metadata,
            bitrate: icyBitrate || prev.metadata.bitrate,
            format: contentType || prev.metadata.format,
          },
        }));
      }
    } catch (e) {
      // Metadata fetch failed silently
    }
  }, []);

  const fetchStreamMetadata = useCallback(async (stationUrl: string) => {
    try {
      // Use a public API to get stream metadata
      const metadataApis = [
        `https://api.allorigins.win/get?url=${encodeURIComponent(stationUrl)}`,
      ];

      for (const apiUrl of metadataApis) {
        try {
          const response = await fetch(apiUrl, {
            signal: AbortSignal.timeout(8000),
          });
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.contents) {
              // Parse ICY metadata from the stream
              const icyMetadataMatch = data.contents.match(/StreamTitle='([^']*)'/);
              if (icyMetadataMatch && icyMetadataMatch[1]) {
                const metadataStr = icyMetadataMatch[1];
                const artistMatch = metadataStr.match(/(.+?)\s*-\s*(.+)/);
                
                if (artistMatch) {
                  setState(prev => ({
                    ...prev,
                    metadata: {
                      ...prev.metadata,
                      title: artistMatch[2].trim(),
                      artist: artistMatch[1].trim(),
                    },
                  }));
                  return;
                } else {
                  setState(prev => ({
                    ...prev,
                    metadata: {
                      ...prev.metadata,
                      title: metadataStr,
                      artist: '',
                    },
                  }));
                  return;
                }
              }
            }
          }
        } catch {
          continue;
        }
      }
    } catch {
      // Silently fail
    }
  }, []);

  const searchAlbumArt = useCallback(async (title: string, artist: string) => {
    if (!title && !artist) return;
    
    try {
      const query = encodeURIComponent(`${artist} ${title}`);
      const response = await fetch(
        `https://itunes.apple.com/search?term=${query}&media=music&limit=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const artworkUrl = data.results[0].artworkUrl100.replace('100x100', '600x600');
          setState(prev => ({
            ...prev,
            metadata: {
              ...prev.metadata,
              albumArt: artworkUrl,
            },
          }));
        }
      }
    } catch {
      // Album art fetch failed
    }
  }, []);

  const play = useCallback((station: RadioStation) => {
    clearMetadataInterval();
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'none';
    audioRef.current = audio;

    setState(prev => ({
      ...prev,
      currentStation: station,
      isLoading: true,
      error: null,
      metadata: {
        ...DEFAULT_METADATA,
        title: `Conectando a ${station.name}...`,
      },
    }));

    audio.volume = state.volume;

    audio.addEventListener('playing', () => {
      setState(prev => ({
        ...prev,
        isPlaying: true,
        isLoading: false,
        error: null,
        metadata: {
          ...prev.metadata,
          title: prev.metadata.title === `Conectando a ${station.name}...` 
            ? station.name 
            : prev.metadata.title,
        },
      }));

      // Get audio quality info
      setState(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          format: audio.canPlayType('audio/mpeg') ? 'MPEG' : 
                  audio.canPlayType('audio/aac') ? 'AAC' : 'Stream',
        },
      }));

      // Start metadata polling
      fetchMetadata(station.url);
      metadataIntervalRef.current = window.setInterval(() => {
        fetchStreamMetadata(station.url);
      }, 15000);
    });

    audio.addEventListener('waiting', () => {
      setState(prev => ({ ...prev, isLoading: true }));
    });

    audio.addEventListener('error', () => {
      setState(prev => ({
        ...prev,
        isPlaying: false,
        isLoading: false,
        error: 'Erro ao conectar com a rádio. Verifique o URL.',
        metadata: {
          ...DEFAULT_METADATA,
          title: 'Erro de conexão',
        },
      }));
      clearMetadataInterval();
    });

    audio.src = station.url;
    audio.play().catch(() => {
      setState(prev => ({
        ...prev,
        isPlaying: false,
        isLoading: false,
        error: 'Não foi possível reproduzir. Tente novamente.',
      }));
    });
  }, [state.volume, fetchMetadata, fetchStreamMetadata]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !state.currentStation) return;

    if (state.isPlaying) {
      audioRef.current.pause();
      setState(prev => ({ ...prev, isPlaying: false }));
      clearMetadataInterval();
    } else {
      audioRef.current.play().catch(() => {
        // Retry with a new connection
        if (state.currentStation) {
          play(state.currentStation);
        }
      });
      setState(prev => ({ ...prev, isPlaying: true }));
    }
  }, [state.isPlaying, state.currentStation, play]);

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    setState(prev => ({ ...prev, volume, isMuted: volume === 0 }));
  }, []);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      if (state.isMuted) {
        audioRef.current.volume = state.volume;
        setState(prev => ({ ...prev, isMuted: false }));
      } else {
        audioRef.current.volume = 0;
        setState(prev => ({ ...prev, isMuted: true }));
      }
    }
  }, [state.isMuted, state.volume]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    clearMetadataInterval();
    setState(prev => ({
      ...prev,
      isPlaying: false,
      isLoading: false,
      currentStation: null,
      metadata: DEFAULT_METADATA,
      error: null,
    }));
  }, []);

  // Watch for metadata changes to fetch album art
  useEffect(() => {
    const { title, artist } = state.metadata;
    if (title && artist && title !== state.currentStation?.name) {
      searchAlbumArt(title, artist);
    }
  }, [state.metadata.title, state.metadata.artist, searchAlbumArt, state.currentStation?.name]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      clearMetadataInterval();
    };
  }, []);

  return {
    state,
    play,
    togglePlay,
    setVolume,
    toggleMute,
    stop,
  };
}
