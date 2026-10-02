import React from 'react';
import { ShibaMark } from './ShibaMark';
import { sounds } from '../services/audio';

interface CabinetHeaderProps {
  nodeStatus: 'connected' | 'emulated';
  rpcPort: number;
  blockHeight: number;
  networkHashrate: string;
  soundEnabled: boolean;
  scanlinesEnabled: boolean;
  onToggleSound: () => void;
  onToggleScanlines: () => void;
  onOpenWallet: () => void;
  onOpenAdmin: () => void;
}

export const CabinetHeader: React.FC<CabinetHeaderProps> = ({
  nodeStatus,
  rpcPort,
  blockHeight,
  networkHashrate,
  soundEnabled,
  scanlinesEnabled,
  onToggleSound,
  onToggleScanlines,
  onOpenWallet,
  onOpenAdmin,
}) => {
  return (
    <header className="cabinet-panel border-b-2 border-[#2b2d38] p-3 sm:p-4 text-[#f59e0b] shadow-2xl relative">
      {/* Corner Rivets */}
      <div className="absolute top-2 left-2 rivet" />
      <div className="absolute top-2 right-2 rivet" />
      <div className="absolute bottom-2 left-2 rivet" />
      <div className="absolute bottom-2 right-2 rivet" />

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Shiba Emblem */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => sounds.playCoinClink()}>
            <ShibaMark size={56} glow />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-tech text-xl sm:text-2xl font-bold tracking-wider text-amber-glow uppercase">
                Dogecoin Core
              </span>
              <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-[#291e07] border border-[#f59e0b44] text-[#fbbf24]">
                3-RIG CASHIER
              </span>
            </div>
            <div className="text-xs text-[#a16207] tracking-wider flex items-center gap-2">
              <span>DAEMON RPC v1.14.9</span>
              <span>·</span>
              <span>BLOCK #{blockHeight.toLocaleString()}</span>
              <span>·</span>
              <span>{networkHashrate}</span>
            </div>
          </div>
        </div>

        {/* The House 25% Cut Notice Banner - PROMINENT AS REQUESTED */}
        <div className="bg-[#1c1305] border border-[#b45309] px-3.5 py-1.5 text-center flex flex-col items-center">
          <div className="text-[10px] tracking-widest text-[#d97706] font-bold uppercase">
            POOL CASHIER REVENUE SPLIT
          </div>
          <div className="flex items-center gap-3 text-xs sm:text-sm font-tech font-semibold">
            <span className="text-[#fbbf24] text-amber-glow">
              HOUSE POOL CUT: <strong className="font-mono text-[#f59e0b]">25.00%</strong>
            </span>
            <span className="text-[#78350f]">|</span>
            <span className="text-[#34d399]">
              MINER NET PAYOUT: <strong className="font-mono">75.00%</strong>
            </span>
          </div>
        </div>

        {/* Controls & Modals Trigger */}
        <div className="flex items-center flex-wrap justify-center gap-2">
          {/* Node Status Indicator */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#101217] border border-[#2b2d38] text-[11px] font-mono"
            title={`RPC Port ${rpcPort} - Dogecoind`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                nodeStatus === 'connected'
                  ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                  : 'bg-amber-500 animate-pulse shadow-[0_0_8px_#f59e0b]'
              }`}
            />
            <span className="text-zinc-400">
              RPC:{rpcPort} ({nodeStatus === 'connected' ? 'LIVE CORE' : 'EMULATED'})
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              onToggleSound();
              sounds.playRelayClick();
            }}
            className={`px-2.5 py-1 text-xs font-mono border transition-all ${
              soundEnabled
                ? 'bg-[#291e07] border-[#f59e0b] text-[#fbbf24]'
                : 'bg-[#121318] border-[#2b2d38] text-zinc-500 line-through'
            }`}
            title="Toggle Synthesized Cabinet Audio"
          >
            SFX {soundEnabled ? 'ON' : 'OFF'}
          </button>

          {/* CRT Scanline Toggle */}
          <button
            onClick={() => {
              onToggleScanlines();
              sounds.playCrtHum();
            }}
            className={`px-2.5 py-1 text-xs font-mono border transition-all ${
              scanlinesEnabled
                ? 'bg-[#291e07] border-[#f59e0b] text-[#fbbf24]'
                : 'bg-[#121318] border-[#2b2d38] text-zinc-500'
            }`}
            title="Toggle CRT Screen Scanlines"
          >
            CRT {scanlinesEnabled ? 'SCAN' : 'FLAT'}
          </button>

          {/* Wallet Drawer Window Button */}
          <button
            onClick={() => {
              onOpenWallet();
              sounds.playRelayClick();
            }}
            className="px-3 py-1 text-xs font-tech font-bold bg-[#1e2330] hover:bg-[#252b3d] border border-[#40475c] text-sky-300 hover:text-sky-200 transition-colors shadow-sm"
          >
            WALLET DRAWER
          </button>

          {/* Admin Panel Button */}
          <button
            onClick={() => {
              onOpenAdmin();
              sounds.playLever();
            }}
            className="px-3 py-1 text-xs font-tech font-bold bg-[#3b2405] hover:bg-[#4d3008] border border-[#b45309] text-amber-300 transition-colors shadow-sm"
          >
            ADMIN CONSOLE
          </button>
        </div>
      </div>
    </header>
  );
};
