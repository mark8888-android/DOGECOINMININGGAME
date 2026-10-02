import React, { useState } from 'react';
import { generateDogeQrMatrix } from '../utils/qr';
import { MinerSlot, PayoutRecord } from '../types';
import { sounds } from '../services/audio';

interface WalletDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  houseAddress: string;
  houseBalance: number;
  totalHouseCut: number;
  totalPaidOut: number;
  slots: MinerSlot[];
  recentPayouts: PayoutRecord[];
  onCashoutRig: (slotIndex: number) => Promise<void>;
}

export const WalletDrawer: React.FC<WalletDrawerProps> = ({
  isOpen,
  onClose,
  houseAddress,
  houseBalance,
  totalHouseCut,
  totalPaidOut,
  slots,
  recentPayouts,
  onCashoutRig,
}) => {
  const [copiedAddr, setCopiedAddr] = useState<boolean>(false);
  const [cashingOutIdx, setCashingOutIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  const qrMatrix = generateDogeQrMatrix(houseAddress);

  const handleCopy = () => {
    navigator.clipboard.writeText(houseAddress);
    setCopiedAddr(true);
    sounds.playRelayClick();
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  const handleCashout = async (slotIndex: number) => {
    setCashingOutIdx(slotIndex);
    sounds.playLever();
    try {
      await onCashoutRig(slotIndex);
      sounds.playCoinClink();
    } finally {
      setCashingOutIdx(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="cabinet-panel border-2 border-amber-500/80 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative shadow-2xl p-5 text-[#f59e0b]">
        {/* Corner Rivets */}
        <div className="absolute top-2 left-2 rivet" />
        <div className="absolute top-2 right-2 rivet" />
        <div className="absolute bottom-2 left-2 rivet" />
        <div className="absolute bottom-2 right-2 rivet" />

        {/* Modal Window Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#3b3e4e]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-amber-400 rounded-full shadow-[0_0_8px_#f59e0b]" />
            <h2 className="text-lg font-tech font-bold uppercase tracking-wider text-amber-glow">
              DOGECOIN CORE · CASHIER WALLET WINDOW
            </h2>
          </div>
          <button
            onClick={() => {
              onClose();
              sounds.playRelayClick();
            }}
            className="px-2 py-1 bg-[#1c1d24] hover:bg-[#282a35] border border-[#3b3e4e] text-zinc-300 font-mono text-xs"
          >
            [X] CLOSE WINDOW
          </button>
        </div>

        {/* App Cashier Vault Section with QR Code */}
        <div className="bg-[#0b0c10] border border-[#2b2d38] p-4 mb-4">
          <div className="text-xs font-tech font-bold text-zinc-400 uppercase mb-2 flex items-center justify-between">
            <span>APP MASTER DOGECOIN WALLET (POOL CASHIER)</span>
            <span className="text-amber-400 font-mono text-[10px]">ALL RIG MINING DEPOSITED HERE</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* Vector SVG QR Code */}
            <div className="p-2 bg-white rounded-xs shadow-md shrink-0">
              <svg width={140} height={140} viewBox="0 0 25 25" className="shape-rendering-crispEdges">
                {qrMatrix.map((row, r) =>
                  row.map((cell, c) =>
                    cell ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#111" /> : null
                  )
                )}
              </svg>
            </div>

            {/* Address & Balances */}
            <div className="flex-1 space-y-3 w-full">
              <div>
                <div className="text-[10px] text-zinc-500 uppercase font-mono mb-1">
                  CORE RECEIVING ADDRESS
                </div>
                <div className="flex items-center gap-2 bg-[#121319] border border-[#232530] p-2">
                  <span className="font-mono text-xs text-[#fbbf24] break-all select-all flex-1">
                    {houseAddress}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="px-2.5 py-1 text-xs font-mono bg-[#291e07] hover:bg-[#3d2c0b] border border-[#f59e0b] text-[#fbbf24] shrink-0"
                  >
                    {copiedAddr ? 'COPIED' : 'COPY'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-[#14151c] p-2 border border-[#232530]">
                  <div className="text-[10px] text-zinc-500">VAULT BALANCE</div>
                  <div className="font-nixie text-lg text-amber-glow font-bold">
                    {houseBalance.toFixed(4)} Ð
                  </div>
                </div>
                <div className="bg-[#181207] p-2 border border-[#78350f]">
                  <div className="text-[10px] text-amber-500">HOUSE 25% CUT TOTAL</div>
                  <div className="font-nixie text-lg text-amber-400 font-bold">
                    +{totalHouseCut.toFixed(4)} Ð
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Miner Slots Quick Cashout */}
        <div className="mb-4">
          <div className="text-xs font-tech font-bold text-zinc-300 uppercase mb-2">
            ACTIVE RIG BALANCES & ON-DEMAND CASHOUT
          </div>

          <div className="space-y-2">
            {slots.map((slot, idx) => (
              <div
                key={slot.id}
                className="bg-[#0e0f14] border border-[#232530] p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-200">{slot.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 ${
                        slot.isOccupied ? 'bg-emerald-950 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {slot.isOccupied ? 'MINING' : 'IDLE'}
                    </span>
                  </div>
                  {slot.isOccupied && (
                    <div className="text-[11px] text-zinc-400 truncate max-w-sm mt-0.5">
                      {slot.address}
                    </div>
                  )}
                </div>

                {slot.isOccupied ? (
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="text-[10px] text-zinc-500">
                        Net: <span className="text-emerald-400 font-bold">+{slot.pendingNetDoge.toFixed(4)} Ð</span>
                      </div>
                      <div className="text-[9px] text-amber-600">
                        (Gross {slot.pendingGrossDoge.toFixed(4)} - 25% fee)
                      </div>
                    </div>

                    <button
                      disabled={slot.pendingGrossDoge <= 0 || cashingOutIdx === idx}
                      onClick={() => handleCashout(idx)}
                      className="px-3 py-1.5 bg-[#291e07] hover:bg-[#3d2c0b] disabled:opacity-40 border border-[#f59e0b] text-[#fbbf24] font-tech text-xs font-bold"
                    >
                      {cashingOutIdx === idx ? 'SENDING...' : 'CASHOUT RIG'}
                    </button>
                  </div>
                ) : (
                  <div className="text-zinc-600 text-xs italic">Vacant Slot</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Confirmations & Recent Core Transmissions */}
        <div>
          <div className="text-xs font-tech font-bold text-zinc-300 uppercase mb-2">
            CORE DISPATCH TRANSMISSIONS
          </div>

          <div className="max-h-48 overflow-y-auto divide-y divide-[#1e2029] bg-[#0a0b0e] border border-[#232530] text-xs font-mono">
            {recentPayouts.map((tx) => (
              <div key={tx.id} className="p-2.5 flex items-center justify-between text-[11px]">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">+{tx.netPayout.toFixed(4)} DOGE</span>
                    <span className="text-amber-500">(-{tx.houseCut.toFixed(4)} 25% cut)</span>
                  </div>
                  <div className="text-zinc-500 font-mono text-[10px] break-all">
                    To: {tx.minerAddress}
                  </div>
                  <div className="text-zinc-600 font-mono text-[9px]">
                    TXID: {tx.txid}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="px-1.5 py-0.5 bg-[#121318] border border-[#232530] text-zinc-400 text-[10px]">
                    {tx.confirmations} CONFIRMATIONS
                  </div>
                  <div className="text-zinc-600 text-[9px] mt-1">
                    {new Date(tx.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
