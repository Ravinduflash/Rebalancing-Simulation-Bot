import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const FEE_RATE = 0.0005; // 0.05%

async function getPrices(): Promise<Record<string, number>> {
  try {
    const prices: Record<string, number> = {};
    const btcPairs: Record<string, number> = {};
    const ethPairs: Record<string, number> = {};

    try {
      const response = await fetch('https://api.pionex.com/api/v1/market/tickers');
      const data = await response.json();
      if (data.result && data.data && data.data.tickers) {
        for (const ticker of data.data.tickers) {
          if (ticker.symbol.endsWith('_USDT')) {
            prices[ticker.symbol.replace('_USDT', '')] = parseFloat(ticker.close);
          } else if (ticker.symbol.endsWith('_USDC')) {
            const coin = ticker.symbol.replace('_USDC', '');
            if (!prices[coin]) prices[coin] = parseFloat(ticker.close);
          } else if (ticker.symbol.endsWith('_BTC')) {
            btcPairs[ticker.symbol.replace('_BTC', '')] = parseFloat(ticker.close);
          } else if (ticker.symbol.endsWith('_ETH')) {
            ethPairs[ticker.symbol.replace('_ETH', '')] = parseFloat(ticker.close);
          }
        }
      }
    } catch (e) { console.error('Tickers error:', e); }

    try {
      const respIndex = await fetch('https://api.pionex.com/api/v1/market/indexes');
      const dataIndex = await respIndex.json();
      if (dataIndex.result && dataIndex.data && dataIndex.data.indexes) {
        for (const indexData of dataIndex.data.indexes) {
          if (indexData.symbol.endsWith('_USDT_PERP')) {
            const coin = indexData.symbol.replace('_USDT_PERP', '');
            if (!prices[coin]) prices[coin] = parseFloat(indexData.indexPrice);
          }
        }
      }
    } catch (e) { console.error('Indexes error:', e); }

    prices['USDT'] = 1.0;
    prices['USDC'] = 1.0;
    const btcPrice = prices['BTC'] || 0;
    const ethPrice = prices['ETH'] || 0;
    if (btcPrice > 0) {
      for (const [coin, p] of Object.entries(btcPairs)) { if (!prices[coin]) prices[coin] = p * btcPrice; }
    }
    if (ethPrice > 0) {
      for (const [coin, p] of Object.entries(ethPairs)) { if (!prices[coin]) prices[coin] = p * ethPrice; }
    }
    return prices;
  } catch (error) {
    console.error('getPrices error:', error);
    return {};
  }
}

async function runSimulationTick() {
  const prices = await getPrices();
  if (Object.keys(prices).length === 0) return;

  const { data: bots, error } = await supabase.from('bots').select('*').eq('status', 'active');
  if (error || !bots) return;

  const now = Date.now();

  for (const bot of bots) {
    const allocations = typeof bot.allocations === 'string' ? JSON.parse(bot.allocations) : bot.allocations;
    const coins = typeof bot.coins === 'string' ? JSON.parse(bot.coins) : bot.coins;
    
    const { data: holdingsRows } = await supabase.from('holdings').select('coin, amount').eq('bot_id', bot.id);
    const holdings: Record<string, number> = {};
    const allCoinsSet = new Set<string>(coins);
    
    if (holdingsRows) {
      for (const row of holdingsRows) {
        holdings[row.coin] = row.amount;
        if (row.amount > 0.00000001) allCoinsSet.add(row.coin);
      }
    }
    
    const allCoins = Array.from(allCoinsSet);

    let totalValue = 0;
    const currentValues: Record<string, number> = {};
    for (const coin of allCoins) {
      const price = prices[coin] || 0;
      const amount = holdings[coin] || 0;
      const value = amount * price;
      currentValues[coin] = value;
      totalValue += value;
    }

    await Promise.all([
      supabase.from('portfolio_snapshots').insert([{ bot_id: bot.id, total_value_usd: totalValue, timestamp: now }]),
      supabase.from('bots').update({ current_value: totalValue }).eq('id', bot.id)
    ]);

    // Check take profit
    if (bot.take_profit) {
      const pnlRate = ((totalValue - bot.initial_investment) / bot.initial_investment) * 100;
      if (pnlRate >= bot.take_profit) {
        const tradesToInsert: any[] = [];
        const holdingUpdates: any[] = [];
        for (const coin of allCoins) {
          const amount = holdings[coin] || 0;
          if (amount > 0) {
            const price = prices[coin] || 1;
            const fee = amount * price * FEE_RATE;
            holdingUpdates.push(supabase.from('holdings').update({ amount: 0 }).eq('bot_id', bot.id).eq('coin', coin));
            tradesToInsert.push({ bot_id: bot.id, coin, side: 'sell', amount, price, fee, reason: 'take_profit', timestamp: now });
          }
        }
        await Promise.all([
          ...holdingUpdates,
          tradesToInsert.length > 0 ? supabase.from('simulated_trades').insert(tradesToInsert) : Promise.resolve(),
          supabase.from('bots').update({ status: 'paused' }).eq('id', bot.id)
        ]);
        continue;
      }
    }

    // Check stop loss
    if (bot.stop_loss) {
      const pnlRate = ((totalValue - bot.initial_investment) / bot.initial_investment) * 100;
      if (pnlRate <= -Math.abs(bot.stop_loss)) {
        const tradesToInsert: any[] = [];
        const holdingUpdates: any[] = [];
        for (const coin of allCoins) {
          const amount = holdings[coin] || 0;
          if (amount > 0) {
            const price = prices[coin] || 1;
            const fee = amount * price * FEE_RATE;
            holdingUpdates.push(supabase.from('holdings').update({ amount: 0 }).eq('bot_id', bot.id).eq('coin', coin));
            tradesToInsert.push({ bot_id: bot.id, coin, side: 'sell', amount, price, fee, reason: 'stop_loss', timestamp: now });
          }
        }
        await Promise.all([
          ...holdingUpdates,
          tradesToInsert.length > 0 ? supabase.from('simulated_trades').insert(tradesToInsert) : Promise.resolve(),
          supabase.from('bots').update({ status: 'paused' }).eq('id', bot.id)
        ]);
        continue;
      }
    }

    // Rebalance check
    let shouldRebalance = false;
    if (bot.trigger_type === 'time') {
      if (now - bot.last_rebalance_at >= bot.time_interval) shouldRebalance = true;
    } else if (bot.trigger_type === 'threshold') {
      for (const coin of allCoins) {
        const targetWeight = allocations[coin] || 0;
        const currentWeight = totalValue > 0 ? currentValues[coin] / totalValue : 0;
        if (Math.abs(currentWeight - targetWeight) >= bot.threshold_value) {
          shouldRebalance = true;
          break;
        }
      }
    }

    if (shouldRebalance) {
      const targetValues: Record<string, number> = {};
      for (const coin of allCoins) {
        targetValues[coin] = totalValue * (allocations[coin] || 0);
      }

      const sells: { coin: string, amount: number, value: number }[] = [];
      const buys: { coin: string, amount: number, value: number }[] = [];

      for (const coin of allCoins) {
        const diff = currentValues[coin] - targetValues[coin];
        if (diff > 0) {
          sells.push({ coin, amount: diff / (prices[coin] || 1), value: diff });
        } else if (diff < 0) {
          buys.push({ coin, amount: Math.abs(diff) / (prices[coin] || 1), value: Math.abs(diff) });
        }
      }

      const tradesToInsert: any[] = [];
      const holdingPromises: any[] = [];

      for (const sell of sells) {
        const price = prices[sell.coin] || 1;
        const fee = sell.value * FEE_RATE;
        holdings[sell.coin] -= sell.amount;
        holdingPromises.push(supabase.from('holdings').update({ amount: holdings[sell.coin] }).eq('bot_id', bot.id).eq('coin', sell.coin));
        tradesToInsert.push({ bot_id: bot.id, coin: sell.coin, side: 'sell', amount: sell.amount, price, fee, reason: 'rebalance', timestamp: now });
      }

      for (const buy of buys) {
        const price = prices[buy.coin] || 1;
        const fee = buy.value * FEE_RATE;
        let isNewCoin = false;
        if (holdings[buy.coin] === undefined) { holdings[buy.coin] = 0; isNewCoin = true; }
        holdings[buy.coin] += buy.amount;
        holdings[buy.coin] -= buy.amount * FEE_RATE;

        if (isNewCoin) {
          holdingPromises.push(supabase.from('holdings').insert([{ bot_id: bot.id, coin: buy.coin, amount: holdings[buy.coin] }]));
        } else {
          holdingPromises.push(supabase.from('holdings').update({ amount: holdings[buy.coin] }).eq('bot_id', bot.id).eq('coin', buy.coin));
        }
        tradesToInsert.push({ bot_id: bot.id, coin: buy.coin, side: 'buy', amount: buy.amount, price, fee, reason: 'rebalance', timestamp: now });
      }

      await Promise.all([
        ...holdingPromises,
        tradesToInsert.length > 0 ? supabase.from('simulated_trades').insert(tradesToInsert) : Promise.resolve(),
        supabase.from('bots').update({ last_rebalance_at: now }).eq('id', bot.id)
      ]);
    }
  }
}

// ============================================================
// NETLIFY FUNCTION HANDLER
// Called by cron-job.org every minute
// ============================================================
export const handler: Handler = async (event, context) => {
  try {
    await runSimulationTick();
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Simulation tick executed successfully' })
    };
  } catch (error) {
    console.error('Simulation tick error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Simulation tick failed' })
    };
  }
};
