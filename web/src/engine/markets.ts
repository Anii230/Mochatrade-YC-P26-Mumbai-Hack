import {
  StockMarket,
  Position,
  MarketTicker,
  CandleData,
  OrderBookLevel,
  RecentTrade,
} from './types';

export const USD_INR_RATE = 83.00;

export const DEFAULT_SYMBOL = 'NVDA-PERP';

/**
 * US Stock Perps (24/7) catalogue — demo seed data.
 * NVDA seed intentionally matches the original engine constants so existing
 * invariants (contracts, PnL, ROE) remain stable.
 */
export const STOCK_MARKETS: StockMarket[] = [
  {
    symbol: 'NVDA-PERP',
    baseSymbol: 'NVDA',
    name: 'NVIDIA Corp',
    logoText: 'NV',
    seed: { entry: 120.00, mark: 120.40, liq: 114.20, health: 137.4 },
    indexPrice: 120.38,
    change24h: 3.20,
    high24h: 123.40,
    low24h: 116.20,
    volume24hUsd: 482_190_450,
    fundingRate: 0.0001,
  },
  {
    symbol: 'TSLA-PERP',
    baseSymbol: 'TSLA',
    name: 'Tesla Motors',
    logoText: 'TS',
    seed: { entry: 218.00, mark: 218.60, liq: 207.60, health: 137.0 },
    indexPrice: 218.55,
    change24h: -1.8,
    high24h: 224.10,
    low24h: 213.90,
    volume24hUsd: 193_850_000,
    fundingRate: -0.00003,
  },
  {
    symbol: 'AAPL-PERP',
    baseSymbol: 'AAPL',
    name: 'Apple Inc',
    logoText: 'AP',
    seed: { entry: 224.00, mark: 224.15, liq: 213.10, health: 135.5 },
    indexPrice: 224.12,
    change24h: 0.7,
    high24h: 225.80,
    low24h: 219.20,
    volume24hUsd: 312_410_000,
    fundingRate: 0.00004,
  },
  {
    symbol: 'AMZN-PERP',
    baseSymbol: 'AMZN',
    name: 'Amazon.com Inc',
    logoText: 'AM',
    seed: { entry: 187.00, mark: 187.35, liq: 178.10, health: 136.4 },
    indexPrice: 187.32,
    change24h: 1.2,
    high24h: 190.10,
    low24h: 182.40,
    volume24hUsd: 264_780_000,
    fundingRate: 0.00005,
  },
  {
    symbol: 'MSFT-PERP',
    baseSymbol: 'MSFT',
    name: 'Microsoft Corp',
    logoText: 'MS',
    seed: { entry: 402.00, mark: 402.50, liq: 382.60, health: 135.9 },
    indexPrice: 402.45,
    change24h: 0.5,
    high24h: 406.20,
    low24h: 395.10,
    volume24hUsd: 218_350_000,
    fundingRate: 0.00003,
  },
  {
    symbol: 'META-PERP',
    baseSymbol: 'META',
    name: 'Meta Platforms',
    logoText: 'ME',
    seed: { entry: 512.00, mark: 512.80, liq: 487.40, health: 136.1 },
    indexPrice: 512.75,
    change24h: 2.3,
    high24h: 518.40,
    low24h: 501.20,
    volume24hUsd: 276_120_000,
    fundingRate: 0.00008,
  },
  {
    symbol: 'GOOGL-PERP',
    baseSymbol: 'GOOGL',
    name: 'Alphabet Inc',
    logoText: 'GO',
    seed: { entry: 176.00, mark: 176.45, liq: 167.70, health: 136.9 },
    indexPrice: 176.42,
    change24h: 0.9,
    high24h: 178.30,
    low24h: 172.60,
    volume24hUsd: 198_540_000,
    fundingRate: 0.00002,
  },
  {
    symbol: 'COIN-PERP',
    baseSymbol: 'COIN',
    name: 'Coinbase Global',
    logoText: 'CO',
    seed: { entry: 245.00, mark: 246.20, liq: 233.90, health: 138.8 },
    indexPrice: 246.14,
    change24h: -2.4,
    high24h: 254.30,
    low24h: 240.80,
    volume24hUsd: 428_910_000,
    fundingRate: -0.00012,
  },
  {
    symbol: 'AMD-PERP',
    baseSymbol: 'AMD',
    name: 'Advanced Micro Devices',
    logoText: 'AD',
    seed: { entry: 148.00, mark: 148.30, liq: 140.90, health: 136.5 },
    indexPrice: 148.27,
    change24h: 1.6,
    high24h: 150.80,
    low24h: 143.20,
    volume24hUsd: 356_240_000,
    fundingRate: 0.00007,
  },
  {
    symbol: 'SPY-PERP',
    baseSymbol: 'SPY',
    name: 'S&P 500 ETF',
    logoText: 'SP',
    seed: { entry: 532.00, mark: 532.40, liq: 506.10, health: 135.5 },
    indexPrice: 532.35,
    change24h: 0.4,
    high24h: 536.10,
    low24h: 526.30,
    volume24hUsd: 187_630_000,
    fundingRate: 0.00002,
  },
];

// ---------------------------------------------------------------------------
// Deterministic PRNG so generated market data is stable per symbol
// ---------------------------------------------------------------------------

function hashSeed(symbol: string): number {
  let h = 2166136261;
  for (let i = 0; i < symbol.length; i++) {
    h ^= symbol.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export function getMarket(symbol: string): StockMarket {
  const match = STOCK_MARKETS.find(
    (m) => m.symbol === symbol || m.baseSymbol === symbol.toUpperCase()
  );
  if (!match) throw new Error(`Unknown market: ${symbol}`);
  return match;
}

// ---------------------------------------------------------------------------
// Deterministic market data generators
// ---------------------------------------------------------------------------

export function generateCandles(symbol: string, closePrice: number, count = 46): CandleData[] {
  const rand = mulberry32(hashSeed(`${symbol}-candles`));
  const now = Date.now();
  const data: CandleData[] = [];
  let price = closePrice * 0.978; // lead-in below target, matching demo history
  const step = closePrice * 0.0038;
  const wick = closePrice * 0.0029;
  for (let i = count - 1; i >= 0; i--) {
    const time = now - i * 60 * 1000;
    const change = (rand() - 0.46) * step;
    const open = price;
    const close = i === 0 ? closePrice : Math.max(closePrice * 0.96, open + change);
    const high = Math.max(open, close) + rand() * wick;
    const low = Math.min(open, close) - rand() * wick;
    const volume = Math.floor(2500 + rand() * 8000);
    data.push({ time, open, high, low, close, volume });
    price = close;
  }
  return data;
}

export function generateOrderBook(
  symbol: string,
  price: number,
  levels = 5
): { asks: OrderBookLevel[]; bids: OrderBookLevel[] } {
  const rand = mulberry32(hashSeed(`${symbol}-book`));
  const step = Math.max(0.005, price * 0.0001);
  const asks: OrderBookLevel[] = [];
  const bids: OrderBookLevel[] = [];
  let askTotal = 0;
  let bidTotal = 0;
  for (let i = 0; i < levels; i++) {
    const askSize = Math.round(200 + rand() * 1600);
    askTotal += askSize;
    asks.push({
      price: Number((price + step * (i + 1)).toFixed(2)),
      size: askSize,
      total: askTotal,
    });
    const bidSize = Math.round(200 + rand() * 1600);
    bidTotal += bidSize;
    bids.push({
      price: Number((price - step * (i + 1)).toFixed(2)),
      size: bidSize,
      total: bidTotal,
    });
  }
  return { asks, bids };
}

export function generateRecentTrades(symbol: string, price: number, count = 4): RecentTrade[] {
  const rand = mulberry32(hashSeed(`${symbol}-trades`));
  const trades: RecentTrade[] = [];
  for (let i = 0; i < count; i++) {
    trades.push({
      id: `tr-${symbol.toLowerCase().replace('-perp', '')}-${i + 1}`,
      time: new Date(Date.now() - i * 4000).toLocaleTimeString('en-IN'),
      price: Number((price + (rand() - 0.5) * price * 0.0006).toFixed(2)),
      size: Number((10 + rand() * 70).toFixed(1)),
      side: rand() > 0.5 ? 'BUY' : 'SELL',
    });
  }
  return trades;
}

/**
 * Margin health percentage, computed exactly like the engine's live-tick formula
 * (see `useTerminalEngine.ts`): max(105, 100 + ((mark - liq) / (entry - liq || 1)) * 35),
 * rounded to 1 decimal BEFORE the clamp so seeds never drift from the first tick.
 */
export function computeMarginHealth(entry: number, mark: number, liq: number): number {
  const refDist = entry - liq || 1;
  return Math.max(105, Number((100 + ((mark - liq) / refDist) * 35).toFixed(1)));
}

export function buildPosition(market: StockMarket, overrides: Partial<Position> = {}): Position {
  const leverage = 20;
  const sizeUsd = 10000;
  const { entry, mark, liq } = market.seed;
  const contracts = sizeUsd / entry;
  const pnlUsd = (mark - entry) * contracts;
  return {
    id: `pos-${market.baseSymbol.toLowerCase()}-01`,
    market: market.symbol,
    side: 'LONG',
    leverage,
    sizeUsd,
    sizeInr: sizeUsd * USD_INR_RATE,
    contracts,
    entryPrice: entry,
    markPrice: mark,
    liqPrice: liq,
    marginHealth: computeMarginHealth(entry, mark, liq),
    pnlUsd: Number(pnlUsd.toFixed(2)),
    pnlInr: Number((pnlUsd * USD_INR_RATE).toFixed(2)),
    roePercent: Number((((mark - entry) / entry) * leverage * 100).toFixed(2)),
    initialMarginUsd: 500.00,
    maintenanceMarginUsd: 250.00,
    isolated: true,
    ...overrides,
  };
}

/** Build a fully coherent market snapshot (ticker, position, candles, book, trades). */
export function buildMarketState(symbol: string) {
  const market = getMarket(symbol);
  const ticker: MarketTicker = {
    symbol: market.symbol,
    name: market.name,
    markPrice: market.seed.mark,
    indexPrice: market.indexPrice,
    change24h: market.change24h,
    high24h: market.high24h,
    low24h: market.low24h,
    volume24hUsd: market.volume24hUsd,
    fundingRate: market.fundingRate,
    is24_7: true,
  };
  return {
    ticker,
    position: buildPosition(market),
    candles: generateCandles(symbol, market.seed.mark),
    orderBook: generateOrderBook(symbol, market.seed.mark),
    recentTrades: generateRecentTrades(symbol, market.seed.mark),
  };
}