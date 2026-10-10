import React from 'react';

interface TrackCoverArtProps {
  trackId: string;
  size?: 'sm' | 'md' | 'lg';
}

export const TrackCoverArt: React.FC<TrackCoverArtProps> = ({ trackId, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
  }[size];

  if (trackId === 'track-1') {
    // Neon Sunset '84: Striped sun, palms, wireframe grid
    return (
      <div className={`${sizeClasses} relative rounded-lg overflow-hidden shrink-0 border border-pink-500/40 shadow-lg shadow-pink-500/20 bg-gradient-to-b from-[#18002e] via-[#40003b] to-[#0d001a]`}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="sunGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffed4a" />
              <stop offset="50%" stopColor="#ff2a85" />
              <stop offset="100%" stopColor="#7928ca" />
            </linearGradient>
            <linearGradient id="gridGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ff2a85" />
              <stop offset="100%" stopColor="#00f0ff" />
            </linearGradient>
          </defs>
          {/* Stars */}
          <circle cx="20" cy="18" r="0.8" fill="#fff" opacity="0.8" />
          <circle cx="80" cy="12" r="0.8" fill="#fff" opacity="0.8" />
          <circle cx="35" cy="25" r="0.6" fill="#00f0ff" opacity="0.9" />
          <circle cx="70" cy="28" r="0.6" fill="#ff2a85" opacity="0.9" />

          {/* Striped Sun */}
          <circle cx="50" cy="50" r="28" fill="url(#sunGrad)" />
          {/* Sun Horizontal Cutouts */}
          <line x1="22" y1="46" x2="78" y2="46" stroke="#250036" strokeWidth="1.2" />
          <line x1="24" y1="52" x2="76" y2="52" stroke="#250036" strokeWidth="2" />
          <line x1="28" y1="59" x2="72" y2="59" stroke="#1d002e" strokeWidth="2.8" />
          <line x1="34" y1="67" x2="66" y2="67" stroke="#120020" strokeWidth="3.6" />

          {/* Grid Horizon */}
          <path d="M 0 72 L 100 72" stroke="#ff2a85" strokeWidth="1" />
          <line x1="50" y1="72" x2="50" y2="100" stroke="#ff2a85" strokeWidth="1" />
          <line x1="50" y1="72" x2="10" y2="100" stroke="#ff2a85" strokeWidth="1" />
          <line x1="50" y1="72" x2="90" y2="100" stroke="#ff2a85" strokeWidth="1" />
          <line x1="50" y1="72" x2="-20" y2="100" stroke="#ff2a85" strokeWidth="0.8" />
          <line x1="50" y1="72" x2="120" y2="100" stroke="#ff2a85" strokeWidth="0.8" />
          <line x1="0" y1="78" x2="100" y2="78" stroke="#ff2a85" strokeWidth="0.7" />
          <line x1="0" y1="87" x2="100" y2="87" stroke="#00f0ff" strokeWidth="0.9" />
          <line x1="0" y1="97" x2="100" y2="97" stroke="#00f0ff" strokeWidth="1.2" />

          {/* Palm silhouette */}
          <path d="M 88 72 Q 83 60 78 45 Q 77 42 75 40" stroke="#0f0019" strokeWidth="2.4" fill="none" />
          <path d="M 75 40 Q 64 36 60 42" stroke="#0f0019" strokeWidth="1.5" fill="none" />
          <path d="M 75 40 Q 72 30 65 30" stroke="#0f0019" strokeWidth="1.5" fill="none" />
          <path d="M 75 40 Q 84 32 88 36" stroke="#0f0019" strokeWidth="1.5" fill="none" />
          <path d="M 75 40 Q 86 42 90 48" stroke="#0f0019" strokeWidth="1.5" fill="none" />
        </svg>
      </div>
    );
  }

  if (trackId === 'track-2') {
    // Cyber Highway Drift: Sports car on cyan/neon grid
    return (
      <div className={`${sizeClasses} relative rounded-lg overflow-hidden shrink-0 border border-cyan-400/40 shadow-lg shadow-cyan-500/20 bg-gradient-to-b from-[#001026] via-[#051c3d] to-[#000814]`}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="100%" stopColor="#7928ca" />
            </linearGradient>
          </defs>
          {/* Cyber Moon / Wireframe Sphere */}
          <circle cx="50" cy="35" r="22" stroke="#00f0ff" strokeWidth="1" fill="#001833" opacity="0.9" />
          <ellipse cx="50" cy="35" rx="22" ry="7" stroke="#00f0ff" strokeWidth="0.8" fill="none" opacity="0.6" />
          <ellipse cx="50" cy="35" rx="7" ry="22" stroke="#00f0ff" strokeWidth="0.8" fill="none" opacity="0.6" />

          {/* Cyan Perspective Grid */}
          <path d="M 0 65 L 100 65" stroke="#00f0ff" strokeWidth="1.2" />
          <line x1="50" y1="65" x2="50" y2="100" stroke="#00f0ff" strokeWidth="1.5" />
          <line x1="50" y1="65" x2="15" y2="100" stroke="#00f0ff" strokeWidth="1.2" />
          <line x1="50" y1="65" x2="85" y2="100" stroke="#00f0ff" strokeWidth="1.2" />
          <line x1="50" y1="65" x2="-20" y2="100" stroke="#00f0ff" strokeWidth="0.8" />
          <line x1="50" y1="65" x2="120" y2="100" stroke="#00f0ff" strokeWidth="0.8" />
          <line x1="0" y1="72" x2="100" y2="72" stroke="#00f0ff" strokeWidth="0.7" />
          <line x1="0" y1="82" x2="100" y2="82" stroke="#00f0ff" strokeWidth="0.9" />
          <line x1="0" y1="94" x2="100" y2="94" stroke="#00f0ff" strokeWidth="1.2" />

          {/* Retro Car Silhouette from behind */}
          <path d="M 38 88 L 42 76 L 58 76 L 62 88 Z" fill="#0a0518" stroke="#ff007f" strokeWidth="1.2" />
          {/* Tail lights */}
          <rect x="40" y="83" width="7" height="2" fill="#ff0055" />
          <rect x="53" y="83" width="7" height="2" fill="#ff0055" />
          <line x1="40" y1="84" x2="60" y2="84" stroke="#ff0055" strokeWidth="0.8" opacity="0.7" />
        </svg>
      </div>
    );
  }

  // Track 3: "Midnight Laser Dreams"
  return (
    <div className={`${sizeClasses} relative rounded-lg overflow-hidden shrink-0 border border-purple-500/40 shadow-lg shadow-purple-500/20 bg-gradient-to-b from-[#15002b] via-[#2a0447] to-[#0d001c]`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Sky gradient and Laser Rays */}
        <line x1="50" y1="20" x2="10" y2="75" stroke="#c084fc" strokeWidth="0.8" opacity="0.5" />
        <line x1="50" y1="20" x2="30" y2="75" stroke="#f472b6" strokeWidth="0.8" opacity="0.6" />
        <line x1="50" y1="20" x2="70" y2="75" stroke="#f472b6" strokeWidth="0.8" opacity="0.6" />
        <line x1="50" y1="20" x2="90" y2="75" stroke="#c084fc" strokeWidth="0.8" opacity="0.5" />

        {/* Purple Glowing Moon */}
        <circle cx="50" cy="22" r="14" fill="#f43f5e" opacity="0.8" />
        <circle cx="50" cy="22" r="14" stroke="#a855f7" strokeWidth="1.5" fill="none" />

        {/* City Skyline Silhouettes */}
        <rect x="8" y="55" width="12" height="30" fill="#0c0117" stroke="#a855f7" strokeWidth="0.6" />
        <rect x="22" y="42" width="14" height="43" fill="#090012" stroke="#ec4899" strokeWidth="0.6" />
        <polygon points="29,32 23,42 35,42" fill="#090012" stroke="#ec4899" strokeWidth="0.6" />
        <rect x="38" y="50" width="16" height="35" fill="#0c0117" stroke="#a855f7" strokeWidth="0.6" />
        <rect x="56" y="38" width="15" height="47" fill="#090012" stroke="#ec4899" strokeWidth="0.6" />
        <polygon points="63.5,28 57,38 70,38" fill="#090012" stroke="#ec4899" strokeWidth="0.6" />
        <rect x="73" y="48" width="18" height="37" fill="#0c0117" stroke="#a855f7" strokeWidth="0.6" />

        {/* Neon City Windows */}
        <rect x="25" y="48" width="2" height="2" fill="#00f0ff" />
        <rect x="30" y="52" width="2" height="2" fill="#ffed4a" />
        <rect x="27" y="58" width="2" height="2" fill="#ff2a85" />
        <rect x="59" y="44" width="2" height="2" fill="#ffed4a" />
        <rect x="65" y="48" width="2" height="2" fill="#00f0ff" />
        <rect x="62" y="56" width="2" height="2" fill="#ff2a85" />

        {/* Water reflection floor */}
        <rect x="0" y="85" width="100" height="15" fill="#05000a" />
        <line x1="10" y1="88" x2="90" y2="88" stroke="#a855f7" strokeWidth="0.8" opacity="0.5" />
        <line x1="20" y1="93" x2="80" y2="93" stroke="#f43f5e" strokeWidth="0.8" opacity="0.4" />
      </svg>
    </div>
  );
};
