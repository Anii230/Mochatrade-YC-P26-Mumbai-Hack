'use client';

import React, { useState } from 'react';
import { MarketTicker, MarginGuardConfig } from '@/engine/types';
import {
  ShieldCheck,
  ChevronDown,
  Wallet,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Layers,
  KeyRound,
  ExternalLink
} from 'lucide-react';

interface NavbarProps {
  ticker: MarketTicker;
  priceFlash: 'UP' | 'DOWN' | null;
  wallet: {
    totalInr: number;
    totalUsd: number;
    freeInr: number;
    freeUsd: number;
    usedInr: number;
    usedUsd: number;
    upiId: string;
    verifiedFiu: boolean;
  };
  guardConfig: MarginGuardConfig;
}

export const Navbar: React.FC<NavbarProps> = ({ ticker, priceFlash, wallet, guardConfig }) => {
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showTickerMenu, setShowTickerMenu] = useState(false);

  const availableTickers = [
    { symbol: 'NVDA-PERP', name: 'Nvidia Corp', price: ticker.markPrice, change: ticker.change24h, active: true },
    { symbol: 'TSLA-PERP', name: 'Tesla Motors', price: 218.60, change: -1.8, active: false },
    { symbol: 'AAPL-PERP', name: 'Apple Inc', price: 224.15, change: +0.7, active: false },
    { symbol: 'BTC-PERP', name: 'Bitcoin Perp', price: 64250.00, change: +2.1, active: false },
  ];

  return (
    <header className="w-full bg-zinc-950 border-b border-zinc-850 select-none text-zinc-100 sticky top-0 z-40">
      {/* Top micro bar for high-density regulatory & network stats */}
      <div className="h-6 bg-zinc-900/90 border-b border-zinc-800/60 px-3 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-zinc-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-emerald-400">Hyperliquid L1 Connected</span>
            <span className="text-zinc-500">|</span>
            <span className="text-zinc-400">Block #84,912,410</span>
            <span className="text-zinc-500">|</span>
            <span className="text-zinc-400">14ms latency</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-zinc-300 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60 text-[10px]">
            <KeyRound className="w-3 h-3 text-emerald-400" />
            <span>Scoped Session Key:</span>
            <span className="text-emerald-400 font-bold">0x7c49...f89a</span>
            <span className="text-[9px] bg-emerald-950/80 text-emerald-300 px-1 py-0.2 rounded border border-emerald-700/50">
              reduceOnly Strict
            </span>
          </div>

          <div className="flex items-center gap-1 text-zinc-400">
            <span>Funding:</span>
            <span className="text-emerald-400 font-semibold">+0.0100% / 1h</span>
          </div>

          <div className="flex items-center gap-1 text-zinc-400">
            <span>24/7 Liquidity:</span>
            <span className="text-emerald-400 font-semibold">Active</span>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="h-14 px-3 flex items-center justify-between gap-4">
        {/* Left: Branding & Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 flex items-center justify-center font-bold text-zinc-950 shadow-md shadow-emerald-500/20">
              <Zap className="w-5 h-5 fill-zinc-950 stroke-zinc-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white font-sans">
                  MOCHATRADE
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold tracking-wide">
                  YC P26
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  FIU-IND Registered
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 font-mono -mt-0.5 flex items-center gap-2">
                <span>US Stock Perps for India</span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400">Instant UPI Settlement</span>
              </div>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="h-8 w-px bg-zinc-800 mx-1 hidden md:block" />

          {/* Active Ticker Selector */}
          <div className="relative">
            <button
              onClick={() => setShowTickerMenu(!showTickerMenu)}
              className="flex items-center gap-3 px-2.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 transition-colors text-left group"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-emerald-950/70 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                  NV
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-sm text-zinc-100">
                    {ticker.symbol}
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 transition-transform" />
                  </div>
                  <div className="text-[10px] text-zinc-400 font-sans">
                    NVIDIA Corp 20x
                  </div>
                </div>
              </div>

              {/* Price Display */}
              <div className="font-mono text-right pl-3 border-l border-zinc-800">
                <div
                  className={`text-sm font-bold transition-all duration-300 ${
                    priceFlash === 'UP'
                      ? 'text-emerald-300 scale-105 bg-emerald-950/50 px-1 rounded'
                      : priceFlash === 'DOWN'
                      ? 'text-rose-400 scale-105 bg-rose-950/50 px-1 rounded'
                      : 'text-zinc-100'
                  }`}
                >
                  ${ticker.markPrice.toFixed(2)}
                </div>
                <div className="text-[10px] font-semibold flex items-center justify-end gap-0.5 text-emerald-400">
                  <ArrowUpRight className="w-3 h-3" />
                  +{ticker.change24h.toFixed(2)}%
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showTickerMenu && (
              <div className="absolute left-0 mt-1 w-64 bg-zinc-900 border border-zinc-750 rounded-lg shadow-2xl py-1 z-50 font-mono">
                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-zinc-400 border-b border-zinc-800 font-sans font-semibold">
                  Select US Equity Perpetual
                </div>
                {availableTickers.map((t) => (
                  <div
                    key={t.symbol}
                    onClick={() => setShowTickerMenu(false)}
                    className={`px-3 py-2 flex items-center justify-between text-xs hover:bg-zinc-800/80 cursor-pointer ${
                      t.active ? 'bg-zinc-800/40 text-emerald-400 font-semibold' : 'text-zinc-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{t.symbol}</div>
                      <div className="text-[10px] text-zinc-400 font-sans">{t.name}</div>
                    </div>
                    <div className="text-right">
                      <div>${t.price.toFixed(2)}</div>
                      <div
                        className={`text-[10px] ${
                          t.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {t.change >= 0 ? `+${t.change}%` : `${t.change}%`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ticker Key Stats */}
          <div className="hidden lg:flex items-center gap-4 text-[11px] font-mono pl-2 text-zinc-400">
            <div>
              <span className="text-zinc-500 block text-[9px] uppercase">24h High</span>
              <span className="text-zinc-200">${ticker.high24h.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[9px] uppercase">24h Low</span>
              <span className="text-zinc-200">${ticker.low24h.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[9px] uppercase">24h Vol</span>
              <span className="text-zinc-200 font-sans">
                ${(ticker.volume24hUsd / 1_000_000).toFixed(1)}M
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[9px] uppercase">Open Interest</span>
              <span className="text-zinc-200">$42.8M</span>
            </div>
          </div>
        </div>

        {/* Right: Wallet, Margin Status & Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Simulated Wallet Card */}
          <div
            onClick={() => setShowWalletModal(!showWalletModal)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-all shadow-sm group"
          >
            <div className="w-7 h-7 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
            <div className="font-mono text-right">
              <div className="text-[10px] text-zinc-400 flex items-center justify-end gap-1.5 font-sans">
                <span>Total Collateral:</span>
                <span className="text-emerald-400 font-bold font-mono">₹50,000 INR</span>
              </div>
              <div className="text-xs font-bold text-zinc-100 flex items-center justify-end gap-1">
                <span>~$600.00 USDC</span>
                <span className="text-[10px] text-zinc-400 font-sans font-normal">(1 USD = ₹83)</span>
              </div>
            </div>
          </div>

          {/* Quick UPI On-Ramp Button */}
          <button
            onClick={() => setShowWalletModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/15 cursor-pointer font-sans"
          >
            <span>+ Deposit UPI</span>
            <span className="text-[10px] bg-emerald-800 text-emerald-100 px-1 rounded font-mono">
              0% Fee
            </span>
          </button>

          {/* Autonomous Shield Status Pill in Navbar */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-mono">
            <span className="text-zinc-400 text-[10px]">MarginGuard:</span>
            {!guardConfig.isEnabled || guardConfig.engineState === 'DISARMED' ? (
              <span className="flex items-center gap-1.5 text-zinc-400 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-500"></span>
                <span>DISARMED</span>
              </span>
            ) : guardConfig.engineState === 'COOLDOWN' ? (
              <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                <span>COOLDOWN</span>
              </span>
            ) : guardConfig.engineState === 'TRIMMING' ? (
              <span className="flex items-center gap-1.5 text-blue-400 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                <span>TRIMMING</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>ACTIVE ({guardConfig.threshold}%)</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Wallet Breakdown Popover / Modal */}
      {showWalletModal && (
        <div className="absolute right-4 top-16 w-80 bg-zinc-900 border border-zinc-750 rounded-xl shadow-2xl p-4 z-50 text-zinc-200">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-sm text-white">INR Margined Wallet</span>
            </div>
            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">
              Verified KYC
            </span>
          </div>

          <div className="py-3 space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-zinc-400">Total Account Value:</span>
              <span className="font-bold text-white">₹50,000 (~$600.00)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Free Margin (Available):</span>
              <span className="text-emerald-400 font-semibold">₹8,500 (~$100.00)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Used Position Margin:</span>
              <span className="text-zinc-300 font-semibold">₹41,500 (~$500.00)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Linked UPI ID:</span>
              <span className="text-zinc-300 text-[11px] font-sans">ani@okhdfcbank</span>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800 flex gap-2">
            <button
              onClick={() => setShowWalletModal(false)}
              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded text-xs transition-colors"
            >
              Instant UPI Top-up
            </button>
            <button
              onClick={() => setShowWalletModal(false)}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-semibold rounded text-xs transition-colors"
            >
              Withdraw
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
