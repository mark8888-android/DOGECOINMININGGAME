import React, { useState } from 'react';
import { MinerSlot } from '../types';
import { sounds } from '../services/audio';

interface ThreeRigBayProps {
  slots: MinerSlot[];
  activeRigIndex: number;
  onSelectRig: (index: number) => void;
  onJoinRig: (slotIndex: number, address: string, minerName: string) => Promise<void>;
  onLeaveRig: (slotIndex: number) => Promise<void>;
  onMineHash: (slotIndex: number) => void;
}

export const ThreeRigBay: React.FC<ThreeRigBayProps> = ({
  slots,
  activeRigIndex,
  onSelectRig,
  onJoinRig,
  onLeaveRig,
  onMineHash,
}) => {
  const [addressInputs, setAddressInputs] = useState<{ [key: number]: string }>({});
  const [nameInputs, setNameInputs] = useState<{ [key: number]: string }>({});
  const [errors, setErrors] = useState<{ [key: number]: string }>({});
  const [joiningIdx, setJoiningIdx] = useState<number | null>(null);

  const handleJoin = async (slotIndex: number) => {
    const addr = (addressInputs[slotIndex] || '').trim();
    const name = (nameInputs[slotIndex] || '').trim();

    if (!addr.startsWith('D')) {
      setErrors((prev) => ({ ...prev, [slotIndex]: "Address must start with 'D'" }));
      return;
    }
    if (addr.length < 26 || addr.length > 35) {
      setErrors((prev) => ({ ...prev, [slotIndex]: 'Invalid length (26-35 chars)' }));
      return;
    }

    setErrors((prev) => ({ ...prev, [slotIndex]: '' }));
    setJoiningIdx(slotIndex);
    sounds.playLever();

    try {
      await onJoinRig(slotIndex, addr, name || `MINER-${slotIndex + 1}`);
      setAddressInputs((prev) => ({ ...prev, [slotIndex]: '' }));
      setErrors((prev) => ({ ...prev, [slotIndex]: '' }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to join rig slot';
      setErrors((prev) => ({ ...prev, [slotIndex]: msg }));
    } finally {
      setJoiningIdx(null);
    }
  };

  const autofillDemoAddress = (slotIndex: number) => {
    const demoAddrs = [
      'D5YdogeMinerAlpha7xKn389sZ4fA2mQ1w',
      'D9BdogeBetaRig88vLk29xP7mQ4zY3tW6',
      'DFGdogeGammaPool33xZ91pT6mN4wK8yL2',
    ];
    setAddressInputs((prev) => ({ ...prev, [slotIndex]: demoAddrs[slotIndex] }));
    sounds.playRelayClick();
  };

  return (
    <section className="cabinet-panel border-2 border-[#2b2d38] p-4 text-[#f59e0b] relative">
      <div className="absolute top-2 left-2 rivet" />
      <div className="absolute top-2 right-2 rivet" />
      <div className="absolute bottom-2 left-2 rivet" />
      <div className="absolute bottom-2 right-2 rivet" />

      {/* Header bar of the Rig Bay */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 mb-4 border-b border-[#2b2d38] gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
          <h2 className="text-base sm:text-lg font-tech font-bold uppercase tracking-wider text-amber-glow">
            3-RIG CONCURRENT MINER BAY
          </h2>
          <span className="text-xs text-[#a16207] font-mono">
            [MAX CAPACITY: 3 SLOTS]
          </span>
        </div>
        <div className="text-xs font-mono text-[#fbbf24] bg-[#221603] px-2.5 py-1 border border-[#78350f]">
          ALL MINING ACCUMULATES IN APP CORE CASHIER
        </div>
      </div>

      {/* 3 Rig Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {slots.map((slot, idx) => {
          const isSelected = activeRigIndex === idx;

          return (
            <div
              key={slot.id}
              className={`cabinet-bezel p-3.5 relative flex flex-col justify-between transition-all ${
                isSelected
                  ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/50'
                  : 'border-[#2a2c38] hover:border-[#404354]'
              }`}
            >
              {/* Slot Header */}
              <div className="flex items-center justify-between border-b border-[#2a2c38] pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-sm ${
                      slot.isOccupied
                        ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                        : 'bg-zinc-700'
                    }`}
                  />
                  <span className="font-tech font-bold text-sm tracking-wide text-zinc-200">
                    {slot.name}
                  </span>
                </div>
                <span className="text-[11px] font-mono px-1.5 py-0.5 bg-[#121318] text-[#a16207] border border-[#232530]">
                  SLOT 0{idx + 1}/03
                </span>
              </div>

              {/* Slot Body: Active or Empty */}
              {slot.isOccupied ? (
                <div className="space-y-3 flex-1 flex flex-col justify-between">
                  {/* Address Display */}
                  <div className="bg-[#0b0c10] border border-[#2b2d38] p-2">
                    <div className="text-[10px] text-zinc-500 font-mono uppercase mb-0.5 flex justify-between">
                      <span>DOGECOIN RECIPIENT</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(slot.address);
                          sounds.playRelayClick();
                        }}
                        className="text-amber-400 hover:text-amber-200 text-[10px]"
                      >
                        COPY
                      </button>
                    </div>
                    <div className="font-mono text-xs text-[#fbbf24] break-all truncate">
                      {slot.address}
                    </div>
                  </div>

                  {/* Hash & Shares Gauge */}
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-[#121318] border border-[#232530] p-1.5">
                      <div className="text-[10px] text-zinc-500 uppercase">HASHRATE</div>
                      <div className="font-nixie text-lg text-amber-glow">
                        {slot.hashrate.toFixed(1)} <span className="text-xs">MH/S</span>
                      </div>
                    </div>
                    <div className="bg-[#121318] border border-[#232530] p-1.5">
                      <div className="text-[10px] text-zinc-500 uppercase">SHARES SOLVED</div>
                      <div className="font-nixie text-lg text-amber-glow">{slot.shares}</div>
                    </div>
                  </div>

                  {/* Earnings & 25% House Cut Breakdown */}
                  <div className="bg-[#14120c] border border-[#78350f] p-2 space-y-1 text-xs font-mono">
                    <div className="text-[10px] text-[#fbbf24] font-bold tracking-wider uppercase border-b border-[#3b2505] pb-1">
                      CURRENT SESSION UNPAID
                    </div>

                    <div className="flex justify-between text-zinc-300">
                      <span>Gross Mined:</span>
                      <span className="text-amber-400">
                        {slot.pendingGrossDoge.toFixed(8)} Ð
                      </span>
                    </div>

                    <div className="flex justify-between text-[#d97706]">
                      <span>House Cut (25%):</span>
                      <span>-{slot.pendingHouseCut.toFixed(8)} Ð</span>
                    </div>

                    <div className="flex justify-between font-bold text-[#34d399] pt-1 border-t border-[#3b2505]">
                      <span>Miner Net (75%):</span>
                      <span className="text-emerald-400">
                        +{slot.pendingNetDoge.toFixed(8)} Ð
                      </span>
                    </div>
                  </div>

                  {/* Lifetime Paid to this Address */}
                  <div className="text-[11px] text-zinc-500 flex justify-between px-1">
                    <span>Dispatched Total:</span>
                    <span className="text-zinc-300 font-mono">
                      {slot.totalPaidDoge.toFixed(4)} DOGE
                    </span>
                  </div>

                  {/* Action Controls for this Rig */}
                  <div className="pt-2 space-y-2">
                    <button
                      onClick={() => {
                        onSelectRig(idx);
                        onMineHash(idx);
                      }}
                      className="w-full py-2 bg-gradient-to-r from-[#78350f] to-[#b45309] hover:from-[#92400e] hover:to-[#d97706] text-amber-100 font-tech font-bold text-xs tracking-wider border border-[#fbbf24] shadow-md transition-all active:scale-[0.98]"
                    >
                      EXCAVATE SCRYPT SHARE
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={() => onSelectRig(idx)}
                        className={`flex-1 py-1 text-[11px] font-tech border ${
                          isSelected
                            ? 'bg-[#291e07] border-[#f59e0b] text-[#fbbf24]'
                            : 'bg-[#121318] border-[#2b2d38] text-zinc-400'
                        }`}
                      >
                        {isSelected ? 'ACTIVE FOCUS' : 'SELECT RIG'}
                      </button>

                      <button
                        onClick={async () => {
                          sounds.playLever();
                          await onLeaveRig(idx);
                        }}
                        className="py-1 px-3 text-[11px] font-tech bg-[#2d1215] hover:bg-[#40181d] border border-[#7f1d1d] text-rose-300 transition-colors"
                        title="Cashout pending balance and release slot"
                      >
                        CASHOUT & LEAVE
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty Slot: Insert Dogecoin Address */
                <div className="space-y-3 flex-1 flex flex-col justify-between">
                  <div className="bg-[#0b0c10] border border-dashed border-[#3a3d4d] p-3 text-center">
                    <div className="text-xs text-zinc-400 font-tech font-bold uppercase mb-1">
                      SLOT AVAILABLE
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Insert your Dogecoin address below to power on this miner.
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-[10px] text-zinc-400 font-mono mb-1">
                        <span>DOGECOIN ADDRESS</span>
                        <button
                          type="button"
                          onClick={() => autofillDemoAddress(idx)}
                          className="text-amber-500 hover:text-amber-300 text-[10px]"
                        >
                          TEST ADDRESS
                        </button>
                      </div>
                      <input
                        type="text"
                        value={addressInputs[idx] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAddressInputs((prev) => ({ ...prev, [idx]: val }));
                          if (errors[idx]) setErrors((prev) => ({ ...prev, [idx]: '' }));
                        }}
                        placeholder="D..."
                        className="w-full bg-[#0a0b0e] border border-[#3b3e4e] focus:border-amber-500 px-2.5 py-1.5 text-xs font-mono text-[#fbbf24] outline-none"
                      />
                      {errors[idx] && (
                        <div className="text-rose-400 text-[10px] font-mono mt-0.5">
                          {errors[idx]}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-[10px] text-zinc-400 font-mono mb-1">
                        OPERATOR CALLSIGN (OPTIONAL)
                      </div>
                      <input
                        type="text"
                        value={nameInputs[idx] || ''}
                        onChange={(e) =>
                          setNameInputs((prev) => ({ ...prev, [idx]: e.target.value }))
                        }
                        placeholder={`OPERATOR-${idx + 1}`}
                        maxLength={12}
                        className="w-full bg-[#0a0b0e] border border-[#3b3e4e] focus:border-amber-500 px-2.5 py-1 text-xs font-mono text-zinc-300 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    disabled={joiningIdx === idx}
                    onClick={() => handleJoin(idx)}
                    className="w-full py-2.5 bg-[#1b2218] hover:bg-[#253320] disabled:opacity-50 text-emerald-300 font-tech font-bold text-xs tracking-wider border border-emerald-600 shadow-sm transition-all"
                  >
                    {joiningIdx === idx ? 'CONNECTING RIG...' : 'ENGAGE RIG SLOT'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
