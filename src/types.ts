export interface RadioStation {
  id: string;
  name: string;
  url: string;
  description: string;
  genre?: string;
  favicon?: string;
}

export interface TrackMetadata {
  title: string;
  artist: string;
  albumArt: string;
  bitrate: string;
  format: string;
  sampleRate: string;
  channels: string;
}

export interface PlayerState {
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentStation: RadioStation | null;
  metadata: TrackMetadata;
  isLoading: boolean;
  error: string | null;
}
