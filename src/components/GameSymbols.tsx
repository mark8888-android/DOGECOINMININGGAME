import React from 'react';

export type SymbolType = 'DOGE_COIN' | 'NONCE_BLOCK' | 'MINING_PICK' | 'CORE_DAEMON' | 'GOLD_BAR' | 'TITANIUM_BONE';

interface GameSymbolProps {
  type: SymbolType;
  size?: number;
  highlighted?: boolean;
}

export const GameSymbol: React.FC<GameSymbolProps> = ({ type, size = 48, highlighted = false }) => {
  const glowClass = highlighted ? 'drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]' : '';

  switch (type) {
    case 'DOGE_COIN':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" className={glowClass} fill="none">
          <circle cx="24" cy="24" r="22" fill="#2b1e06" stroke="#f59e0b" strokeWidth="2" />
          <circle cx="24" cy="24" r="18" fill="#140f05" stroke="#d97706" strokeWidth="1" strokeDasharray="3 2" />
          <circle cx="24" cy="24" r="14" fill="#3b2605" />
          <text x="24" y="30" textAnchor="middle" fill="#fbbf24" fontSize="20" fontWeight="bold" fontFamily="'VT323', monospace">
            Ð
          </text>
        </svg>
      );

    case 'NONCE_BLOCK':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" className={glowClass} fill="none">
          <rect x="6" y="6" width="36" height="36" rx="2" fill="#181510" stroke="#f59e0b" strokeWidth="1.5" />
          <rect x="10" y="10" width="28" height="28" fill="#0d0c09" stroke="#78350f" strokeWidth="1" />
          <line x1="6" y1="18" x2="42" y2="18" stroke="#332510" strokeWidth="1" />
          <line x1="6" y1="30" x2="42" y2="30" stroke="#332510" strokeWidth="1" />
          <text x="24" y="22" textAnchor="middle" fill="#d97706" fontSize="8" fontFamily="'Share Tech Mono', monospace">0000</text>
          <text x="24" y="32" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="bold" fontFamily="'Share Tech Mono', monospace">HASH</text>
        </svg>
      );

    case 'MINING_PICK':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" className={glowClass} fill="none">
          {/* Wooden / steel handle */}
          <line x1="12" y1="36" x2="32" y2="16" stroke="#92400e" strokeWidth="4" strokeLinecap="round" />
          <line x1="12" y1="36" x2="32" y2="16" stroke="#b45309" strokeWidth="2" strokeLinecap="round" />
          {/* Curved steel pickaxe head */}
          <path d="M 22,8 Q 36,12 40,26 Q 30,22 26,20 Z" fill="#d4d4d8" stroke="#f59e0b" strokeWidth="1" />
          <path d="M 22,8 Q 26,22 40,26" fill="none" stroke="#e4e4e7" strokeWidth="2" />
          {/* Spark point */}
          <polygon points="40,26 44,28 42,32 38,30" fill="#fbbf24" />
        </svg>
      );

    case 'CORE_DAEMON':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" className={glowClass} fill="none">
          {/* IC Chip body */}
          <rect x="10" y="10" width="28" height="28" rx="2" fill="#111827" stroke="#f59e0b" strokeWidth="1.5" />
          <circle cx="16" cy="16" r="1.5" fill="#f59e0b" />
          {/* Pins on top & bottom */}
          {[14, 20, 26, 32].map((x) => (
            <React.Fragment key={x}>
              <line x1={x} y1="6" x2={x} y2="10" stroke="#fbbf24" strokeWidth="1.5" />
              <line x1={x} y1="38" x2={x} y2="42" stroke="#fbbf24" strokeWidth="1.5" />
            </React.Fragment>
          ))}
          <text x="24" y="24" textAnchor="middle" fill="#f59e0b" fontSize="7" fontWeight="bold" fontFamily="'Share Tech Mono', monospace">CORE</text>
          <text x="24" y="32" textAnchor="middle" fill="#d97706" fontSize="7" fontFamily="'VT323', monospace">RPC:9001</text>
        </svg>
      );

    case 'GOLD_BAR':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" className={glowClass} fill="none">
          <polygon points="12,18 20,12 38,12 42,18 36,36 10,36" fill="#78350f" stroke="#f59e0b" strokeWidth="1" />
          <polygon points="12,18 20,12 38,12 30,18" fill="#fbbf24" />
          <polygon points="30,18 38,12 42,18 34,24" fill="#d97706" />
          <polygon points="12,18 30,18 36,36 10,36" fill="#b45309" stroke="#f59e0b" strokeWidth="1" />
          <text x="22" y="29" textAnchor="middle" fill="#fef3c7" fontSize="8" fontWeight="bold" fontFamily="'VT323', monospace">999.9</text>
        </svg>
      );

    case 'TITANIUM_BONE':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" className={glowClass} fill="none">
          <g fill="#451a03" stroke="#f59e0b" strokeWidth="1.5">
            {/* Left lobes */}
            <circle cx="14" cy="18" r="4" />
            <circle cx="14" cy="30" r="4" />
            {/* Right lobes */}
            <circle cx="34" cy="18" r="4" />
            <circle cx="34" cy="30" r="4" />
            {/* Bridge */}
            <rect x="14" y="20" width="20" height="8" rx="2" fill="#291404" />
          </g>
          <text x="24" y="26" textAnchor="middle" fill="#fbbf24" fontSize="6" fontFamily="'Share Tech Mono', monospace">SCRYPT</text>
        </svg>
      );
  }
};
