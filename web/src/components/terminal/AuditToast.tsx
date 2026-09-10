'use client';

import React, { useEffect, useState } from 'react';
import { NotificationToast } from '@/engine/useTerminalEngine';
import {
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  X,
  ExternalLink,
  ArrowRight,
  Zap,
  CheckCircle2,
  AlertOctagon
} from 'lucide-react';

interface AuditToastProps {
  toast: NotificationToast | null;
  onClose: () => void;
}

export const AuditToast: React.FC<AuditToastProps> = ({ toast, onClose }) => {
  const [progress, setProgress] = useState<number>(100);

  useEffect(() => {
    if (!toast) return;

    setProgress(100);
    const duration = 12000;
    const startTime = Date.now();

    const intervalTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
    }, 100);

    const dismissTimeout = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearInterval(intervalTimer);
      clearTimeout(dismissTimeout);
    };
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'DEFENSE_SUCCESS';
  const isWarning = toast.type === 'MARGIN_WARNING';

  return (
    <div className="fixed bottom-24 right-6 max-w-md w-full z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 font-mono">
      <div
        className={`rounded-xl border p-4 shadow-2xl backdrop-blur-xl relative overflow-hidden ${
          isSuccess
            ? 'bg-zinc-950/95 border-emerald-500/60 shadow-emerald-500/20'
            : isWarning
            ? 'bg-zinc-950/95 border-rose-500/80 shadow-rose-500/20'
            : 'bg-zinc-950/95 border-zinc-700 shadow-zinc-900/50'
        }`}
      >
        {/* Progress Bar at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800">
          <div
            className={`h-full transition-all duration-100 ${
              isSuccess ? 'bg-emerald-400' : isWarning ? 'bg-rose-500' : 'bg-blue-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              isSuccess
                ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-400'
                : isWarning
                ? 'bg-rose-950 border border-rose-500/50 text-rose-400'
                : 'bg-blue-950 border border-blue-500/50 text-blue-400'
            }`}
          >
            {isSuccess ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            ) : isWarning ? (
              <AlertOctagon className="w-5 h-5 text-rose-400" />
            ) : (
              <RotateCcw className="w-5 h-5 text-blue-400" />
            )}
          </div>

          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
                Audit HUD
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">{toast.timestamp}</span>
            </div>
            <h4 className="font-sans font-bold text-sm text-white mt-0.5 leading-tight">
              {toast.title}
            </h4>
          </div>
        </div>

        {/* Body message */}
        <p className="text-zinc-300 text-xs font-sans mt-2.5 leading-relaxed">
          {toast.message}
        </p>

        {/* Defense Audit Metrics */}
        {toast.details && (
          <div className="mt-3 p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800/80 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Trigger Mark Price:</span>
              <span className="text-rose-400 font-bold">${toast.details.markPrice.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Margin Health:</span>
              <div className="flex items-center gap-1.5 font-bold">
                <span className="text-rose-400">{toast.details.healthBefore.toFixed(1)}%</span>
                <ArrowRight className="w-3 h-3 text-zinc-500" />
                <span className="text-emerald-400">{toast.details.healthAfter.toFixed(1)}%</span>
              </div>
            </div>

            {toast.details.liqBefore && toast.details.liqAfter && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Liquidation Price Defended:</span>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-rose-400">${toast.details.liqBefore.toFixed(2)}</span>
                  <ArrowRight className="w-3 h-3 text-zinc-500" />
                  <span className="text-emerald-300">${toast.details.liqAfter.toFixed(2)}</span>
                </div>
              </div>
            )}

            {toast.details.trimmedAmount && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Trimmed via reduceOnly:</span>
                <span className="text-amber-400 font-bold">{toast.details.trimmedAmount}</span>
              </div>
            )}

            {toast.details.txHash && (
              <div className="flex items-center justify-between pt-1 border-t border-zinc-800 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500">L1 Action Signature:</span>
                  {toast.details.mode === 'live-testnet' && (
                    <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/50 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      L1 Testnet Verified
                    </span>
                  )}
                </div>
                <a
                  href={toast.details.explorerUrl || `https://testnet.hyperliquid.xyz/explorer/tx/${toast.details.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline font-mono flex items-center gap-1 transition-colors"
                >
                  <span>
                    {toast.details.txHash.length > 18
                      ? `${toast.details.txHash.slice(0, 10)}...${toast.details.txHash.slice(-6)}`
                      : toast.details.txHash}
                  </span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-2.5 text-[10px] text-zinc-400 font-sans flex items-center justify-between">
          <span className="text-emerald-400/90 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Zero-custody execution on Hyperliquid L1
          </span>
          <span className="text-zinc-500">Mochatrade YC P26</span>
        </div>
      </div>
    </div>
  );
};
