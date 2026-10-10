export interface Invader {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  row: number;
  col: number;
  type: 'squid' | 'crab' | 'octopus';
  points: number;
  alive: boolean;
  color: string;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isPlayer: boolean;
  color: string;
}

export interface Bunker {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  grid: number[][]; // 0 = empty, 1 = intact, 2 = damaged
}

export interface Ufo {
  active: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  points: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
  life: number;
  maxLife: number;
}

export type PowerUpType = 'SPREAD' | 'SHIELD' | 'RAPID' | 'SLOW';

export interface PowerUpItem {
  id: string;
  x: number;
  y: number;
  type: PowerUpType;
  label: string;
  color: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  durationSeconds: number;
  bpm: number;
  key: string;
  themeColor: string;
  description: string;
}

export interface HighScoreRecord {
  score: number;
  wave: number;
  date: string;
}
