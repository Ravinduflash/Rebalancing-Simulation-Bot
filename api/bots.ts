import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Inline getPrices to avoid cross-file import issues on Netlify
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
            const coin = ticker.symbol.replace('_USDT', '');
            prices[coin] = parseFloat(ticker.close);
          } else if (ticker.symbol.endsWith('_USDC')) {
            const coin = ticker.symbol.replace('_USDC', '');
            if (!prices[coin]) prices[coin] = parseFloat(ticker.close);
          } else if (ticker.symbol.endsWith('_BTC')) {
            const coin = ticker.symbol.replace('_BTC', '');
            btcPairs[coin] = parseFloat(ticker.close);
          } else if (ticker.symbol.endsWith('_ETH')) {
            const coin = ticker.symbol.replace('_ETH', '');
            ethPairs[coin] = parseFloat(ticker.close);
          }
        }
      }
    } catch (e) { console.error('Error fetching tickers:', e); }

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
    } catch (e) { console.error('Error fetching indexes:', e); }

    prices['USDT'] = 1.0;
    prices['USDC'] = 1.0;

    const btcPrice = prices['BTC'] || 0;
    const ethPrice = prices['ETH'] || 0;
    if (btcPrice > 0) {
      for (const [coin, priceInBtc] of Object.entries(btcPairs)) {
        if (!prices[coin]) prices[coin] = priceInBtc * btcPrice;
      }
    }
    if (ethPrice > 0) {
      for (const [coin, priceInEth] of Object.entries(ethPairs)) {
        if (!prices[coin]) prices[coin] = priceInEth * ethPrice;
      }
    }
    return prices;
  } catch (error) {
    console.error('Error fetching prices:', error);
    return {};
  }
}

// ============================================================
// UNIFIED BOT HANDLER
// Handles ALL /api/bots/* routes in a single Netlify Function
// ============================================================
export const handler: Handler = async (event, context) => {
  const path = event.path;
  const method = event.httpMethod;

  // --- Route: POST /api/bots/:id/toggle ---
  const toggleMatch = path.match(/\/api\/bots\/(\d+)\/toggle/);
  if (toggleMatch) {
    if (method !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };

    const id = toggleMatch[1];
    const { data: bot, error } = await supabase.from('bots').select('status').eq('id', id).single();
    if (error || !bot) return { statusCode: 404, body: JSON.stringify({ error: 'Bot not found' }) };

    const newStatus = bot.status === 'active' ? 'paused' : 'active';
    await supabase.from('bots').update({ status: newStatus }).eq('id', id);
    return { statusCode: 200, body: JSON.stringify({ success: true, status: newStatus }) };
  }

  // --- Route: GET/PUT/DELETE /api/bots/:id ---
  const idMatch = path.match(/\/api\/bots\/(\d+)$/);
  if (idMatch) {
    const id = idMatch[1];

    if (method === 'GET') {
      const { data: bot, error: botError } = await supabase.from('bots').select('*').eq('id', id).single();
      if (botError || !bot) return { statusCode: 404, body: JSON.stringify({ error: 'Bot not found' }) };

      const { data: holdings } = await supabase.from('holdings').select('*').eq('bot_id', id);
      const { data: trades } = await supabase.from('simulated_trades').select('*').eq('bot_id', id).order('timestamp', { ascending: false });
      const { data: snapshots } = await supabase.from('portfolio_snapshots').select('*').eq('bot_id', id).order('timestamp', { ascending: true });

      return { statusCode: 200, body: JSON.stringify({ bot, holdings, trades, snapshots }) };
    }

    if (method === 'PUT') {
      const { name, coins, allocations, trigger_type, threshold_value, time_interval, trigger_prices, take_profit, stop_loss } = JSON.parse(event.body || '{}');
      try {
        await supabase.from('bots').update({
          name,
          coins: JSON.stringify(coins),
          allocations: JSON.stringify(allocations),
          trigger_type,
          threshold_value,
          time_interval,
          trigger_prices: trigger_prices ? JSON.stringify(trigger_prices) : null,
          take_profit: take_profit ? parseFloat(take_profit) : null,
          stop_loss: stop_loss ? parseFloat(stop_loss) : null
        }).eq('id', id);
        return { statusCode: 200, body: JSON.stringify({ success: true }) };
      } catch (error) {
        console.error(error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Failed to update bot' }) };
      }
    }

    if (method === 'DELETE') {
      try {
        await Promise.all([
          supabase.from('holdings').delete().eq('bot_id', id),
          supabase.from('simulated_trades').delete().eq('bot_id', id),
          supabase.from('portfolio_snapshots').delete().eq('bot_id', id)
        ]);
        await supabase.from('bots').delete().eq('id', id);
        return { statusCode: 200, body: JSON.stringify({ success: true }) };
      } catch (error) {
        console.error(error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Failed to delete bot' }) };
      }
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // --- Route: GET /api/bots (list all) ---
  if (method === 'GET') {
    const { data: bots, error } = await supabase.from('bots').select('*').order('created_at', { ascending: false });
    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    return { statusCode: 200, body: JSON.stringify(bots) };
  }

  // --- Route: POST /api/bots (create new) ---
  if (method === 'POST') {
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

      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    } catch (error) {
      console.error(error);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to create bot' }) };
    }
  }

  return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
};
