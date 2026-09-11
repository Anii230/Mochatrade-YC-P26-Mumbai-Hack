'use client';

import React, { useState } from 'react';
import { Position, AuditLog, OrderBookLevel, RecentTrade, StockMarket } from '@/engine/types';
import {
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  History,
  BookOpen,
  LayoutGrid,
  Search,
  Zap
} from 'lucide-react';

interface PositionsTableProps {
  position: Position;
  auditLogs: AuditLog[];
  orderBook: { asks: OrderBookLevel[]; bids: OrderBookLevel[] };
  recentTrades: RecentTrade[];
  stockMarkets: StockMarket[];
  selectedSymbol: string;
  onSelectTicker: (symbol: string) => void;
}

export const PositionsTable: React.FC<PositionsTableProps> = ({
  position,
  auditLogs,
  orderBook,
  recentTrades,
  stockMarkets,
  selectedSymbol,
  onSelectTicker,
}) => {
  const [activeTab, setActiveTab] = useState<'POSITIONS' | 'AUDIT_LOGS' | 'ORDER_BOOK' | 'MARKETS'>('POSITIONS');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMarkets = stockMarkets.filter((m) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      m.symbol.toLowerCase().includes(q) ||
      m.baseSymbol.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q)
    );
  });

  // Margin Health color styling
  // Green > 120%, Yellow 110-120%, Red < 110%
  const getHealthColor = (health: number) => {
    if (health > 120) {
      return {
        text: 'text-emerald-400',
        bg: 'bg-emerald-500',
        glow: 'shadow-emerald-500/30',
        badge: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
        label: 'HEALTHY',
      };
    } else if (health >= 110) {
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-500',
        glow: 'shadow-amber-500/30',
        badge: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
        label: 'WARNING',
      };
    } else {
      return {
        text: 'text-rose-400',
        bg: 'bg-rose-500',
        glow: 'shadow-rose-500/30',
        badge: 'bg-rose-950/70 border-rose-500/40 text-rose-300',
        label: 'CRITICAL RISK',
      };
    }
  };

  const healthStyle = getHealthColor(position.marginHealth);
  // Calculate percentage of bar width (clamped between 0 and 100, normalized for 100% to 150%)
  const normalizedProgress = Math.min(
    100,
    Math.max(10, ((position.marginHealth - 95) / 55) * 100)
  );

  return (
    <div className="w-full bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden flex flex-col font-mono text-zinc-300">
      {/* Tab Navigation */}
      <div className="h-10 px-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs select-none">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('POSITIONS')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'POSITIONS'
                ? 'bg-zinc-800 text-white border-b-2 border-emerald-400'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Open Positions</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
              1
            </span>
          </button>

          <button
            onClick={() => setActiveTab('AUDIT_LOGS')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'AUDIT_LOGS'
                ? 'bg-zinc-800 text-white border-b-2 border-blue-400'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <History className="w-3.5 h-3.5 text-blue-400" />
            <span>MarginGuard Defense Logs</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-950 text-blue-400 border border-blue-800">
              {auditLogs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ORDER_BOOK')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'ORDER_BOOK'
                ? 'bg-zinc-800 text-white border-b-2 border-zinc-400'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
            <span>Order Book & Trades</span>
          </button>

          <button
            onClick={() => setActiveTab('MARKETS')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'MARKETS'
                ? 'bg-zinc-800 text-white border-b-2 border-emerald-400'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-emerald-400" />
            <span>US Stock Perps (24/7)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
              {stockMarkets.length}
            </span>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-3 text-[11px] text-zinc-400">
          <span>Maintenance Margin: <strong className="text-zinc-200">${position.maintenanceMarginUsd.toFixed(2)}</strong></span>
          <span>•</span>
          <span>Settlement: <strong className="text-emerald-400">Instant UPI (INR)</strong></span>
        </div>
      </div>

      {/* TAB 1: POSITIONS */}
      {activeTab === 'POSITIONS' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-850 bg-zinc-900/50 text-[11px] text-zinc-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Market</th>
                <th className="py-2.5 px-3">Size (USD / INR)</th>
                <th className="py-2.5 px-3">Entry Price</th>
                <th className="py-2.5 px-3">Mark Price</th>
                <th className="py-2.5 px-3">Liq Price</th>
                <th className="py-2.5 px-3">Unrealized PnL (ROE)</th>
                <th className="py-2.5 px-3 w-56">Margin Health</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850 font-mono">
              <tr className="hover:bg-zinc-900/40 transition-colors">
                {/* Market */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-white flex items-center gap-1">
                      <span>{position.market}</span>
                    </div>
                    <span className="text-[10px] bg-emerald-950/80 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-700/60 font-semibold">
                      {position.leverage}x Long
                    </span>
                    <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1 rounded">
                      Isolated
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5 font-sans">
                    NVIDIA Perpetual • 24/7 Hyperliquid L1
                  </div>
                </td>

                {/* Size */}
                <td className="py-3 px-3">
                  <div className="font-bold text-white">
                    ${position.sizeUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    ₹{position.sizeInr.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    {position.contracts.toFixed(4)} NVDA
                  </div>
                </td>

                {/* Entry */}
                <td className="py-3 px-3 font-semibold text-zinc-200">
                  ${position.entryPrice.toFixed(2)}
                </td>

                {/* Mark Price */}
                <td className="py-3 px-3">
                  <div className="font-bold text-zinc-100 flex items-center gap-1">
                    ${position.markPrice.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    Spread: $0.02
                  </div>
                </td>

                {/* Liq Price */}
                <td className="py-3 px-3">
                  <div className="font-bold text-rose-400 flex items-center gap-1">
                    <span>${position.liqPrice.toFixed(2)}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Buffer: ${(position.markPrice - position.liqPrice).toFixed(2)} (
                    {(((position.markPrice - position.liqPrice) / position.markPrice) * 100).toFixed(1)}%)
                  </div>
                </td>

                {/* PnL */}
                <td className="py-3 px-3">
                  <div
                    className={`font-bold flex items-center gap-1 text-sm ${
                      position.pnlUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {position.pnlUsd >= 0 ? (
                      <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-rose-400" />
                    )}
                    <span>
                      {position.pnlUsd >= 0 ? '+' : ''}${position.pnlUsd.toFixed(2)}
                    </span>
                    <span className="text-xs font-semibold">
                      ({position.roePercent >= 0 ? '+' : ''}{position.roePercent.toFixed(2)}%)
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {position.pnlInr >= 0 ? '+' : ''}₹{position.pnlInr.toLocaleString(undefined, { maximumFractionDigits: 0 })} INR
                  </div>
                </td>

                {/* Margin Health Ratio & Progress Bar */}
                <td className="py-3 px-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-zinc-400 font-sans">Health Ratio:</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold ${healthStyle.text}`}>
                        {position.marginHealth.toFixed(1)}%
                      </span>
                      <span className={`text-[9px] px-1 py-0.2 rounded border font-semibold ${healthStyle.badge}`}>
                        {healthStyle.label}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar with Trigger Marker */}
                  <div className="relative w-full h-2 bg-zinc-850 rounded-full overflow-hidden border border-zinc-750">
                    {/* Fill */}
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${healthStyle.bg}`}
                      style={{ width: `${normalizedProgress}%` }}
                    />
                  </div>

                  {/* Threshold Indicators under bar */}
                  <div className="flex justify-between text-[9px] text-zinc-500 mt-1">
                    <span className="text-rose-500 font-bold">100% Liq</span>
                    <span className="text-amber-400 font-bold flex items-center gap-0.5">
                      <span className="w-1 h-1 bg-amber-400 rounded-full"></span>
                      115% Shield Trigger
                    </span>
                    <span className="text-emerald-400 font-semibold">&gt;120% Safe</span>
                  </div>
                </td>

                {/* Actions */}
                <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                  <button
                    disabled
                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-sans font-semibold transition-colors disabled:opacity-60 cursor-not-allowed"
                  >
                    TP / SL
                  </button>
                  <button
                    disabled
                    className="px-2.5 py-1 rounded bg-rose-950/50 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60 text-xs font-sans font-semibold transition-colors disabled:opacity-60 cursor-not-allowed"
                  >
                    Market Close
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: MARGINGUARD AUDIT LOGS */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="p-3">
          <div className="text-xs text-zinc-400 mb-2 flex items-center justify-between">
            <span className="font-sans flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Autonomous On-Chain Audit Trail (Hyperliquid L1 Scoped Session Key)
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              EIP-712 Signature Validated • reduceOnly: true
            </span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        log.action === 'DEFENSE_TRIM_EXECUTED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/60 animate-pulse'
                          : log.action === 'RESET_POSITION'
                          ? 'bg-blue-950 text-blue-300 border border-blue-600/60'
                          : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                      }`}
                    >
                      {log.action}
                    </span>
                    <span className="font-bold text-zinc-100">{log.title}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400">{log.timestamp}</span>
                </div>

                <p className="text-zinc-300 text-[11px] leading-relaxed font-sans">
                  {log.details}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-zinc-800/80 text-[10px] text-zinc-400">
                  <span>Mark: <strong className="text-zinc-200">${log.markPrice.toFixed(2)}</strong></span>
                  <span>Health: <strong className="text-rose-400">{log.healthBefore.toFixed(1)}%</strong> → <strong className="text-emerald-400">{log.healthAfter.toFixed(1)}%</strong></span>
                  {log.newLiqPrice && (
                    <span>New Liq: <strong className="text-emerald-300">${log.newLiqPrice.toFixed(2)}</strong></span>
                  )}
                  <span className="flex items-center gap-1">
                    <span>Tx:</span>
                    <a
                      href={log.explorerUrl || `https://testnet.hyperliquid.xyz/explorer/tx/${log.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline font-mono flex items-center gap-0.5 transition-colors"
                    >
                      <span>{log.txHash.length > 18 ? `${log.txHash.slice(0, 10)}...${log.txHash.slice(-6)}` : log.txHash}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    {log.mode === 'live-testnet' && (
                      <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1 py-0.2 rounded border border-emerald-500/50 font-bold ml-1">
                        L1 Testnet Verified
                      </span>
                    )}
                  </span>
                  <span>Gas: <strong className="text-zinc-300">{log.gasCost}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ORDER BOOK & RECENT TRADES */}
      {activeTab === 'ORDER_BOOK' && (
        <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* L2 Order Book */}
          <div className="bg-zinc-900 p-2 rounded border border-zinc-800">
            <div className="text-[10px] uppercase font-bold text-zinc-400 mb-1.5 flex justify-between">
              <span>Price (USD)</span>
              <span>Size (NVDA)</span>
              <span>Total</span>
            </div>
            {/* Asks */}
            <div className="space-y-1 mb-1.5">
              {orderBook.asks.map((ask, i) => (
                <div key={i} className="flex justify-between text-rose-400 font-mono text-[11px]">
                  <span>${ask.price.toFixed(2)}</span>
                  <span className="text-zinc-300">{ask.size}</span>
                  <span className="text-zinc-500">{ask.total}</span>
                </div>
              ))}
            </div>
            {/* Spread */}
            <div className="py-1 border-y border-zinc-800 text-center text-[10px] text-zinc-400 font-semibold bg-zinc-950/50">
              Spread: $0.02 (0.016%)
            </div>
            {/* Bids */}
            <div className="space-y-1 mt-1.5">
              {orderBook.bids.map((bid, i) => (
                <div key={i} className="flex justify-between text-emerald-400 font-mono text-[11px]">
                  <span>${bid.price.toFixed(2)}</span>
                  <span className="text-zinc-300">{bid.size}</span>
                  <span className="text-zinc-500">{bid.total}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Trades Tape */}
          <div className="bg-zinc-900 p-2 rounded border border-zinc-800">
            <div className="text-[10px] uppercase font-bold text-zinc-400 mb-1.5 flex justify-between">
              <span>Time</span>
              <span>Price</span>
              <span>Size (NVDA)</span>
            </div>
            <div className="space-y-1.5 font-mono text-[11px]">
              {recentTrades.map((t) => (
                <div key={t.id} className="flex justify-between items-center">
                  <span className="text-zinc-500 text-[10px]">{t.time}</span>
                  <span className={t.side === 'BUY' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    ${t.price.toFixed(2)}
                  </span>
                  <span className="text-zinc-300">{t.size.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    {/* TAB 4: US STOCK PERPS MARKET BOARD */}
      {activeTab === 'MARKETS' && (
        <div className="p-3">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="text-xs text-zinc-400 flex items-center gap-1.5 font-sans">
              <LayoutGrid className="w-4 h-4 text-emerald-400" />
              <span>US Equity Perpetuals — 24/7 INR Margined</span>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symbol or name…"
                className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 pl-7 text-[11px] font-mono text-zinc-200 placeholder-zinc-500 outline-none focus:border-emerald-500 w-44 sm:w-56"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto pr-1 space-y-1">
            {filteredMarkets.map((m) => (
              <div
                key={m.symbol}
                className={`p-2 rounded border flex items-center justify-between gap-2 transition-colors ${
                  selectedSymbol === m.symbol
                    ? 'bg-emerald-950/30 border-emerald-600/50'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded bg-emerald-950/70 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-[10px] shrink-0">
                    {m.logoText}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-zinc-100 flex items-center gap-1.5">
                      <span>{m.symbol}</span>
                      {selectedSymbol === m.symbol && (
                        <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1 py-0.2 rounded border border-emerald-500/40 font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-sans truncate">{m.name}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="font-mono font-bold text-zinc-100">
                      ${m.seed.mark.toFixed(2)}
                    </div>
                    <div
                      className={`text-[10px] font-mono font-semibold ${
                        m.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {m.change24h >= 0 ? '+' : ''}{m.change24h}%
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-zinc-500 font-mono hidden sm:block">
                    <div>5h Fund</div>
                    <div className={m.fundingRate >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                      {(m.fundingRate * 100).toFixed(4)}%
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onSelectTicker(m.symbol);
                      setActiveTab('POSITIONS');
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                      selectedSymbol === m.symbol
                        ? 'bg-zinc-800 text-emerald-300 border border-emerald-700/60'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-zinc-950 shadow shadow-emerald-500/20'
                    }`}
                  >
                    <Zap className="w-3 h-3" />
                    <span>Trade</span>
                  </button>
                </div>
              </div>
            ))}

            {filteredMarkets.length === 0 && (
              <div className="py-8 text-center text-xs text-zinc-500 font-sans">
                No markets match “{searchQuery}”.
              </div>
            )}
          </div>

          <div className="mt-2 text-[10px] text-zinc-500 font-mono flex items-center justify-between">
            <span>Tap <strong className="text-emerald-400">Trade</strong> to rebase the terminal on that market.</span>
            <span>Hyperliquid L1 • 24/7 • Zero Gas</span>
          </div>
        </div>
      )}
    </div>
  );
};
