import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Trophy, RotateCcw, Volume2, VolumeX, 
  Monitor, Play, Pause, Zap, Shield, Sparkles, Clock
} from 'lucide-react';
import { synthEngine } from '../audio/synthEngine';
import { Invader, Bullet, Bunker, Ufo, Particle, PowerUpItem, PowerUpType } from '../types';

interface SpaceInvadersGameProps {
  onScoreUpdate?: (score: number) => void;
  onHighScoreUpdate?: (highScore: number) => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// Pixel maps for retro invaders (11x8 grids)
const SQUID_FRAME_A = [
  '00011000',
  '00111100',
  '01111110',
  '11011011',
  '11111111',
  '00100100',
  '01011010',
  '10100101',
];
const SQUID_FRAME_B = [
  '00011000',
  '00111100',
  '01111110',
  '11011011',
  '11111111',
  '01011010',
  '10000001',
  '01000010',
];

const CRAB_FRAME_A = [
  '00100000100',
  '00010001000',
  '00111111100',
  '01101110110',
  '11111111111',
  '10111111101',
  '10100000101',
  '00011011000',
];
const CRAB_FRAME_B = [
  '00100000100',
  '10010001001',
  '10111111101',
  '11101110111',
  '11111111111',
  '01111111110',
  '00100000100',
  '01000000010',
];

const OCTOPUS_FRAME_A = [
  '000011110000',
  '011111111110',
  '111111111111',
  '111001100111',
  '111111111111',
  '000110011000',
  '001101101100',
  '110000000011',
];
const OCTOPUS_FRAME_B = [
  '000011110000',
  '011111111110',
  '111111111111',
  '111001100111',
  '111111111111',
  '001101101100',
  '011000000110',
  '000110011000',
];

export const SpaceInvadersGame: React.FC<SpaceInvadersGameProps> = ({
  onScoreUpdate,
  onHighScoreUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // High score from localStorage
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('vapor_invaders_highscore');
    return saved ? parseInt(saved, 10) : 5000;
  });

  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [wave, setWave] = useState<number>(1);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'VICTORY'>('IDLE');
  const [sfxOn, setSfxOn] = useState<boolean>(true);
  const [crtOn, setCrtOn] = useState<boolean>(true);
  const [shotsFired, setShotsFired] = useState<number>(0);
  const [shotsHit, setShotsHit] = useState<number>(0);
  const [aliensDestroyed, setAliensDestroyed] = useState<number>(0);
  const [activePowerUp, setActivePowerUp] = useState<PowerUpType | null>(null);
  const [powerUpTimeLeft, setPowerUpTimeLeft] = useState<number>(0);

  // Mutable Game Loop State Ref
  const gameRef = useRef<{
    player: {
      x: number;
      y: number;
      width: number;
      height: number;
      speed: number;
      lastShotTime: number;
      isInvulnerable: boolean;
      invulnerableEndTime: number;
    };
    keys: { [key: string]: boolean };
    bullets: Bullet[];
    invaders: Invader[];
    invaderDirection: number; // 1 = right, -1 = left
    invaderStepTimer: number;
    invaderStepInterval: number;
    invaderStepSoundIndex: number;
    invaderAnimFrame: boolean;
    bunkers: Bunker[];
    ufo: Ufo;
    ufoTimer: number;
    particles: Particle[];
    powerUps: PowerUpItem[];
    activePowerUp: PowerUpType | null;
    powerUpEndTime: number;
    score: number;
    highScore: number;
    lives: number;
    wave: number;
    shotsFired: number;
    shotsHit: number;
    aliensDestroyed: number;
    lastTime: number;
    touchControls: {
      left: boolean;
      right: boolean;
      fire: boolean;
    };
  }>({
    player: {
      x: 375,
      y: 535,
      width: 48,
      height: 24,
      speed: 340, // px per sec
      lastShotTime: 0,
      isInvulnerable: false,
      invulnerableEndTime: 0,
    },
    keys: {},
    bullets: [],
    invaders: [],
    invaderDirection: 1,
    invaderStepTimer: 0,
    invaderStepInterval: 0.75,
    invaderStepSoundIndex: 0,
    invaderAnimFrame: false,
    bunkers: [],
    ufo: { active: false, x: -60, y: 55, width: 48, height: 20, vx: 140, points: 200 },
    ufoTimer: 18,
    particles: [],
    powerUps: [],
    activePowerUp: null,
    powerUpEndTime: 0,
    score: 0,
    highScore: 5000,
    lives: 3,
    wave: 1,
    shotsFired: 0,
    shotsHit: 0,
    aliensDestroyed: 0,
    lastTime: 0,
    touchControls: { left: false, right: false, fire: false },
  });

  // Sync high score to ref
  useEffect(() => {
    gameRef.current.highScore = highScore;
  }, [highScore]);

  // Create Bunkers
  const initBunkers = useCallback((): Bunker[] => {
    const bunkers: Bunker[] = [];
    const count = 4;
    const spacing = CANVAS_WIDTH / (count + 1);
    const bunkerWidth = 60;
    const bunkerHeight = 36;
    const rows = 6;
    const cols = 10;

    for (let i = 0; i < count; i++) {
      const bx = (i + 1) * spacing - bunkerWidth / 2;
      const by = 450;
      const grid: number[][] = [];

      for (let r = 0; r < rows; r++) {
        const rowData: number[] = [];
        for (let c = 0; c < cols; c++) {
          // Classic arch cutout in bottom center
          if (r >= 4 && c >= 3 && c <= 6) {
            rowData.push(0);
          } else if (r === 0 && (c === 0 || c === cols - 1)) {
            // Cut top corners
            rowData.push(0);
          } else {
            rowData.push(1); // intact
          }
        }
        grid.push(rowData);
      }

      bunkers.push({
        id: i,
        x: bx,
        y: by,
        width: bunkerWidth,
        height: bunkerHeight,
        grid,
      });
    }
    return bunkers;
  }, []);

  // Create Invaders Grid
  const initInvaders = useCallback((waveNum: number): Invader[] => {
    const invaders: Invader[] = [];
    const rows = 5;
    const cols = 11;
    const startX = 100;
    const startY = 110 + Math.min(60, (waveNum - 1) * 15);
    const spacingX = 48;
    const spacingY = 36;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let type: 'squid' | 'crab' | 'octopus' = 'squid';
        let points = 30;
        let color = '#ff2a85'; // neon pink
        let width = 28;
        let height = 20;

        if (r === 0) {
          type = 'squid';
          points = 30;
          color = '#ff2a85';
          width = 24;
        } else if (r === 1 || r === 2) {
          type = 'crab';
          points = 20;
          color = '#00f0ff'; // neon cyan
          width = 30;
        } else {
          type = 'octopus';
          points = 10;
          color = '#c084fc'; // neon purple
          width = 32;
        }

        invaders.push({
          id: `${r}-${c}`,
          x: startX + c * spacingX,
          y: startY + r * spacingY,
          width,
          height,
          row: r,
          col: c,
          type,
          points,
          alive: true,
          color,
        });
      }
    }
    return invaders;
  }, []);

  // Start new game
  const startGame = () => {
    const g = gameRef.current;
    g.score = 0;
    g.lives = 3;
    g.wave = 1;
    g.shotsFired = 0;
    g.shotsHit = 0;
    g.aliensDestroyed = 0;
    g.bullets = [];
    g.particles = [];
    g.powerUps = [];
    g.activePowerUp = null;
    g.invaders = initInvaders(1);
    g.bunkers = initBunkers();
    g.invaderDirection = 1;
    g.invaderStepInterval = 0.75;
    g.invaderStepTimer = 0;
    g.player.x = CANVAS_WIDTH / 2 - 24;
    g.player.isInvulnerable = false;
    g.ufo.active = false;
    g.ufoTimer = 16;
    g.lastTime = performance.now();

    setScore(0);
    setLives(3);
    setWave(1);
    setShotsFired(0);
    setShotsHit(0);
    setAliensDestroyed(0);
    setActivePowerUp(null);
    setPowerUpTimeLeft(0);
    setGameState('PLAYING');

    // Also auto-start synthwave music if not playing!
    synthEngine.play();
  };

  // Next Wave
  const nextWave = () => {
    const g = gameRef.current;
    g.wave += 1;
    g.score += 1000; // Wave bonus
    g.bullets = [];
    g.powerUps = [];
    g.invaders = initInvaders(g.wave);
    g.invaderDirection = 1;
    // Faster with each wave
    g.invaderStepInterval = Math.max(0.25, 0.75 - (g.wave - 1) * 0.08);
    g.invaderStepTimer = 0;
    g.player.x = CANVAS_WIDTH / 2 - 24;
    g.player.isInvulnerable = true;
    g.player.invulnerableEndTime = performance.now() + 2000;

    setWave(g.wave);
    setScore(g.score);
    setGameState('PLAYING');
    synthEngine.playPowerupSfx();
  };

  // Spawn Debris Explosion Particles
  const spawnExplosion = (x: number, y: number, color: string, count = 16) => {
    const g = gameRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 160 + 40;
      g.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1,
        size: Math.random() * 3 + 2,
        life: 0,
        maxLife: Math.random() * 0.4 + 0.3,
      });
    }
  };

  // Player Fires Weapon
  const firePlayerLaser = useCallback(() => {
    const g = gameRef.current;
    const now = performance.now();
    const cooldown = g.activePowerUp === 'RAPID' ? 140 : 280;

    if (now - g.player.lastShotTime < cooldown) return;
    g.player.lastShotTime = now;
    g.shotsFired++;
    setShotsFired(g.shotsFired);

    synthEngine.playLaserSfx();

    if (g.activePowerUp === 'SPREAD') {
      // 3 Spread Lasers
      g.bullets.push(
        {
          id: `p-${now}-0`,
          x: g.player.x + g.player.width / 2,
          y: g.player.y - 6,
          vx: 0,
          vy: -600,
          isPlayer: true,
          color: '#ff2a85',
        },
        {
          id: `p-${now}-1`,
          x: g.player.x + 8,
          y: g.player.y - 4,
          vx: -140,
          vy: -580,
          isPlayer: true,
          color: '#00f0ff',
        },
        {
          id: `p-${now}-2`,
          x: g.player.x + g.player.width - 8,
          y: g.player.y - 4,
          vx: 140,
          vy: -580,
          isPlayer: true,
          color: '#00f0ff',
        }
      );
    } else {
      // Normal single laser
      g.bullets.push({
        id: `p-${now}`,
        x: g.player.x + g.player.width / 2,
        y: g.player.y - 6,
        vx: 0,
        vy: -620,
        isPlayer: true,
        color: '#ff2a85',
      });
    }
  }, []);

  // Keyboard input listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      gameRef.current.keys[e.code] = true;

      if (e.code === 'KeyP') {
        setGameState((prev) => (prev === 'PLAYING' ? 'PAUSED' : prev === 'PAUSED' ? 'PLAYING' : prev));
      }

      if (e.code === 'Space') {
        if (gameState === 'PLAYING') {
          firePlayerLaser();
          e.preventDefault();
        } else if (gameState === 'IDLE' || gameState === 'GAMEOVER') {
          startGame();
          e.preventDefault();
        }
      }

      if (e.code === 'Enter') {
        if (gameState === 'IDLE' || gameState === 'GAMEOVER' || gameState === 'VICTORY') {
          startGame();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameRef.current.keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, firePlayerLaser]);

  // Main Canvas Game Loop
  useEffect(() => {
    let animId: number;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = (timestamp: number) => {
      animId = requestAnimationFrame(loop);
      const g = gameRef.current;
      const dt = Math.min(0.06, (timestamp - (g.lastTime || timestamp)) / 1000);
      g.lastTime = timestamp;

      // 1. UPDATE GAME STATE
      if (gameState === 'PLAYING') {
        // Player Movement
        const moveLeft = g.keys['ArrowLeft'] || g.keys['KeyA'] || g.touchControls.left;
        const moveRight = g.keys['ArrowRight'] || g.keys['KeyD'] || g.touchControls.right;

        if (moveLeft && !moveRight) {
          g.player.x = Math.max(16, g.player.x - g.player.speed * dt);
        } else if (moveRight && !moveLeft) {
          g.player.x = Math.min(CANVAS_WIDTH - g.player.width - 16, g.player.x + g.player.speed * dt);
        }

        if (g.touchControls.fire) {
          firePlayerLaser();
        }

        // Power-Up Timer
        if (g.activePowerUp && timestamp > g.powerUpEndTime) {
          g.activePowerUp = null;
          setActivePowerUp(null);
          setPowerUpTimeLeft(0);
        } else if (g.activePowerUp) {
          setPowerUpTimeLeft(Math.ceil((g.powerUpEndTime - timestamp) / 1000));
        }

        // Invulnerable status after respawn
        if (g.player.isInvulnerable && timestamp > g.player.invulnerableEndTime) {
          g.player.isInvulnerable = false;
        }

        // Bullets update
        for (let i = g.bullets.length - 1; i >= 0; i--) {
          const b = g.bullets[i];
          b.x += (b.vx || 0) * dt;
          b.y += b.vy * dt;

          if (b.y < -10 || b.y > CANVAS_HEIGHT + 10 || b.x < -10 || b.x > CANVAS_WIDTH + 10) {
            g.bullets.splice(i, 1);
          }
        }

        // UFO Mystery Ship logic
        g.ufoTimer -= dt;
        if (g.ufoTimer <= 0 && !g.ufo.active) {
          g.ufo.active = true;
          g.ufo.x = -60;
          g.ufo.vx = 140;
          g.ufo.points = [100, 150, 200, 300][Math.floor(Math.random() * 4)];
          synthEngine.playUfoSfx();
        }

        if (g.ufo.active) {
          g.ufo.x += g.ufo.vx * dt;
          if (g.ufo.x > CANVAS_WIDTH + 80) {
            g.ufo.active = false;
            g.ufoTimer = Math.random() * 15 + 18;
          }
        }

        // Invaders Step March
        const activeInvaders = g.invaders.filter((inv) => inv.alive);
        if (activeInvaders.length === 0) {
          // Wave Cleared!
          setGameState('VICTORY');
          setTimeout(() => {
            nextWave();
          }, 1500);
          return;
        }

        // Dynamic speed based on remaining invaders count
        const aliveRatio = activeInvaders.length / 55;
        const currentSpeedInterval =
          (g.activePowerUp === 'SLOW' ? 1.6 : 1.0) *
          Math.max(0.06, g.invaderStepInterval * (0.15 + aliveRatio * 0.85));

        g.invaderStepTimer += dt;
        if (g.invaderStepTimer >= currentSpeedInterval) {
          g.invaderStepTimer = 0;
          g.invaderAnimFrame = !g.invaderAnimFrame;
          synthEngine.playInvaderStepSfx(g.invaderStepSoundIndex);
          g.invaderStepSoundIndex = (g.invaderStepSoundIndex + 1) % 4;

          // Check boundary hits
          let hitEdge = false;
          const stepAmountX = 14;

          for (const inv of activeInvaders) {
            const nextX = inv.x + g.invaderDirection * stepAmountX;
            if (nextX < 24 || nextX + inv.width > CANVAS_WIDTH - 24) {
              hitEdge = true;
              break;
            }
          }

          if (hitEdge) {
            g.invaderDirection *= -1;
            // Drop down
            for (const inv of activeInvaders) {
              inv.y += 18;
              // Check if invaded player ground
              if (inv.y + inv.height >= g.player.y) {
                // Game Over: Invasion!
                setGameState('GAMEOVER');
                synthEngine.playPlayerDeathSfx();
                return;
              }
            }
          } else {
            // Move horizontally
            for (const inv of activeInvaders) {
              inv.x += g.invaderDirection * stepAmountX;
            }
          }
        }

        // Invader shooting logic
        // Find bottom-most alien for each column
        if (Math.random() < 0.045 + g.wave * 0.01) {
          const colMap = new Map<number, Invader>();
          for (const inv of activeInvaders) {
            const existing = colMap.get(inv.col);
            if (!existing || inv.row > existing.row) {
              colMap.set(inv.col, inv);
            }
          }

          const bottomAliens = Array.from(colMap.values());
          if (bottomAliens.length > 0) {
            const shooter = bottomAliens[Math.floor(Math.random() * bottomAliens.length)];
            g.bullets.push({
              id: `alien-${timestamp}-${Math.random()}`,
              x: shooter.x + shooter.width / 2,
              y: shooter.y + shooter.height + 2,
              vx: (Math.random() - 0.5) * 20,
              vy: 240 + g.wave * 15,
              isPlayer: false,
              color: '#a855f7',
            });
          }
        }

        // Power-ups falling
        for (let i = g.powerUps.length - 1; i >= 0; i--) {
          const p = g.powerUps[i];
          p.y += 120 * dt;

          // Check collect by player
          if (
            p.x + 14 > g.player.x &&
            p.x - 14 < g.player.x + g.player.width &&
            p.y + 14 > g.player.y &&
            p.y - 14 < g.player.y + g.player.height
          ) {
            // Collect powerup!
            g.activePowerUp = p.type;
            g.powerUpEndTime = performance.now() + 9000;
            setActivePowerUp(p.type);
            setPowerUpTimeLeft(9);
            synthEngine.playPowerupSfx();
            spawnExplosion(p.x, p.y, p.color, 12);
            g.powerUps.splice(i, 1);
            continue;
          }

          if (p.y > CANVAS_HEIGHT + 20) {
            g.powerUps.splice(i, 1);
          }
        }

        // Bullet collisions
        for (let bi = g.bullets.length - 1; bi >= 0; bi--) {
          const b = g.bullets[bi];
          if (!b) continue;

          // 1. Player laser hits UFO
          if (b.isPlayer && g.ufo.active) {
            if (
              b.x >= g.ufo.x &&
              b.x <= g.ufo.x + g.ufo.width &&
              b.y >= g.ufo.y &&
              b.y <= g.ufo.y + g.ufo.height
            ) {
              g.ufo.active = false;
              g.score += g.ufo.points;
              g.shotsHit++;
              setShotsHit(g.shotsHit);
              setScore(g.score);
              synthEngine.playExplosionSfx();
              spawnExplosion(g.ufo.x + g.ufo.width / 2, g.ufo.y + g.ufo.height / 2, '#fde047', 24);

              // 50% chance to drop power-up from UFO
              if (Math.random() < 0.5) {
                const types: PowerUpType[] = ['SPREAD', 'SHIELD', 'RAPID', 'SLOW'];
                const selectedType = types[Math.floor(Math.random() * types.length)];
                g.powerUps.push({
                  id: `pw-${timestamp}`,
                  x: g.ufo.x + g.ufo.width / 2,
                  y: g.ufo.y + 10,
                  type: selectedType,
                  label: selectedType,
                  color: selectedType === 'SPREAD' ? '#00f0ff' : selectedType === 'SHIELD' ? '#10b981' : '#ec4899',
                });
              }

              g.bullets.splice(bi, 1);
              continue;
            }
          }

          // 2. Player laser hits Invaders
          if (b.isPlayer) {
            let hitInvader = false;
            for (const inv of activeInvaders) {
              if (
                b.x >= inv.x - 2 &&
                b.x <= inv.x + inv.width + 2 &&
                b.y >= inv.y &&
                b.y <= inv.y + inv.height
              ) {
                inv.alive = false;
                g.score += inv.points;
                g.shotsHit++;
                g.aliensDestroyed++;
                setShotsHit(g.shotsHit);
                setAliensDestroyed(g.aliensDestroyed);
                setScore(g.score);

                // Check high score
                if (g.score > g.highScore) {
                  g.highScore = g.score;
                  setHighScore(g.score);
                  localStorage.setItem('vapor_invaders_highscore', g.score.toString());
                  if (onHighScoreUpdate) onHighScoreUpdate(g.score);
                }

                synthEngine.playExplosionSfx();
                spawnExplosion(inv.x + inv.width / 2, inv.y + inv.height / 2, inv.color, 16);

                // Rare chance to drop powerup from normal invaders (5%)
                if (Math.random() < 0.05) {
                  const types: PowerUpType[] = ['SPREAD', 'SHIELD', 'RAPID', 'SLOW'];
                  const selectedType = types[Math.floor(Math.random() * types.length)];
                  g.powerUps.push({
                    id: `pw-${timestamp}-${Math.random()}`,
                    x: inv.x + inv.width / 2,
                    y: inv.y + inv.height,
                    type: selectedType,
                    label: selectedType,
                    color: selectedType === 'SPREAD' ? '#00f0ff' : selectedType === 'SHIELD' ? '#10b981' : '#ec4899',
                  });
                }

                g.bullets.splice(bi, 1);
                hitInvader = true;
                break;
              }
            }
            if (hitInvader) continue;
          }

          // 3. Bullets hit Bunkers
          let hitBunker = false;
          for (const bunker of g.bunkers) {
            if (
              b.x >= bunker.x &&
              b.x <= bunker.x + bunker.width &&
              b.y >= bunker.y &&
              b.y <= bunker.y + bunker.height
            ) {
              const rows = bunker.grid.length;
              const cols = bunker.grid[0].length;
              const blockW = bunker.width / cols;
              const blockH = bunker.height / rows;

              const c = Math.floor((b.x - bunker.x) / blockW);
              const r = Math.floor((b.y - bunker.y) / blockH);

              if (r >= 0 && r < rows && c >= 0 && c < cols && bunker.grid[r][c] > 0) {
                // Destroy block
                bunker.grid[r][c] = 0;
                // Erode adjacent blocks for realistic crater impact
                if (r > 0 && Math.random() < 0.4) bunker.grid[r - 1][c] = 0;
                if (c > 0 && Math.random() < 0.4) bunker.grid[r][c - 1] = 0;
                if (c < cols - 1 && Math.random() < 0.4) bunker.grid[r][c + 1] = 0;

                synthEngine.playShieldHitSfx();
                spawnExplosion(b.x, b.y, '#10b981', 6);
                g.bullets.splice(bi, 1);
                hitBunker = true;
                break;
              }
            }
          }
          if (hitBunker) continue;

          // 4. Alien bullet hits Player
          if (!b.isPlayer) {
            if (
              b.x >= g.player.x &&
              b.x <= g.player.x + g.player.width &&
              b.y >= g.player.y &&
              b.y <= g.player.y + g.player.height
            ) {
              g.bullets.splice(bi, 1);

              if (g.activePowerUp === 'SHIELD') {
                // Shield absorbs hit
                g.activePowerUp = null;
                setActivePowerUp(null);
                setPowerUpTimeLeft(0);
                synthEngine.playShieldHitSfx();
                spawnExplosion(g.player.x + g.player.width / 2, g.player.y + 10, '#10b981', 20);
                continue;
              }

              if (!g.player.isInvulnerable) {
                g.lives--;
                setLives(g.lives);
                synthEngine.playPlayerDeathSfx();
                spawnExplosion(g.player.x + g.player.width / 2, g.player.y + 10, '#ff2a85', 28);

                if (g.lives <= 0) {
                  setGameState('GAMEOVER');
                } else {
                  // Respawn invulnerability
                  g.player.x = CANVAS_WIDTH / 2 - 24;
                  g.player.isInvulnerable = true;
                  g.player.invulnerableEndTime = performance.now() + 2500;
                }
              }
              continue;
            }
          }
        }

        // Particle updates
        for (let i = g.particles.length - 1; i >= 0; i--) {
          const p = g.particles[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life += dt;
          p.alpha = Math.max(0, 1 - p.life / p.maxLife);

          if (p.life >= p.maxLife) {
            g.particles.splice(i, 1);
          }
        }
      }

      // 2. RENDER CANVAS
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Deep Space Vaporwave Backdrop
      const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      bgGrad.addColorStop(0, '#0c0217');
      bgGrad.addColorStop(0.65, '#220038');
      bgGrad.addColorStop(1, '#080012');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Distant 80s Wireframe Horizon lines
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.15)';
      ctx.lineWidth = 1;
      for (let y = 460; y < CANVAS_HEIGHT; y += 18) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }

      // Draw Destructible Bunkers
      for (const bunker of g.bunkers) {
        const rows = bunker.grid.length;
        const cols = bunker.grid[0].length;
        const blockW = bunker.width / cols;
        const blockH = bunker.height / rows;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (bunker.grid[r][c] > 0) {
              ctx.fillStyle = '#00f0ff';
              ctx.shadowColor = '#00f0ff';
              ctx.shadowBlur = 4;
              ctx.fillRect(bunker.x + c * blockW, bunker.y + r * blockH, blockW - 0.5, blockH - 0.5);
              ctx.shadowBlur = 0;
            }
          }
        }
      }

      // Draw Invaders
      const drawPixelSprite = (
        pattern: string[],
        x: number,
        y: number,
        w: number,
        h: number,
        color: string
      ) => {
        const pRows = pattern.length;
        const pCols = pattern[0].length;
        const pw = w / pCols;
        const ph = h / pRows;

        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;

        for (let r = 0; r < pRows; r++) {
          for (let c = 0; c < pCols; c++) {
            if (pattern[r][c] === '1') {
              ctx.fillRect(x + c * pw, y + r * ph, pw, ph);
            }
          }
        }
        ctx.shadowBlur = 0;
      };

      for (const inv of g.invaders) {
        if (!inv.alive) continue;

        let framePattern: string[];
        if (inv.type === 'squid') {
          framePattern = g.invaderAnimFrame ? SQUID_FRAME_A : SQUID_FRAME_B;
        } else if (inv.type === 'crab') {
          framePattern = g.invaderAnimFrame ? CRAB_FRAME_A : CRAB_FRAME_B;
        } else {
          framePattern = g.invaderAnimFrame ? OCTOPUS_FRAME_A : OCTOPUS_FRAME_B;
        }

        drawPixelSprite(framePattern, inv.x, inv.y, inv.width, inv.height, inv.color);
      }

      // Draw Mystery UFO
      if (g.ufo.active) {
        ctx.save();
        ctx.fillStyle = '#ffed4a';
        ctx.shadowColor = '#ffed4a';
        ctx.shadowBlur = 12;

        // Flying Saucer Dome & Body
        ctx.beginPath();
        ctx.ellipse(g.ufo.x + g.ufo.width / 2, g.ufo.y + 12, g.ufo.width / 2, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(g.ufo.x + g.ufo.width / 2, g.ufo.y + 9, 8, Math.PI, 0);
        ctx.fill();

        // Pulsing navigation lights
        const t = Date.now() * 0.01;
        ctx.fillStyle = Math.sin(t) > 0 ? '#00f0ff' : '#ff007f';
        ctx.fillRect(g.ufo.x + 8, g.ufo.y + 11, 4, 3);
        ctx.fillRect(g.ufo.x + g.ufo.width / 2 - 2, g.ufo.y + 12, 4, 3);
        ctx.fillRect(g.ufo.x + g.ufo.width - 12, g.ufo.y + 11, 4, 3);
        ctx.restore();
      }

      // Draw Power-Up Capsules
      for (const p of g.powerUps) {
        ctx.save();
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = p.color;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.type[0], p.x, p.y);
        ctx.restore();
      }

      // Draw Bullets
      for (const b of g.bullets) {
        ctx.save();
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = b.color;

        if (b.isPlayer) {
          // Neon Laser beam
          ctx.fillRect(b.x - 2, b.y, 4, 14);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(b.x - 1, b.y + 2, 2, 10);
        } else {
          // Alien Zigzag plasma bolt
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(b.x - 3, b.y + 5);
          ctx.lineTo(b.x + 3, b.y + 10);
          ctx.lineTo(b.x, b.y + 15);
          ctx.strokeStyle = b.color;
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Draw Particles
      for (const p of g.particles) {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        ctx.restore();
      }

      // Draw Player Ship (Neon Laser Cannon)
      const px = g.player.x;
      const py = g.player.y;
      const pw = g.player.width;
      const ph = g.player.height;

      // Invulnerability flicker
      const showShip = !g.player.isInvulnerable || Math.floor(timestamp / 80) % 2 === 0;

      if (showShip) {
        ctx.save();
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 12;

        // Main Tank Body
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(px + 4, py + 12, pw - 8, ph - 12);

        // Center Laser Turret
        ctx.fillStyle = '#ec4899';
        ctx.shadowColor = '#ec4899';
        ctx.fillRect(px + pw / 2 - 3, py + 2, 6, 14);

        // Cockpit dome
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px + pw / 2 - 5, py + 8, 10, 6);

        // Side fins
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(px, py + 16, 4, 8);
        ctx.fillRect(px + pw - 4, py + 16, 4, 8);

        // Thruster flame
        const flameLength = Math.random() * 6 + 4;
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.moveTo(px + pw / 2 - 6, py + ph);
        ctx.lineTo(px + pw / 2, py + ph + flameLength);
        ctx.lineTo(px + pw / 2 + 6, py + ph);
        ctx.fill();

        // Active Shield Forcefield Aura
        if (g.activePowerUp === 'SHIELD') {
          ctx.strokeStyle = '#10b981';
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 14;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(px + pw / 2, py + ph / 2, pw / 2 + 8, ph / 2 + 8, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }

      // Ground Laser Line
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(0, 565);
      ctx.lineTo(CANVAS_WIDTH, 565);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // In-Canvas HUD (Lives, Score, Wave)
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillText(`SCORE: ${g.score.toString().padStart(5, '0')}`, 20, 30);

      ctx.fillStyle = '#f43f5e';
      ctx.fillText(`HI: ${g.highScore.toString().padStart(5, '0')}`, 280, 30);

      ctx.fillStyle = '#00f0ff';
      ctx.fillText(`WAVE: ${g.wave}`, 540, 30);

      // Lives icons in canvas
      for (let i = 0; i < g.lives; i++) {
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(CANVAS_WIDTH - 90 + i * 24, 20, 16, 10);
        ctx.fillRect(CANVAS_WIDTH - 86 + i * 24, 16, 8, 4);
      }
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [gameState, nextWave, firePlayerLaser, onHighScoreUpdate]);

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
      {/* Top Arcade Header Bar */}
      <div className="w-full bg-[#16062a] border-t border-x border-pink-500/40 rounded-t-xl px-4 py-2.5 flex items-center justify-between text-xs font-mono-retro text-purple-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-purple-300">HIGH SCORE:</span>
            <span className="font-arcade text-pink-400 text-sm tracking-widest">{highScore}</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-purple-400">
            <span>·</span>
            <span>CURRENT SCORE:</span>
            <span className="font-arcade text-cyan-300 text-sm">{score}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Active Powerup Indicator */}
          {activePowerUp && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-pink-950/80 border border-pink-500/60 rounded text-pink-300 animate-pulse">
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              <span className="font-bold">{activePowerUp}</span>
              <span className="text-yellow-400">({powerUpTimeLeft}s)</span>
            </div>
          )}

          {/* CRT toggle */}
          <button
            onClick={() => setCrtOn(!crtOn)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
              crtOn
                ? 'bg-purple-900/80 text-pink-300 border border-pink-500/40'
                : 'bg-purple-950/40 text-purple-400 hover:text-white'
            }`}
            title="Toggle Retro CRT Scanlines"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold">{crtOn ? 'CRT ON' : 'CRT OFF'}</span>
          </button>

          {/* SFX Toggle */}
          <button
            onClick={() => {
              setSfxOn(!sfxOn);
              synthEngine.toggleSfx();
            }}
            className="p-1 rounded text-purple-300 hover:text-pink-400"
            title="Toggle Sound FX"
          >
            {sfxOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>
        </div>
      </div>

      {/* Main Arcade Cabinet Screen */}
      <div className="w-full relative bg-black border-2 border-pink-500/50 shadow-2xl shadow-pink-900/40 overflow-hidden flex justify-center items-center">
        {/* HTML5 Canvas */}
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-auto aspect-4/3 block max-h-[580px] bg-black"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Scanlines and CRT Curvature Overlay */}
        {crtOn && (
          <>
            <div className="absolute inset-0 scanlines-overlay pointer-events-none" />
            <div className="absolute inset-0 crt-vignette pointer-events-none" />
          </>
        )}

        {/* Start / Idle Menu Overlay */}
        {gameState === 'IDLE' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-10">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-cyan-400 font-arcade mb-4 tracking-wider crt-glow">
              SPACE INVADERS
            </h2>
            <div className="text-pink-300 font-mono-retro text-sm mb-6 max-w-md">
              Synthwave Vapor edition. Defend the retro horizon while listening to classic synthwave beats.
            </div>

            {/* Score Table */}
            <div className="bg-purple-950/60 border border-purple-800/80 rounded-lg p-3.5 mb-6 text-xs font-mono-retro text-left space-y-1.5 w-64">
              <div className="flex items-center justify-between text-yellow-300">
                <span>🛸 MYSTERY UFO</span>
                <span>= ??? PTS</span>
              </div>
              <div className="flex items-center justify-between text-pink-400">
                <span>👾 SQUID ALIEN</span>
                <span>= 30 PTS</span>
              </div>
              <div className="flex items-center justify-between text-cyan-400">
                <span>🦀 CRAB ALIEN</span>
                <span>= 20 PTS</span>
              </div>
              <div className="flex items-center justify-between text-purple-300">
                <span>🐙 OCTOPUS</span>
                <span>= 10 PTS</span>
              </div>
            </div>

            <button
              onClick={startGame}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-arcade text-xs tracking-wider rounded shadow-lg shadow-pink-500/40 transition-transform active:scale-95 animate-pulse"
            >
              INSERT COIN // START GAME
            </button>
            <div className="text-[11px] text-purple-400/80 font-mono-retro mt-3">
              Press SPACE or ENTER to launch
            </div>
          </div>
        )}

        {/* Game Over Modal Overlay */}
        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-10">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-rose-500 font-arcade mb-2 tracking-wider crt-glow">
              GAME OVER
            </h2>
            <div className="text-purple-300 font-mono-retro text-sm mb-4">
              The neon grid has fallen.
            </div>

            {/* Stats Breakdown */}
            <div className="bg-purple-950/80 border border-pink-500/40 rounded-lg p-4 mb-6 text-xs font-mono-retro w-72 space-y-2">
              <div className="flex justify-between border-b border-purple-800/40 pb-1">
                <span className="text-purple-300">FINAL SCORE:</span>
                <span className="text-pink-400 font-bold">{score}</span>
              </div>
              <div className="flex justify-between border-b border-purple-800/40 pb-1">
                <span className="text-purple-300">HIGH SCORE:</span>
                <span className="text-yellow-400 font-bold">{highScore}</span>
              </div>
              <div className="flex justify-between border-b border-purple-800/40 pb-1">
                <span className="text-purple-300">WAVE REACHED:</span>
                <span className="text-cyan-300">{wave}</span>
              </div>
              <div className="flex justify-between border-b border-purple-800/40 pb-1">
                <span className="text-purple-300">ALIENS BLASTED:</span>
                <span className="text-white">{aliensDestroyed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-300">ACCURACY:</span>
                <span className="text-emerald-400">
                  {shotsFired > 0 ? Math.round((shotsHit / shotsFired) * 100) : 0}%
                </span>
              </div>
            </div>

            <button
              onClick={startGame}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-arcade text-xs tracking-wider rounded shadow-lg shadow-pink-500/40 transition-transform active:scale-95"
            >
              PLAY AGAIN
            </button>
          </div>
        )}

        {/* Pause Overlay */}
        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-2xl font-bold font-arcade text-cyan-400 mb-4 crt-glow">
              PAUSED
            </h3>
            <button
              onClick={() => setGameState('PLAYING')}
              className="px-5 py-2.5 bg-purple-700 hover:bg-purple-600 text-white font-mono-retro text-sm font-semibold rounded shadow transition-all"
            >
              Resume Game
            </button>
          </div>
        )}
      </div>

      {/* Bottom Arcade Control Strip & Mobile Touch Controls */}
      <div className="w-full bg-[#16062a] border-b border-x border-pink-500/40 rounded-b-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono-retro text-purple-300">
        {/* Keyboard Controls Legend */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-purple-900/80 border border-purple-700 rounded text-pink-300 font-bold">
              ← / →
            </kbd>
            <span className="text-purple-300/80">Move</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-purple-900/80 border border-purple-700 rounded text-pink-300 font-bold">
              SPACE
            </kbd>
            <span className="text-purple-300/80">Fire Laser</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-purple-900/80 border border-purple-700 rounded text-pink-300 font-bold">
              P
            </kbd>
            <span className="text-purple-300/80">Pause</span>
          </div>
        </div>

        {/* On-Screen Touch / Click Buttons for Mobile and Quick Controls */}
        <div className="flex items-center gap-2">
          <button
            onMouseDown={() => (gameRef.current.touchControls.left = true)}
            onMouseUp={() => (gameRef.current.touchControls.left = false)}
            onTouchStart={() => (gameRef.current.touchControls.left = true)}
            onTouchEnd={() => (gameRef.current.touchControls.left = false)}
            className="px-3.5 py-2 bg-purple-900/80 hover:bg-purple-800 active:bg-pink-600 text-white rounded font-bold transition-colors select-none"
            aria-label="Move Left"
          >
            ◀ LEFT
          </button>
          <button
            onMouseDown={() => (gameRef.current.touchControls.right = true)}
            onMouseUp={() => (gameRef.current.touchControls.right = false)}
            onTouchStart={() => (gameRef.current.touchControls.right = true)}
            onTouchEnd={() => (gameRef.current.touchControls.right = false)}
            className="px-3.5 py-2 bg-purple-900/80 hover:bg-purple-800 active:bg-pink-600 text-white rounded font-bold transition-colors select-none"
            aria-label="Move Right"
          >
            RIGHT ▶
          </button>
          <button
            onClick={() => {
              if (gameState === 'PLAYING') {
                firePlayerLaser();
              } else if (gameState === 'IDLE' || gameState === 'GAMEOVER') {
                startGame();
              }
            }}
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 active:scale-95 text-white font-bold rounded shadow-md shadow-pink-500/30 transition-all select-none"
            aria-label="Fire Laser"
          >
            🔥 FIRE
          </button>
        </div>
      </div>
    </div>
  );
};
