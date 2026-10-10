import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Disc3, Radio } from 'lucide-react';
import { synthEngine, TRACKS } from '../audio/synthEngine';
import { TrackCoverArt } from './TrackCoverArt';
import { AudioVisualizer } from './AudioVisualizer';

export const MusicPlayer: React.FC = () => {
  const [playbackState, setPlaybackState] = useState(synthEngine.getPlaybackState());
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const unsubscribe = synthEngine.subscribe(() => {
      setPlaybackState(synthEngine.getPlaybackState());
    });

    const timer = setInterval(() => {
      setCurrentTime(synthEngine.getElapsedSeconds());
    }, 250);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    synthEngine.seek(val);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    synthEngine.setVolume(parseFloat(e.target.value));
  };

  const currentTrack = playbackState.currentTrack;
  const progressPercent = (currentTime / currentTrack.durationSeconds) * 100;

  return (
    <div className="bg-[#170a2c]/90 border border-pink-500/30 rounded-xl p-4 shadow-xl shadow-purple-950/50 backdrop-blur-md relative overflow-hidden flex flex-col gap-3">
      {/* Vaporwave Header Banner for Player */}
      <div className="flex items-center justify-between pb-2 border-b border-purple-800/40 text-xs">
        <div className="flex items-center gap-2 font-mono-retro text-pink-400">
          <Radio className="w-3.5 h-3.5 animate-pulse text-pink-500" />
          <span className="font-semibold tracking-wider">RETRO-SYNTH DECK // AUTO-REVERSE</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-purple-300 font-mono-retro">
          <span>TAPE {playbackState.currentTrackIndex + 1}/3</span>
          <span className="text-cyan-400">{currentTrack.bpm} BPM</span>
        </div>
      </div>

      {/* Cassette Deck / Track Showcase */}
      <div className="flex items-center gap-4">
        {/* Cover Art */}
        <TrackCoverArt trackId={currentTrack.id} size="md" />

        {/* Cassette Shell Visualization */}
        <div className="flex-1 min-w-0 bg-[#0d041c] border border-purple-700/60 rounded-lg p-2.5 relative shadow-inner">
          {/* Cassette Tape window with spinning reels */}
          <div className="flex items-center justify-between bg-black/70 rounded px-3 py-1.5 border border-purple-900/60 mb-1.5">
            {/* Left Reel */}
            <div className="flex items-center gap-1.5">
              <Disc3
                className={`w-5 h-5 text-pink-400 ${
                  playbackState.isPlaying ? 'animate-reel' : 'animate-reel-paused'
                }`}
              />
              <span className="text-[9px] font-mono-retro text-purple-400">A-SIDE</span>
            </div>

            {/* Tape Window / Magnetic Ribbon */}
            <div className="h-1.5 w-16 bg-gradient-to-r from-purple-900 via-pink-700 to-purple-900 rounded-full opacity-70" />

            {/* Right Reel */}
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono-retro text-cyan-400">STEREO</span>
              <Disc3
                className={`w-5 h-5 text-cyan-400 ${
                  playbackState.isPlaying ? 'animate-reel' : 'animate-reel-paused'
                }`}
              />
            </div>
          </div>

          {/* Track Info */}
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-white truncate tracking-wide crt-glow">
              {currentTrack.title}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-pink-400 truncate mt-0.5">
              <span className="font-medium text-pink-300">{currentTrack.artist}</span>
              <span>·</span>
              <span className="text-purple-300/80">{currentTrack.album}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Web Audio Spectrum Visualizer */}
      <AudioVisualizer isPlaying={playbackState.isPlaying} barColor={currentTrack.themeColor} />

      {/* Seekbar & Time */}
      <div className="space-y-1">
        <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={currentTrack.durationSeconds}
            step={0.5}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-purple-950 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400"
          />
        </div>
        <div className="flex justify-between text-[11px] font-mono-retro text-purple-300/80 px-0.5">
          <span>{formatTime(currentTime)}</span>
          <span className="text-pink-400">{currentTrack.key}</span>
          <span>{formatTime(currentTrack.durationSeconds)}</span>
        </div>
      </div>

      {/* Transport Controls & Volume */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-purple-900/40">
        {/* Track Playlist Selector Quick Tabs */}
        <div className="flex items-center gap-1">
          {TRACKS.map((t, idx) => (
            <button
              key={t.id}
              onClick={() => synthEngine.selectTrack(idx)}
              title={t.title}
              className={`px-2 py-1 text-[11px] font-mono-retro rounded transition-all ${
                playbackState.currentTrackIndex === idx
                  ? 'bg-pink-600 text-white font-bold shadow-md shadow-pink-600/30 ring-1 ring-pink-400'
                  : 'bg-purple-950/70 text-purple-300 hover:bg-purple-900/60'
              }`}
            >
              0{idx + 1}
            </button>
          ))}
        </div>

        {/* Playback Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => synthEngine.prevTrack()}
            className="p-2 rounded-lg bg-purple-900/40 text-purple-200 hover:bg-purple-800/60 hover:text-white transition-colors active:scale-95"
            title="Previous Track"
            aria-label="Previous Track"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={() => synthEngine.togglePlay()}
            className={`p-2.5 rounded-full transition-transform active:scale-90 flex items-center justify-center ${
              playbackState.isPlaying
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/40 ring-2 ring-pink-300'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/40 hover:opacity-95'
            }`}
            title={playbackState.isPlaying ? 'Pause' : 'Play'}
            aria-label={playbackState.isPlaying ? 'Pause' : 'Play'}
          >
            {playbackState.isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={() => synthEngine.nextTrack()}
            className="p-2 rounded-lg bg-purple-900/40 text-purple-200 hover:bg-purple-800/60 hover:text-white transition-colors active:scale-95"
            title="Next Track"
            aria-label="Next Track"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Volume & Mute */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => synthEngine.toggleMute()}
            className="text-purple-300 hover:text-pink-400 transition-colors p-1"
            title={playbackState.isMuted ? 'Unmute' : 'Mute'}
            aria-label="Toggle mute"
          >
            {playbackState.isMuted || playbackState.volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={playbackState.isMuted ? 0 : playbackState.volume}
            onChange={handleVolumeChange}
            className="w-16 h-1.5 bg-purple-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            title={`Volume: ${Math.round(playbackState.volume * 100)}%`}
          />
        </div>
      </div>
    </div>
  );
};
