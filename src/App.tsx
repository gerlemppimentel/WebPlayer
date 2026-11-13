import { useState, useEffect, useCallback } from 'react';
import Player from './components/Player';
import SettingsModal from './components/SettingsModal';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { RadioStation } from './types';

const STORAGE_KEY = 'webradio_stations';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function loadStations(): RadioStation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Failed to load
  }
  return [];
}

function saveStations(stations: RadioStation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stations));
  } catch {
    // Failed to save
  }
}

// Demo stations for first-time users
const DEMO_STATIONS: RadioStation[] = [
  {
    id: 'demo-1',
    name: 'SomaFM Groove Salad',
    url: 'https://ice1.somafm.com/groovesalad-128-mp3',
    description: 'A nicely chilled plate of ambient/downtempo beats and grooves',
    genre: 'Ambient / Downtempo',
  },
  {
    id: 'demo-2',
    name: 'SomaFM DEF CON',
    url: 'https://ice1.somafm.com/defcon-128-mp3',
    description: 'Music from the DEF CON conference',
    genre: 'Electronic',
  },
  {
    id: 'demo-3',
    name: 'SomaFM Drone Zone',
    url: 'https://ice1.somafm.com/dronezone-128-mp3',
    description: 'Atmospheric textures with an ambient sensibility',
    genre: 'Ambient',
  },
  {
    id: 'demo-4',
    name: 'SomaFM Lush',
    url: 'https://ice1.somafm.com/lush-128-mp3',
    description: 'Sensuous and mellow vocals, mostly female, with an electronic influence',
    genre: 'Electronic / Vocal',
  },
];

export default function App() {
  const [stations, setStations] = useState<RadioStation[]>(loadStations);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { state, play, togglePlay, setVolume, toggleMute, stop } = useAudioPlayer();

  // Save stations to localStorage whenever they change
  useEffect(() => {
    saveStations(stations);
  }, [stations]);

  // Initialize with demo stations if first visit
  useEffect(() => {
    if (stations.length === 0) {
      const hasVisited = localStorage.getItem('webradio_visited');
      if (!hasVisited) {
        setStations(DEMO_STATIONS);
        localStorage.setItem('webradio_visited', 'true');
      }
    }
  }, []);

  const handleAddStation = useCallback((stationData: Omit<RadioStation, 'id'>) => {
    const newStation: RadioStation = {
      ...stationData,
      id: generateId(),
    };
    setStations(prev => [...prev, newStation]);
  }, []);

  const handleEditStation = useCallback((station: RadioStation) => {
    setStations(prev => prev.map(s => s.id === station.id ? station : s));
  }, []);

  const handleDeleteStation = useCallback((id: string) => {
    setStations(prev => prev.filter(s => s.id !== id));
    if (state.currentStation?.id === id) {
      stop();
    }
  }, [state.currentStation, stop]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-pink-500/10 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-lg mx-auto min-h-screen flex flex-col">
        <Player
          state={state}
          stations={stations}
          onPlay={play}
          onTogglePlay={togglePlay}
          onSetVolume={setVolume}
          onToggleMute={toggleMute}
          onStop={stop}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        stations={stations}
        onAddStation={handleAddStation}
        onEditStation={handleEditStation}
        onDeleteStation={handleDeleteStation}
      />
    </div>
  );
}
