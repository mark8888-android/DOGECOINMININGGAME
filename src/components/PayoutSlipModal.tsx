import React, { useState } from 'react';
import { PayoutRecord } from '../types';
import { sounds } from '../services/audio';

interface PayoutSlipModalProps {
  record: PayoutRecord | null;
  onClose: () => void;
}

export const PayoutSlipModal: React.FC<PayoutSlipModalProps> = ({ record, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!record) return null;

  const dateStr = new Date(record.timestamp).toLocaleString();

  const handleCopy = () => {
    const text = `
=== DOGECOIN CORE CASHIER RECEIPT ===
DATE: ${dateStr}
RECIPIENT: ${record.minerAddress}
GROSS MINED: ${record.grossAmount.toFixed(8)} DOGE
HOUSE CUT (25%): -${record.houseCut.toFixed(8)} DOGE
NET MINER PAYOUT (75%): +${record.netPayout.toFixed(8)} DOGE
CORE TXID: ${record.txid}
STATUS: ${record.status.toUpperCase()} (${record.confirmations} confirms)
=====================================
`;
    navigator.clipboard.writeText(text.trim());
    setCopied(true);
    sounds.playRelayClick();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#121317] border-2 border-amber-500 w-full max-w-md p-5 text-amber-300 relative shadow-2xl font-mono text-xs">
        {/* Receipt perforations on top */}
        <div className="border-b-2 border-dashed border-[#474a5e] pb-3 mb-3 text-center">
          <div className="text-[10px] tracking-widest text-zinc-400">
            ************************************************
          </div>
          <div className="text-sm font-tech font-bold text-amber-glow tracking-widest mt-1">
            DOGECOIN CORE CASHIER DISPATCH
          </div>
          <div className="text-[10px] text-zinc-400">
            AUTOMATED 60-SECOND ON-CHAIN SEND RECEIPT
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">{dateStr}</div>
        </div>

        {/* Breakdown of 25% cut vs 75% net */}
        <div className="space-y-2 py-2">
          <div>
            <div className="text-[10px] text-zinc-500">MINER DESTINATION ADDRESS:</div>
            <div className="font-bold text-zinc-200 break-all select-all">
              {record.minerAddress}
            </div>
          </div>

          <div className="pt-2 border-t border-[#232530] space-y-1">
            <div className="flex justify-between text-zinc-300">
              <span>GROSS MINED SHARE:</span>
              <span className="font-bold">{record.grossAmount.toFixed(8)} Ð</span>
            </div>

            <div className="flex justify-between text-amber-500">
              <span>HOUSE COMMISSION (25.00%):</span>
              <span className="font-bold">-{record.houseCut.toFixed(8)} Ð</span>
            </div>

            <div className="flex justify-between text-emerald-400 text-sm font-bold pt-1 border-t border-dashed border-[#333748]">
              <span>NET MINER DISBURSEMENT (75.00%):</span>
              <span>+{record.netPayout.toFixed(8)} Ð</span>
            </div>
          </div>

          {/* TxID & On-Chain status */}
          <div className="pt-3 border-t border-[#232530] space-y-1">
            <div className="text-[10px] text-zinc-500">DOGECOIN CORE TXID:</div>
            <div className="p-1.5 bg-[#090a0d] border border-[#232530] text-[10px] text-zinc-300 break-all select-all">
              {record.txid}
            </div>
          </div>

          <div className="flex justify-between text-[11px] text-zinc-400 pt-1">
            <span>NETWORK CONFIRMATIONS:</span>
            <span className="text-emerald-400 font-bold">
              {record.confirmations} ({record.confirmations > 0 ? 'CONFIRMED' : 'MEMPOOL ~1 MIN'})
            </span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t-2 border-dashed border-[#474a5e] pt-4 mt-3 flex justify-between gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 py-1.5 bg-[#1e2029] hover:bg-[#2b2d3a] border border-[#3b3e4e] text-zinc-300 text-xs font-tech"
          >
            {copied ? 'RECEIPT COPIED' : 'COPY RECEIPT SLIP'}
          </button>

          <button
            onClick={() => {
              onClose();
              sounds.playRelayClick();
            }}
            className="flex-1 py-1.5 bg-[#291e07] hover:bg-[#3d2c0b] border border-[#f59e0b] text-[#fbbf24] font-tech text-xs font-bold"
          >
            DISMISS SLIP
          </button>
        </div>
      </div>
    </div>
  );
};
