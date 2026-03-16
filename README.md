# Asset Portfolio Rebalancing Simulator

A high-performance, real-time Asset Portfolio Rebalancing Simulator designed to mimic the advanced trading features of the Pionex exchange. This project allows users to simulate automated, algorithmic trading strategies across highly volatile asset classes (Crypto, Tokenized Stocks, Leveraged Tokens) without risking real capital.

## 🚀 Features

*   **Real-time Market Data:** Integrates directly with the official Pionex REST API (`/api/v1/market/tickers` and `/api/v1/market/indexes`) to fetch live, accurate order-book pricing for Crypto Spot, Delisted Leveraged Tokens, and Tokenized Stocks/ETFs.
*   **Stateful Random Walk Engine:** Simulates realistic market movements for offline or completely delisted assets, ensuring the simulator behaves like a real paper-trading environment rather than randomly fluctuating.
*   **Advanced Rebalancing Triggers:**
    *   **Periodic (Time-based):** Rebalance automatically on set intervals (15 Min to 7 Days).
    *   **Threshold (Deviation-based):** Rebalance automatically when an asset's weight drifts beyond a defined proportion (e.g., 1%).
    *   **Momentum Rebalancing:** A complex hybrid strategy that rotates capital into top-performing assets while securing baseline profits based on custom or default distribution ratios.
*   **Granular Profit/Loss Control:** Configure precise Take Profit limits (e.g., +20%) and Stop Loss limits (e.g., -10%) that instantly halt the bot and liquidate into stablecoins when hit.
*   **Detailed Trade History Analytics:** Every single simulated buy or sell is meticulously logged in a real-time table with explicit "Reasons" (Initial Allocation, Rebalance, Take Profit, Stop Loss) so you know exactly why the algorithmic engine triggered an action.
*   **Slippage Simulation:** Toggle between AI-optimized Slippage (based on live volume/volatility) or Manual custom slippage thresholds to perfectly model real-world high-frequency liquidity loss.
*   **Stateless Cloud Architecture:** Fully migrated away from local SQLite! The entire trading engine streams its background rebalancing operations directly to a **Supabase PostgreSQL** cloud cluster via asynchronous WebSocket events.

## 🛠️ Technology Stack

*   **Frontend:** React, Vite, TailwindCSS (for high-performance, beautiful UI rendering)
*   **Backend / API:** Serverless Node.js (Vercel Edge Functions)
*   **Database:** Supabase (PostgreSQL)
*   **Market Data:** Pionex API (`getPrices`)
*   **LLM Integration:** Google Gemini 3 Flash (via `@google/genai` for the built-in trading assistant)

## ☁️ Deployment Architecture (Vercel + Supabase)

This repository is strictly designed for modern Serverless environments. It leverages **Vercel File-based Routing** (`/api/*`) for standard REST operations (Create Bot, Pause Bot, etc).

Because Vercel environments put idle functions to sleep, the core trading engine (`runSimulationTick`) has been transformed into a standalone HTTP endpoint at `/api/tick.ts`. 

**Note for Vercel Hobby Tier Users:** Vercel's free tier only allows 1 cron job per day. Because this simulator requires executing trades every minute, you must use a free external service like [cron-job.org](https://cron-job.org/) to ping your `https://your-domain.vercel.app/api/tick` endpoint every 1 minute.

## ⚙️ Quick Start (Local Development)

### 1. Configure Environment Variables
Create a `.env.local` file in the root directory and populate it with your cloud keys:
```env
# Required for the conversational Trading Assistant tab
GEMINI_API_KEY=your_gemini_key

# Required for the Trade Rebalancing Engine 
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Initialize the Database
Before running the server, you must create the necessary PostgreSQL tables. 
Open `supabase_schema.sql`, copy the contents, and execute them in your Supabase SQL Editor to instantly scaffold the `bots`, `holdings`, `simulated_trades`, and `portfolio_snapshots` tables.

### 3. Install & Run
```bash
# Install dependencies
npm install

# Run the local Vite preview server alongside the Vercel dev API proxy
npm run dev
```

Your simulator will be running locally at `http://localhost:3000`.

## 📦 Deploying to Production

1. Fork or push this repository to GitHub.
2. Go to [Vercel](https://vercel.com) and link the repository.
3. Import your `.env.local` variables directly into the Vercel Environment Variables dashboard.
4. Click **Deploy**. Vercel will automatically configure the File-based `/api/` routing.
5. Create a free account on [cron-job.org](https://cron-job.org/).
6. Create a new cron job that pings `https://your-deployment-url.vercel.app/api/cron/tick` every 1 minute. This will wake up the server and execute all necessary trades in the background.
