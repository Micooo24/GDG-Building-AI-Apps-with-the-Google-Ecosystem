/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Trophy, Music, Disc3, Shield, Zap, Sparkles, 
  Gamepad2, Volume2, VolumeX, Radio, Flame, Info
} from 'lucide-react';
import { SpaceInvadersGame } from './components/SpaceInvadersGame';
import { MusicPlayer } from './components/MusicPlayer';
import { TrackCoverArt } from './components/TrackCoverArt';
import { synthEngine, TRACKS } from './audio/synthEngine';

export default function App() {
  const [globalHighScore, setGlobalHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('vapor_invaders_highscore');
    return saved ? parseInt(saved, 10) : 5000;
  });

  const [currentScore, setCurrentScore] = useState<number>(0);
  const [playbackState, setPlaybackState] = useState(synthEngine.getPlaybackState());

  useEffect(() => {
    const unsub = synthEngine.subscribe(() => {
      setPlaybackState(synthEngine.getPlaybackState());
    });
    return unsub;
  }, []);

  const handleQuickAudioToggle = () => {
    if (playbackState.isPlaying) {
      synthEngine.pause();
    } else {
      synthEngine.play();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0314] text-slate-100 flex flex-col relative selection:bg-pink-500 selection:text-white font-display">
      {/* Vaporwave Background Ambient Backdrop */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Sky gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#090214] via-[#1a052e] to-[#2b084a]" />

        {/* Giant Glowing Vaporwave Sunset */}
        <div className="absolute top-[120px] left-1/2 -translate-x-1/2 w-[340px] h-[340px] sm:w-[500px] sm:h-[500px] rounded-full bg-gradient-to-b from-yellow-300 via-pink-500 to-purple-800 opacity-20 blur-2xl" />

        {/* Perspective Wireframe Floor Grid */}
        <div className="absolute bottom-0 left-0 right-0 h-[45vh] vapor-grid-bg opacity-35 [transform:perspective(500px)_rotateX(62deg)] origin-bottom" />

        {/* Horizon Glow Line */}
        <div className="absolute bottom-[44vh] left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />
      </div>

      {/* Top Bar Contract (3 Zones: Brand wordmark, concise nav links, 1 primary action) */}
      <header className="relative z-20 border-b border-purple-800/40 bg-[#120524]/85 backdrop-blur-md px-6 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <a href="/" className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group">
          <Gamepad2 className="w-5 h-5 text-pink-500 group-hover:scale-110 transition-transform" />
          <span className="font-arcade text-xs sm:text-sm text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-cyan-400 tracking-wider">
            VAPOR INVADERS '84
          </span>
        </a>

        {/* Zone 2: Single-Line Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-mono-retro text-purple-300">
          <a href="#arcade" className="hover:text-pink-400 transition-colors whitespace-nowrap shrink-0">
            Arcade Center
          </a>
          <a href="#soundtrack" className="hover:text-pink-400 transition-colors whitespace-nowrap shrink-0">
            Synthwave Deck
          </a>
          <a href="#powerups" className="hover:text-pink-400 transition-colors whitespace-nowrap shrink-0">
            Power-Ups
          </a>
          <a href="#records" className="hover:text-pink-400 transition-colors whitespace-nowrap shrink-0">
            High Scores
          </a>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleQuickAudioToggle}
            className={`px-3 py-1.5 text-xs font-mono-retro font-semibold rounded-lg flex items-center gap-2 whitespace-nowrap shrink-0 transition-all ${
              playbackState.isPlaying
                ? 'bg-pink-600/90 hover:bg-pink-500 text-white shadow-md shadow-pink-600/30 ring-1 ring-pink-400/50'
                : 'bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700/50'
            }`}
          >
            {playbackState.isPlaying ? (
              <>
                <Volume2 className="w-3.5 h-3.5 animate-pulse text-pink-200" />
                <span>MUSIC PLAYING</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>START MUSIC</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Hero Section: Game in the Center Window & Music Player Side Deck */}
        <section id="arcade" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Center Stage: Space Invaders Arcade Game (7 cols on large screens) */}
          <div className="lg:col-span-8 flex flex-col items-center">
            <SpaceInvadersGame
              onScoreUpdate={setCurrentScore}
              onHighScoreUpdate={setGlobalHighScore}
            />
          </div>

          {/* Right Stage: Music Player & Tape Deck (4 cols on large screens) */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* The Integrated Synthwave Music Player */}
            <MusicPlayer />

            {/* Quick High Score & Arcade Status Card */}
            <div className="bg-[#170a2c]/85 border border-purple-700/40 rounded-xl p-4 shadow-lg backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-purple-800/40">
                <div className="flex items-center gap-2 text-xs font-mono-retro text-yellow-400 font-bold">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span>ALL-TIME RECORD</span>
                </div>
                <span className="font-arcade text-xs text-pink-400">
                  {globalHighScore} PTS
                </span>
              </div>

              <div className="text-xs text-purple-200/80 font-mono-retro space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-purple-300">Synth Engine:</span>
                  <span className="text-cyan-400 font-semibold">Web Audio 80s FM/Sub</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-purple-300">Audio Latency:</span>
                  <span className="text-emerald-400 font-semibold">0ms (Client Synths)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-purple-300">Visualizer:</span>
                  <span className="text-pink-400 font-semibold">Real-Time FFT Analyzer</span>
                </div>
              </div>

              <div className="pt-2 border-t border-purple-800/40 text-[11px] text-purple-300/70 font-mono-retro leading-relaxed">
                Tip: Use <kbd className="px-1 py-0.5 bg-purple-950 border border-purple-700 rounded text-pink-300">SPACE</kbd> to fire laser bolts and destroy mystery UFOs for massive bonus points!
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Synthwave Soundtrack Vault (Showcasing the 3 Dummy Tracks) */}
        <section id="soundtrack" className="pt-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-purple-800/40">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                Synthwave Soundtrack Vault
              </h3>
              <p className="text-xs text-purple-300/80 font-mono-retro mt-0.5">
                3 authentic original retro synthwave tracks composed via browser Web Audio synthesis
              </p>
            </div>
            <div className="text-xs font-mono-retro text-pink-400">
              3 Tracks · 44.1kHz Hi-Fi
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TRACKS.map((track, idx) => {
              const isCurrent = playbackState.currentTrackIndex === idx;
              const isPlayingThis = isCurrent && playbackState.isPlaying;

              return (
                <div
                  key={track.id}
                  className={`bg-[#160a2b]/90 border rounded-xl p-4 transition-all flex flex-col justify-between gap-3 ${
                    isCurrent
                      ? 'border-pink-500/70 shadow-lg shadow-pink-900/30 ring-1 ring-pink-500/30'
                      : 'border-purple-800/40 hover:border-purple-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <TrackCoverArt trackId={track.id} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono-retro text-purple-400">
                          TRACK 0{idx + 1}
                        </span>
                        <span className="text-[10px] font-mono-retro text-cyan-400">
                          {track.bpm} BPM · {track.key}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white truncate mt-0.5">
                        {track.title}
                      </h4>
                      <p className="text-xs text-pink-400 truncate">{track.artist}</p>
                    </div>
                  </div>

                  <p className="text-xs text-purple-300/80 leading-relaxed font-mono-retro">
                    {track.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-purple-900/40 text-xs">
                    <span className="text-purple-400 font-mono-retro">
                      {Math.floor(track.durationSeconds / 60)}:
                      {(track.durationSeconds % 60).toString().padStart(2, '0')}
                    </span>

                    <button
                      onClick={() => {
                        if (isCurrent) {
                          synthEngine.togglePlay();
                        } else {
                          synthEngine.selectTrack(idx);
                        }
                      }}
                      className={`px-3 py-1 rounded text-xs font-mono-retro font-semibold transition-all flex items-center gap-1.5 ${
                        isPlayingThis
                          ? 'bg-pink-600 text-white shadow-sm shadow-pink-600/40'
                          : 'bg-purple-900/70 text-purple-200 hover:bg-pink-600 hover:text-white'
                      }`}
                    >
                      {isPlayingThis ? 'PAUSE' : isCurrent ? 'RESUME' : 'PLAY TRACK'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 3: Power-Ups & Arcade Mechanics */}
        <section id="powerups" className="pt-4 space-y-4">
          <div className="pb-2 border-b border-purple-800/40">
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide">
              Power-Ups & Tactical Defense
            </h3>
            <p className="text-xs text-purple-300/80 font-mono-retro mt-0.5">
              Blast the mystery flying saucer UFO to collect holographic synth bonuses
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#160a2b]/70 border border-purple-800/40 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Spread Laser</span>
              </div>
              <p className="text-xs text-purple-300 font-mono-retro leading-relaxed">
                Fires 3 simultaneous neon energy beams in a spread angle to clear entire columns of invaders.
              </p>
            </div>

            <div className="bg-[#160a2b]/70 border border-purple-800/40 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-pink-400 font-bold text-sm">
                <Flame className="w-4 h-4 text-pink-400" />
                <span>Rapid Cannon</span>
              </div>
              <p className="text-xs text-purple-300 font-mono-retro leading-relaxed">
                Overclocks your laser blaster cooldown to 140ms for high-frequency fire against descending waves.
              </p>
            </div>

            <div className="bg-[#160a2b]/70 border border-purple-800/40 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Energy Shield</span>
              </div>
              <p className="text-xs text-purple-300 font-mono-retro leading-relaxed">
                Generates a glowing forcefield perimeter that fully absorbs an enemy plasma bolt impact.
              </p>
            </div>

            <div className="bg-[#160a2b]/70 border border-purple-800/40 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-yellow-400 font-bold text-sm">
                <Radio className="w-4 h-4 text-yellow-400" />
                <span>Vapor Drift</span>
              </div>
              <p className="text-xs text-purple-300 font-mono-retro leading-relaxed">
                Warps time and decelerates the alien marching tempo, giving you space to pick off high-value targets.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: High Scores & Hall of Fame */}
        <section id="records" className="pt-4 space-y-4">
          <div className="pb-2 border-b border-purple-800/40">
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide">
              Arcade Hall of Fame
            </h3>
            <p className="text-xs text-purple-300/80 font-mono-retro mt-0.5">
              High score persisted locally in your browser
            </p>
          </div>

          <div className="bg-[#160a2b]/80 border border-purple-800/40 rounded-xl p-4 overflow-x-auto">
            <table className="w-full text-left font-mono-retro text-xs">
              <thead>
                <tr className="border-b border-purple-800/60 text-purple-400">
                  <th className="py-2 px-3">RANK</th>
                  <th className="py-2 px-3">PILOT CALLSIGN</th>
                  <th className="py-2 px-3">SCORE</th>
                  <th className="py-2 px-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/30">
                <tr className="text-yellow-300">
                  <td className="py-2.5 px-3 font-bold">1ST</td>
                  <td className="py-2.5 px-3 font-bold">PLAYER 1 (YOU)</td>
                  <td className="py-2.5 px-3 font-arcade text-pink-400">{globalHighScore}</td>
                  <td className="py-2.5 px-3 text-emerald-400">CHAMPION</td>
                </tr>
                <tr className="text-purple-200">
                  <td className="py-2.5 px-3">2ND</td>
                  <td className="py-2.5 px-3">NEON_DRIFTER</td>
                  <td className="py-2.5 px-3 font-arcade text-purple-300">4200</td>
                  <td className="py-2.5 px-3 text-purple-400">ARCHIVED</td>
                </tr>
                <tr className="text-purple-300">
                  <td className="py-2.5 px-3">3RD</td>
                  <td className="py-2.5 px-3">SYNTH_VIBES_84</td>
                  <td className="py-2.5 px-3 font-arcade text-purple-400">3500</td>
                  <td className="py-2.5 px-3 text-purple-400">ARCHIVED</td>
                </tr>
                <tr className="text-purple-400">
                  <td className="py-2.5 px-3">4TH</td>
                  <td className="py-2.5 px-3">OUTRUN_PROTOCOL</td>
                  <td className="py-2.5 px-3 font-arcade text-purple-400">2800</td>
                  <td className="py-2.5 px-3 text-purple-400">ARCHIVED</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-purple-900/40 bg-[#0d0319]/90 py-6 px-6 mt-12 text-center text-xs font-mono-retro text-purple-400/80">
        <div className="flex items-center justify-center gap-3 mb-1">
          <span>VAPOR INVADERS // '84</span>
          <span>·</span>
          <span>SYNTHWAVE SOUNDSYSTEM</span>
          <span>·</span>
          <span>HTML5 CANVAS & WEB AUDIO</span>
        </div>
        <div>
          Controls: Arrow keys / A,D to move · Space to fire · P to pause
        </div>
      </footer>
    </div>
  );
}
