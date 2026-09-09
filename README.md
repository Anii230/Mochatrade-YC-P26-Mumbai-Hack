# MarginGuard for Mochatrade

Autonomous Liquidation Defense and Risk Mitigation Architecture for Retail US Equity Perpetuals.

Developed for the Mochatrade YC P26 Mumbai Hackathon (September 8–12, 2026).

---

## Team FinalCommit

* Aniket Gaikwad
* Harshil Amin

Technical Specifications Hub: [MarginGuard Technical & Product Documentation on Notion](https://toothsome-buzzard-a8f.notion.site/MarginGuard-Technical-Product-Documentation-3d0412ca282c80dcaf9fdf6052e2ebb4)

---

## Executive Summary

Mochatrade opens access for Indian retail traders to trade US equity perpetuals (NVDA, TSLA, AAPL, AMZN) with professional leverage using native INR UPI rails. However, high leverage coupled with cross-border trading dynamics introduces significant risk:

1. Market Hour Disparity: US market after-hours sessions and high-beta earnings releases occur after 1:30 AM IST, while domestic retail traders are asleep.
2. Retail Liquidation Limitations: On underlying decentralized perpetual engines such as Hyperliquid L1, automated partial liquidations natively apply only to institutional positions exceeding $100,000 in notional value. Retail accounts below this threshold face complete 100% position liquidations via aggressive market orders and forfeit maintenance margin during rapid gap-down events.
3. Trader Churn: SEBI market studies indicate that over 75% of retail derivatives traders who experience a catastrophic margin wipeout churn from platforms within 90 days. Unmitigated liquidations directly degrade Customer Lifetime Value (LTV).

MarginGuard provides a client-authorized, non-custodial risk engine that brings algorithmic partial deleveraging to retail-sized positions, preventing forced liquidations while keeping the primary trade alive.

---

## Core Mechanics

* Multi-Tiered Auto-Deleveraging: Continuously evaluates the real-time Margin Health Ratio against user-defined defensive thresholds (e.g., 115%). Upon breach, MarginGuard automatically executes an immediate 20% to 25% partial trim.
* Dynamic Threshold Widening: Shedding a 25% slice reduces notional exposure and required maintenance margin, immediately pushing the liquidation price 2% to 4% further away from the current mark price.
* Non-Custodial Scoped Execution: Leverages Hyperliquid Agent Wallets locked strictly to reduceOnly: true order parameters. The engine maintains zero custody, zero withdrawal permissions, and cannot initiate new directional exposure.
* Slippage and Cooldown Protections: Replaces unrestricted market orders with Immediate-or-Cancel (IOC) limit batches, enforced with a 60-second cooldown cycle to avoid cascade feedback loops during illiquid wicks.

---

## System Architecture

[ Hyperliquid WebSocket L2 Feeds ] ---> [ Mark / Index Price Telemetry ]
                                                    |
                                                    v
                                    +-------------------------------+
                                    |     Margin Health Monitor     |
                                    | Account Equity vs Maint Margin|
                                    +---------------+---------------+
                                                    |
                                          (Health <= Threshold)
                                                    |
                                                    v
                                    +-------------------------------+
                                    |     Finite State Machine      |
                                    | IDLE -> ARMED -> EXEC -> COOL |
                                    +---------------+---------------+
                                                    |
                                            (Order Dispatch)
                                                    |
                                                    v
                                    +-------------------------------+
                                    |    Delegated Agent Wallet     |
                                    |     reduceOnly: true (IOC)    |
                                    +---------------+---------------+
                                                    |
                                                    v
                                    [ Hyperliquid Matching Engine ]

---

## Comparative Analysis

| Feature | Exchange Forced Liquidation | Standard Blunt Stop-Loss | MarginGuard Auto-Defense |
| :--- | :--- | :--- | :--- |
| Execution Trigger | Maintenance margin breached | Fixed static price point | Dynamic Margin Health ratio |
| Order Impact | 100% forced market closure | 100% position dumped | 20% to 25% targeted trim |
| Capital Preserved | Zero (Margin seized by vault) | Partial (at local bottom) | ~70% to 75% equity intact |
| Trade Continuation | Terminated | Terminated | Ongoing (captures upside) |
| Adverse Penalty | Liquidation clearance penalty | Standard taker fee | Standard taker fee |

---

## Repository Structure

.
|-- Mochatrade.md           # Official hackathon brief and platform overview
|-- README.md               # MarginGuard system documentation
|-- .gitignore              # Dependency and build configuration exclusions
`-- web/                    # Unified Next.js application & risk worker
    |-- src/
    |   |-- app/            # Application routes and terminal layout
    |   |-- components/     # Mochatrade trading terminal & MarginGuard UI
    |   `-- engine/         # State machine, telemetry, and order execution
    |-- public/             # Static platform assets
    |-- package.json        # Dependencies and build scripts
    `-- tsconfig.json       # TypeScript compiler configuration

---

## Local Development and Verification

### Prerequisites
* Node.js version 18.x or higher
* npm or pnpm package manager

### Installation and Setup

1. Clone the forked repository:
git clone git@github.com:Anii230/Mochatrade-YC-P26-Mumbai-Hack.git
cd Mochatrade-YC-P26-Mumbai-Hack

2. Navigate to the web application directory:
cd web

3. Install project dependencies:
npm install

4. Launch the local development server:
npm run dev

Open http://localhost:3000 in your browser to interact with the Mochatrade trading terminal and the MarginGuard risk module.
EOF
