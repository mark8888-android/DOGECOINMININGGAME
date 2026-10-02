import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppStatus, DogecoinConf, PayoutRecord } from './types';
import { CabinetHeader } from './components/CabinetHeader';
import { ThreeRigBay } from './components/ThreeRigBay';
import { ExcavatorReel } from './components/ExcavatorReel';
import { PayoutLedger } from './components/PayoutLedger';
import { WalletDrawer } from './components/WalletDrawer';
import { AdminConsoleModal } from './components/AdminConsoleModal';
import { PayoutSlipModal } from './components/PayoutSlipModal';
import { sounds } from './services/audio';

const DEFAULT_CONFIG: DogecoinConf = {
  connect: '',
  listen: '1',
  server: '1',
  listenonion: '0',
  discover: '1',
  dnsseed: '1',
  txindex: '1',
  port: 9000,
  rpcallowip: '127.0.0.1',
  rpcport: 9001,
  rpcuser: 'elshaddai',
  rpcpassword: 'DFYweEjcmE5EUb6xjwtaiygsJm7bDCPsED',
  rpchost: '127.0.0.1',
  houseAddress: 'DM9dogePoolCashier8Gg2b4rP2J6fFvU2r',
  houseCutPercent: 25,
  payoutInterval: 60,
};

export default function App() {
  const [status, setStatus] = useState<AppStatus | null>(null);
  const [config, setConfig] = useState<DogecoinConf>(DEFAULT_CONFIG);
  const [activeRigIndex, setActiveRigIndex] = useState<number>(0);

  // Modals & UI Controls
  const [isWalletOpen, setIsWalletOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [selectedTx, setSelectedTx] = useState<PayoutRecord | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [scanlinesEnabled, setScanlinesEnabled] = useState<boolean>(true);

  // Track recent payout ID to auto-show receipt slip on fresh 60s dispatches
  const lastPayoutIdRef = useRef<string | null>(null);

  // Fetch status from server
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data: AppStatus = await res.json();
        setStatus(data);

        // Check if a new payout arrived
        if (data.recentPayouts && data.recentPayouts.length > 0) {
          const newest = data.recentPayouts[0];
          if (lastPayoutIdRef.current && lastPayoutIdRef.current !== newest.id) {
            // New payout dispatch just arrived!
            sounds.playCoinClink();
            setSelectedTx(newest);
          }
          lastPayoutIdRef.current = newest.id;
        }
      }
    } catch {
      // Backend not yet ready or polling error
    }
  }, []);

  // Fetch config
  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/conf');
      if (res.ok) {
        const data = await res.json();
        if (data.conf) {
          setConfig(data.conf);
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchConfig();
    const interval = setInterval(fetchStatus, 2500);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchConfig]);

  // Local 1-second countdown decrement for smooth visual ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setStatus((prev) => {
        if (!prev) return null;
        if (prev.nextPayoutInSeconds <= 1) {
          fetchStatus();
          return { ...prev, nextPayoutInSeconds: prev.payoutInterval };
        }
        return { ...prev, nextPayoutInSeconds: prev.nextPayoutInSeconds - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [fetchStatus]);

  // Actions
  const handleJoinRig = async (slotIndex: number, address: string, minerName: string) => {
    const res = await fetch('/api/rigs/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotIndex, address, minerName }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to join rig');
    }

    setActiveRigIndex(slotIndex);
    await fetchStatus();
  };

  const handleLeaveRig = async (slotIndex: number) => {
    const res = await fetch('/api/rigs/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotIndex }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to leave rig');
    }

    await fetchStatus();
  };

  const handleMineHash = async (slotIndex: number, bonusMultiplier: number = 1) => {
    try {
      const res = await fetch('/api/rigs/hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotIndex, bonusMultiplier }),
      });
      if (res.ok) {
        await fetchStatus();
      }
    } catch {
      // Ignore
    }
  };

  const handleForceDispatch = async () => {
    try {
      const res = await fetch('/api/payout/dispatch', { method: 'POST' });
      if (res.ok) {
        await fetchStatus();
      }
    } catch {
      // Ignore
    }
  };

  const handleSaveConfig = async (newConf: Partial<DogecoinConf>) => {
    const res = await fetch('/api/admin/conf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConf),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save config');
    }

    const data = await res.json();
    if (data.conf) {
      setConfig(data.conf);
    }
    await fetchStatus();
  };

  const handleTestRpc = async () => {
    const res = await fetch('/api/admin/test-rpc', { method: 'POST' });
    return await res.json();
  };

  const handleExecRpc = async (method: string, params: unknown[] = []) => {
    const res = await fetch('/api/admin/rpc-exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, params }),
    });
    return await res.json();
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
  };

  const toggleScanlines = () => {
    setScanlinesEnabled((prev) => !prev);
  };

  return (
    <div
      className={`min-h-screen bg-[#07080a] text-[#f59e0b] flex flex-col justify-between ${
        scanlinesEnabled ? '' : 'crt-scanlines-disabled'
      }`}
    >
      {/* Outer Metal Cabinet Frame */}
      <div className="flex-1 flex flex-col">
        {/* Cabinet Bezel Header */}
        <CabinetHeader
          nodeStatus={status?.nodeStatus || 'emulated'}
          rpcPort={status?.rpcPort || config.rpcport}
          blockHeight={status?.blockHeight || 5420119}
          networkHashrate={status?.networkHashrate || '794.28 TH/s'}
          soundEnabled={soundEnabled}
          scanlinesEnabled={scanlinesEnabled}
          onToggleSound={toggleSound}
          onToggleScanlines={toggleScanlines}
          onOpenWallet={() => setIsWalletOpen(true)}
          onOpenAdmin={() => setIsAdminOpen(true)}
        />

        {/* Main Cabinet Screen (CRT Glass Effect) */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 space-y-5">
          <div className="crt-screen rounded-xs p-3 sm:p-5 space-y-5">
            {/* The 3-Rig Mining Bay */}
            <ThreeRigBay
              slots={status?.activeMiners || []}
              activeRigIndex={activeRigIndex}
              onSelectRig={(idx) => setActiveRigIndex(idx)}
              onJoinRig={handleJoinRig}
              onLeaveRig={handleLeaveRig}
              onMineHash={(idx) => handleMineHash(idx, 1)}
            />

            {/* The Scrypt Excavator Reel & Lever Tumbler */}
            <ExcavatorReel
              slots={status?.activeMiners || []}
              activeRigIndex={activeRigIndex}
              blockProgressPercent={status?.blockProgressPercent || 0}
              onSpinSubmit={(idx, mult) => handleMineHash(idx, mult)}
            />

            {/* The Payout Ledger & 60-Second Cashier Dispatcher */}
            <PayoutLedger
              recentPayouts={status?.recentPayouts || []}
              nextPayoutInSeconds={status?.nextPayoutInSeconds ?? 60}
              payoutInterval={status?.payoutInterval || 60}
              houseBalance={status?.houseBalance || 0}
              totalHouseCutCollected={status?.totalHouseCutCollected || 0}
              totalPaidOut={status?.totalPaidOut || 0}
              onForceDispatch={handleForceDispatch}
              onSelectTx={(record) => setSelectedTx(record)}
            />
          </div>
        </main>

        {/* Industrial Cabinet Base Plate */}
        <footer className="cabinet-panel border-t-2 border-[#2b2d38] p-3 text-center text-xs font-mono text-zinc-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              DOGECOIN CORE HARDWARE CASHIER · ARCH: X86_64-LINUX · DAEMON PORT {config.port} / RPC {config.rpcport}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#a16207]">
                HOUSE POOL FEE: <strong className="text-amber-400">25.00%</strong>
              </span>
              <span>·</span>
              <span className="text-[#059669]">
                MINER SHARE: <strong className="text-emerald-400">75.00%</strong>
              </span>
              <span>·</span>
              <span className="text-zinc-400">DISPATCH: ~60s</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Modals & Sub-Windows */}
      <WalletDrawer
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        houseAddress={status?.houseAddress || config.houseAddress}
        houseBalance={status?.houseBalance || 0}
        totalHouseCut={status?.totalHouseCutCollected || 0}
        totalPaidOut={status?.totalPaidOut || 0}
        slots={status?.activeMiners || []}
        recentPayouts={status?.recentPayouts || []}
        onCashoutRig={handleLeaveRig}
      />

      <AdminConsoleModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        config={config}
        nodeStatus={status?.nodeStatus || 'emulated'}
        onSaveConfig={handleSaveConfig}
        onTestRpc={handleTestRpc}
        onExecRpc={handleExecRpc}
      />

      <PayoutSlipModal
        record={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
}
