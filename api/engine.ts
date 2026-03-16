import supabase from './db';
import { getPrices } from './pionex';

const FEE_RATE = 0.0005; // 0.05%

export async function runSimulationTick() {
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
        if (row.amount > 0.00000001) { // Ignore dust
          allCoinsSet.add(row.coin);
        }
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
        const tradesToInsert = [];
        const holdingUpdates = [];
        
        for (const coin of allCoins) {
          const amount = holdings[coin] || 0;
          if (amount > 0) {
            const price = prices[coin] || 1;
            const value = amount * price;
            const fee = value * FEE_RATE;
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
        const tradesToInsert = [];
        const holdingUpdates = [];
        
        for (const coin of allCoins) {
          const amount = holdings[coin] || 0;
          if (amount > 0) {
            const price = prices[coin] || 1;
            const value = amount * price;
            const fee = value * FEE_RATE;
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

    let shouldRebalance = false;

    if (bot.trigger_type === 'time') {
      if (now - bot.last_rebalance_at >= bot.time_interval) {
        shouldRebalance = true;
      }
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
          const amountToSell = diff / (prices[coin] || 1);
          sells.push({ coin, amount: amountToSell, value: diff });
        } else if (diff < 0) {
          const amountToBuy = Math.abs(diff) / (prices[coin] || 1);
          buys.push({ coin, amount: amountToBuy, value: Math.abs(diff) });
        }
      }

      const tradesToInsert = [];
      const holdingPromises = [];

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
        if (holdings[buy.coin] === undefined) {
          holdings[buy.coin] = 0;
          isNewCoin = true;
        }
        
        holdings[buy.coin] += buy.amount;
        const feeInCoin = buy.amount * FEE_RATE;
        holdings[buy.coin] -= feeInCoin;
        
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

// Run every 10 seconds for demo purposes
setInterval(() => {
  runSimulationTick().catch(console.error);
}, 10000);
