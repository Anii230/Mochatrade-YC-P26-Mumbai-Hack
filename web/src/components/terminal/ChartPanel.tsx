'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { CandleData, Position } from '@/engine/types';
import {
  BarChart2,
  TrendingUp,
  Maximize2,
  Sliders,
  Eye,
  Activity,
  Layers
} from 'lucide-react';

interface ChartPanelProps {
  candles: CandleData[];
  position: Position;
  markPrice: number;
}

export const ChartPanel: React.FC<ChartPanelProps> = ({ candles, position, markPrice }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [timeframe, setTimeframe] = useState<string>('1m');
  const [chartType, setChartType] = useState<'CANDLE' | 'LINE'>('CANDLE');
  const [showEMA, setShowEMA] = useState<boolean>(true);
  const [hoverData, setHoverData] = useState<{ candle: CandleData; x: number; y: number } | null>(null);

  // Timeframes list
  const timeframes = ['1s', '1m', '5m', '15m', '1H', '1D'];

  // Redraw canvas on data or dimension changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to match display size with pixel ratio
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Padding
    const padTop = 30;
    const padBottom = 45;
    const padRight = 65; // Y-axis price label area
    const chartHeight = height - padTop - padBottom;
    const chartWidth = width - padRight;

    // Clear background
    ctx.fillStyle = '#09090b'; // zinc-950
    ctx.fillRect(0, 0, width, height);

    if (candles.length === 0) return;

    // Determine min/max price range (include position entry and liq price)
    let minPrice = Math.min(...candles.map((c) => c.low), position.liqPrice - 1);
    let maxPrice = Math.max(...candles.map((c) => c.high), position.entryPrice + 1);
    const priceRange = maxPrice - minPrice || 1;

    // Price to Y coordinate conversion
    const getY = (price: number) => {
      return padTop + chartHeight * (1 - (price - minPrice) / priceRange);
    };

    // Draw Grid Lines (Horizontal)
    const gridSteps = 6;
    ctx.strokeStyle = '#18181b'; // zinc-900
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.fillStyle = '#71717a'; // zinc-500
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'left';

    for (let i = 0; i <= gridSteps; i++) {
      const p = minPrice + (priceRange / gridSteps) * i;
      const y = getY(p);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();

      // Price label on right margin
      ctx.fillText(`$${p.toFixed(2)}`, chartWidth + 6, y + 3);
    }

    // Candle metrics
    const candleCount = candles.length;
    const candleWidth = Math.max(3, (chartWidth / candleCount) * 0.72);
    const candleSpacing = chartWidth / candleCount;

    // Max volume for volume bars
    const maxVolume = Math.max(...candles.map((c) => c.volume), 1);
    const volumeHeightMax = 50;

    // Draw Volume Bars
    candles.forEach((c, idx) => {
      const x = idx * candleSpacing + candleSpacing / 2;
      const vHeight = (c.volume / maxVolume) * volumeHeightMax;
      const vy = height - padBottom - vHeight;
      const isUp = c.close >= c.open;

      ctx.fillStyle = isUp ? 'rgba(52, 211, 153, 0.18)' : 'rgba(244, 63, 94, 0.18)';
      ctx.fillRect(x - candleWidth / 2, vy, candleWidth, vHeight);
    });

    // Draw Candlesticks or Line
    if (chartType === 'CANDLE') {
      candles.forEach((c, idx) => {
        const x = idx * candleSpacing + candleSpacing / 2;
        const openY = getY(c.open);
        const closeY = getY(c.close);
        const highY = getY(c.high);
        const lowY = getY(c.low);
        const isUp = c.close >= c.open;

        const strokeColor = isUp ? '#34d399' : '#f43f5e'; // emerald-400 / rose-500
        const fillColor = isUp ? '#10b981' : '#f43f5e';

        // Draw Wick
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        // Draw Candle Body
        const topY = Math.min(openY, closeY);
        const bodyHeight = Math.max(2, Math.abs(closeY - openY));
        ctx.fillStyle = fillColor;
        ctx.fillRect(x - candleWidth / 2, topY, candleWidth, bodyHeight);
      });
    } else {
      // Line chart mode
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2;
      ctx.beginPath();
      candles.forEach((c, idx) => {
        const x = idx * candleSpacing + candleSpacing / 2;
        const y = getY(c.close);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Calculate & Draw EMA 20 if enabled
    if (showEMA && candles.length >= 20) {
      const k = 2 / (20 + 1);
      let ema = candles[0].close;
      ctx.strokeStyle = '#60a5fa'; // blue-400
      ctx.lineWidth = 1.2;
      ctx.beginPath();

      candles.forEach((c, idx) => {
        ema = c.close * k + ema * (1 - k);
        if (idx >= 15) {
          const x = idx * candleSpacing + candleSpacing / 2;
          const y = getY(ema);
          if (idx === 15) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    // DRAW OVERLAY: Entry Price Line (Amber)
    const entryY = getY(position.entryPrice);
    if (entryY >= padTop && entryY <= height - padBottom) {
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#f59e0b'; // amber-500
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, entryY);
      ctx.lineTo(chartWidth, entryY);
      ctx.stroke();

      // Badge
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(chartWidth + 2, entryY - 9, 60, 18);
      ctx.fillStyle = '#09090b';
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.fillText(`ENTRY $${position.entryPrice.toFixed(2)}`, chartWidth + 4, entryY + 3);
      ctx.restore();
    }

    // DRAW OVERLAY: Liquidation Price Line (Rose)
    const liqY = getY(position.liqPrice);
    if (liqY >= padTop && liqY <= height - padBottom) {
      ctx.save();
      ctx.setLineDash([5, 3]);
      ctx.strokeStyle = '#f43f5e'; // rose-500
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, liqY);
      ctx.lineTo(chartWidth, liqY);
      ctx.stroke();

      // Shaded Danger Zone beneath Liquidation Price
      ctx.fillStyle = 'rgba(244, 63, 94, 0.05)';
      ctx.fillRect(0, liqY, chartWidth, height - padBottom - liqY);

      // Liq Badge
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(chartWidth + 2, liqY - 9, 62, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.fillText(`LIQ $${position.liqPrice.toFixed(2)}`, chartWidth + 4, liqY + 3);
      ctx.restore();
    }

    // DRAW OVERLAY: Current Mark Price Line
    const currentY = getY(markPrice);
    ctx.save();
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = markPrice >= position.entryPrice ? '#34d399' : '#f43f5e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, currentY);
    ctx.lineTo(chartWidth, currentY);
    ctx.stroke();

    // Current Mark Badge
    ctx.fillStyle = markPrice >= position.entryPrice ? '#059669' : '#e11d48';
    ctx.fillRect(chartWidth + 2, currentY - 9, 62, 18);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px JetBrains Mono, monospace';
    ctx.fillText(`$${markPrice.toFixed(2)}`, chartWidth + 5, currentY + 3);
    ctx.restore();

  }, [candles, position.entryPrice, position.liqPrice, markPrice, chartType, showEMA]);

  // Handle canvas mousemove for crosshair
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const padRight = 65;
    const chartWidth = rect.width - padRight;
    if (x > chartWidth || y < 30 || y > rect.height - 45) {
      setHoverData(null);
      return;
    }

    const candleCount = candles.length;
    const candleSpacing = chartWidth / candleCount;
    const index = Math.floor(x / candleSpacing);

    if (index >= 0 && index < candles.length) {
      setHoverData({
        candle: candles[index],
        x,
        y,
      });
    }
  };

  const handleMouseLeave = () => {
    setHoverData(null);
  };

  return (
    <div className="w-full flex flex-col bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden shadow-inner">
      {/* Chart Toolbar */}
      <div className="h-10 px-3 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between text-xs select-none">
        <div className="flex items-center gap-2">
          {/* Timeframe selector */}
          <div className="flex items-center bg-zinc-950 rounded p-0.5 border border-zinc-800 text-[11px] font-mono">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  timeframe === tf
                    ? 'bg-zinc-800 text-emerald-400 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-zinc-800 mx-1" />

          {/* Chart Type Toggle */}
          <button
            onClick={() => setChartType(chartType === 'CANDLE' ? 'LINE' : 'CANDLE')}
            className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-850 hover:bg-zinc-800 text-zinc-300 text-[11px] font-mono border border-zinc-750"
          >
            <BarChart2 className="w-3 h-3 text-emerald-400" />
            <span>{chartType}</span>
          </button>

          {/* Indicator toggles */}
          <button
            onClick={() => setShowEMA(!showEMA)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono border transition-colors ${
              showEMA
                ? 'bg-blue-950/60 border-blue-800/80 text-blue-300 font-semibold'
                : 'bg-zinc-850 border-zinc-750 text-zinc-400'
            }`}
          >
            <Activity className="w-3 h-3 text-blue-400" />
            <span>EMA 20</span>
          </button>
        </div>

        {/* Legend overlays */}
        <div className="hidden sm:flex items-center gap-4 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-amber-500 rounded-full" />
            <span className="text-zinc-400">Entry:</span>
            <span className="text-amber-400 font-bold">${position.entryPrice.toFixed(2)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-rose-500 rounded-full" />
            <span className="text-zinc-400">Liq:</span>
            <span className="text-rose-400 font-bold">${position.liqPrice.toFixed(2)}</span>
            <span className="text-[10px] text-zinc-500 font-sans">
              (Buffer: ${(markPrice - position.liqPrice).toFixed(2)})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-zinc-400">Mark:</span>
            <span className="text-emerald-400 font-bold">${markPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Candlestick Canvas Viewport */}
      <div ref={containerRef} className="relative w-full h-[360px] cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full block"
        />

        {/* Dynamic Crosshair Tooltip */}
        {hoverData && (
          <div
            className="absolute pointer-events-none bg-zinc-900/95 border border-zinc-700 text-[10px] font-mono p-2 rounded-md shadow-xl text-zinc-200 z-30"
            style={{
              left: Math.min(hoverData.x + 10, 480),
              top: Math.max(hoverData.y - 65, 10),
            }}
          >
            <div className="text-zinc-400 border-b border-zinc-800 pb-1 mb-1">
              Time: {new Date(hoverData.candle.time).toLocaleTimeString()}
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
              <div>
                O: <span className="text-white">${hoverData.candle.open.toFixed(2)}</span>
              </div>
              <div>
                H: <span className="text-white">${hoverData.candle.high.toFixed(2)}</span>
              </div>
              <div>
                L: <span className="text-white">${hoverData.candle.low.toFixed(2)}</span>
              </div>
              <div>
                C: <span className="text-white">${hoverData.candle.close.toFixed(2)}</span>
              </div>
              <div className="col-span-2 text-zinc-400 pt-0.5">
                Vol: {hoverData.candle.volume.toLocaleString()} contracts
              </div>
            </div>
          </div>
        )}

        {/* Liquidation Zone Warning Watermark */}
        <div className="absolute left-3 bottom-3 text-[10px] font-mono text-zinc-600 select-none pointer-events-none flex items-center gap-2">
          <span>Hyperliquid L1 Feed</span>
          <span>•</span>
          <span>TradingView Canvas Engine</span>
          <span>•</span>
          <span className="text-emerald-500/70">Autonomous Guard Overlay Active</span>
        </div>
      </div>
    </div>
  );
};
