import React, { useState } from 'react';
import { PayoutRecord } from '../types';
import { sounds } from '../services/audio';

interface PayoutLedgerProps {
  recentPayouts: PayoutRecord[];
  nextPayoutInSeconds: number;
  payoutInterval: number;
  houseBalance: number;
  totalHouseCutCollected: number;
  totalPaidOut: number;
  onForceDispatch: () => Promise<void>;
  onSelectTx: (record: PayoutRecord) => void;
}

export const PayoutLedger: React.FC<PayoutLedgerProps> = ({
  recentPayouts,
  nextPayoutInSeconds,
  payoutInterval,
  houseBalance,
  totalHouseCutCollected,
  totalPaidOut,
  onForceDispatch,
  onSelectTx,
}) => {
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [copiedTx, setCopiedTx] = useState<string | null>(null);

  const handleManualDispatch = async () => {
    setIsDispatching(true);
    sounds.playLever();
    try {
      await onForceDispatch();
      sounds.playCoinClink();
    } finally {
      setIsDispatching(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTx(text);
    sounds.playRelayClick();
    setTimeout(() => setCopiedTx(null), 2000);
  };

  const mins = Math.floor(nextPayoutInSeconds / 60);
  const secs = nextPayoutInSeconds % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const progressPercent = Math.max(0, Math.min(100, ((payoutInterval - nextPayoutInSeconds) / payoutInterval) * 100));

  return (
    <section className="cabinet-panel border-2 border-[#2b2d38] p-4 text-[#f59e0b] relative shadow-2xl">
      <div className="absolute top-2 left-2 rivet" />
      <div className="absolute top-2 right-2 rivet" />
      <div className="absolute bottom-2 left-2 rivet" />
      <div className="absolute bottom-2 right-2 rivet" />

      {/* Top Header & 60s Dispatch Ticker */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between pb-3 mb-4 border-b border-[#2b2d38] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-tech text-base sm:text-lg font-bold uppercase tracking-wider text-amber-glow">
              CORE CASHIER PAYOUT DISPATCHER
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 bg-[#291e07] border border-[#f59e0b44] text-[#fbbf24]">
              ~60s CYCLE
            </span>
          </div>
          <div className="text-xs text-[#a16207] font-mono mt-0.5">
            The core fires off miner payouts every ~1 minute via <code className="text-amber-300">sendtoaddress</code>
          </div>
        </div>

        {/* 60s Countdown Module */}
        <div className="flex items-center gap-4 bg-[#0a0b0e] border border-[#3b3e4e] p-2.5 w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-zinc-400 uppercase">
              NEXT PAYOUT DISPATCH
            </span>
            <div className="flex items-center gap-2">
              <span className="font-nixie text-2xl sm:text-3xl text-amber-glow tracking-widest font-bold">
                {timeFormatted}
              </span>
              <div className="w-16 sm:w-24 h-2 bg-[#1b1c24] overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <button
            disabled={isDispatching}
            onClick={handleManualDispatch}
            className="px-3 py-1.5 bg-[#291e07] hover:bg-[#3d2c0b] disabled:opacity-50 border border-[#f59e0b] text-[#fbbf24] font-tech font-bold text-xs tracking-wider shadow-sm transition-all"
            title="Immediately trigger Core sendtoaddress payout"
          >
            {isDispatching ? 'DISPATCHING...' : 'FIRE DISPATCH NOW'}
          </button>
        </div>
      </div>

      {/* Aggregate Pool Accounting: Gross vs House 25% Cut vs Net Paid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 font-mono text-xs">
        <div className="bg-[#101217] border border-[#2b2d38] p-3 flex flex-col justify-between">
          <div className="text-[10px] text-zinc-400 uppercase">APP CASHIER POOL VAULT</div>
          <div className="font-nixie text-2xl text-amber-glow mt-1">
            {houseBalance.toFixed(4)} <span className="text-xs">DOGE</span>
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">
            All mining accumulates to this wallet
          </div>
        </div>

        <div className="bg-[#181207] border border-[#78350f] p-3 flex flex-col justify-between">
          <div className="text-[10px] text-[#fbbf24] uppercase font-bold flex justify-between">
            <span>HOUSE POOL RETENTION</span>
            <span className="text-amber-400">25.00% CUT</span>
          </div>
          <div className="font-nixie text-2xl text-amber-400 mt-1">
            +{totalHouseCutCollected.toFixed(4)} <span className="text-xs">DOGE</span>
          </div>
          <div className="text-[10px] text-[#a16207] mt-1">
            Deducted transparently at disbursement
          </div>
        </div>

        <div className="bg-[#0b1411] border border-[#065f46] p-3 flex flex-col justify-between">
          <div className="text-[10px] text-emerald-400 uppercase font-bold flex justify-between">
            <span>TOTAL MINER DISBURSEMENTS</span>
            <span className="text-emerald-300">75.00% NET</span>
          </div>
          <div className="font-nixie text-2xl text-emerald-400 mt-1">
            {totalPaidOut.toFixed(4)} <span className="text-xs">DOGE</span>
          </div>
          <div className="text-[10px] text-emerald-600 mt-1">
            Broadcast via Dogecoin Core RPC
          </div>
        </div>
      </div>

      {/* Live Transaction Ledger Table */}
      <div className="bg-[#0b0c10] border border-[#2b2d38] overflow-hidden">
        <div className="bg-[#121319] border-b border-[#2b2d38] px-3 py-2 flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-300 font-bold uppercase">
            RECENT DOGECOIN CORE ON-CHAIN DISPATCHES
          </span>
          <span className="text-[10px] text-zinc-500">
            SHOWING LATEST {recentPayouts.length} CORE SENDS
          </span>
        </div>

        {recentPayouts.length === 0 ? (
          <div className="p-6 text-center text-xs font-mono text-zinc-500">
            No payouts dispatched yet. Engage a rig and hash shares to receive ~1 minute disbursements.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#232530] text-zinc-400 text-[10px] uppercase bg-[#0f1015]">
                  <th className="p-2.5">TIMESTAMP</th>
                  <th className="p-2.5">RECIPIENT ADDRESS</th>
                  <th className="p-2.5 text-right">GROSS MINED</th>
                  <th className="p-2.5 text-right text-amber-500">HOUSE CUT (25%)</th>
                  <th className="p-2.5 text-right text-emerald-400">NET PAID (75%)</th>
                  <th className="p-2.5">TXID / STATUS</th>
                  <th className="p-2.5 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2029]">
                {recentPayouts.map((record) => {
                  const dateStr = new Date(record.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-[#14151c] transition-colors cursor-pointer"
                      onClick={() => onSelectTx(record)}
                    >
                      <td className="p-2.5 text-zinc-400 whitespace-nowrap">{dateStr}</td>
                      <td className="p-2.5 whitespace-nowrap">
                        <span className="text-zinc-200">
                          {record.minerAddress.slice(0, 8)}...{record.minerAddress.slice(-6)}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-bold text-zinc-300 whitespace-nowrap">
                        {record.grossAmount.toFixed(4)} Ð
                      </td>
                      <td className="p-2.5 text-right text-amber-400 whitespace-nowrap">
                        -{record.houseCut.toFixed(4)} Ð
                      </td>
                      <td className="p-2.5 text-right font-bold text-emerald-400 whitespace-nowrap">
                        +{record.netPayout.toFixed(4)} Ð
                      </td>
                      <td className="p-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              record.confirmations > 0 ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                          />
                          <span className="text-zinc-400 font-mono text-[11px] truncate max-w-[120px]">
                            {record.txid.slice(0, 10)}...
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            ({record.confirmations} conf)
                          </span>
                        </div>
                      </td>
                      <td className="p-2.5 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(record.txid);
                          }}
                          className="px-2 py-0.5 text-[10px] bg-[#1a1b24] hover:bg-[#252733] border border-[#3b3e4e] text-amber-400"
                        >
                          {copiedTx === record.txid ? 'COPIED' : 'RECEIPT'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
