'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Position,
  MarginGuardConfig,
  AuditLog,
  MarketTicker,
  CandleData,
  OrderBookLevel,
  RecentTrade
} from './types';

const INITIAL_ENTRY = 120.00;
const INITIAL_MARK = 120.40;
const INITIAL_LIQ = 114.20;
const INITIAL_SIZE_USD = 10000;
const USD_INR_RATE = 83.00;

export interface NotificationToast {
  id: string;
  type: 'DEFENSE_SUCCESS' | 'MARGIN_WARNING' | 'RESET' | 'INFO';
  title: string;
  message: string;
  details?: {
    markPrice: number;
    healthBefore: number;
    healthAfter: number;
    liqBefore?: number;
    liqAfter?: number;
    trimmedAmount?: string;
    txHash?: string;
    mode?: 'simulated' | 'live-testnet';
    explorerUrl?: string;
  };
  timestamp: string;
}

export function useTerminalEngine() {
  // 1. Ticker state
  const [ticker, setTicker] = useState<MarketTicker>({
    symbol: 'NVDA-PERP',
    name: 'NVIDIA Perpetual',
    markPrice: INITIAL_MARK,
    indexPrice: 120.38,
    change24h: 3.20,
    high24h: 123.40,
    low24h: 116.20,
    volume24hUsd: 482190450,
    fundingRate: 0.0001, // 0.0100% / 1h
    is24_7: true,
  });

  const [priceFlash, setPriceFlash] = useState<'UP' | 'DOWN' | null>(null);

  // 2. Position state
  const [position, setPosition] = useState<Position>({
    id: 'pos-nvda-01',
    market: 'NVDA-PERP',
    side: 'LONG',
    leverage: 20,
    sizeUsd: INITIAL_SIZE_USD,
    sizeInr: INITIAL_SIZE_USD * USD_INR_RATE,
    contracts: INITIAL_SIZE_USD / INITIAL_ENTRY, // 83.3333
    entryPrice: INITIAL_ENTRY,
    markPrice: INITIAL_MARK,
    liqPrice: INITIAL_LIQ,
    marginHealth: 135.2,
    pnlUsd: (INITIAL_MARK - INITIAL_ENTRY) * (INITIAL_SIZE_USD / INITIAL_ENTRY), // +$33.33
    pnlInr: (INITIAL_MARK - INITIAL_ENTRY) * (INITIAL_SIZE_USD / INITIAL_ENTRY) * USD_INR_RATE,
    roePercent: ((INITIAL_MARK - INITIAL_ENTRY) / INITIAL_ENTRY) * 20 * 100, // +6.67%
    initialMarginUsd: 500.00,
    maintenanceMarginUsd: 250.00,
    isolated: true,
  });

  // 3. MarginGuard configuration & state machine
  const [guardConfig, setGuardConfig] = useState<MarginGuardConfig>({
    isEnabled: true,
    threshold: 115, // 115% Health
    trimSlice: 25, // 25% Notional
    engineState: 'ARMED',
    cooldownSeconds: 0,
    keyType: 'SCOPED_SESSION_KEY',
    l1Chain: 'Hyperliquid L1',
    executionPermissions: 'reduceOnly_strict',
  });

  // 4. Audit history logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: 'log-init',
      timestamp: '02:00:15 IST',
      action: 'ARMED',
      title: 'MarginGuard L1 Defense Engine Armed',
      details: 'Autonomous protection active at 115% health threshold. Scoped key: 0x7c49...f89a (reduceOnly strict).',
      markPrice: INITIAL_MARK,
      healthBefore: 135.2,
      healthAfter: 135.2,
      txHash: '0x3a91...e42b',
      executionVenue: 'Hyperliquid L1',
      gasCost: '0.00 USDC',
    },
  ]);

  // 5. Active toasts / alerts
  const [activeToast, setActiveToast] = useState<NotificationToast | null>(null);

  // 6. Live ticking controller
  const [isSimulatingLiveTicks, setIsSimulatingLiveTicks] = useState<boolean>(true);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 7. Candlestick series state
  const [candles, setCandles] = useState<CandleData[]>(() => {
    // Generate 45 realistic historical 1m candles leading up to $120.40
    const now = Date.now();
    const data: CandleData[] = [];
    let price = 117.80;
    for (let i = 45; i >= 0; i--) {
      const time = now - i * 60 * 1000;
      const change = (Math.random() - 0.46) * 0.45;
      const open = price;
      const close = i === 0 ? INITIAL_MARK : Math.max(116.5, open + change);
      const high = Math.max(open, close) + Math.random() * 0.35;
      const low = Math.min(open, close) - Math.random() * 0.35;
      const volume = Math.floor(2500 + Math.random() * 8000);
      data.push({ time, open, high, low, close, volume });
      price = close;
    }
    return data;
  });

  // 8. Order book & recent trades
  const [orderBook, setOrderBook] = useState<{ asks: OrderBookLevel[]; bids: OrderBookLevel[] }>({
    asks: [
      { price: 120.45, size: 450, total: 450 },
      { price: 120.44, size: 820, total: 1270 },
      { price: 120.43, size: 1250, total: 2520 },
      { price: 120.42, size: 680, total: 3200 },
      { price: 120.41, size: 940, total: 4140 },
    ],
    bids: [
      { price: 120.39, size: 1100, total: 1100 },
      { price: 120.38, size: 750, total: 1850 },
      { price: 120.37, size: 1540, total: 3390 },
      { price: 120.36, size: 920, total: 4310 },
      { price: 120.35, size: 1800, total: 6110 },
    ],
  });

  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([
    { id: 'tr-1', time: '02:14:58', price: 120.40, size: 25.4, side: 'BUY' },
    { id: 'tr-2', time: '02:14:55', price: 120.39, size: 12.0, side: 'SELL' },
    { id: 'tr-3', time: '02:14:52', price: 120.40, size: 83.3, side: 'BUY' },
    { id: 'tr-4', time: '02:14:48', price: 120.38, size: 45.1, side: 'SELL' },
  ]);

  // Wallet balances
  const wallet = {
    totalInr: 50000,
    totalUsd: 602.41,
    freeInr: 8500,
    freeUsd: 102.41,
    usedInr: 41500,
    usedUsd: 500.00,
    upiId: 'ani@okhdfcbank',
    verifiedFiu: true,
  };

  // Cooldown countdown timer effect
  useEffect(() => {
    if (guardConfig.engineState === 'COOLDOWN' && guardConfig.cooldownSeconds > 0) {
      cooldownTimerRef.current = setInterval(() => {
        setGuardConfig((prev) => {
          if (prev.cooldownSeconds <= 1) {
            clearInterval(cooldownTimerRef.current as NodeJS.Timeout);
            return {
              ...prev,
              engineState: prev.isEnabled ? 'ARMED' : 'DISARMED',
              cooldownSeconds: 0,
            };
          }
          return {
            ...prev,
            cooldownSeconds: prev.cooldownSeconds - 1,
          };
        });
      }, 1000);
    }

    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, [guardConfig.engineState, guardConfig.cooldownSeconds]);

  // Real-time subtle Brownian micro-ticking when enabled
  useEffect(() => {
    if (!isSimulatingLiveTicks || guardConfig.engineState === 'TRIMMING') return;

    const interval = setInterval(() => {
      // Small jitter ±0.03
      const delta = (Math.random() - 0.49) * 0.06;
      setTicker((prev) => {
        const nextPrice = Number((prev.markPrice + delta).toFixed(2));
        setPriceFlash(delta >= 0 ? 'UP' : 'DOWN');
        setTimeout(() => setPriceFlash(null), 400);

        // Update position dynamically
        setPosition((currentPos) => {
          const pnlUsd = (nextPrice - currentPos.entryPrice) * currentPos.contracts;
          const pnlInr = pnlUsd * USD_INR_RATE;
          const roePercent = ((nextPrice - currentPos.entryPrice) / currentPos.entryPrice) * currentPos.leverage * 100;

          // Maintenance margin distance calculation
          let health = currentPos.marginHealth;
          // Smoothly correlate health with price movement if not in trimmed state
          const priceDistFromLiq = nextPrice - currentPos.liqPrice;
          const refDist = INITIAL_ENTRY - INITIAL_LIQ; // 5.80
          health = Number((100 + (priceDistFromLiq / refDist) * 35).toFixed(1));

          return {
            ...currentPos,
            markPrice: nextPrice,
            pnlUsd: Number(pnlUsd.toFixed(2)),
            pnlInr: Number(pnlInr.toFixed(2)),
            roePercent: Number(roePercent.toFixed(2)),
            marginHealth: Math.max(105, health),
          };
        });

        // Update last candle
        setCandles((prevCandles) => {
          if (prevCandles.length === 0) return prevCandles;
          const lastIndex = prevCandles.length - 1;
          const lastCandle = prevCandles[lastIndex];
          const updated = {
            ...lastCandle,
            close: nextPrice,
            high: Math.max(lastCandle.high, nextPrice),
            low: Math.min(lastCandle.low, nextPrice),
            volume: lastCandle.volume + Math.floor(Math.random() * 20),
          };
          const copy = [...prevCandles];
          copy[lastIndex] = updated;
          return copy;
        });

        return {
          ...prev,
          markPrice: nextPrice,
          high24h: Math.max(prev.high24h, nextPrice),
          low24h: Math.min(prev.low24h, nextPrice),
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isSimulatingLiveTicks, guardConfig.engineState]);

  // Action: Toggle MarginGuard Enabled
  const toggleMarginGuard = useCallback(() => {
    setGuardConfig((prev) => {
      const nextEnabled = !prev.isEnabled;
      const nextState = nextEnabled ? 'ARMED' : 'DISARMED';

      const newLog: AuditLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('en-IN') + ' IST',
        action: nextEnabled ? 'ARMED' : 'DISARMED',
        title: nextEnabled ? 'MarginGuard Defense Shield Activated' : 'MarginGuard Defense Shield Deactivated',
        details: nextEnabled
          ? `Engine re-armed with scoped session key. Liquidation trigger threshold set to ${prev.threshold}%.`
          : 'User disarmed autonomous defense. Position exposed to naked liquidation cascade risks.',
        markPrice: ticker.markPrice,
        healthBefore: position.marginHealth,
        healthAfter: position.marginHealth,
        txHash: '0x' + Math.random().toString(16).substring(2, 10) + '...',
        executionVenue: 'Hyperliquid L1',
        gasCost: '0.00 USDC',
      };

      setAuditLogs((l) => [newLog, ...l]);
      return {
        ...prev,
        isEnabled: nextEnabled,
        engineState: nextState,
      };
    });
  }, [ticker.markPrice, position.marginHealth]);

  // Action: Update Threshold
  const setThreshold = useCallback((val: number) => {
    setGuardConfig((prev) => ({ ...prev, threshold: val }));
  }, []);

  // Action: Update Trim Slice
  const setTrimSlice = useCallback((val: number) => {
    setGuardConfig((prev) => ({ ...prev, trimSlice: val }));
  }, []);

  // PRIMARY DEMO ACTION: Simulate -4% Overnight Dip
  const simulateOvernightDip = useCallback(() => {
    // 1. Temporarily pause live ticks to keep the demo state crisp
    setIsSimulatingLiveTicks(false);

    const droppedMark = 115.10;
    const droppedHealth = 114.0; // drops to 114% (< 115% threshold)

    // Update ticker
    setTicker((prev) => ({
      ...prev,
      markPrice: droppedMark,
      change24h: -1.35,
      low24h: Math.min(prev.low24h, droppedMark),
    }));
    setPriceFlash('DOWN');

    // Add red dip candle to chart
    setCandles((prevCandles) => {
      const now = Date.now();
      const last = prevCandles[prevCandles.length - 1];
      const dipCandle: CandleData = {
        time: now + 60000,
        open: last ? last.close : 120.40,
        high: 120.40,
        low: droppedMark - 0.30,
        close: droppedMark,
        volume: 38400, // Spike in volume
      };
      return [...prevCandles, dipCandle];
    });

    // Check if MarginGuard is ARMED and enabled
    if (guardConfig.isEnabled) {
      // Step A: Immediately show breach state
      setPosition((prev) => {
        const pnlUsd = (droppedMark - prev.entryPrice) * prev.contracts; // (115.10 - 120) * 83.333 = -$408.33
        return {
          ...prev,
          markPrice: droppedMark,
          marginHealth: droppedHealth,
          pnlUsd: Number(pnlUsd.toFixed(2)),
          pnlInr: Number((pnlUsd * USD_INR_RATE).toFixed(2)),
          roePercent: Number((((droppedMark - prev.entryPrice) / prev.entryPrice) * prev.leverage * 100).toFixed(2)),
        };
      });

      // Transition to TRIMMING
      setGuardConfig((prev) => ({ ...prev, engineState: 'TRIMMING' }));

      // Step B: Simulate autonomous L1 sub-second execution delay (600ms)
      setTimeout(() => {
        const slicePct = guardConfig.trimSlice; // e.g. 25%
        const trimmedNotional = (INITIAL_SIZE_USD * slicePct) / 100; // $2,500
        const newSizeUsd = INITIAL_SIZE_USD - trimmedNotional; // $7,500
        const newContracts = newSizeUsd / INITIAL_ENTRY; // 62.5
        const newLiqPrice = 108.40; // New lower liquidation level
        const restoredHealth = 126.2; // Health restored safely above trigger

        const pnlUsd = (droppedMark - INITIAL_ENTRY) * newContracts;
        const pnlInr = pnlUsd * USD_INR_RATE;
        const roePercent = ((droppedMark - INITIAL_ENTRY) / INITIAL_ENTRY) * 20 * 100;

        setPosition((prev) => ({
          ...prev,
          sizeUsd: newSizeUsd,
          sizeInr: newSizeUsd * USD_INR_RATE,
          contracts: newContracts,
          markPrice: droppedMark,
          liqPrice: newLiqPrice,
          marginHealth: restoredHealth,
          pnlUsd: Number(pnlUsd.toFixed(2)),
          pnlInr: Number(pnlInr.toFixed(2)),
          roePercent: Number(roePercent.toFixed(2)),
          initialMarginUsd: 375.00,
          maintenanceMarginUsd: 187.50,
        }));

        // Transition to COOLDOWN (60s)
        setGuardConfig((prev) => ({
          ...prev,
          engineState: 'COOLDOWN',
          cooldownSeconds: 60,
        }));

        const initialTxHash = '0x9f4a37d2e0c7b2e1f48039cfa19082da17b35ef892c5d1e4';
        const initialExplorerUrl = 'https://testnet.hyperliquid.xyz';

        // Add optimistic audit log
        const defenseLog: AuditLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-IN') + ' IST',
          action: 'DEFENSE_TRIM_EXECUTED',
          title: 'Autonomous Liquidation Defense Executed',
          details: `Margin health breached ${guardConfig.threshold}% (fell to ${droppedHealth}% at $115.10). Auto-dispatched 25% reduceOnly trim (-$${trimmedNotional.toLocaleString()} notional). Liquidation price lowered from $114.20 → $${newLiqPrice.toFixed(2)}. Health restored to ${restoredHealth}%.`,
          markPrice: droppedMark,
          healthBefore: droppedHealth,
          healthAfter: restoredHealth,
          notionalTrimmed: trimmedNotional,
          newLiqPrice: newLiqPrice,
          txHash: initialTxHash,
          executionVenue: 'Hyperliquid L1 (Scoped Session Key)',
          gasCost: '0.00 USDC (Zero Gas L1)',
          mode: 'simulated',
          explorerUrl: initialExplorerUrl,
        };

        setAuditLogs((l) => [defenseLog, ...l]);

        // Trigger Notification Toast optimistically
        setActiveToast({
          id: `toast-${Date.now()}`,
          type: 'DEFENSE_SUCCESS',
          title: 'Autonomous Liquidation Defense Triggered',
          message: `NVDA mark dropped to $115.10. MarginGuard executed a 25% reduceOnly trim order to prevent liquidation.`,
          details: {
            markPrice: droppedMark,
            healthBefore: droppedHealth,
            healthAfter: restoredHealth,
            liqBefore: INITIAL_LIQ,
            liqAfter: newLiqPrice,
            trimmedAmount: `-$${trimmedNotional.toLocaleString()} USD (₹${(trimmedNotional * USD_INR_RATE).toLocaleString()})`,
            txHash: initialTxHash,
            mode: 'simulated',
            explorerUrl: initialExplorerUrl,
          },
          timestamp: new Date().toLocaleTimeString('en-IN'),
        });

        // Asynchronously dispatch to Hyperliquid Testnet API route
        fetch('/api/simulate-trim', { method: 'POST' })
          .then((res) => res.json())
          .then((data: { success: boolean; mode?: 'simulated' | 'live-testnet'; txHash?: string; explorerUrl?: string }) => {
            if (data && data.success && data.txHash) {
              const finalHash = data.txHash;
              const finalUrl = data.explorerUrl || `https://testnet.hyperliquid.xyz/explorer/tx/${finalHash}`;
              const finalMode = data.mode || 'simulated';

              setActiveToast((currentToast) => {
                if (!currentToast || currentToast.type !== 'DEFENSE_SUCCESS') return currentToast;
                return {
                  ...currentToast,
                  details: {
                    ...currentToast.details!,
                    txHash: finalHash,
                    mode: finalMode,
                    explorerUrl: finalUrl,
                  },
                };
              });

              setAuditLogs((logs) => {
                if (logs.length === 0) return logs;
                const copy = [...logs];
                const targetIdx = copy.findIndex((l) => l.action === 'DEFENSE_TRIM_EXECUTED');
                if (targetIdx !== -1) {
                  copy[targetIdx] = {
                    ...copy[targetIdx],
                    txHash: finalHash,
                    mode: finalMode,
                    explorerUrl: finalUrl,
                    executionVenue: finalMode === 'live-testnet'
                      ? 'Hyperliquid L1 Testnet (EIP-712 Order Placed)'
                      : copy[targetIdx].executionVenue,
                  };
                }
                return copy;
              });
            }
          })
          .catch((err) => {
            console.warn('Simulate trim API call failed gracefully:', err);
          });
      }, 550);
    } else {
      // Guard is OFF: Liquidation warning!
      const pnlUsd = (droppedMark - INITIAL_ENTRY) * (INITIAL_SIZE_USD / INITIAL_ENTRY);
      setPosition((prev) => ({
        ...prev,
        markPrice: droppedMark,
        marginHealth: droppedHealth,
        pnlUsd: Number(pnlUsd.toFixed(2)),
        pnlInr: Number((pnlUsd * USD_INR_RATE).toFixed(2)),
        roePercent: Number((((droppedMark - INITIAL_ENTRY) / INITIAL_ENTRY) * 20 * 100).toFixed(2)),
      }));

      setActiveToast({
        id: `toast-${Date.now()}`,
        type: 'MARGIN_WARNING',
        title: 'CRITICAL MARGIN WARNING: Liquidation Imminent',
        message: `NVDA mark dipped to $115.10. Margin health is 114.0% with liquidation at $114.20. MarginGuard is DISARMED - no defense was executed!`,
        details: {
          markPrice: droppedMark,
          healthBefore: 135.2,
          healthAfter: droppedHealth,
          liqBefore: INITIAL_LIQ,
          liqAfter: INITIAL_LIQ,
        },
        timestamp: new Date().toLocaleTimeString('en-IN'),
      });
    }
  }, [guardConfig.isEnabled, guardConfig.threshold, guardConfig.trimSlice]);

  // Reset Position action
  const resetPosition = useCallback(() => {
    setTicker((prev) => ({
      ...prev,
      markPrice: INITIAL_MARK,
      change24h: 3.20,
    }));

    setPosition({
      id: 'pos-nvda-01',
      market: 'NVDA-PERP',
      side: 'LONG',
      leverage: 20,
      sizeUsd: INITIAL_SIZE_USD,
      sizeInr: INITIAL_SIZE_USD * USD_INR_RATE,
      contracts: INITIAL_SIZE_USD / INITIAL_ENTRY,
      entryPrice: INITIAL_ENTRY,
      markPrice: INITIAL_MARK,
      liqPrice: INITIAL_LIQ,
      marginHealth: 135.2,
      pnlUsd: (INITIAL_MARK - INITIAL_ENTRY) * (INITIAL_SIZE_USD / INITIAL_ENTRY),
      pnlInr: (INITIAL_MARK - INITIAL_ENTRY) * (INITIAL_SIZE_USD / INITIAL_ENTRY) * USD_INR_RATE,
      roePercent: ((INITIAL_MARK - INITIAL_ENTRY) / INITIAL_ENTRY) * 20 * 100,
      initialMarginUsd: 500.00,
      maintenanceMarginUsd: 250.00,
      isolated: true,
    });

    setGuardConfig((prev) => ({
      ...prev,
      engineState: prev.isEnabled ? 'ARMED' : 'DISARMED',
      cooldownSeconds: 0,
    }));

    setIsSimulatingLiveTicks(true);

    const resetLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-IN') + ' IST',
      action: 'RESET_POSITION',
      title: 'Position & Engine Reset to Baseline',
      details: 'Restored 20x Long NVDA-PERP at $120.00 entry ($10,000 notional, Liq: $114.20, Health: 135.2%). Engine ARMED.',
      markPrice: INITIAL_MARK,
      healthBefore: 114.0,
      healthAfter: 135.2,
      txHash: '0x' + Math.random().toString(16).substring(2, 10),
      executionVenue: 'Mochatrade Core Engine',
      gasCost: '0.00 USDC',
    };

    setAuditLogs((l) => [resetLog, ...l]);

    setActiveToast({
      id: `toast-${Date.now()}`,
      type: 'RESET',
      title: 'Position Restored to Baseline',
      message: 'NVDA-PERP reset to $120.00 Entry, $10,000 Notional (20x Long). MarginGuard Armed.',
      timestamp: new Date().toLocaleTimeString('en-IN'),
    });
  }, []);

  const closeToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  return {
    ticker,
    priceFlash,
    position,
    guardConfig,
    auditLogs,
    activeToast,
    candles,
    orderBook,
    recentTrades,
    wallet,
    isSimulatingLiveTicks,
    setIsSimulatingLiveTicks,
    toggleMarginGuard,
    setThreshold,
    setTrimSlice,
    simulateOvernightDip,
    resetPosition,
    closeToast,
  };
}
