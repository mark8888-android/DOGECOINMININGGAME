import React, { useState, useEffect } from 'react';
import { GameSymbol, SymbolType } from './GameSymbols';
import { sounds } from '../services/audio';
import { MinerSlot } from '../types';

const SYMBOLS: SymbolType[] = [
  'DOGE_COIN',
  'NONCE_BLOCK',
  'MINING_PICK',
  'CORE_DAEMON',
  'GOLD_BAR',
  'TITANIUM_BONE',
];

interface ExcavatorReelProps {
  slots: MinerSlot[];
  activeRigIndex: number;
  blockProgressPercent: number;
  onSpinSubmit: (slotIndex: number, bonusMultiplier: number) => void;
}

export const ExcavatorReel: React.FC<ExcavatorReelProps> = ({
  slots,
  activeRigIndex,
  blockProgressPercent,
  onSpinSubmit,
}) => {
  const [reels, setReels] = useState<[SymbolType, SymbolType, SymbolType]>([
    'DOGE_COIN',
    'NONCE_BLOCK',
    'DOGE_COIN',
  ]);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [leverPulled, setLeverPulled] = useState<boolean>(false);
  const [lastWinText, setLastWinText] = useState<string>('PULL LEVER TO EXCAVATE DOGE NONCE');
  const [lastMultiplier, setLastMultiplier] = useState<number>(1);
  const [recentNonce, setRecentNonce] = useState<string>('0x7A8F9B2C');

  const activeRig = slots[activeRigIndex];

  const handlePullLever = () => {
    if (isSpinning) return;
    if (!activeRig || !activeRig.isOccupied) {
      setLastWinText('ENGAGE A RIG SLOT FIRST TO MINE');
      sounds.playRelayClick();
      return;
    }

    setLeverPulled(true);
    setIsSpinning(true);
    sounds.playLever();

    setTimeout(() => {
      setLeverPulled(false);
    }, 250);

    // Sound ticks during spin
    const tickInterval = setInterval(() => {
      sounds.playReelTick();
    }, 110);

    // Stop reel 1
    setTimeout(() => {
      sounds.playReelStop(0);
      const s1 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      setReels((prev) => [s1, prev[1], prev[2]]);
    }, 700);

    // Stop reel 2
    setTimeout(() => {
      sounds.playReelStop(1);
      const s2 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      setReels((prev) => [prev[0], s2, prev[2]]);
    }, 1100);

    // Stop reel 3 and calculate match
    setTimeout(() => {
      clearInterval(tickInterval);
      sounds.playReelStop(2);

      // Random final outcome with nice weighting for matches
      const rnd = Math.random();
      let s1: SymbolType;
      let s2: SymbolType;
      let s3: SymbolType;

      if (rnd < 0.25) {
        // Triple match jackpot!
        s1 = 'DOGE_COIN';
        s2 = 'DOGE_COIN';
        s3 = 'DOGE_COIN';
      } else if (rnd < 0.55) {
        // Double match
        const matched = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        s1 = matched;
        s2 = matched;
        s3 = SYMBOLS[(SYMBOLS.indexOf(matched) + 1) % SYMBOLS.length];
      } else {
        s1 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        s2 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        s3 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      }

      setReels([s1, s2, s3]);
      setIsSpinning(false);

      // Evaluate match bonus
      let bonus = 1;
      const genNonce = '0x' + Math.floor(Math.random() * 0xffffffff).toString(16).toUpperCase();
      setRecentNonce(genNonce);

      if (s1 === s2 && s2 === s3) {
        bonus = s1 === 'DOGE_COIN' ? 5 : 3;
        setLastMultiplier(bonus);
        setLastWinText(`TRIPLE MATCH! ${s1.replace('_', ' ')} BONUS (${bonus}X SCRYPT SHARES)`);
        sounds.playBlockSolved();
        sounds.playCoinClink();
      } else if (s1 === s2 || s2 === s3 || s1 === s3) {
        bonus = 2;
        setLastMultiplier(bonus);
        setLastWinText(`DOUBLE SHARE HIT! (2X HASH MULTIPLIER)`);
        sounds.playCoinClink();
      } else {
        bonus = 1;
        setLastMultiplier(bonus);
        setLastWinText(`SCRYPT SHARE CONFIRMED · NONCE ACCEPTED`);
        sounds.playCoinClink();
      }

      onSpinSubmit(activeRigIndex, bonus);
    }, 1500);
  };

  // Keyboard shortcut: Spacebar to spin
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        handlePullLever();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="cabinet-panel border-2 border-[#2b2d38] p-4 text-[#f59e0b] relative shadow-2xl">
      <div className="absolute top-2 left-2 rivet" />
      <div className="absolute top-2 right-2 rivet" />
      <div className="absolute bottom-2 left-2 rivet" />
      <div className="absolute bottom-2 right-2 rivet" />

      {/* Top Banner of the Excavator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 mb-4 border-b border-[#2b2d38] gap-2">
        <div className="flex items-center gap-2">
          <span className="font-tech text-base sm:text-lg font-bold uppercase tracking-wider text-amber-glow">
            SCRYPT NONCE EXCAVATOR
          </span>
          <span className="text-xs text-zinc-400 font-mono">
            [RIG: {activeRig?.name || 'NONE'}]
          </span>
        </div>

        {/* Global Block Progress Bar */}
        <div className="w-full sm:w-64 bg-[#0a0b0e] border border-[#3b3e4e] p-1.5 flex flex-col gap-1">
          <div className="flex justify-between text-[10px] font-mono text-zinc-400">
            <span>DOGE BLOCK CRACK PROGRESS</span>
            <span className="text-amber-400 font-bold">{blockProgressPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full h-2.5 bg-[#14151b] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300 shadow-[0_0_8px_#f59e0b]"
              style={{ width: `${blockProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Center Console: The 3 Tumbler Reels + Heavy Lever */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* CRT Status & Nonce Telemetry */}
        <div className="lg:col-span-3 bg-[#0a0b0e] border border-[#2b2d38] p-3 text-xs font-mono space-y-2">
          <div className="text-[10px] text-[#fbbf24] font-bold tracking-widest uppercase border-b border-[#2a2c38] pb-1">
            CORE EXCAVATION HUD
          </div>

          <div className="flex justify-between text-zinc-400">
            <span>ALGORITHM:</span>
            <span className="text-zinc-200">SCRYPT 1024,1,1</span>
          </div>

          <div className="flex justify-between text-zinc-400">
            <span>CURRENT NONCE:</span>
            <span className="text-amber-400 font-bold">{recentNonce}</span>
          </div>

          <div className="flex justify-between text-zinc-400">
            <span>MULTIPLIER:</span>
            <span className="text-emerald-400 font-bold">{lastMultiplier}X</span>
          </div>

          <div className="flex justify-between text-zinc-400">
            <span>OPERATOR RIG:</span>
            <span className="text-amber-300">{activeRig?.isOccupied ? `SLOT 0${activeRigIndex + 1}` : 'VACANT'}</span>
          </div>

          <div className="pt-2 border-t border-[#2a2c38] text-[11px] text-zinc-500">
            All mined shares are collected by the app's Core Cashier. Payouts fire every ~60s with a 25% pool cut deducted.
          </div>
        </div>

        {/* 3 Tumbler Drum Reels */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="bg-[#0e0f14] border-4 border-[#252733] p-4 rounded-sm shadow-inner w-full max-w-xl">
            {/* Payline Marker */}
            <div className="relative">
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-3 h-0.5 bg-amber-500 shadow-[0_0_8px_#f59e0b] z-20" />
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-3 h-0.5 bg-amber-500 shadow-[0_0_8px_#f59e0b] z-20" />

              <div className="grid grid-cols-3 gap-3 bg-[#08090c] p-3 border border-[#1e2029]">
                {reels.map((symbol, idx) => (
                  <div
                    key={idx}
                    className={`h-28 sm:h-32 bg-gradient-to-b from-[#15161d] via-[#222430] to-[#15161d] border-2 border-[#373a4d] flex flex-col items-center justify-center relative overflow-hidden transition-all ${
                      isSpinning ? 'blur-[0.5px] scale-[0.99]' : 'scale-100 shadow-md'
                    }`}
                  >
                    {/* Metallic drum curved shading */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none" />

                    <div className={isSpinning ? 'animate-pulse' : ''}>
                      <GameSymbol type={symbol} size={64} highlighted={!isSpinning} />
                    </div>

                    <div className="text-[10px] font-mono text-zinc-400 mt-1 uppercase tracking-wider">
                      {symbol.replace('_', ' ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Readout Slip Under Reels */}
            <div className="mt-3 bg-[#111218] border border-[#232530] px-3 py-2 text-center">
              <div className="font-mono text-xs sm:text-sm text-amber-glow tracking-wider truncate">
                &gt; {lastWinText}
              </div>
            </div>
          </div>
        </div>

        {/* Heavy Mechanical Lever Arm */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center">
            {/* Lever Knob & Shaft */}
            <div
              onClick={handlePullLever}
              className={`w-12 h-44 bg-[#14151b] border-2 border-[#323543] rounded-full relative cursor-pointer flex flex-col items-center justify-between p-1 select-none transition-transform duration-200 ${
                leverPulled ? 'translate-y-6 rotate-3' : 'hover:-translate-y-0.5'
              } ${isSpinning ? 'opacity-80' : ''}`}
              title="Click or press Spacebar to pull mining excavator lever"
            >
              {/* Ball Knob */}
              <div
                className={`w-10 h-10 rounded-full border-2 border-amber-500 shadow-lg flex items-center justify-center transition-all ${
                  leverPulled
                    ? 'bg-amber-600 scale-95 shadow-[0_0_15px_#f59e0b]'
                    : 'bg-gradient-to-tr from-[#78350f] to-[#f59e0b] shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                }`}
              >
                <span className="font-bold text-xs text-black font-nixie">PULL</span>
              </div>

              {/* Steel shaft */}
              <div className="w-3 h-24 bg-gradient-to-r from-[#4b4e61] via-[#8c91aa] to-[#3a3c4a] border border-[#2b2d38]" />

              {/* Base Pivot */}
              <div className="w-8 h-6 bg-[#0a0b0e] border border-[#3b3e4e] rounded-sm" />
            </div>

            <button
              disabled={isSpinning}
              onClick={handlePullLever}
              className="mt-3 px-3 py-1.5 bg-[#291e07] hover:bg-[#3d2c0b] disabled:opacity-50 border border-[#f59e0b] text-[#fbbf24] font-tech font-bold text-xs tracking-wider shadow-sm"
            >
              {isSpinning ? 'HASHING...' : 'PULL LEVER [SPACE]'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
