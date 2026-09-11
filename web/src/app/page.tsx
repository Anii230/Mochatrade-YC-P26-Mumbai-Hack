'use client';

import React from 'react';
import { useTerminalEngine } from '@/engine/useTerminalEngine';
import { Navbar } from '@/components/terminal/Navbar';
import { ChartPanel } from '@/components/terminal/ChartPanel';
import { PositionsTable } from '@/components/terminal/PositionsTable';
import { OrderEntry } from '@/components/terminal/OrderEntry';
import { RiskShieldCard } from '@/components/terminal/RiskShieldCard';
import { PitchToolbar } from '@/components/terminal/PitchToolbar';
import { AuditToast } from '@/components/terminal/AuditToast';

export default function TerminalPage() {
  const {
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
  } = useTerminalEngine();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col antialiased select-none font-sans">
      {/* 1. Top Navigation Bar */}
      <Navbar
        ticker={ticker}
        priceFlash={priceFlash}
        wallet={wallet}
        guardConfig={guardConfig}
      />

      {/* 2. Main Viewport (2-Column Layout) */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto p-3 lg:p-4 flex flex-col gap-4 pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Panel: 65% width (col-span-12 lg:col-span-8) */}
          <section className="lg:col-span-8 flex flex-col gap-4">
            {/* TradingView-Style Candlestick Chart */}
            <ChartPanel
              candles={candles}
              position={position}
              markPrice={ticker.markPrice}
            />

            {/* Open Positions Table & Defense Logs */}
            <PositionsTable
              position={position}
              auditLogs={auditLogs}
              orderBook={orderBook}
              recentTrades={recentTrades}
            />
          </section>

          {/* Right Panel: 35% width (col-span-12 lg:col-span-4) */}
          <section className="lg:col-span-4 flex flex-col gap-4">
            {/* Order Entry Mockup */}
            <OrderEntry
              markPrice={ticker.markPrice}
              availableUsd={wallet.freeUsd}
              availableInr={wallet.freeInr}
            />

            {/* MarginGuard Autonomous Risk Shield Card */}
            <RiskShieldCard
              guardConfig={guardConfig}
              position={position}
              toggleMarginGuard={toggleMarginGuard}
              setThreshold={setThreshold}
              setTrimSlice={setTrimSlice}
            />
          </section>
        </div>
      </main>

      {/* 3. Bottom Interactive Pitch Toolbar (Sticky / Fixed for Demo) */}
      <div className="fixed bottom-3 left-3 right-3 max-w-[1920px] mx-auto z-40 pointer-events-auto">
        <PitchToolbar
          onSimulateDip={simulateOvernightDip}
          onReset={resetPosition}
          engineState={guardConfig.engineState}
          isSimulatingLiveTicks={isSimulatingLiveTicks}
          onToggleLiveTicks={() => setIsSimulatingLiveTicks(!isSimulatingLiveTicks)}
        />
      </div>

      {/* 4. Telemetry Audit Toast */}
      <AuditToast key={activeToast?.id ?? 'none'} toast={activeToast} onClose={closeToast} />
    </div>
  );
}
