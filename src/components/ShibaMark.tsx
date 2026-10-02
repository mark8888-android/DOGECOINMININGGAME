import React from 'react';

interface ShibaMarkProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

export const ShibaMark: React.FC<ShibaMarkProps> = ({ size = 64, className = '', glow = false }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`${className} ${glow ? 'drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]' : ''}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="coinGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffd166" />
          <stop offset="45%" stopColor="#d48b14" />
          <stop offset="85%" stopColor="#8a5307" />
          <stop offset="100%" stopColor="#4a2c03" />
        </radialGradient>
        <radialGradient id="innerRim" cx="50%" cy="50%" r="50%">
          <stop offset="75%" stopColor="#1a1815" stopOpacity="0" />
          <stop offset="100%" stopColor="#0a0907" stopOpacity="0.8" />
        </radialGradient>
        <linearGradient id="metalHatch" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Outer Coin Ring with serrations */}
      <circle cx="50" cy="50" r="48" fill="#5c3805" stroke="#ffb703" strokeWidth="2" />
      <circle cx="50" cy="50" r="45" fill="url(#coinGrad)" />
      <circle cx="50" cy="50" r="41" fill="none" stroke="#ffda79" strokeWidth="1" strokeDasharray="2 1.5" />
      <circle cx="50" cy="50" r="38" fill="#1b1712" stroke="#d48b14" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="38" fill="url(#innerRim)" />

      {/* Engraved Shiba Inu Profile Silhouette */}
      <g fill="#ffc233" stroke="#8a5307" strokeWidth="0.75" strokeLinejoin="round">
        {/* Left Ear */}
        <polygon points="34,22 41,35 29,35" fill="#e09c1b" />
        <polygon points="35,25 39,33 32,33" fill="#ffdc73" />

        {/* Right Ear */}
        <polygon points="56,22 66,35 52,36" fill="#e09c1b" />
        <polygon points="57,25 63,33 54,34" fill="#ffdc73" />

        {/* Head & Cheeks */}
        <path d="M 28,36 Q 30,55 36,65 Q 43,74 52,74 Q 62,74 68,65 Q 73,55 70,36 Q 63,33 50,33 Q 36,33 28,36 Z" fill="#e6a11e" />

        {/* Snout & Muzzle */}
        <path d="M 41,52 Q 50,49 57,52 Q 59,62 50,65 Q 40,62 41,52 Z" fill="#ffdf85" />
        {/* Nose */}
        <polygon points="48,53 52,53 50,56" fill="#1f1406" />

        {/* Eyes (alert, calm) */}
        <path d="M 37,45 Q 41,43 44,46 Q 41,47 37,45 Z" fill="#1f1406" />
        <path d="M 56,46 Q 59,43 63,45 Q 59,47 56,46 Z" fill="#1f1406" />

        {/* Eyebrow dots */}
        <circle cx="41" cy="41" r="1.5" fill="#ffdf85" />
        <circle cx="59" cy="41" r="1.5" fill="#ffdf85" />

        {/* Mouth curve */}
        <path d="M 48,58 Q 50,60 52,58" fill="none" stroke="#1f1406" strokeWidth="1" />
      </g>

      {/* The Dogecoin 'Ð' Monogram on collar seal */}
      <g transform="translate(43, 67)">
        <circle cx="7" cy="7" r="8" fill="#14110b" stroke="#ffb703" strokeWidth="1" />
        <text
          x="7"
          y="11.5"
          textAnchor="middle"
          fontSize="11"
          fontWeight="bold"
          fontFamily="'VT323', monospace"
          fill="#ffb703"
        >
          Ð
        </text>
      </g>

      {/* Surface scratch / worn metal overlay */}
      <line x1="20" y1="25" x2="80" y2="75" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" />
      <line x1="25" y1="70" x2="75" y2="30" stroke="#000000" strokeWidth="0.5" strokeOpacity="0.3" />
    </svg>
  );
};
