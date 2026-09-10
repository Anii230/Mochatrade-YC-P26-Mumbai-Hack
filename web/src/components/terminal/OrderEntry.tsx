'use client';

import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Zap, Info } from 'lucide-react';

interface OrderEntryProps {
  markPrice: number;
  availableUsd: number;
  availableInr: number;
}

export const OrderEntry: React.FC<OrderEntryProps> = ({ markPrice, availableUsd, availableInr }) => {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP'>('MARKET');
  const [leverage, setLeverage] = useState<number>(20);
  const [sizeUsd, setSizeUsd] = useState<string>('500'); // default $500 margin = $10,000 notional at 20x
  const [orderPlacedMsg, setOrderPlacedMsg] = useState<string | null>(null);

  const parsedMargin = parseFloat(sizeUsd) || 0;
  const notionalUsd = parsedMargin * leverage;
  const notionalInr = notionalUsd * 83.00;
  const contracts = markPrice > 0 ? notionalUsd / markPrice : 0;

  // Approximate liquidation price preview
  // For Long: Liq = Entry * (1 - (1/Leverage) + MaintenanceMarginRate)
  // For 20x: 1 - 0.05 + 0.025 = 0.975 -> 120.40 * 0.95 = ~114.38
  const estimatedLiq =
    side === 'BUY'
      ? markPrice * (1 - 1 / leverage + 0.025)
      : markPrice * (1 + 1 / leverage - 0.025);

  const handlePercentageClick = (pct: number) => {
    const val = (availableUsd * pct) / 100;
    setSizeUsd(val.toFixed(0));
  };

  const handlePlaceOrder = () => {
    setOrderPlacedMsg(`Simulated ${leverage}x ${side === 'BUY' ? 'Long' : 'Short'} order submitted to Hyperliquid L1!`);
    setTimeout(() => setOrderPlacedMsg(null), 3000);
  };

  return (
    <div className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex flex-col gap-3 font-mono text-xs">
      {/* Side Switcher (Buy / Long vs Sell / Short) */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-900 rounded-lg border border-zinc-850">
        <button
          onClick={() => setSide('BUY')}
          className={`py-2 rounded-md font-bold text-xs uppercase tracking-wide transition-all ${
            side === 'BUY'
              ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Buy / Long
        </button>
        <button
          onClick={() => setSide('SELL')}
          className={`py-2 rounded-md font-bold text-xs uppercase tracking-wide transition-all ${
            side === 'SELL'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Sell / Short
        </button>
      </div>

      {/* Order Type Selector */}
      <div className="flex items-center justify-between border-b border-zinc-850 pb-2 text-[11px]">
        <span className="text-zinc-400 font-sans">Type:</span>
        <div className="flex gap-2">
          {(['MARKET', 'LIMIT', 'STOP'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setOrderType(t)}
              className={`px-2 py-0.5 rounded transition-colors ${
                orderType === t
                  ? 'bg-zinc-800 text-white font-bold'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Leverage Slider & Quick Snaps */}
      <div className="space-y-1.5 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-850">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400 font-sans">Leverage:</span>
          <span className="font-bold text-emerald-400 text-sm">{leverage}x</span>
        </div>

        <input
          type="range"
          min="1"
          max="20"
          step="1"
          value={leverage}
          onChange={(e) => setLeverage(parseInt(e.target.value))}
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
        />

        <div className="flex justify-between gap-1 pt-1">
          {[1, 5, 10, 15, 20].map((lev) => (
            <button
              key={lev}
              onClick={() => setLeverage(lev)}
              className={`flex-1 py-0.5 text-[10px] rounded border transition-colors ${
                leverage === lev
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 font-bold'
                  : 'bg-zinc-850 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {lev}x
            </button>
          ))}
        </div>
      </div>

      {/* Order Size Input */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] text-zinc-400 font-sans">
          <span>Margin Input:</span>
          <span>
            Avail: <strong className="text-zinc-200">${availableUsd.toFixed(2)}</strong> (₹{availableInr.toLocaleString()})
          </span>
        </div>

        <div className="relative">
          <input
            type="number"
            value={sizeUsd}
            onChange={(e) => setSizeUsd(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-md py-2 pl-7 pr-16 text-sm font-bold text-white outline-none"
            placeholder="0.00"
          />
          <span className="absolute left-2.5 top-2.5 text-zinc-500 text-sm">$</span>
          <span className="absolute right-3 top-2.5 text-zinc-400 text-xs font-semibold">USD</span>
        </div>

        {/* INR & Contracts conversion readout */}
        <div className="flex justify-between text-[10px] text-zinc-400 px-1 font-sans">
          <span>₹{(parsedMargin * 83).toLocaleString()} INR Margin</span>
          <span>≈ {contracts.toFixed(3)} NVDA</span>
        </div>

        {/* Percentage Snaps */}
        <div className="grid grid-cols-4 gap-1 pt-1">
          {[25, 50, 75, 100].map((pct) => (
            <button
              key={pct}
              onClick={() => handlePercentageClick(pct)}
              className="py-1 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 rounded border border-zinc-800 text-[10px] transition-colors"
            >
              {pct}%
            </button>
          ))}
        </div>
      </div>

      {/* Execution Summary Panel */}
      <div className="space-y-1.5 p-2 rounded bg-zinc-900/90 border border-zinc-850 text-[11px]">
        <div className="flex justify-between">
          <span className="text-zinc-400">Total Notional Position:</span>
          <span className="font-bold text-zinc-100">${notionalUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Notional (INR):</span>
          <span className="font-bold text-emerald-400">₹{notionalInr.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Est. Liquidation Price:</span>
          <span className="font-bold text-rose-400">${estimatedLiq.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-800">
          <span>Fee (0.02% Maker): ${(notionalUsd * 0.0002).toFixed(2)}</span>
          <span>Slippage: &lt; 0.01%</span>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={handlePlaceOrder}
        className={`w-full py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${
          side === 'BUY'
            ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20'
            : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
        }`}
      >
        <Zap className="w-4 h-4 fill-current" />
        <span>
          Open {leverage}x {side === 'BUY' ? 'Long' : 'Short'} NVDA
        </span>
      </button>

      {/* Feedback message */}
      {orderPlacedMsg && (
        <div className="p-2 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-[11px] text-center font-sans">
          {orderPlacedMsg}
        </div>
      )}

      {/* L1 Execution Note */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-400 pt-1">
        <ShieldCheck className="w-3 h-3 text-emerald-400" />
        <span>Sub-second Hyperliquid L1 execution</span>
      </div>
    </div>
  );
};
