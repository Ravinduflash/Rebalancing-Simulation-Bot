import { Handler } from '@netlify/functions';
import supabase from '../db';
import { getPrices } from '../pionex';

export const handler: Handler = async (event, context) => {
  if (event.httpMethod === 'GET') {
    const { data: bots, error } = await supabase.from('bots').select('*').order('created_at', { ascending: false });
    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    return {
        statusCode: 200,
        body: JSON.stringify(bots)
    };
  }

  if (event.httpMethod === 'POST') {
    const { name, coins, allocations, trigger_type, threshold_value, time_interval, initial_investment, trigger_prices, take_profit, stop_loss } = JSON.parse(event.body || '{}');
    const now = Date.now();
    const prices = await getPrices();

    try {
      const { data: botData, error: botError } = await supabase.from('bots').insert([{
        name,
        status: 'active',
        coins: JSON.stringify(coins),
        allocations: JSON.stringify(allocations),
        trigger_type,
        threshold_value,
        time_interval,
        initial_investment,
        current_value: initial_investment,
        created_at: now,
        last_rebalance_at: now,
        trigger_prices: trigger_prices ? JSON.stringify(trigger_prices) : null,
        take_profit: take_profit ? parseFloat(take_profit) : null,
        stop_loss: stop_loss ? parseFloat(stop_loss) : null
      }]).select().single();

      if (botError) throw botError;
      const botId = botData.id;

      const holdingsToInsert: any[] = [];
      const tradesToInsert: any[] = [];

      for (const coin of coins) {
        const targetValue = initial_investment * allocations[coin];
        const price = prices[coin] || 1;
        const amount = targetValue / price;
        const fee = targetValue * 0.0005;
        const amountAfterFee = amount - (amount * 0.0005);
        
        holdingsToInsert.push({ bot_id: botId, coin, amount: amountAfterFee });
        tradesToInsert.push({ bot_id: botId, coin, side: 'buy', amount, price, fee, reason: 'initial', timestamp: now });
      }

      await Promise.all([
        supabase.from('holdings').insert(holdingsToInsert),
        supabase.from('simulated_trades').insert(tradesToInsert),
        supabase.from('portfolio_snapshots').insert([{ bot_id: botId, total_value_usd: initial_investment, timestamp: now }])
      ]);

      return {
          statusCode: 200,
          body: JSON.stringify({ success: true })
      };
    } catch (error) {
      console.error(error);
      return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to create bot' })
      };
    }
  }

  return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
};
