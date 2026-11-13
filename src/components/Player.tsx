import React, { useEffect, useRef, useState } from 'react';
import { PlayerState, RadioStation } from '../types';

interface PlayerProps {
  state: PlayerState;
  stations: RadioStation[];
  onPlay: (station: RadioStation) => void;
  onTogglePlay: () => void;
  onSetVolume: (volume: number) => void;
  onToggleMute: () => void;
  onStop: () => void;
  onOpenSettings: () => void;
}

export default function Player({
  state,
  stations,
  onPlay,
  onTogglePlay,
  onSetVolume,
  onToggleMute,
  onStop,
  onOpenSettings,
}: PlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showStationList, setShowStationList] = useState(false);

  // Audio visualizer animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const bars = 64;
    const barValues = new Array(bars).fill(0);

    const animate = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      ctx.clearRect(0, 0, width, height);

      // Update bar values with smooth animation
      for (let i = 0; i < bars; i++) {
        if (state.isPlaying && !state.isLoading) {
          const target = Math.random() * 0.8 + 0.1;
          barValues[i] += (target - barValues[i]) * 0.15;
        } else {
          barValues[i] *= 0.92;
        }
      }

      // Draw bars
      const barWidth = width / bars;
      const gap = 2;

      for (let i = 0; i < bars; i++) {
        const barHeight = barValues[i] * height * 0.8;
        const x = i * barWidth;
        const y = height - barHeight;

        const gradient = ctx.createLinearGradient(x, y, x, height);
        gradient.addColorStop(0, 'rgba(168, 85, 247, 0.9)');
        gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.7)');
        gradient.addColorStop(1, 'rgba(236, 72, 153, 0.5)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        const bx = x + gap / 2;
        const bw = barWidth - gap;
        if (ctx.roundRect) {
          ctx.roundRect(bx, y, bw, barHeight, [4, 4, 0, 0]);
        } else {
          ctx.rect(bx, y, bw, barHeight);
        }
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [state.isPlaying, state.isLoading]);

  const formatTime = () => {
    return state.isPlaying ? 'AO VIVO' : '--:--';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <i className="fas fa-broadcast-tower text-white"></i>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">WebRadio</h1>
            <p className="text-xs text-gray-400">Player</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStationList(!showStationList)}
            className="p-3 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-purple-500/50 text-gray-300 hover:text-purple-400 transition-all"
            title="Lista de Rádios"
          >
            <i className="fas fa-list"></i>
          </button>
          <button
            onClick={onOpenSettings}
            className="p-3 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-purple-500/50 text-gray-300 hover:text-purple-400 transition-all"
            title="Configurações"
          >
            <i className="fas fa-cog"></i>
          </button>
        </div>
      </div>

      {/* Station List Dropdown */}
      {showStationList && (
        <div className="mx-4 md:mx-6 mb-4 p-4 rounded-2xl bg-gray-800/80 border border-gray-700 backdrop-blur-xl max-h-60 overflow-y-auto">
          {stations.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">Nenhuma rádio adicionada</p>
              <button
                onClick={() => { setShowStationList(false); onOpenSettings(); }}
                className="mt-2 text-purple-400 text-sm hover:underline"
              >
                Adicionar agora
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {stations.map((station) => (
                <button
                  key={station.id}
                  onClick={() => {
                    onPlay(station);
                    setShowStationList(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                    state.currentStation?.id === station.id
                      ? 'bg-purple-600/20 border border-purple-500/50'
                      : 'hover:bg-gray-700/50 border border-transparent'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    state.currentStation?.id === station.id && state.isPlaying
                      ? 'bg-purple-500'
                      : 'bg-gray-700'
                  }`}>
                    {state.currentStation?.id === station.id && state.isPlaying ? (
                      <i className="fas fa-volume-up text-white text-xs"></i>
                    ) : (
                      <i className="fas fa-broadcast-tower text-gray-400 text-xs"></i>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{station.name}</p>
                    <p className="text-gray-400 text-xs truncate">{station.genre || station.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-6">
        {/* Album Art / Visualizer */}
        <div className="relative w-full max-w-sm aspect-square mb-6">
          {/* Album Art */}
          {state.metadata.albumArt && state.isPlaying ? (
            <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/20">
              <img
                src={state.metadata.albumArt}
                alt="Album Art"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          ) : (
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center shadow-2xl">
              <div className={`text-center ${state.isPlaying ? 'animate-pulse' : ''}`}>
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-4">
                  <i className={`fas fa-broadcast-tower text-4xl md:text-5xl ${
                    state.isPlaying ? 'text-purple-400' : 'text-gray-600'
                  }`}></i>
                </div>
                {state.currentStation && (
                  <p className="text-gray-400 text-sm">{state.currentStation.name}</p>
                )}
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          {state.isLoading && (
            <div className="absolute inset-0 rounded-3xl bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-white text-sm">Conectando...</p>
              </div>
            </div>
          )}

          {/* Live Badge */}
          {state.isPlaying && !state.isLoading && (
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/90 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
              <span className="text-white text-xs font-bold">AO VIVO</span>
            </div>
          )}
        </div>

        {/* Metadata Display */}
        <div className="w-full max-w-sm text-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-white truncate mb-1">
            {state.metadata.title || 'Nenhuma rádio selecionada'}
          </h2>
          {state.metadata.artist && (
            <p className="text-purple-300 text-lg truncate">{state.metadata.artist}</p>
          )}
          {state.currentStation?.description && (
            <p className="text-gray-400 text-sm mt-1 truncate">{state.currentStation.description}</p>
          )}
        </div>

        {/* Stream Quality Info */}
        <div className="w-full max-w-sm grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-center">
            <p className="text-gray-400 text-xs mb-1">Formato</p>
            <p className="text-white text-sm font-semibold">{state.metadata.format || '--'}</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-center">
            <p className="text-gray-400 text-xs mb-1">Bitrate</p>
            <p className="text-white text-sm font-semibold">{state.metadata.bitrate ? `${state.metadata.bitrate} kbps` : '--'}</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-center">
            <p className="text-gray-400 text-xs mb-1">Sample Rate</p>
            <p className="text-white text-sm font-semibold">{state.metadata.sampleRate || '--'}</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-center">
            <p className="text-gray-400 text-xs mb-1">Canais</p>
            <p className="text-white text-sm font-semibold">{state.metadata.channels || '--'}</p>
          </div>
        </div>

        {/* Visualizer */}
        <div className="w-full max-w-sm h-16 mb-6 rounded-xl overflow-hidden bg-gray-800/30 border border-gray-700/50">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="p-4 md:p-6 border-t border-gray-800">
        {/* Error Message */}
        {state.error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
            <i className="fas fa-exclamation-triangle mr-2"></i>
            {state.error}
          </div>
        )}

        <div className="flex items-center justify-between max-w-sm mx-auto gap-4">
          {/* Volume Control */}
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={onToggleMute}
              className="p-3 rounded-full hover:bg-gray-800 text-gray-300 hover:text-white transition-all flex-shrink-0"
            >
              <i className={`fas ${state.isMuted || state.volume === 0 ? 'fa-volume-mute' : state.volume < 0.5 ? 'fa-volume-down' : 'fa-volume-up'}`}></i>
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={state.isMuted ? 0 : state.volume}
              onChange={(e) => onSetVolume(parseFloat(e.target.value))}
              className="w-full h-2 accent-purple-500 cursor-pointer"
            />
          </div>

          {/* Play/Pause Button */}
          <div className="flex items-center gap-4">
            {state.currentStation && (
              <button
                onClick={onStop}
                className="p-3 rounded-full hover:bg-gray-800 text-gray-300 hover:text-white transition-all"
                title="Parar"
              >
                <i className="fas fa-stop"></i>
              </button>
            )}
            <button
              onClick={state.currentStation ? onTogglePlay : onOpenSettings}
              disabled={state.isLoading}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
                state.currentStation
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105'
                  : 'bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={state.currentStation ? (state.isPlaying ? 'Pausar' : 'Reproduzir') : 'Adicionar rádio'}
            >
              {state.isLoading ? (
                <i className="fas fa-spinner animate-spin text-white text-xl"></i>
              ) : state.isPlaying ? (
                <i className="fas fa-pause text-white text-xl"></i>
              ) : state.currentStation ? (
                <i className="fas fa-play text-white text-xl ml-1"></i>
              ) : (
                <i className="fas fa-plus text-white text-xl"></i>
              )}
            </button>
            {state.currentStation && (
              <button
                onClick={() => {/* Skip/Next could go here */}}
                className="p-3 rounded-full hover:bg-gray-800 text-gray-300 hover:text-white transition-all opacity-50 cursor-not-allowed"
                title="Próxima (em breve)"
              >
                <i className="fas fa-forward"></i>
              </button>
            )}
          </div>

          {/* Live indicator */}
          <div className="text-right">
            <span className={`text-xs font-mono ${state.isPlaying ? 'text-green-400' : 'text-gray-500'}`}>
              {formatTime()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
