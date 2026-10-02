export interface MinerSlot {
  id: number; // 0, 1, 2
  name: string; // "RIG-01 ALPHA", etc.
  address: string;
  isOccupied: boolean;
  hashrate: number; // MH/s
  shares: number;
  pendingGrossDoge: number;
  pendingNetDoge: number; // 75%
  pendingHouseCut: number; // 25%
  totalPaidDoge: number;
  joinedAt: number | null;
  lastShareAt: number | null;
}

export interface PayoutRecord {
  id: string;
  txid: string;
  minerSlot: number;
  minerAddress: string;
  grossAmount: number;
  houseCut: number; // 25%
  netPayout: number; // 75%
  timestamp: number;
  confirmations: number;
  status: 'confirmed' | 'pending' | 'mempool';
}

export interface AppStatus {
  nodeStatus: 'connected' | 'emulated';
  rpcHost: string;
  rpcPort: number;
  blockHeight: number;
  networkHashrate: string;
  houseAddress: string;
  houseBalance: number;
  totalHouseCutCollected: number;
  totalPaidOut: number;
  nextPayoutInSeconds: number;
  payoutInterval: number;
  difficulty: number;
  blockReward: number;
  blockProgressPercent: number;
  activeMiners: MinerSlot[];
  recentPayouts: PayoutRecord[];
}

export interface DogecoinConf {
  connect: string;
  listen: string;
  server: string;
  listenonion: string;
  discover: string;
  dnsseed: string;
  txindex: string;
  port: number;
  rpcallowip: string;
  rpcport: number;
  rpcuser: string;
  rpcpassword: string;
  rpchost: string;
  houseAddress: string;
  houseCutPercent: number;
  payoutInterval: number;
}
