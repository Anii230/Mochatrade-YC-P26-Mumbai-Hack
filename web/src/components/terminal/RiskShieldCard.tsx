'use client';

import React from 'react';
import { MarginGuardConfig, Position } from '@/engine/types';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Zap,
  Lock,
  Clock,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  KeyRound,
  CheckCircle2
} from 'lucide-react';

interface RiskShieldCardProps {
  guardConfig: MarginGuardConfig;
  position: Position;
  toggleMarginGuard: () => void;
  setThreshold: (val: number) => void;
  setTrimSlice: (val: number) => void;
}

export const RiskShieldCard: React.FC<RiskShieldCardProps> = ({
  guardConfig,
  position,
  toggleMarginGuard,
  setThreshold,
  setTrimSlice,
}) => {
  const thresholdOptions = [110, 115, 120, 125];
  const sliceOptions = [15, 25, 33, 50];

  // Helper for engine state badge
  const renderEngineStateBadge = () => {
    switch (guardConfig.engineState) {
      case 'ARMED':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-400 font-bold text-[11px] shadow-sm shadow-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span>ARMED</span>
          </div>
        );
      case 'TRIMMING':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-950/90 border border-blue-500/50 text-blue-300 font-bold text-[11px] shadow-sm shadow-blue-500/30 animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
            <span>TRIMMING (25%)</span>
          </div>
        );
      case 'COOLDOWN':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/90 border border-amber-500/50 text-amber-300 font-bold text-[11px]">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>COOLDOWN ({guardConfig.cooldownSeconds}s)</span>
          </div>
        );
      case 'DISARMED':
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 font-bold text-[11px]">
            <span className="h-2 w-2 rounded-full bg-zinc-500"></span>
            <span>DISARMED</span>
          </div>
        );
    }
  };

  const bufferToTrigger = position.marginHealth - guardConfig.threshold;

  return (
    <div className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 flex flex-col gap-3 font-mono text-xs text-zinc-300 relative overflow-hidden shadow-lg">
      {/* Background ambient glow when armed */}
      {guardConfig.engineState === 'ARMED' && (
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      )}
      {guardConfig.engineState === 'TRIMMING' && (
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      )}

      {/* Header: Title & Primary Switch */}
      <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm text-white flex items-center gap-1.5 font-sans">
              <span>MarginGuard™</span>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.2 rounded font-mono border border-emerald-500/30">
                v2.4 Pro
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 font-sans">
              Autonomous Liquidation Defense Engine
            </div>
          </div>
        </div>

        {/* Primary ON / OFF Toggle Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMarginGuard}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              guardConfig.isEnabled ? 'bg-emerald-500' : 'bg-zinc-800'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                guardConfig.isEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="text-[11px] font-bold text-white">
            {guardConfig.isEnabled ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>

      {/* Engine Status Bar */}
      <div className="flex items-center justify-between bg-zinc-900/90 p-2 rounded-lg border border-zinc-850">
        <span className="text-zinc-400 text-[11px] font-sans">Engine State:</span>
        {renderEngineStateBadge()}
      </div>

      {/* Threshold Selector: [115% Health] */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-300 font-sans flex items-center gap-1">
            <span>Trigger Threshold:</span>
            <span className="text-zinc-500 text-[10px]">(Fires defense if breached)</span>
          </span>
          <span className="font-bold text-amber-400 text-xs">
            {guardConfig.threshold}% Health
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {thresholdOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => setThreshold(opt)}
              className={`py-1.5 text-[11px] font-bold rounded border transition-colors ${
                guardConfig.threshold === opt
                  ? 'bg-amber-950/70 border-amber-500/60 text-amber-300 shadow-sm'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              {opt}%
            </button>
          ))}
        </div>
      </div>

      {/* Auto-Trim Slice: [25% Notional via reduceOnly: true] */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-300 font-sans flex items-center gap-1">
            <span>Auto-Trim Slice:</span>
            <span className="text-zinc-500 text-[10px]">(reduceOnly: true)</span>
          </span>
          <span className="font-bold text-emerald-400 text-xs">
            {guardConfig.trimSlice}% Notional
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {sliceOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => setTrimSlice(opt)}
              className={`py-1.5 text-[11px] font-bold rounded border transition-colors ${
                guardConfig.trimSlice === opt
                  ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300 shadow-sm'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              {opt}%
            </button>
          ))}
        </div>
      </div>

      {/* Security & Scoped Key Badge */}
      <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-zinc-100 font-sans font-semibold">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Non-Custodial Scoped Agent Key</span>
          </div>
          <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-800 font-bold">
            ACTIVE
          </span>
        </div>

        <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
          Cryptographically restricted on Hyperliquid L1. Key is hard-scoped strictly to{' '}
          <code className="bg-zinc-950 px-1 rounded text-emerald-300 border border-zinc-800">
            reduceOnly: true
          </code>
          . Zero withdrawal permissions. Zero collateral drain attack vector.
        </p>
      </div>

      {/* Live Defense Telemetry */}
      <div className="bg-zinc-900/60 p-2 rounded border border-zinc-850 space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span className="text-zinc-400">Current Margin Health:</span>
          <span
            className={`font-bold ${
              position.marginHealth > 120
                ? 'text-emerald-400'
                : position.marginHealth >= 110
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            {position.marginHealth.toFixed(1)}%
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-400">Safety Buffer to Trigger:</span>
          <span
            className={`font-bold ${
              bufferToTrigger > 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {bufferToTrigger > 0 ? `+${bufferToTrigger.toFixed(1)}%` : `${bufferToTrigger.toFixed(1)}%`}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-400">Protected Notional:</span>
          <span className="text-zinc-200 font-semibold">
            ${position.sizeUsd.toLocaleString()} (₹{position.sizeInr.toLocaleString()})
          </span>
        </div>

        <div className="flex justify-between text-[10px] text-zinc-500 pt-0.5 border-t border-zinc-850">
          <span>Execution Venue: Hyperliquid L1</span>
          <span>Latency: &lt;15ms</span>
        </div>
      </div>
    </div>
  );
};
