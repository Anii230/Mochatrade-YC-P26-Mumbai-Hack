# Mochatrade MarginGuard — Full Project Context

**Hackathon**: Mochatrade YC P26 Mumbai Hackathon (September 8–12, 2026)
**Team**: FinalCommit — Aniket Gaikwad + Harshil Amin
**Repository**: `Anii230/Mochatrade-YC-P26-Mumbai-Hack` (branch: `main`, 8 commits)

---

## 1. What Is This Project?

**MarginGuard** is an autonomous liquidation defense engine for **Mochatrade** — a YC P26–backed platform that lets Indian retail traders trade US equity perpetuals (NVDA, TSLA, AAPL, etc.) with up to 20× leverage, margined in INR via instant UPI.

### The Problem It Solves
Indian F&O traders who go long on US stocks via perpetuals face **overnight gap-down liquidation risk** — US market after-hours sessions happen at 1:30 AM IST while traders sleep. On Hyperliquid L1, retail positions under $100K are liquidated 100% with aggressive market orders. MarginGuard provides **autonomous partial deleveraging** that fires while the trader sleeps.

### Core Mechanics
| Mechanism | Detail |
|---|---|
| **Multi-Tiered Auto-Deleveraging** | Monitors margin health ratio; on breach of user threshold (e.g. 115%), auto-trims 20–25% of position |
| **Non-Custodial Scoped Execution** | Uses Hyperliquid Agent Wallets scoped to `reduceOnly: true` — zero custody, zero withdrawal |
| **Slippage + Cooldown** | IOC limit batches with 60s cooldown to prevent cascade loops |
| **State Machine** | `DISARMED → ARMED → TRIMMING → COOLDOWN → ARMED` |

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.3.4 (App Router, Turbopack) |
| **Language** | TypeScript 5.x |
| **React** | React 19.2.8 |
| **Styling** | Tailwind CSS v4 (via `@tailwindcss/postcss`) |
| **Fonts** | Geist Sans + Geist Mono (via `next/font/google`) |
| **Icons** | `lucide-react` v1.44.0 |
| **CSS Utilities** | `clsx` + `tailwind-merge` |
| **Blockchain SDK** | `@nktkas/hyperliquid` v0.33.3 (Hyperliquid L1 exchange client) |
| **Wallet/Crypto** | `viem` v2.56.3 (EIP-712 signing, private key accounts) |
| **Testing** | Node.js `assert` module (custom test runner) |
| **Build** | Turbopack (dev), Next.js production build |

---

## 3. Directory Structure

```text
Mochatrade-YC-P26-Mumbai-Hack/
├── .gitignore                          # Root gitignore
├── Mochatrade.md                       # Official hackathon brief & platform overview (7.5KB)
├── README.md                           # MarginGuard system documentation (5.1KB)
└── web/                                # ← Entire Next.js application
    ├── .gitignore                       # Web-specific gitignore
    ├── AGENTS.md                        # Agent instructions file
    ├── CLAUDE.md                        # Claude instructions file (11 bytes)
    ├── README.md                        # Default Next.js readme
    ├── package.json                     # Dependencies & scripts
    ├── package-lock.json                # Lockfile (248KB)
    ├── next.config.ts                   # Next.js config (empty)
    ├── tsconfig.json                    # TypeScript config
    ├── postcss.config.mjs              # PostCSS → Tailwind v4
    ├── eslint.config.mjs               # ESLint config
    ├── next-env.d.ts                    # Next.js type definitions
    ├── public/                          # Static assets (favicon, SVGs)
    └── src/
        ├── app/
        │   ├── favicon.ico              # App icon
        │   ├── globals.css              # Global styles, scrollbar, selection, fonts (44 lines)
        │   ├── layout.tsx               # Root layout (Geist fonts, dark mode, metadata)
        │   ├── page.tsx                 # Main terminal page (wires all components)
        │   └── api/
        │       └── simulate-trim/
        │           └── route.ts         # POST endpoint → Hyperliquid Testnet order dispatch
        ├── engine/
        │   ├── types.ts                 # All TypeScript interfaces (~100 lines)
        │   ├── markets.ts               # 10-stock catalogue + deterministic market data generators
        │   ├── useTerminalEngine.ts     # Core state machine hook (~600 lines)
        │   └── engine.test.ts           # Invariant & formula tests (~130 lines)
        └── components/
            └── terminal/
                ├── Navbar.tsx           # Top navigation bar (328 lines)
                ├── ChartPanel.tsx       # Candlestick chart with canvas rendering (399 lines)
                ├── PositionsTable.tsx   # Positions, audit logs, order book tabs (415 lines)
                ├── OrderEntry.tsx       # Order entry panel (213 lines)
                ├── RiskShieldCard.tsx   # MarginGuard configuration card (255 lines)
                ├── PitchToolbar.tsx     # Interactive demo controls bar (113 lines)
                └── AuditToast.tsx       # Defense notification toast (196 lines)
```

---

## 4. What's Already Implemented (File-by-File)

### 4.1 Engine Layer ([`src/engine/`](file:///home/ani23/Projects/mochatrade/Mochatrade-YC-P26-Mumbai-Hack/web/src/engine))

#### [`types.ts`](file:///home/ani23/Projects/mochatrade/Mochatrade-YC-P26-Mumbai-Hack/web/src/engine/types.ts) (~100 lines)
- ✅ `MarginEngineState` — `'ARMED' | 'TRIMMING' | 'COOLDOWN' | 'DISARMED'`
- ✅ `Position` — Full position model (id, market, side, leverage, sizeUsd/Inr, contracts, entry/mark/liq prices, marginHealth, pnl, roe, margin amounts, isolated flag)
- ✅ `MarginGuardConfig` — Guard config (enabled, threshold, trimSlice, engineState, cooldown, keyType, l1Chain, permissions)
- ✅ `AuditLog` — Full audit log entry with tx hash, explorer URL, mode, gas cost (+ `MARKET_SWITCHED` action)
- ✅ `MarketTicker` — Symbol, name, mark/index price, 24h stats, funding rate, is24_7
- ✅ `CandleData` — OHLCV candle structure
- ✅ `OrderBookLevel` — Price, size, total
- ✅ `RecentTrade` — Id, time, price, size, side
- ✅ `StockMarket` — Catalogue entry with symbol/baseSymbol/name/logo + `seed` position baseline

#### [`markets.ts`](file:///home/ani23/Projects/mochatrade/Mochatrade-YC-P26-Mumbai-Hack/web/src/engine/markets.ts) (new)
- ✅ **`STOCK_MARKETS` catalogue** — NVDA, TSLA, AAPL, AMZN, MSFT, META, GOOGL, COIN, AMD, SPY (NVDA seed preserves original invariants)
- ✅ **Deterministic-seeded generators** — `generateCandles`, `generateOrderBook`, `generateRecentTrades`
- ✅ **`buildPosition` / `buildMarketState`** — coherent per-market snapshot (ticker + position + chart + book + trades)
- ✅ `USD_INR_RATE`, `DEFAULT_SYMBOL`, `getMarket()` lookups

#### [`useTerminalEngine.ts`](file:///home/ani23/Projects/mochatrade/Mochatrade-YC-P26-Mumbai-Hack/web/src/engine/useTerminalEngine.ts) (590 lines)
- ✅ **Ticker state** — NVDA-PERP initial at $120.40, with 24h stats
- ✅ **Position state** — 20x Long NVDA, $10,000 notional, $120 entry, $114.20 liq, 137.4% health
- ✅ **MarginGuard config** — Default armed at 115% threshold, 25% trim slice
- ✅ **Audit log history** — Initial "ARMED" log entry
- ✅ **Notification toast system** — `NotificationToast` interface with defense/warning/reset/info types
- ✅ **45 historical candles** — Brownian-generated 1-minute candles leading to $120.40
- ✅ **Order book** — 5 asks + 5 bids around $120.40 spread
- ✅ **Recent trades** — 4 initial trades
- ✅ **Wallet balances** — ₹50,000 total, $602.41 USD, ₹8,500 free, UPI ID
- ✅ **Cooldown countdown timer** — setInterval-based countdown from 60s
- ✅ **Real-time Brownian micro-ticking** — ±$0.03 jitter every 2 seconds, updating ticker/position/candles simultaneously
- ✅ **Toggle MarginGuard** — ARM/DISARM with audit log
- ✅ **Threshold & trim slice setters** — Configurable 110/115/120/125% and 15/25/33/50%
- ✅ **Simulate overnight dip** — Primary demo action (**generalized to active market**):
  - Drops mark by ~4.4% (→ $115.10 for NVDA), health to `threshold - 1` (114%)
  - Adds red dip candle to chart
  - If guard enabled: transitions `ARMED → TRIMMING`, executes `trimSlice`% reduceOnly trim after 550ms delay, restores health, lowers liq, transitions to `COOLDOWN (60s)`
  - If guard disabled: shows CRITICAL MARGIN WARNING toast
  - Async POST to `/api/simulate-trim` with `{ symbol, price, size }` to attempt real Hyperliquid Testnet order
- ✅ **Reset position** — Restores the *selected* market's baseline state, adds audit log
- ✅ **Price flash effect** — UP/DOWN flash with 400ms timeout
- ✅ **Select market** — `selectTicker(symbol)` + `selectedSymbol` rebase ticker/position/chart/order book/trades, resets cooldown, adds `MARKET_SWITCHED` audit log + INFO toast
- ✅ **Price-scaled Brownian jitter** — ~±0.05% of mark (~±$0.06 for NVDA) every 2s

#### [`engine.test.ts`](file:///home/ani23/Projects/mochatrade/Mochatrade-YC-P26-Mumbai-Hack/web/src/engine/engine.test.ts) (~130 lines)
- ✅ Tests initial position metrics (contracts, PnL, ROE)
- ✅ Tests overnight dip simulation (health breach detection)
- ✅ Tests 25% reduceOnly trim execution (trimmed notional, new size, new contracts, new liq, restored health)
- ✅ Tests position reset verification
- ✅ Tests market catalogue integrity (10 unique stocks, sane baselines)
- ✅ Tests NVDA default seed invariants + deterministic candle/order-book generation + `buildMarketState` coherence
- Run via: `npx tsx src/engine/engine.test.ts`

---

### 4.2 API Route ([`src/app/api/`](file:///home/ani23/Projects/mochatrade/Mochatrade-YC-P26-Mumbai-Hack/web/src/app/api))

#### [`simulate-trim/route.ts`](file:///home/ani23/Projects/mochatrade/Mochatrade-YC-P26-Mumbai-Hack/web/src/app/api/simulate-trim/route.ts) (~105 lines)
- ✅ `POST /api/simulate-trim` — Fail-soft API endpoint
- ✅ **Body**: accepts `{ symbol, price, size }` JSON (defaults `NVDA-PERP` / `115.10` / `21.7`); invalid bodies fail soft to defaults
- ✅ **Without private key**: Returns simulated hash + success
- ✅ **With `HYPERLIQUID_TESTNET_PRIVATE_KEY` env var**: 
  - Creates `viem` private key account
  - Initializes Hyperliquid Testnet exchange client
  - Dispatches EIP-712 signed reduceOnly IOC sell order (asset 0) at the requested price/size
  - Parses filled/resting order ID into tx hash
  - Falls back to simulated on any exchange-level error or network exception
- ✅ Returns `{ success, mode, symbol, txHash, explorerUrl }`

---

### 4.3 Components ([`src/components/terminal/`](file:///home/ani23/Projects/mochatrade/Mochatrade-YC-P26-Mumbai-Hack/web/src/components/terminal))

#### [`Navbar.tsx`](file:///home/ani23/Projects/mochatrade/Mochatrade-YC-P26-Mumbai-Hack/web/src/components/terminal/Navbar.tsx) (328 lines)
- ✅ **Top micro bar** — Hyperliquid L1 connection status, block number, latency, scoped session key badge (`reduceOnly Strict`), funding rate, 24/7 liquidity indicator
- ✅ **Branding** — MOCHATRADE logo + YC P26 badge + FIU-IND Registered badge + tagline
- ✅ **Active ticker selector** — Dropdown with all 10 catalogue stocks (dynamic from `STOCK_MARKETS`), logo, symbol, price, 24h change; **clicking calls `onSelectTicker` and rebases the whole terminal**; active row derived from `selectedSymbol`
- ✅ **Ticker key stats** — 24h High/Low/Volume/Open Interest (hidden below `lg`)
- ✅ **Wallet card** — ₹50,000 INR / ~$600 USDC with click-to-expand modal
- ✅ **Deposit UPI button** — Hidden below `sm`
- ✅ **MarginGuard status pill** — Shows DISARMED/COOLDOWN/TRIMMING/ACTIVE with animated dot (hidden below `md`)
- ✅ **Wallet modal** — Full balance breakdown, Instant UPI Top-up + Withdraw buttons

#### [`ChartPanel.tsx`](file:///home/ani23/Projects/mochatrade/Mochatrade-YC-P26-Mumbai-Hack/web/src/components/terminal/ChartPanel.tsx) (399 lines)
- ✅ **Canvas-rendered candlestick chart** — Full OHLCV rendering with DPI-aware scaling
- ✅ **Volume bars** — Semi-transparent volume bars at bottom
- ✅ **Candle + Line chart modes** — Toggle between candlestick and line chart
- ✅ **EMA 20 overlay** — Blue exponential moving average line
- ✅ **Entry price line** — Amber dashed line with badge
- ✅ **Liquidation price line** — Rose dashed line with danger zone shading + badge
- ✅ **Current mark price line** — Green/red dashed line with badge
- ✅ **Timeframe selector** — 1s/1m/5m/15m/1H/1D buttons (visual only, doesn't change data)
- ✅ **Crosshair tooltip** — Mouse hover shows OHLCV + time
- ✅ **Watermark** — "Hyperliquid L1 Feed • TradingView Canvas Engine • Autonomous Guard Overlay Active"
- ✅ **Legend bar** — Entry, Liq, Mark prices with buffer

#### [`PositionsTable.tsx`](file:///home/ani23/Projects/mochatrade/Mochatrade-YC-P26-Mumbai-Hack/web/src/components/terminal/PositionsTable.tsx) (415 lines)
- ✅ **3-tab layout**: Open Positions | MarginGuard Defense Logs | Order Book & Trades
- ✅ **Positions tab** — Full position row: Market (badge + leverage), Size USD/INR/contracts, Entry, Mark, Liq with buffer calc, PnL with ROE + INR, Margin Health bar with threshold indicators, TP/SL + Market Close buttons (disabled)
- ✅ **Audit Logs tab** — Scrollable defense log entries with action badges (animated pulse on DEFENSE_TRIM_EXECUTED), details, price/health metrics, tx hash with explorer link, L1 Testnet Verified badge, gas cost
- ✅ **Order Book tab** — Side-by-side L2 order book (5 asks + 5 bids with spread) + Recent Trades tape
- ✅ **Margin health color system** — Green >120%, Yellow 110-120%, Red <110%
- ✅ **Health bar** — Animated progress bar with HEALTHY/WARNING/CRITICAL RISK badge

#### [`OrderEntry.tsx`](file:///home/ani23/Projects/mochatrade/Mochatrade-YC-P26-Mumbai-Hack/web/src/components/terminal/OrderEntry.tsx) (213 lines)
- ✅ **Buy/Long vs Sell/Short toggle** — Green/Red visual state
- ✅ **Order type selector** — MARKET/LIMIT/STOP (visual only)
- ✅ **Leverage slider** — Range 1-20x with quick-snap buttons (1x/5x/10x/15x/20x)
- ✅ **Margin input** — USD input with INR + contracts conversion
- ✅ **Percentage snaps** — 25%/50%/75%/100% of available balance
- ✅ **Execution summary** — Notional USD/INR, estimated liquidation price, fee, slippage
- ✅ **CTA button** — "Open 20x Long NVDA" (simulated, shows feedback message)
- ✅ **L1 execution note** — "Sub-second Hyperliquid L1 execution"

#### [`RiskShieldCard.tsx`](file:///home/ani23/Projects/mochatrade/Mochatrade-YC-P26-Mumbai-Hack/web/src/components/terminal/RiskShieldCard.tsx) (255 lines)
- ✅ **MarginGuard™ v2.4 Pro header** — Shield icon, title, version badge
- ✅ **ON/OFF toggle** — Animated toggle switch with ARM/DISARM
- ✅ **Engine state badge** — ARMED (pulsing green), TRIMMING (spinning blue), COOLDOWN (amber with seconds), DISARMED (gray)
- ✅ **Trigger threshold selector** — 110%/115%/120%/125% grid buttons
- ✅ **Auto-trim slice selector** — 15%/25%/33%/50% grid buttons
- ✅ **Scoped key security section** — Lock icon, non-custodial key description, `reduceOnly: true` code badge
- ✅ **Live defense telemetry** — Current health, buffer to trigger, protected notional USD/INR, execution venue, latency
- ✅ **Ambient background glow** — Emerald glow when ARMED, blue glow when TRIMMING

#### [`PitchToolbar.tsx`](file:///home/ani23/Projects/mochatrade/Mochatrade-YC-P26-Mumbai-Hack/web/src/components/terminal/PitchToolbar.tsx) (113 lines)
- ✅ **Fixed bottom toolbar** — Sticky demo controls with backdrop blur
- ✅ **Toggle Live Ticks** — Play/Pause Brownian motion button
- ✅ **Simulate -4% Overnight Dip** — Primary red CTA: "⚡ Simulate -4% Overnight Dip ($115.10)" with sub-label "Triggers Health 114% → Autonomous 25% Trim"
- ✅ **Reset Position** — "🔄 Reset Position" secondary button
- ✅ **"Interactive Pitch & Demo Controls"** — Title with "Live State Machine" badge
- ✅ **Responsive layout** — `flex-col md:flex-row`

#### [`AuditToast.tsx`](file:///home/ani23/Projects/mochatrade/Mochatrade-YC-P26-Mumbai-Hack/web/src/components/terminal/AuditToast.tsx) (196 lines)
- ✅ **Floating notification toast** — Fixed bottom-right with fade-in animation
- ✅ **Type-based styling** — Green (defense success), Red (margin warning), Blue (reset/info)
- ✅ **Auto-dismiss** — 12-second countdown with animated progress bar
- ✅ **Defense audit metrics** — Trigger mark price, health before→after, liq price defended, trimmed amount, L1 signature hash with explorer link, L1 Testnet Verified badge
- ✅ **Footer** — "Zero-custody execution on Hyperliquid L1 • Mochatrade YC P26"

---

### 4.4 App Shell ([`src/app/`](file:///home/ani23/Projects/mochatrade/Mochatrade-YC-P26-Mumbai-Hack/web/src/app))

#### [`layout.tsx`](file:///home/ani23/Projects/mochatrade/Mochatrade-YC-P26-Mumbai-Hack/web/src/app/layout.tsx) (38 lines)
- ✅ Geist Sans + Geist Mono font loading via `next/font/google`
- ✅ Dark mode forced (`className="dark"`)
- ✅ SEO metadata: "Mochatrade | Institutional US Perpetual Futures & MarginGuard"
- ✅ Favicon configured

#### [`globals.css`](file:///home/ani23/Projects/mochatrade/Mochatrade-YC-P26-Mumbai-Hack/web/src/app/globals.css) (44 lines)
- ✅ Tailwind v4 import
- ✅ Dark theme root variables (`--background: #09090b`, `--foreground: #f4f4f5`)
- ✅ Tabular number font features for financial tickers
- ✅ Custom dark scrollbars
- ✅ Emerald selection highlight

#### [`page.tsx`](file:///home/ani23/Projects/mochatrade/Mochatrade-YC-P26-Mumbai-Hack/web/src/app/page.tsx) (105 lines)
- ✅ Client component (`'use client'`)
- ✅ Wires `useTerminalEngine()` hook to all 7 components
- ✅ 12-column grid layout: left panel 8 cols (Chart + Positions), right panel 4 cols (OrderEntry + RiskShield)
- ✅ Fixed bottom PitchToolbar with z-40
- ✅ AuditToast overlay

---

## 5. Current Lint/Build Status

### Build: ✅ Passes (`npm run build` exits 0)

### Lint: ✅ Passes (`npm run lint` → 0 errors, 0 warnings)

All previously-reported issues were resolved in the A–G implementation:

| Old issue | Resolution |
|---|---|
| `prefer-const` in `ChartPanel.tsx` | `minPrice`/`maxPrice` now `const` |
| `react-hooks/set-state-in-effect` in `AuditToast.tsx` | Remount per toast via `key`, state initialised at 100 |
| ~40 unused lucide imports | Removed across all components |
| Unused props (`wallet`, `isArmed`, `onTriggerSimulate`) | `wallet` wired into Navbar card/modal; the other two removed |
| Unused `TESTNET_API_URL` import | Removed from API route |

---

## 6. What Needs to Be Implemented (from Approved Plan)

> **Status: ✅ ALL COMPLETED** in the A–G implementation (commits `f020c49` → `a1d3319`).

### 6.1 Fix Missing Stocks UI (Primary Issue)

> **Root Cause**: On Mac M2 (1280–1470px viewport), the navbar's combined element widths exceed the available space. The ticker selector lacks `shrink-0` and gets crushed to zero width or pushed off-screen. `overflow-x: hidden` on body hides the overflow.

| Task | Status |
|---|---|
| Add `shrink-0` and visual priority to stock ticker selector so it's always visible | `[x]` |
| Make branding responsive below 1440px (streamline text, hide redundant taglines) | `[x]` |
| Hide secondary stats (24h Volume, Open Interest) below `xl` (1280px) | `[x]` |
| Make wallet card compact on smaller viewports | `[x]` |
| Wire up `onSelectTicker` so clicking a stock switches the active ticker across the terminal | `[x]` |

### 6.2 Dedicated US Stock Perps Market Board

| Task | Status |
|---|---|
| Add stock market catalogue to `types.ts` (NVDA, TSLA, AAPL, AMZN, MSFT, META, GOOGL, COIN, AMD, SPY) | `[x]` — `StockMarket` type + `markets.ts` catalogue |
| Add `selectedSymbol` + `selectTicker(symbol)` to `useTerminalEngine.ts` | `[x]` |
| Dynamically regenerate candles, order book, recent trades when switching stocks | `[x]` — deterministic seeded generators |
| Add new "US Stock Perps (24/7)" tab to `PositionsTable.tsx` with search/filter | `[x]` |
| Add quick "Trade" button per stock that switches chart + order entry | `[x]` |

### 6.3 Responsive Layout for Mac M2

| Task | Status |
|---|---|
| Optimize viewport grid: `p-2 sm:p-3 lg:p-4` for better space usage on 1280–1440px | `[x]` |
| Add `ResizeObserver` to `ChartPanel.tsx` for dynamic canvas redraw on resize | `[x]` |
| Make chart timeframes and controls wrap/scroll on compact screens | `[x]` |
| Adjust position table column responsive display (`hidden md:table-cell`) | `[x]` — sub-rows hidden below `md` |
| Make PitchToolbar stack/wrap buttons cleanly on Mac M2 | `[x]` |
| Ensure OrderEntry shows selected ticker name dynamically | `[x]` — `baseSymbol` prop drives CTA + contracts |
| Ensure RiskShieldCard sliders remain compact on smaller screens | `[x]` |

### 6.4 Lint & Code Cleanup

| Task | Status |
|---|---|
| Fix `ChartPanel.tsx` `prefer-const` errors (`let minPrice/maxPrice` → `const`) | `[x]` |
| Fix `AuditToast.tsx` `react-hooks/set-state-in-effect` error | `[x]` — remount per toast `key` |
| Clean up ~40 unused imports across all component files | `[x]` |
| Clean up unused props (`wallet`, `isArmed`, `onTriggerSimulate`) | `[x]` — `wallet` wired, others removed |
| Remove unused `TESTNET_API_URL` import in API route | `[x]` |

---

## 7. Key Constants & Configuration

| Constant | Value | Location |
|---|---|---|
| Initial Entry Price | $120.00 | `markets.ts` NVDA seed |
| Initial Mark Price | $120.40 | `markets.ts` NVDA seed |
| Initial Liq Price | $114.20 | `markets.ts` NVDA seed |
| Initial Position Size | $10,000 USD | `markets.ts` `buildPosition` |
| USD/INR Rate | 83.00 | `markets.ts` `USD_INR_RATE` |
| Leverage | 20× | Position state |
| Defense Threshold | 115% health | Guard config |
| Trim Slice | 25% notional | Guard config |
| Cooldown Duration | 60 seconds | Guard config |
| Dip Target Mark | `currentMark × 0.956` (~$115.10 for NVDA) | `simulateOvernightDip` |
| Dip Target Health | `threshold − 1` (114.0%) | `simulateOvernightDip` |
| Tick Interval | 2,000ms | Live ticking effect |
| Brownian Tick Jitter | ~±0.05% of mark (~±$0.06 for NVDA) | Live ticking effect |
| Toast Duration | 12,000ms | `AuditToast.tsx` |

---

## 8. How to Run

```bash
# Clone & install
git clone git@github.com:Anii230/Mochatrade-YC-P26-Mumbai-Hack.git
cd Mochatrade-YC-P26-Mumbai-Hack/web
npm install          # or npm ci

# Development server
npm run dev          # → http://localhost:3000

# Build check
npm run build

# Run engine tests
npx tsx src/engine/engine.test.ts

# Lint
npm run lint

# Optional: Enable real Hyperliquid Testnet orders
export HYPERLIQUID_TESTNET_PRIVATE_KEY="0x..."
npm run dev
```
