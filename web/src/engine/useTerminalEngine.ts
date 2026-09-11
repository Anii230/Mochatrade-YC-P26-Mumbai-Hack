'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Position,
  MarginGuardConfig,
  AuditLog,
  MarketTicker,
  CandleData,
  OrderBookLevel,
  RecentTrade,
} from './types';
import {
  STOCK_MARKETS,
  getMarket,
  buildMarketState,
  USD_INR_RATE,
  DEFAULT_SYMBOL,
} from './markets';

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
  // Single canonical baseline snapshot (deterministic) reused across all initial state
  const initialState = buildMarketState(DEFAULT_SYMBOL);

  // 1. Ticker state
  const [ticker, setTicker] = useState<MarketTicker>(() => initialState.ticker);

  const [priceFlash, setPriceFlash] = useState<'UP' | 'DOWN' | null>(null);

  // 2. Position state
  const [position, setPosition] = useState<Position>(() => initialState.position);

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
      markPrice: 120.40,
      healthBefore: initialState.position.marginHealth,
      healthAfter: initialState.position.marginHealth,
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

  // 7. Selected market
  const [selectedSymbol, setSelectedSymbol] = useState<string>(DEFAULT_SYMBOL);

  // 8. Candlestick series state
  const [candles, setCandles] = useState<CandleData[]>(() => initialState.candles);

  // 9. Order book & recent trades
  const [orderBook, setOrderBook] = useState<{ asks: OrderBookLevel[]; bids: OrderBookLevel[] }>(
    () => initialState.orderBook
  );

  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>(
    () => initialState.recentTrades
  );

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
      setTicker((prev) => {
        // Price-scaled jitter: approx ±0.05% of mark price (~±$0.06 for NVDA)
        const delta = (Math.random() - 0.49) * prev.markPrice * 0.0005;
        const nextPrice = Number((prev.markPrice + delta).toFixed(2));
        setPriceFlash(delta >= 0 ? 'UP' : 'DOWN');
        setTimeout(() => setPriceFlash(null), 400);

        // Update position dynamically
        setPosition((currentPos) => {
          const pnlUsd = (nextPrice - currentPos.entryPrice) * currentPos.contracts;
          const pnlInr = pnlUsd * USD_INR_RATE;
          const roePercent = ((nextPrice - currentPos.entryPrice) / currentPos.entryPrice) * currentPos.leverage * 100;

          // Maintenance margin distance calculation, generalized per market
          const priceDistFromLiq = nextPrice - currentPos.liqPrice;
          const refDist = currentPos.entryPrice - currentPos.liqPrice || 1;
          const health = Number((100 + (priceDistFromLiq / refDist) * 35).toFixed(1));

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
          indexPrice: Number((nextPrice - 0.02).toFixed(2)),
          high24h: Math.max(prev.high24h, nextPrice),
          low24h: Math.min(prev.low24h, nextPrice),
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isSimulatingLiveTicks, guardConfig.engineState]);

  // Action: Switch the active market across the whole terminal
  const selectTicker = useCallback((symbol: string) => {
    let market;
    try {
      market = getMarket(symbol);
    } catch {
      return;
    }

    const state = buildMarketState(market.symbol);

    setSelectedSymbol(market.symbol);
    setTicker(state.ticker);
    setPosition(state.position);
    setCandles(state.candles);
    setOrderBook(state.orderBook);
    setRecentTrades(state.recentTrades);
    setPriceFlash(null);
    setIsSimulatingLiveTicks(true);
    setGuardConfig((prev) => ({
      ...prev,
      engineState: prev.isEnabled ? 'ARMED' : 'DISARMED',
      cooldownSeconds: 0,
    }));

    const switchLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-IN') + ' IST',
      action: 'MARKET_SWITCHED',
      title: `Switched to ${market.baseSymbol} Perpetual`,
      details: `Active market switched to ${market.symbol}. Position rebased to $${market.seed.entry.toFixed(2)} entry ($10,000 notional, Liq: $${market.seed.liq.toFixed(2)}). Engine re-armed.`,
      markPrice: state.ticker.markPrice,
      healthBefore: state.position.marginHealth,
      healthAfter: state.position.marginHealth,
      txHash: '0x' + Math.random().toString(16).substring(2, 10),
      executionVenue: 'Mochatrade Core Engine',
      gasCost: '0.00 USDC',
    };
    setAuditLogs((logs) => [switchLog, ...logs]);

    setActiveToast({
      id: `toast-${Date.now()}`,
      type: 'INFO',
      title: `Market Switched: ${market.baseSymbol}`,
      message: `Terminal rebased to ${market.symbol} @ $${state.ticker.markPrice.toFixed(2)}. MarginGuard re-armed at ${state.position.marginHealth.toFixed(1)}% health.`,
      timestamp: new Date().toLocaleTimeString('en-IN'),
    });
  }, []);

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

  // PRIMARY DEMO ACTION: Simulate -4% Overnight Dip (generalized to active market)
  const simulateOvernightDip = useCallback(() => {
    // 1. Temporarily pause live ticks to keep the demo state crisp
    setIsSimulatingLiveTicks(false);

    const market = getMarket(selectedSymbol);
    const currentMark = ticker.markPrice;

    const droppedMark = Number((currentMark * 0.956).toFixed(2)); // ~ -4.4% (115.10 for NVDA)
    const droppedHealth = guardConfig.threshold - 1; // 114% at default 115% threshold

    // Update ticker
    setTicker((prev) => ({
      ...prev,
      markPrice: droppedMark,
      indexPrice: Number((droppedMark - 0.02).toFixed(2)),
      change24h: Number(prev.change24h - 4.5),
      low24h: Math.min(prev.low24h, droppedMark),
    }));
    setPriceFlash('DOWN');

    // Add red dip candle to chart
    setCandles((prevCandles) => {
      const now = Date.now();
      const last = prevCandles[prevCandles.length - 1];
      const dipCandle: CandleData = {
        time: now + 60000,
        open: last ? last.close : currentMark,
        high: currentMark,
        low: droppedMark - droppedMark * 0.003,
        close: droppedMark,
        volume: 38400, // Spike in volume
      };
      return [...prevCandles, dipCandle];
    });

    // Check if MarginGuard is ARMED and enabled
    if (guardConfig.isEnabled) {
      // Step A: Immediately show breach state
      setPosition((prev) => {
        const pnlUsd = (droppedMark - prev.entryPrice) * prev.contracts;
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
      const entryPrice = position.entryPrice;
      const currentLiq = position.liqPrice;
      const currentSizeUsd = position.sizeUsd;
      const currentContracts = position.contracts;

      setTimeout(() => {
        const slicePct = guardConfig.trimSlice; // e.g. 25%
        const trimmedNotional = (currentSizeUsd * slicePct) / 100;
        const newSizeUsd = currentSizeUsd - trimmedNotional;
        const newContracts = newSizeUsd / entryPrice;
        const newLiqPrice = Math.max(0, Number((droppedMark - (entryPrice - currentLiq) * 1.15).toFixed(2)));
        const restoredHealth = Number((droppedHealth + 12.2).toFixed(1));

        const pnlUsd = (droppedMark - entryPrice) * newContracts;
        const pnlInr = pnlUsd * USD_INR_RATE;
        const roePercent = ((droppedMark - entryPrice) / entryPrice) * 20 * 100;

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
          initialMarginUsd: Number((newSizeUsd * 0.05).toFixed(2)),
          maintenanceMarginUsd: Number((newSizeUsd * 0.025).toFixed(2)),
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
          details: `${market.baseSymbol} margin health breached ${guardConfig.threshold}% (fell to ${droppedHealth}% at $${droppedMark.toFixed(2)}). Auto-dispatched ${slicePct}% reduceOnly trim (-$${trimmedNotional.toLocaleString()} notional). Liquidation price lowered from $${currentLiq.toFixed(2)} → $${newLiqPrice.toFixed(2)}. Health restored to ${restoredHealth}%.`,
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
          message: `${market.baseSymbol} mark dropped to $${droppedMark.toFixed(2)}. MarginGuard executed a ${slicePct}% reduceOnly trim order to prevent liquidation.`,
          details: {
            markPrice: droppedMark,
            healthBefore: droppedHealth,
            healthAfter: restoredHealth,
            liqBefore: currentLiq,
            liqAfter: newLiqPrice,
            trimmedAmount: `-$${trimmedNotional.toLocaleString()} USD (₹${(trimmedNotional * USD_INR_RATE).toLocaleString()})`,
            txHash: initialTxHash,
            mode: 'simulated',
            explorerUrl: initialExplorerUrl,
          },
          timestamp: new Date().toLocaleTimeString('en-IN'),
        });

        const trimmedContracts = Number((currentContracts - newContracts).toFixed(2));

        // Asynchronously dispatch to Hyperliquid Testnet API route
        fetch('/api/simulate-trim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: market.symbol,
            price: Number(droppedMark.toFixed(2)),
            size: trimmedContracts,
          }),
        })
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
      const pnlUsd = (droppedMark - position.entryPrice) * position.contracts;
      setPosition((prev) => ({
        ...prev,
        markPrice: droppedMark,
        marginHealth: droppedHealth,
        pnlUsd: Number(pnlUsd.toFixed(2)),
        pnlInr: Number((pnlUsd * USD_INR_RATE).toFixed(2)),
        roePercent: Number((((droppedMark - prev.entryPrice) / prev.entryPrice) * 20 * 100).toFixed(2)),
      }));

      setActiveToast({
        id: `toast-${Date.now()}`,
        type: 'MARGIN_WARNING',
        title: 'CRITICAL MARGIN WARNING: Liquidation Imminent',
        message: `${market.baseSymbol} mark dipped to $${droppedMark.toFixed(2)}. Margin health is ${droppedHealth.toFixed(1)}% with liquidation at $${position.liqPrice.toFixed(2)}. MarginGuard is DISARMED - no defense was executed!`,
        details: {
          markPrice: droppedMark,
          healthBefore: position.marginHealth,
          healthAfter: droppedHealth,
          liqBefore: position.liqPrice,
          liqAfter: position.liqPrice,
        },
        timestamp: new Date().toLocaleTimeString('en-IN'),
      });
    }
  }, [
    guardConfig.isEnabled,
    guardConfig.threshold,
    guardConfig.trimSlice,
    selectedSymbol,
    ticker.markPrice,
    position.entryPrice,
    position.liqPrice,
    position.sizeUsd,
    position.contracts,
    position.marginHealth,
  ]);

  // Reset Position action
  const resetPosition = useCallback(() => {
    const state = buildMarketState(selectedSymbol);
    const market = getMarket(selectedSymbol);

    setTicker(state.ticker);
    setPosition(state.position);
    setCandles(state.candles);
    setOrderBook(state.orderBook);
    setRecentTrades(state.recentTrades);

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
      details: `Restored 20x Long ${market.symbol} at $${market.seed.entry.toFixed(2)} entry ($10,000 notional, Liq: $${market.seed.liq.toFixed(2)}, Health: ${market.seed.health}%). Engine ARMED.`,
      markPrice: state.ticker.markPrice,
      healthBefore: state.position.marginHealth,
      healthAfter: state.position.marginHealth,
      txHash: '0x' + Math.random().toString(16).substring(2, 10),
      executionVenue: 'Mochatrade Core Engine',
      gasCost: '0.00 USDC',
    };

    setAuditLogs((l) => [resetLog, ...l]);

    setActiveToast({
      id: `toast-${Date.now()}`,
      type: 'RESET',
      title: 'Position Restored to Baseline',
      message: `${market.symbol} reset to $${market.seed.entry.toFixed(2)} Entry, $10,000 Notional (20x Long). MarginGuard Armed.`,
      timestamp: new Date().toLocaleTimeString('en-IN'),
    });
  }, [selectedSymbol]);

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
    stockMarkets: STOCK_MARKETS,
    selectedSymbol,
    selectTicker,
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