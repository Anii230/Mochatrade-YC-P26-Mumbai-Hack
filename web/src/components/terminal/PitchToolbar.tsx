'use client';

import React from 'react';
import {
  Zap,
  RotateCcw,
  Play,
  Pause,
  TrendingDown
} from 'lucide-react';
import { MarginEngineState } from '@/engine/types';

interface PitchToolbarProps {
  onSimulateDip: () => void;
  onReset: () => void;
  engineState: MarginEngineState;
  isSimulatingLiveTicks: boolean;
  onToggleLiveTicks: () => void;
}

export const PitchToolbar: React.FC<PitchToolbarProps> = ({
  onSimulateDip,
  onReset,
  engineState,
  isSimulatingLiveTicks,
  onToggleLiveTicks,
}) => {
  return (
    <div className="w-full bg-zinc-950/95 backdrop-blur-md border border-zinc-800 rounded-xl p-3 shadow-2xl font-mono text-xs text-zinc-300 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Left: Interactive Demo Context */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <Zap className="w-5 h-5 fill-emerald-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm font-sans tracking-tight">
              Interactive Pitch & Demo Controls
            </span>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700/60 font-mono">
              Live State Machine
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 font-sans hidden sm:block">
            Demonstrate how Mochatrade defends Indian retail traders from overnight US gap-down liquidations while they sleep.
          </div>
        </div>
      </div>

      {/* Center / Right: The Interactive Pitch Buttons */}
      <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto justify-end">
        {/* Toggle Live Ticking */}
        <button
          onClick={onToggleLiveTicks}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
            isSimulatingLiveTicks
              ? 'bg-zinc-900 border-zinc-750 text-zinc-300 hover:bg-zinc-850'
              : 'bg-zinc-850 border-zinc-700 text-zinc-400'
          }`}
          title="Toggle live Brownian motion market ticks"
        >
          {isSimulatingLiveTicks ? (
            <>
              <Pause className="w-3.5 h-3.5 text-amber-400" />
              <span>Pause Ticks</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span>Resume Ticks</span>
            </>
          )}
        </button>

        {/* PRIMARY ACTION: Simulate -4% Overnight Dip */}
        <button
          onClick={onSimulateDip}
          disabled={engineState === 'TRIMMING'}
          className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <TrendingDown className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
          <div className="text-left font-sans">
            <div className="leading-tight font-extrabold flex items-center gap-1">
              <span>⚡ Simulate -4% Overnight Dip</span>
              <span className="text-[10px] bg-rose-950/80 px-1 py-0.2 rounded font-mono">
                ($115.10)
              </span>
            </div>
            <div className="text-[10px] text-rose-200 font-normal font-mono">
              Triggers Health 114% → Autonomous 25% Trim
            </div>
          </div>
        </button>

        {/* SECONDARY ACTION: Reset Position */}
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-750 font-bold text-xs transition-all shadow-md active:scale-98 cursor-pointer font-sans"
        >
          <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
          <span>🔄 Reset Position</span>
        </button>
      </div>
    </div>
  );
};
