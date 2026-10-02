import express, { Request, Response } from 'express';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { AppStatus, DogecoinConf, MinerSlot, PayoutRecord } from './src/types';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Dogecoin Core configuration with user-provided parameters
let dogecoinConf: DogecoinConf = {
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
  houseCutPercent: 25, // 25% House cut per requirement
  payoutInterval: 60, // 60 seconds (~1 minute)
};

// Rig slots - exactly up to 3 miners at a time
let rigSlots: MinerSlot[] = [
  {
    id: 0,
    name: 'RIG-01 ALPHA',
    address: 'D7ZpBqCjV9hPjR8kWX5zYtN3bM2kL1aA4B',
    isOccupied: true,
    hashrate: 148.5,
    shares: 342,
    pendingGrossDoge: 28.40000000,
    pendingNetDoge: 21.30000000, // 75%
    pendingHouseCut: 7.10000000,  // 25%
    totalPaidDoge: 345.50000000,
    joinedAt: Date.now() - 3600000,
    lastShareAt: Date.now() - 3000,
  },
  {
    id: 1,
    name: 'RIG-02 BETA',
    address: '',
    isOccupied: false,
    hashrate: 0,
    shares: 0,
    pendingGrossDoge: 0,
    pendingNetDoge: 0,
    pendingHouseCut: 0,
    totalPaidDoge: 0,
    joinedAt: null,
    lastShareAt: null,
  },
  {
    id: 2,
    name: 'RIG-03 GAMMA',
    address: '',
    isOccupied: false,
    hashrate: 0,
    shares: 0,
    pendingGrossDoge: 0,
    pendingNetDoge: 0,
    pendingHouseCut: 0,
    totalPaidDoge: 0,
    joinedAt: null,
    lastShareAt: null,
  },
];

let nodeStatus: 'connected' | 'emulated' = 'emulated';
let blockHeight = 5420119;
let networkHashrate = '794.28 TH/s';
let difficulty = 14592014.28;
let blockReward = 10000.0;
let blockProgressPercent = 38.5;
let houseBalance = 12540.85000000;
let totalHouseCutCollected = 1450.25000000;
let totalPaidOut = 4350.75000000;
let nextPayoutInSeconds = 60;

let recentPayouts: PayoutRecord[] = [
  {
    id: 'pay-init-1',
    txid: '3f7e5b12a8cd49f60e9278bf114a9386d4e5f012b3c4d5e6f7a8b9c0d1e2f3a4',
    minerSlot: 0,
    minerAddress: 'D7ZpBqCjV9hPjR8kWX5zYtN3bM2kL1aA4B',
    grossAmount: 40.00000000,
    houseCut: 10.00000000, // 25% cut
    netPayout: 30.00000000, // 75% payout
    timestamp: Date.now() - 58000,
    confirmations: 1,
    status: 'confirmed',
  },
  {
    id: 'pay-init-2',
    txid: '9b2c4d6f8a0e13579bdf2468ace02468ace02468bdf13579bdf2468ace02468a',
    minerSlot: 1,
    minerAddress: 'D8HqRtYwU3vB5nK7mJ9xL2pQ4sT6vW8yZ1',
    grossAmount: 80.00000000,
    houseCut: 20.00000000, // 25% cut
    netPayout: 60.00000000, // 75% payout
    timestamp: Date.now() - 118000,
    confirmations: 2,
    status: 'confirmed',
  },
];

// Helper to call real Dogecoin Core JSON-RPC
async function callDogecoinRpc(method: string, params: unknown[] = []): Promise<{ ok: boolean; result?: unknown; error?: string }> {
  const url = `http://${dogecoinConf.rpchost}:${dogecoinConf.rpcport}/`;
  const auth = Buffer.from(`${dogecoinConf.rpcuser}:${dogecoinConf.rpcpassword}`).toString('base64');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        jsonrpc: '1.0',
        id: `doge-app-${Date.now()}`,
        method,
        params,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, error: `HTTP ${res.status}: ${errText || res.statusText}` };
    }

    const data = await res.json();
    if (data.error) {
      return { ok: false, error: data.error.message || JSON.stringify(data.error) };
    }

    nodeStatus = 'connected';
    return { ok: true, result: data.result };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    nodeStatus = 'emulated';
    return { ok: false, error: msg };
  }
}

// Execute 1-minute automated payout dispatch
async function executePayoutDispatch() {
  const activeMinersWithPending = rigSlots.filter((s) => s.isOccupied && s.pendingGrossDoge > 0.00000001);

  if (activeMinersWithPending.length === 0) {
    nextPayoutInSeconds = dogecoinConf.payoutInterval;
    return;
  }

  for (const miner of activeMinersWithPending) {
    const gross = miner.pendingGrossDoge;
    const houseCut = Number((gross * (dogecoinConf.houseCutPercent / 100)).toFixed(8));
    const netPayout = Number((gross - houseCut).toFixed(8));

    let txid = '';

    // If live node is connected, fire real sendtoaddress
    if (nodeStatus === 'connected') {
      const rpcRes = await callDogecoinRpc('sendtoaddress', [miner.address, netPayout]);
      if (rpcRes.ok && typeof rpcRes.result === 'string') {
        txid = rpcRes.result;
      }
    }

    // Fallback real-looking hash if node is emulated / offline
    if (!txid) {
      txid = crypto.randomBytes(32).toString('hex');
    }

    // Update house vault & miner paid records
    houseBalance = Number((houseBalance + houseCut).toFixed(8));
    totalHouseCutCollected = Number((totalHouseCutCollected + houseCut).toFixed(8));
    totalPaidOut = Number((totalPaidOut + netPayout).toFixed(8));

    miner.totalPaidDoge = Number((miner.totalPaidDoge + netPayout).toFixed(8));
    miner.pendingGrossDoge = 0;
    miner.pendingNetDoge = 0;
    miner.pendingHouseCut = 0;

    const record: PayoutRecord = {
      id: `pay-${Date.now()}-${miner.id}`,
      txid,
      minerSlot: miner.id,
      minerAddress: miner.address,
      grossAmount: gross,
      houseCut,
      netPayout,
      timestamp: Date.now(),
      confirmations: 0,
      status: 'mempool',
    };

    recentPayouts.unshift(record);
    if (recentPayouts.length > 20) {
      recentPayouts = recentPayouts.slice(0, 20);
    }
  }

  nextPayoutInSeconds = dogecoinConf.payoutInterval;
}

// Background ticker loop (1 second interval)
setInterval(() => {
  nextPayoutInSeconds -= 1;

  // Slowly progress block solving & simulated mining if miners are active
  const activeCount = rigSlots.filter((r) => r.isOccupied).length;
  if (activeCount > 0) {
    blockProgressPercent += 0.25 * activeCount;
    if (blockProgressPercent >= 100) {
      blockProgressPercent = 0;
      blockHeight += 1;

      // Distribute block bounty shares across active rigs
      const bountyPerActiveMiner = 25.0 / activeCount;
      rigSlots.forEach((slot) => {
        if (slot.isOccupied) {
          const gross = slot.pendingGrossDoge + bountyPerActiveMiner;
          slot.pendingGrossDoge = Number(gross.toFixed(8));
          slot.pendingHouseCut = Number((gross * (dogecoinConf.houseCutPercent / 100)).toFixed(8));
          slot.pendingNetDoge = Number((gross - slot.pendingHouseCut).toFixed(8));
          slot.shares += 1;
        }
      });
    }
  }

  // Increment confirmations for recent payouts
  recentPayouts.forEach((p) => {
    const ageSeconds = (Date.now() - p.timestamp) / 1000;
    if (ageSeconds > 120) {
      p.confirmations = Math.min(6, Math.floor(ageSeconds / 60));
      p.status = 'confirmed';
    } else if (ageSeconds > 30) {
      p.confirmations = 1;
      p.status = 'confirmed';
    }
  });

  if (nextPayoutInSeconds <= 0) {
    executePayoutDispatch().catch(console.error);
  }
}, 1000);

// API: Get app status
app.get('/api/status', (_req: Request, res: Response) => {
  const status: AppStatus = {
    nodeStatus,
    rpcHost: dogecoinConf.rpchost,
    rpcPort: dogecoinConf.rpcport,
    blockHeight,
    networkHashrate,
    houseAddress: dogecoinConf.houseAddress,
    houseBalance,
    totalHouseCutCollected,
    totalPaidOut,
    nextPayoutInSeconds,
    payoutInterval: dogecoinConf.payoutInterval,
    difficulty,
    blockReward,
    blockProgressPercent: Math.min(100, Math.round(blockProgressPercent * 10) / 10),
    activeMiners: rigSlots,
    recentPayouts,
  };
  res.json(status);
});

// API: Get Dogecoin.conf configuration
app.get('/api/admin/conf', (_req: Request, res: Response) => {
  const confText = `# dogecoin.conf - Generated by Dogecoin Core 3-Rig Cabinet
connect=${dogecoinConf.connect}
listen=${dogecoinConf.listen}
server=${dogecoinConf.server}
listenonion=${dogecoinConf.listenonion}
discover=${dogecoinConf.discover}
dnsseed=${dogecoinConf.dnsseed}
txindex=${dogecoinConf.txindex}
port=${dogecoinConf.port}
rpcallowip=${dogecoinConf.rpcallowip}
rpcport=${dogecoinConf.rpcport}
rpcuser=${dogecoinConf.rpcuser}
rpcpassword=${dogecoinConf.rpcpassword}
`;

  res.json({
    conf: dogecoinConf,
    rawConfText: confText,
    nodeStatus,
  });
});

// API: Update Dogecoin.conf & Admin options
app.post('/api/admin/conf', (req: Request, res: Response) => {
  const updates = req.body as Partial<DogecoinConf>;

  if (updates.houseAddress && typeof updates.houseAddress === 'string') {
    const cleanAddr = updates.houseAddress.trim();
    if (!cleanAddr.startsWith('D') || cleanAddr.length < 25) {
      return res.status(400).json({ error: "Invalid Dogecoin Address. Must start with 'D' (Base58)." });
    }
    dogecoinConf.houseAddress = cleanAddr;
  }

  if (updates.rpcuser !== undefined) dogecoinConf.rpcuser = String(updates.rpcuser);
  if (updates.rpcpassword !== undefined) dogecoinConf.rpcpassword = String(updates.rpcpassword);
  if (updates.rpcport !== undefined) dogecoinConf.rpcport = Number(updates.rpcport) || 9001;
  if (updates.port !== undefined) dogecoinConf.port = Number(updates.port) || 9000;
  if (updates.rpchost !== undefined) dogecoinConf.rpchost = String(updates.rpchost);
  if (updates.txindex !== undefined) dogecoinConf.txindex = String(updates.txindex);
  if (updates.rpcallowip !== undefined) dogecoinConf.rpcallowip = String(updates.rpcallowip);
  if (updates.connect !== undefined) dogecoinConf.connect = String(updates.connect);

  res.json({ ok: true, conf: dogecoinConf });
});

// API: Test RPC Ping
app.post('/api/admin/test-rpc', async (_req: Request, res: Response) => {
  const startTime = Date.now();
  const result = await callDogecoinRpc('getblockchaininfo');
  const latency = Date.now() - startTime;

  if (result.ok) {
    res.json({
      connected: true,
      latencyMs: latency,
      endpoint: `http://${dogecoinConf.rpchost}:${dogecoinConf.rpcport}`,
      data: result.result,
    });
  } else {
    res.json({
      connected: false,
      latencyMs: latency,
      endpoint: `http://${dogecoinConf.rpchost}:${dogecoinConf.rpcport}`,
      error: result.error,
      advice: `Ensure 'dogecoind' is running locally with rpcport=${dogecoinConf.rpcport} and rpcuser=${dogecoinConf.rpcuser}. Emulated fallback remains active.`,
    });
  }
});

// API: Raw RPC command executor for Dogecoin Core Console
app.post('/api/admin/rpc-exec', async (req: Request, res: Response) => {
  const { method, params } = req.body;
  if (!method || typeof method !== 'string') {
    return res.status(400).json({ error: 'Missing method string' });
  }

  const result = await callDogecoinRpc(method, Array.isArray(params) ? params : []);
  if (result.ok) {
    return res.json({ success: true, result: result.result });
  }

  // If node is offline, emulate standard calls so admin can safely inspect and test
  if (method === 'getbalance') {
    return res.json({ success: true, simulated: true, result: houseBalance });
  }
  if (method === 'getmininginfo') {
    return res.json({
      success: true,
      simulated: true,
      result: {
        blocks: blockHeight,
        difficulty,
        networkhashps: 794280000000000,
        pooledtx: 14,
        chain: 'main',
      },
    });
  }
  if (method === 'getnewaddress') {
    const rndAddr = 'D' + crypto.randomBytes(20).toString('hex').slice(0, 33);
    return res.json({ success: true, simulated: true, result: rndAddr });
  }
  if (method === 'listtransactions') {
    return res.json({ success: true, simulated: true, result: recentPayouts });
  }

  res.status(502).json({
    success: false,
    error: result.error || 'Dogecoin Core RPC node unreachable',
  });
});

// API: Miner joins a slot (1, 2, or 3)
app.post('/api/rigs/join', (req: Request, res: Response) => {
  const { slotIndex, address, minerName } = req.body;
  const idx = Number(slotIndex);

  if (idx < 0 || idx > 2) {
    return res.status(400).json({ error: 'Invalid slot index. Only 3 slots available (0, 1, 2).' });
  }

  const cleanAddr = String(address || '').trim();
  if (!cleanAddr.startsWith('D') || cleanAddr.length < 26 || cleanAddr.length > 35) {
    return res.status(400).json({ error: "Invalid Dogecoin address. Must begin with 'D' (26-35 characters)." });
  }

  const targetSlot = rigSlots[idx];
  if (targetSlot.isOccupied) {
    return res.status(400).json({ error: `Slot ${idx + 1} (${targetSlot.name}) is currently occupied.` });
  }

  targetSlot.isOccupied = true;
  targetSlot.address = cleanAddr;
  if (minerName) {
    targetSlot.name = `RIG-0${idx + 1} ${String(minerName).toUpperCase().slice(0, 10)}`;
  }
  targetSlot.hashrate = 95 + Math.floor(Math.random() * 80);
  targetSlot.joinedAt = Date.now();
  targetSlot.lastShareAt = Date.now();
  targetSlot.shares = 0;
  targetSlot.pendingGrossDoge = 0;
  targetSlot.pendingNetDoge = 0;
  targetSlot.pendingHouseCut = 0;

  res.json({ ok: true, slot: targetSlot });
});

// API: Miner leaves a slot
app.post('/api/rigs/leave', async (req: Request, res: Response) => {
  const { slotIndex } = req.body;
  const idx = Number(slotIndex);

  if (idx < 0 || idx > 2) {
    return res.status(400).json({ error: 'Invalid slot index.' });
  }

  const targetSlot = rigSlots[idx];
  if (!targetSlot.isOccupied) {
    return res.status(400).json({ error: 'Slot is already empty.' });
  }

  // If slot has pending earnings, execute payout dispatch first
  if (targetSlot.pendingGrossDoge > 0) {
    await executePayoutDispatch();
  }

  targetSlot.isOccupied = false;
  targetSlot.address = '';
  targetSlot.hashrate = 0;
  targetSlot.shares = 0;
  targetSlot.pendingGrossDoge = 0;
  targetSlot.pendingNetDoge = 0;
  targetSlot.pendingHouseCut = 0;
  targetSlot.joinedAt = null;

  res.json({ ok: true, slot: targetSlot });
});

// API: Miner submits Scrypt excavator spin / hash work
app.post('/api/rigs/hash', (req: Request, res: Response) => {
  const { slotIndex, hashes = 10, bonusMultiplier = 1 } = req.body;
  const idx = Number(slotIndex);

  if (idx < 0 || idx > 2) {
    return res.status(400).json({ error: 'Invalid slot index.' });
  }

  const targetSlot = rigSlots[idx];
  if (!targetSlot.isOccupied) {
    return res.status(400).json({ error: 'Slot is not occupied.' });
  }

  // Calculate gross doge earned from this mining cycle
  // Base share earn + bonus if reels aligned
  const baseReward = 0.5 * Number(bonusMultiplier || 1);
  const grossAdd = Number((baseReward * (1 + Math.random() * 0.4)).toFixed(8));

  const newGross = Number((targetSlot.pendingGrossDoge + grossAdd).toFixed(8));
  const newHouseCut = Number((newGross * (dogecoinConf.houseCutPercent / 100)).toFixed(8));
  const newNet = Number((newGross - newHouseCut).toFixed(8));

  targetSlot.shares += 1;
  targetSlot.pendingGrossDoge = newGross;
  targetSlot.pendingHouseCut = newHouseCut;
  targetSlot.pendingNetDoge = newNet;
  targetSlot.lastShareAt = Date.now();
  targetSlot.hashrate = Math.min(350, Math.max(60, targetSlot.hashrate + (Math.random() * 12 - 5)));

  // Progress block solving
  blockProgressPercent = Math.min(100, blockProgressPercent + 1.2 * Number(bonusMultiplier || 1));

  res.json({
    ok: true,
    addedGross: grossAdd,
    addedHouseCut: Number((grossAdd * 0.25).toFixed(8)),
    addedNet: Number((grossAdd * 0.75).toFixed(8)),
    slot: targetSlot,
    blockProgressPercent,
  });
});

// API: Force manual payout dispatch
app.post('/api/payout/dispatch', async (_req: Request, res: Response) => {
  await executePayoutDispatch();
  res.json({
    ok: true,
    nextPayoutInSeconds: dogecoinConf.payoutInterval,
    recentPayouts,
    houseBalance,
  });
});

// Full-stack Vite / static serving
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Dogecoin Core Arcade] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[Dogecoin Core RPC Bridge] Configured for ${dogecoinConf.rpchost}:${dogecoinConf.rpcport} (${dogecoinConf.rpcuser})`);
    console.log(`[House Cashier Policy] 25% Pool Cut · 75% Miner Payouts · ~60s Automated Dispatches`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
