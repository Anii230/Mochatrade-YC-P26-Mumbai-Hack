export type MarginEngineState = 'ARMED' | 'TRIMMING' | 'COOLDOWN' | 'DISARMED';

export interface Position {
  id: string;
  market: string;
  side: 'LONG' | 'SHORT';
  leverage: number;
  sizeUsd: number;
  sizeInr: number;
  contracts: number;
  entryPrice: number;
  markPrice: number;
  liqPrice: number;
  marginHealth: number; // in percent, e.g. 135.2
  pnlUsd: number;
  pnlInr: number;
  roePercent: number;
  initialMarginUsd: number;
  maintenanceMarginUsd: number;
  isolated: boolean;
}

export interface MarginGuardConfig {
  isEnabled: boolean;
  threshold: number; // e.g. 115 (%)
  trimSlice: number; // e.g. 25 (%)
  engineState: MarginEngineState;
  cooldownSeconds: number;
  keyType: 'SCOPED_SESSION_KEY';
  l1Chain: 'Hyperliquid L1';
  executionPermissions: 'reduceOnly_strict';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: 'DEFENSE_TRIM_EXECUTED' | 'RISK_THRESHOLD_BREACH' | 'ARMED' | 'DISARMED' | 'RESET_POSITION' | 'CONFIG_UPDATED' | 'MARKET_SWITCHED';
  title: string;
  details: string;
  markPrice: number;
  healthBefore: number;
  healthAfter: number;
  notionalTrimmed?: number;
  newLiqPrice?: number;
  txHash: string;
  executionVenue: string;
  gasCost: string;
  mode?: 'simulated' | 'live-testnet';
  explorerUrl?: string;
}

export interface MarketTicker {
  symbol: string;
  name: string;
  markPrice: number;
  indexPrice: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24hUsd: number;
  fundingRate: number; // e.g. 0.0001 = 0.01%
  is24_7: boolean;
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
}

export interface RecentTrade {
  id: string;
  time: string;
  price: number;
  size: number;
  side: 'BUY' | 'SELL';
}

/**
 * A single entry in the US Stock Perps market catalogue.
 * `seed` holds the demo position baseline used to bootstrap the terminal.
 */
export interface StockMarket {
  symbol: string; // e.g. 'NVDA-PERP'
  baseSymbol: string; // e.g. 'NVDA'
  name: string; // e.g. 'NVIDIA Corp'
  logoText: string; // e.g. 'NV'
  seed: {
    entry: number;
    mark: number;
    liq: number;
    health: number; // margin health in percent
  };
  indexPrice: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24hUsd: number;
  fundingRate: number; // e.g. 0.0001 = 0.01%
}
